// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAG5_Y5-wsDUVrbA76aY1TAyLaJoc9p_HM",
  authDomain: "mental-track-bc6be.firebaseapp.com",
  projectId: "mental-track-bc6be",
  storageBucket: "mental-track-bc6be.firebasestorage.app",
  messagingSenderId: "534895474447",
  appId: "1:534895474447:web:2cf3c851add07603d2f07a",
  measurementId: "G-0GCDH75ZFX",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

//Show message
function showMessage(message, divId) {
  var messageDiv = document.getElementById(divId);
  messageDiv.style.display = "block";
  messageDiv.innerHTML = message;
  messageDiv.style.opacity = 1;
  setTimeout(function () {
    messageDiv.style.opacity = 0;
  }, 5000);
}

document.addEventListener("DOMContentLoaded", () => {
  const emotionChartCanvas = document.getElementById("emotionChart");
  let emotionChart = null; // Biến để lưu trữ đối tượng biểu đồ Chart.js

  let currentUser = null;

  const moodColorMap = {
    happy: "rgba(38, 215, 238, 0.911)",
    joyful: "rgba(131, 12, 187, 0.842)",
    normal: "rgba(230, 100, 191, 0.692)",
    sad: "rgb(231, 27, 61)",
    awful: "rgb(204, 52, 14)",
  };

  const moodTextMap = {
    happy: "Hạnh phúc",
    joyful: "Vui vẻ",
    normal: "Bình thường",
    sad: "Buồn",
    awful: "Tồi tệ",
  };

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      loadEmotionDataForChart();
    } else {
      currentUser = null;
      showMessage(
        "Vui lòng đăng nhập để xem biểu đồ cảm xúc của bạn.",
        "auth-status-message"
      );
      // Ẩn biểu đồ và hiển thị thông báo không có dữ liệu
      if (emotionChartCanvas) emotionChartCanvas.style.display = "none";
    }
  });

  // Hàm tải dữ liệu cảm xúc từ Firestore cho biểu đồ
  async function loadEmotionDataForChart() {
    if (!currentUser) return;

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14); // 2 tuần trước
    twoWeeksAgo.setHours(0, 0, 0, 0); // Đặt về đầu ngày 2 tuần trước

    try {
      const q = query(
        collection(db, "emotionLogs"),
        where("uid", "==", currentUser.uid),
        where("timestamp", ">=", Timestamp.fromDate(twoWeeksAgo)), // Lọc từ 2 tuần trước
        orderBy("timestamp", "asc") // Sắp xếp theo ngày tăng dần
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        if (emotionChartCanvas) emotionChartCanvas.style.display = "none";
        showMessage(
          "Chưa có dữ liệu cảm xúc trong 2 tuần gần nhất.",
          "no-data-message"
        );
        return;
      }

      // Thu thập tất cả các nhật ký và nhóm theo ngày
      const dailyLogs = new Map(); // Key: "DD/MM/YYYY", Value: mảng các log {intensity, emotion, timestamp}
      const uniqueSortedDates = []; // Chứa các ngày duy nhất, đã sắp xếp

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.timestamp && data.timestamp.toDate) {
          const dateObj = data.timestamp.toDate();
          // Chỉ lấy DD/MM cho nhãn
          const dateKey = `${dateObj.getDate().toString().padStart(2, "0")}/${(
            dateObj.getMonth() + 1
          )
            .toString()
            .padStart(2, "0")}`;

          if (!dailyLogs.has(dateKey)) {
            dailyLogs.set(dateKey, []);
            uniqueSortedDates.push(dateKey); // Thu thập các ngày duy nhất
          }
          dailyLogs.get(dateKey).push({
            intensity: data.intensity,
            emotion: data.emotion,
            timestamp: dateObj.getTime(), // Lưu timestamp để sắp xếp các log trong ngày
          });
        }
      });

      // Sắp xếp các ngày duy nhất (labels chính cho trục X)
      uniqueSortedDates.sort((a, b) => {
        const [dayA, monthA] = a.split("/").map(Number);
        const [dayB, monthB] = b.split("/").map(Number);
        const dateA = new Date(2000, monthA - 1, dayA); // Năm giả định để so sánh ngày
        const dateB = new Date(2000, monthB - 1, dayB);
        return dateA - dateB;
      });

      // Mỗi log là 1 dataset riêng
      const datasets = [];
      const numDays = uniqueSortedDates.length; // Số lượng ngày duy nhất

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.timestamp && data.timestamp.toDate) {
          const dateObj = data.timestamp.toDate();
          const dateKey = `${dateObj.getDate().toString().padStart(2, "0")}/${(
            dateObj.getMonth() + 1
          )
            .toString()
            .padStart(2, "0")}`;
          const timeKey = `${dateObj
            .getHours()
            .toString()
            .padStart(2, "0")}:${dateObj
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;

          const dataArrayForThisLog = new Array(numDays).fill(null); // Mảng dữ liệu cho dataset này, với các null
          const dayIndex = uniqueSortedDates.indexOf(dateKey); // Tìm index của ngày này trong mảng labels chính

          if (dayIndex !== -1) {
            dataArrayForThisLog[dayIndex] = data.intensity;
          }

          datasets.push({
            label: `${moodTextMap[data.emotion]} ${timeKey} ${dateKey}`, // Nhãn chi tiết cho tooltip
            data: dataArrayForThisLog,
            backgroundColor: moodColorMap[data.emotion] || "#CCCCCC",
            borderColor: "rgb(0, 0, 0)",
            borderWidth: 1,
          });
        }
      });

      // Nếu đã có biểu đồ cũ, hủy nó đi trước khi vẽ lại
      if (emotionChart) {
        emotionChart.destroy();
      }

      // Vẽ biểu đồ
      if (emotionChartCanvas) {
        emotionChartCanvas.style.display = "block"; // Đảm bảo canvas hiển thị

        const ctx = emotionChartCanvas.getContext("2d");
        emotionChart = new Chart(ctx, {
          type: "bar", // Biểu đồ thanh

          data: {
            labels: uniqueSortedDates, // Labels chỉ chứa các ngày duy nhất
            datasets: datasets, // Mảng datasets đã được tạo ở trên
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                // Tùy chỉnh trục X
                stacked: false,
                offset: true,
                barThickness: "flex", // Cho phép linh hoạt điều chỉnh độ dày
                maxBarThickness: 30, // Giới hạn độ dày tối đa
                categoryPercentage: 0.9, // Khoảng trống giữa CÁC NHÓM NGÀY
                barPercentage: 0.8, // Khoảng trống giữa CÁC THANH TRONG MỘT NHÓM NGÀY (nếu có nhiều hơn 1)
                ticks: {
                  autoSkip: false,
                  maxRotation: 0,
                  minRotation: 0,
                  callback: function (value, index) {
                    return this.getLabelForValue(value); // Trả về nhãn ngày thực sự
                  },
                },
              },
              y: {
                beginAtZero: true,
                max: 5, // Cảm xúc từ 1-5
                ticks: {
                  stepSize: 1,
                  callback: function (value) {
                    // Hiển thị tên cảm xúc thay vì số
                    switch (value) {
                      case 1:
                        return "Tồi tệ";
                      case 2:
                        return "Buồn";
                      case 3:
                        return "Bình thường";
                      case 4:
                        return "Vui vẻ";
                      case 5:
                        return "Hạnh phúc";
                      default:
                        return "";
                    }
                  },
                },
              },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function (context) {
                    // Tooltip label bây giờ sẽ lấy từ thuộc tính 'label' của từng dataset
                    return context.dataset.label;
                  },
                },
              },
            },
          },
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu cảm xúc cho biểu đồ:", error);
      showMessage("Không thể tải biểu đồ cảm xúc.", "auth-status-message");
      if (emotionChartCanvas) emotionChartCanvas.style.display = "none";
      showMessage("Lỗi khi tải biểu đồ cảm xúc.", "no-data-message");
    }
  }
});
