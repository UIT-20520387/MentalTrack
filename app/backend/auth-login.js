// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  getFirestore,
  getDoc,
  doc,
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
const db = getFirestore(app);
const auth = getAuth(app);

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
  // DOM Elements
  const loginForm = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  //Button
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = emailInput.value;
      const password = passwordInput.value;

      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        showMessage("Đăng nhập thành công", "loginMessage");
        const user = userCredential.user;
        localStorage.setItem("loggedInUserId", user.uid);

        const userDocRef = doc(db, "users", user.uid); // Tạo tham chiếu đến tài liệu user
        const userDocSnap = await getDoc(userDocRef); // Lấy snapshot của tài liệu

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData.role === "admin") {
            // Nếu người dùng là admin, chuyển hướng đến trang admin
            window.location.href = "../html/admin.html";
          } else {
            // Nếu là người dùng thông thường hoặc không có trường role, chuyển hướng đến trang chính
            window.location.href = "../html/homepage_signed_in.html";
          }
        } else {
          console.warn(
            "Tài liệu người dùng không tồn tại trong Firestore. Đăng xuất."
          );
          //signOut(); // Đăng xuất để tránh trạng thái không hợp lệ
          window.location.href = "../html/login.html";
        }
      } catch (error) {
        const errorCode = error.code;
        if (errorCode == "auth/invalid-credential") {
          showMessage("Email hoặc Mật khẩu sai", "loginMessage");
        } else {
          showMessage("Tài khoản không tồn tại", "loginMessage");
        }
      }
    });
  }
});
