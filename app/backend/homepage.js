// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import {
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  collection, query, where, getDocs, orderBy, Timestamp
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

document.addEventListener('DOMContentLoaded', () => {
    const emotionChartCanvas = document.getElementById('emotionChart');
    let emotionChart = null; // Biến để lưu trữ đối tượng biểu đồ Chart.js

    let currentUser = null;

     onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            loadEmotionDataForChart();

        } else {
            currentUser = null;
            showMessage("Vui lòng đăng nhập để xem biểu đồ cảm xúc của bạn.", 'auth-status-message');
            // Ẩn biểu đồ và hiển thị thông báo không có dữ liệu
            if (emotionChartCanvas) emotionChartCanvas.style.display = 'none';
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
                collection(db, 'emotionLogs'),
                where('uid', '==', currentUser.uid),
                where('date', '>=', Timestamp.fromDate(twoWeeksAgo)), // Lọc từ 2 tuần trước
                orderBy('date', 'asc') // Sắp xếp theo ngày tăng dần
            );
            const querySnapshot = await getDocs(q);

            const dates = [];
            const emotionValues = [];

            if (querySnapshot.empty) {
                if (emotionChartCanvas) emotionChartCanvas.style.display = 'none';
                showMessage("Chưa có dữ liệu cảm xúc trong 2 tuần gần nhất.", 'no-data-message');
                return;
            }

            querySnapshot.forEach(doc => {
                const data = doc.data();
                // Định dạng ngày cho trục X (ví dụ: MM/DD)
                const dateObj = data.date.toDate(); // Chuyển Timestamp sang Date object
                dates.push(`${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')}`);
                emotionValues.push(data.emotionValue);
            });

            // Nếu đã có biểu đồ cũ, hủy nó đi trước khi vẽ lại
            if (emotionChart) {
                emotionChart.destroy();
            }

            // Vẽ biểu đồ
            if (emotionChartCanvas) {
                emotionChartCanvas.style.display = 'block'; // Đảm bảo canvas hiển thị

                const ctx = emotionChartCanvas.getContext('2d');
                emotionChart = new Chart(ctx, {
                    type: 'line', // Biểu đồ đường
                    data: {
                        labels: dates, // Ngày
                        datasets: [{
                            label: 'Mức độ cảm xúc',
                            data: emotionValues, // Giá trị cảm xúc
                            borderColor: 'rgb(75, 192, 192)',
                            tension: 0.1,
                            fill: false
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 5, // Cảm xúc từ 1-5
                                ticks: {
                                    stepSize: 1,
                                    callback: function(value) {
                                        // Hiển thị tên cảm xúc thay vì số
                                        switch(value) {
                                            case 1: return 'Tồi tệ';
                                            case 2: return 'Buồn';
                                            case 3: return 'Bình thường';
                                            case 4: return 'Vui vẻ';
                                            case 5: return 'Hạnh phúc';
                                            default: return '';
                                        }
                                    }
                                }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        let label = context.dataset.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        // Hiển thị tên cảm xúc trong tooltip
                                        const value = context.raw;
                                        switch(value) {
                                            case 1: label += 'Tồi tệ'; break;
                                            case 2: label += 'Buồn'; break;
                                            case 3: label += 'Bình thường'; break;
                                            case 4: label += 'Vui vẻ'; break;
                                            case 5: label += 'Hạnh phúc'; break;
                                            default: label += value;
                                        }
                                        return label;
                                    }
                                }
                            }
                        }
                    }
                });
            }

        } catch (error) {
            console.error("Lỗi khi tải dữ liệu cảm xúc cho biểu đồ:", error);
            showMessage("Không thể tải biểu đồ cảm xúc.", 'auth-status-message');
            if (emotionChartCanvas) emotionChartCanvas.style.display = 'none';
            showMessage("Lỗi khi tải biểu đồ cảm xúc.", 'no-data-message');
        }
    }
});