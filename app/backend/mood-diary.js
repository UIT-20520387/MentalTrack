// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, Timestamp, updateDoc
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
    let selectedMoodValue = ''; // Biến lưu trữ mood_value: "happy", "joyful", ...
    let selectedMoodDisplayText = '...'; // Biến lưu trữ tên cảm xúc tiếng Việt: "Hạnh phúc", ...

    const moodButtons = document.querySelectorAll('.mood-btn');
    const selectedMoodDisplay = document.getElementById('selected-mood-display');
    const diaryEntryText = document.getElementById('diary-entry-text');
    const saveDiaryBtn = document.getElementById('save-diary-btn');

    const moodToIntensity = {
        "happy": 5,
        "joyful": 4,
        "normal": 3,
        "sad": 2,
        "awful": 1
    };

    onAuthStateChanged(auth, (user) => {
      if (user) {
            // Người dùng đã đăng nhập
            currentUser = user;
            console.log("Người dùng đã đăng nhập:", currentUser.uid);
        } else {
            // Người dùng đã đăng xuất
            currentUser = null;
            console.log("Người dùng chưa đăng nhập.");
            showMessage("Vui lòng đăng nhập để viết nhật ký", 'mood-message');
        }
    });

    moodButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Bỏ class 'selected' khỏi tất cả các button (nếu bạn có style cho trạng thái được chọn)
            moodButtons.forEach(btn => btn.classList.remove('selected')); // Thêm class 'selected' vào CSS nếu muốn
            // Thêm class 'selected' cho button vừa click
            button.classList.add('selected');

            selectedMoodValue = button.dataset.mood;
            selectedMoodDisplayText = button.dataset.moodText; // Lấy text từ data-mood-text
            selectedMoodDisplay.textContent = `'${selectedMoodDisplayText}'.`;

            // Cập nhật giá trị cho input ẩn (nếu vẫn muốn dùng)
            document.getElementById('selected-emotion-value').value = selectedMoodValue;
            document.getElementById('selected-emotion-text').value = selectedMoodDisplayText;
        });
    });

    saveDiaryBtn.addEventListener('click', async () => {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            showMessage("Bạn cần đăng nhập để lưu nhật ký!", 'mood-message');
            window.location.href = '../html/login.html';
            return;
        }

        if (!selectedMoodValue) {
            showMessage("Vui lòng chọn một cảm xúc.", 'mood-message');
            return;
        }

        const notes = diaryEntryText.value.trim();
        const uid = currentUser.uid;
        const emotion = selectedMoodValue;
        const intensity = moodToIntensity[selectedMoodValue] || 0; // Lấy intensity, mặc định là 0 nếu không tìm thấy
        const timestamp = firebase.firestore.FieldValue.serverTimestamp(); // Lấy timestamp từ server Firestore
        
        // Tạo ngày dạng YYYY-MM-DD
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Tháng từ 0-11 nên +1
        const day = String(now.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        try {
            await db.collection("emotionLogs").add({
                uid: uid,
                emotion: emotion, 
                emotionTextDisplay: selectedMoodDisplayText, 
                intensity: intensity, 
                notes: notes,
                timestamp: timestamp,
                date: dateString 
            });
            showMessage("Nhật ký cảm xúc đã được lưu!", 'mood-message');

            // Reset form
            selectedMoodValue = '';
            selectedMoodDisplayText = '...';
            selectedMoodDisplay.textContent = selectedMoodDisplayText;
            diaryEntryText.value = '';
            moodButtons.forEach(btn => btn.classList.remove('selected'));

        } catch (error) {
            console.error("Lỗi khi lưu nhật ký: ", error);
            showMessage("Đã có lỗi xảy ra khi lưu nhật ký. Vui lòng thử lại.", 'mood-message');
        }
    });

    
});