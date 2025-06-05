// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  getFirestore,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
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
  let currentUser = null;
  let selectedMoodValue = ""; // Lưu trữ giá trị 'happy', 'sad', v.v.
  let selectedMoodDisplayText = "..."; // Lưu trữ văn bản hiển thị như 'Hạnh phúc', 'Buồn'

  //DOM Elements
  const moodButtons = document.querySelectorAll(".mood-btn");
  const feelingSpan = document.querySelector(".diary-link span");
  const diaryEntryText = document.getElementById("diary-entry-text");
  const saveDiaryBtn = document.getElementById("save-diary-btn");

  //DOM Elements cho quản lý view
  const newEntryView = document.getElementById("new-entry-view");
  const diaryListView = document.getElementById("diary-list-view");
  const showNewEntryViewBtn = document.getElementById("showNewEntryViewBtn");
  const showDiaryListViewBtn = document.getElementById("showDiaryListViewBtn");
  const diaryEntriesContainer = document.getElementById(
    "diary-entries-container"
  );

  const moodTextMap = {
    happy: "Hạnh phúc",
    joyful: "Vui vẻ",
    normal: "Bình thường",
    sad: "Buồn",
    awful: "Tồi tệ",
  };

  const moodToIntensity = {
    happy: 5,
    joyful: 4,
    normal: 3,
    sad: 2,
    awful: 1,
  };

  // Hàm chuyển đổi giữa các view
  function switchView(viewToShow) {
    // Ẩn tất cả các view
    newEntryView.classList.remove("active");
    diaryListView.classList.remove("active");

    // Hiển thị view được chọn
    viewToShow.classList.add("active");

    // Nếu chuyển sang view danh sách, hãy tải nhật ký
    if (viewToShow === diaryListView && currentUser) {
      loadDiaryEntries();
    }
  }

  moodButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Bỏ class 'selected' khỏi tất cả các button
      moodButtons.forEach((btn) => {
        btn.classList.remove("selected");
      });

      // Thêm class 'selected' cho button vừa click
      this.classList.add("selected");

      // Cập nhật text trong dòng "Tôi cảm thấy"
      selectedMoodValue = this.dataset.mood;

      selectedMoodDisplayText = `Tôi cảm thấy ${moodTextMap[selectedMoodValue]}`;

      if (feelingSpan) {
        feelingSpan.textContent = selectedMoodDisplayText;
      }
    });
  });

  const normalButton = document.querySelector('.mood-btn[data-mood="normal"]');
  if (normalButton) {
    normalButton.click();
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Người dùng đã đăng nhập
      currentUser = user;
      console.log("Người dùng đã đăng nhập:", currentUser.uid);
    } else {
      // Người dùng đã đăng xuất
      currentUser = null;
      console.log("Người dùng chưa đăng nhập.");
      showMessage("Vui lòng đăng nhập để viết nhật ký", "mood-message");
    }
  });

  saveDiaryBtn.addEventListener("click", async () => {
    // const currentUser = auth.currentUser;

    if (!currentUser) {
      showMessage("Bạn cần đăng nhập để lưu nhật ký!", "mood-message");
      window.location.href = "../html/login.html";
      return;
    }

    if (!selectedMoodValue) {
      showMessage("Vui lòng chọn một cảm xúc.", "mood-message");
      return;
    }

    const notes = diaryEntryText.value.trim();
    if (!notes) {
      showMessage("Vui lòng nhập nội dung nhật ký.", "mood-message");
      return;
    }

    const uid = currentUser.uid;
    const emotion = selectedMoodValue;
    const intensity = moodToIntensity[selectedMoodValue] || 0; // Lấy intensity, mặc định là 0 nếu không tìm thấy
    const timestamp = serverTimestamp(); // Lấy timestamp từ server Firestore

    // Tạo ngày dạng DD-MM-YYYY
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Tháng từ 0-11 nên +1
    const day = String(now.getDate()).padStart(2, "0");
    const dateString = `${day}-${month}-${year}`;

    try {
      await addDoc(collection(db, "emotionLogs"), {
        uid: uid,
        emotion: selectedMoodValue,
        emotionTextDisplay: selectedMoodDisplayText,
        intensity: intensity,
        notes: notes,
        timestamp: timestamp,
        date: dateString,
      });
      showMessage("Nhật ký cảm xúc đã được lưu!", "mood-message");

      // Reset Diary sau khi lưu thành công
      resetDiary();
      // Sau khi lưu, chuyển sang view danh sách diary
      switchView(diaryListView);
    } catch (error) {
      console.error("Lỗi khi lưu nhật ký: ", error);
      showMessage(
        "Đã có lỗi xảy ra khi lưu nhật ký. Vui lòng thử lại.",
        "mood-message"
      );
    }
  });

  // Reset Diary
  function resetDiary() {
    selectedMoodValue = "";
    selectedMoodDisplayText = "..";
    if (feelingSpan) {
      feelingSpan.textContent = selectedMoodDisplayText;
    }
    diaryEntryText.value = "";
    moodButtons.forEach((btn) => btn.classList.remove("selected"));
  }

  // ============== READ DIARY ==============

  // Hàm tải nhật ký từ Firestore
  async function loadDiaryEntries() {
    if (!currentUser) {
      console.log("Không có người dùng nào đăng nhập để tải nhật ký.");
      diaryEntriesContainer.innerHTML = ""; // Xóa nội dung cũ
      showMessage("Bạn chưa có nhật ký nào.", "no-diary-entries-message"); // Hiển thị thông báo không có nhật ký
      return;
    }

    diaryEntriesContainer.innerHTML = "<p>Đang tải nhật ký...</p>";

    try {
      const q = query(
        collection(db, "emotionLogs"),
        where("uid", "==", currentUser.uid), // Chỉ lấy nhật ký của người dùng hiện tại
        orderBy("timestamp", "desc") // Sắp xếp theo thời gian mới nhất trước
      );

      const querySnapshot = await getDocs(q);

      // Xóa tất cả các nhật ký cũ trước khi thêm nhật ký mới
      diaryEntriesContainer.innerHTML = "";

      if (querySnapshot.empty) {
        showMessage(
          "Bạn chưa có nhật ký nào. Hãy viết nhật ký mới. ",
          "no-diary-entries-message"
        ); // Hiển thị thông báo không có nhật ký
        console.log("Không có nhật ký nào cho người dùng này.");
        return;
      }

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const diaryItem = document.createElement("div");
        diaryItem.classList.add("diary-item");
        diaryItem.dataset.id = doc.id; // Lưu id của document để dùng cho Xóa/Sửa

        // Định dạng timestamp sang định dạng ngày giờ dễ đọc
        let date = "";
        if (data.timestamp && data.timestamp.toDate) {
          const itemDate = data.timestamp.toDate();
          date =
            itemDate.toLocaleDateString("vi-VN") +
            " " +
            itemDate.toLocaleTimeString("vi-VN");
        } else if (data.date) {
          date = data.date;
        } else {
          date = "Chưa xác định";
        }

        diaryItem.innerHTML = `
                <h3>${data.emotionTextDisplay || "Chưa xác định cảm xúc"}</h3>
                <p>Ngày: ${date}</p>
                <p>Tâm trạng: ${
                  moodTextMap[data.emotion] || "Chưa xác định cảm xúc"
                }</p>
                <p class="notes">${data.notes || "Không có ghi chú."}</p>
                <button class="edit-btn" data-id="${doc.id}">Sửa</button>
                <button class="delete-btn" data-id="${doc.id}">Xóa</button>
            `;
        diaryEntriesContainer.appendChild(diaryItem);
      });
      // showMessage("Tải nhật ký thành công.", "no-diary-entries-message");
    } catch (error) {
      console.error("Lỗi khi tải nhật ký: ", error);
      showMessage(
        "Đã có lỗi xảy ra khi tải nhật ký. Vui lòng thử lại.",
        "no-diary-entries-message"
      );
    }
  }

  // ============== Xử lý sự kiện nút điều hướng ==============
  showNewEntryViewBtn.addEventListener("click", () => {
    switchView(newEntryView);
  });

  showDiaryListViewBtn.addEventListener("click", () => {
    switchView(diaryListView);
  });
});
