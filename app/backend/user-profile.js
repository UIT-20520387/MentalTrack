// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
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

document.addEventListener("DOMContentLoaded", function () {
  //DOM Elements
  const fullName = document.getElementById("fullname");
  const gender = document.getElementById("gender");
  const birthday = document.getElementById("birthday");
  const email = document.getElementById("email");
  const logoutBtn = document.getElementById("logout");

  // Fetch user details
  onAuthStateChanged(auth, (user) => {
    if (user) {
      //     // User is signed in
      const docRef = doc(db, "users", user.uid);
      getDoc(docRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          fullName.textContent = userData.fullName;
          gender.textContent = userData.gender;
          birthday.textContent = userData.birthday;
          email.textContent = userData.email;
        } else {
          showMessage("Không tìm thấy dữ liệu người dùng", "profileMessage");
        }
      });
    } else {
      // User is not signed in, redict to login page
      showMessage(
        "Người dùng chưa đăng nhập. Chuyển hướng...",
        "profileMessage"
      );
      window.location.href = "../html/login.html";
    }
  });

  //Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      signOut(auth)
        .then(() => {
          //Logout success
          localStorage.removeItem("loggedInUserId");
          window.location.href = "../html/login.html";
        })
        .catch((error) => {
          showMessage("Đăng xuất thất bại. Vui lòng thử lại", "profileMessage");
        });
    });
  }
});
