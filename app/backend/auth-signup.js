// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  getFirestore,
  setDoc,
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

//Button
const registerBtn = document.getElementById("register-btn");
registerBtn.addEventListener("click", (event) => {
  event.preventDefault();

  //Inputs
  const fullName = document.getElementById("fullname").value;
  const gender = document.getElementById("gender").value;
  const birthday = document.getElementById("birthday").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const reEnterPassword = document.getElementById("re-enter-password").value;

  if (password !== reEnterPassword) {
    showMessage("Mật khẩu xác nhận không khớp", "registerMessage");
    return; 
  }

  const auth = getAuth();
  const db = getFirestore();

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      const userData = {
        fullName: fullName,
        gender: gender,
        birthday: birthday,
        email: email,
        password: password,
        reEnterPassword: reEnterPassword,
      };
      showMessage("Tài khoản được tạo thành công", "registerMessage");
      const docRef = doc(db, "users", user.uid);
      setDoc(docRef, userData)
        .then(() => {
          window.location.href = "../html/login.html";
        })
        .catch((error) => {
          console.error("Lỗi ghi tài liệu", error);
        });
    })
    .catch((error) => {
      const errorCode = error.code;
      if (errorCode == "auth/email-already-in-use") {
        showMessage("Email đã tồn tại!", "registerMessage");
      } else {
        showMessage("Không thể tạo tài khoản", "registerMessage");
      }
    });
});
