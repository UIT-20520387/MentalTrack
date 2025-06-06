// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import {
  getAuth,
  deleteUser,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
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
// function showMessage(message, divId) {
//   var messageDiv = document.getElementById(divId);
//   messageDiv.style.display = "block";
//   messageDiv.innerHTML = message;
//   messageDiv.style.opacity = 1;
//   setTimeout(function () {
//     messageDiv.style.opacity = 0;
//   }, 5000);
// }

// DOM Elements
const mainContent = document.getElementById("mainContent");
const navUsers = document.getElementById("navUsers");
const navTests = document.getElementById("navTests");
const navPosts = document.getElementById("navPosts");

let currentAdminUser = null;

// --- Chức năng xác thực và kiểm tra vai trò Admin ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Người dùng đã đăng nhập, kiểm tra vai trò
    currentAdminUser = user;
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists && userDocSnap.data().role === "admin") {
        currentAdminUser = user;
        // Tải trang Quản lý Người dùng làm mặc định
        await loadUserManagementContent();
        // highlightActiveMenuItem(navUsers); // Đánh dấu menu active
      } else {
        // Không phải admin, chuyển hướng về trang đăng nhập hoặc trang người dùng thông thường
        alert("Bạn không có quyền truy cập trang quản trị.");
        await auth.signOut(); // Đăng xuất để bảo mật
        window.location.href = "../html/login.html"; // Chuyển hướng về trang đăng nhập
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra vai trò người dùng:", error);
      alert("Lỗi xác minh vai trò. Vui lòng thử lại.");
      await auth.signOut();
      window.location.href = '../html/login.html';
    }
  } else {
    // Người dùng chưa đăng nhập, chuyển hướng về trang đăng nhập
    window.location.href = "../html/login.html"; // Chuyển hướng về trang đăng nhập
  }
});

// --- Hàm tải và hiển thị nội dung Quản lý Người dùng ---
async function loadUserManagementContent() {
  mainContent.innerHTML = `
        <h2>Quản lý Người dùng</h2>
        <button id="addNewUserBtn" class="add-btn">Thêm người dùng mới</button>
        <div id="userListContainer">
            <p>Đang tải danh sách người dùng...</p>
        </div>
    `;

  // Gắn sự kiện cho nút "Thêm người dùng mới"
  document.getElementById("addNewUserBtn").addEventListener("click", () => {
    alert("Chức năng thêm người dùng đang được phát triển!"); // Placeholder
    // Sau này sẽ gọi hàm showAddUserForm()
  });

  try {
    const usersColRef = collection(db, "users"); // Sử dụng 'collection'
    const usersSnapshot = await getDocs(usersColRef); // Sử dụng 'getDocs'
    let usersHtml = `
            <table class="user-table">
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Tên đầy đủ</th>
                        <th>Ngày sinh</th>
                        <th>Giới tính</th>
                        <th>Vai trò</th>
                        <th>UID</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
        `;

    if (usersSnapshot.empty) {
      usersHtml += `<tr><td colspan="5">Không có người dùng nào.</td></tr>`;
    } else {
      usersSnapshot.forEach((docSnap) => {
        const userData = docSnap.data();
        usersHtml += `
                    <tr>
                        <td>${userData.email || "N/A"}</td>
                        <td>${userData.fullName || "N/A"}</td>
                        <td>${userData.birthday || "N/A"}</td> 
                        <td>${userData.gender || "N/A"}</td>   
                        <td>${userData.role || "user"}</td>
                        <td>${docSnap.id}</td>
                        <td>
                            <button class="delete-user-btn" data-uid="${
                              doc.id
                            }">Xóa</button>
                        </td>
                    </tr>
                `;
      });
    }
    usersHtml += `
                </tbody>
            </table>
        `;
    document.getElementById("userListContainer").innerHTML = usersHtml;

    // Gắn sự kiện cho các nút Xóa
    document.querySelectorAll(".delete-user-btn").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const uidToDelete = e.currentTarget.dataset.uid;

        // Không cho phép admin tự xóa tài khoản của chính mình
        if (currentAdminUser && uidToDelete === currentAdminUser.uid) {
          alert("Bạn không thể tự xóa tài khoản admin của chính mình.");
          return;
        }

        if (
          confirm(
            `Bạn có chắc chắn muốn xóa người dùng có UID: ${uidToDelete} không? Hành động này không thể hoàn tác.`
          )
        ) {
          try {
            // await deleteUserAccountAndData(uidToDelete); // Gọi hàm xóa
            alert(`Đã xóa người dùng có UID: ${uidToDelete}`);
            loadUserManagementContent(); // Tải lại danh sách người dùng sau khi xóa
          } catch (error) {
            console.error("Lỗi khi xóa người dùng:", error);
            alert(
              `Không thể xóa người dùng: ${error.message}. Vui lòng kiểm tra console.`
            );
          }
        }
      });
    });
  } catch (error) {
    console.error("Lỗi khi tải danh sách người dùng:", error);
    mainContent.innerHTML = `<p class="error-message">Không thể tải danh sách người dùng: ${error.message}</p>`;
  }
}

//Xóa tài khoản người dùng và dữ liệu Firestore
async function deleteUserAccountAndData(uid) {
  // Xóa tài liệu người dùng khỏi Firestore
    // try {
    //     const userDocRef = doc(db, 'users', uid);
    //     await deleteDoc(userDocRef);
    //     console.log(`Đã xóa tài liệu người dùng Firestore: ${uid}`);
    // } catch (error) {
    //     console.error("Lỗi khi xóa tài liệu người dùng Firestore:", error);
    //     throw new Error("Không thể xóa tài liệu người dùng trong Firestore: " + error.message);
    // }

    // //Xoá tài khoản Authentication
    // try {
      
    // } catch (error) {
    //   console.error("Lỗi khi xóa tài khoản Firebase Authentication:", error);
    //     // Ném lỗi để báo cho người dùng biết rằng việc xóa Auth thất bại.
    //     throw new Error("Không thể xóa tài khoản Firebase Authentication");
    // }
}

// --- Event Listeners cho menu điều hướng Admin ---
navUsers.addEventListener("click", (e) => {
  e.preventDefault();
  loadUserManagementContent();
  highlightActiveMenuItem(navUsers);
});

navTests.addEventListener("click", (e) => {
  e.preventDefault();
  mainContent.innerHTML =
    '<h2>Quản lý Bài kiểm tra</h2><p class="info-message">Chức năng này đang được phát triển...</p>';
  highlightActiveMenuItem(navTests);
});

navPosts.addEventListener("click", (e) => {
  e.preventDefault();
  mainContent.innerHTML =
    '<h2>Quản lý Bài đăng</h2><p class="info-message">Chức năng này đang được phát triển...</p>';
  highlightActiveMenuItem(navPosts);
});
