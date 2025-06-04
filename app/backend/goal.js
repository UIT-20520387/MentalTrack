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
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
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

//DOM Elements
const taskInput = document.getElementById("task");
const addBtn = document.getElementById("add-btn");
const listContainer = document.getElementById("list-container");

let currentUser = null;

function createGoalElement(goal) {
    const li = document.createElement('li');
    li.setAttribute('data-id', goal.id); // Lưu Firestore document ID vào data-id của li

    const label = document.createElement('label');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = goal.completed; // Đặt trạng thái ban đầu của checkbox
    
    // Xử lý sự kiện khi checkbox thay đổi trạng thái
    checkbox.addEventListener('change', () => {
        const isCompleted = checkbox.checked;
        const goalTextElement = label.querySelector('span'); // Lấy phần tử span chứa văn bản mục tiêu
        
        // Thêm/bỏ class 'completed' để gạch ngang text
        if (isCompleted) {
            goalTextElement.classList.add('completed');
        } else {
            goalTextElement.classList.remove('completed');
        }
        
        // Cập nhật trạng thái 'completed' trong Firestore
        toggleGoalCompleted(goal.id, isCompleted);
    });

    const span = document.createElement('span');
    span.textContent = goal.text;
    // Áp dụng class 'completed' ngay khi tạo element nếu mục tiêu đã hoàn thành (từ Firestore)
    if (goal.completed) {
        span.classList.add('completed');
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    // Sử dụng Material Symbols cho nút xóa
    deleteBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';
    deleteBtn.addEventListener('click', () => deleteGoal(goal.id));

    // Xây dựng cấu trúc HTML cho mỗi mục tiêu: <li> <label> (checkbox + span) </label> <button> (icon X) </button> </li>
    label.appendChild(checkbox);
    label.appendChild(span);
    li.appendChild(label);
    li.appendChild(deleteBtn); 

    listContainer.appendChild(li); // Thêm mục tiêu vào danh sách
}

// Hàm tải mục tiêu từ Firestore
async function loadGoals(uid) {
    listContainer.innerHTML = ''; // Xóa các mục tiêu cũ trước khi tải lại
    const q = query(collection(db, "goals"), where("uid", "==", uid));
    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            showMessage("Chưa có mục tiêu nào. Hãy thêm mục tiêu đầu tiên của bạn!", 'goalMessage');
        } else {
            querySnapshot.forEach((doc) => {
                createGoalElement({ id: doc.id, ...doc.data() });
            });
        }
    } catch (e) {
        console.error("Lỗi khi tải mục tiêu: ", e);
        showMessage("Không thể tải mục tiêu. Vui lòng kiểm tra kết nối hoặc quyền truy cập.", 'goalMessage');
    }
}


// Hàm thêm mục tiêu mới vào Firestore
async function addGoal() {
    const goalText = taskInput.value.trim();
    if (goalText === '') {
        showMessage('Vui lòng nhập mục tiêu.', 'goalMessage');
        return;
    }
    if (!currentUser) {
        showMessage('Vui lòng đăng nhập để thêm mục tiêu.', 'goalMessage');
        return;
    }

    try {
        const docRef = await addDoc(collection(db, "goals"), {
            uid: currentUser.uid,
            text: goalText,
            completed: false, // Mục tiêu mới mặc định là chưa hoàn thành
            createdAt: new Date() // Thêm thời gian tạo để sắp xếp nếu cần
        });
        console.log("Mục tiêu đã được thêm với ID: ", docRef.id);
        createGoalElement({ id: docRef.id, uid: currentUser.uid, text: goalText, completed: false });
        taskInput.value = ''; // Xóa nội dung input sau khi thêm
        showMessage("Mục tiêu đã được thêm thành công!", 'goalMessage');
    } catch (e) {
        console.error("Lỗi khi thêm mục tiêu: ", e);
        showMessage("Có lỗi xảy ra khi thêm mục tiêu. Vui lòng thử lại.", 'goalMessage');
    }
}

// Hàm đánh dấu hoàn thành/chưa hoàn thành mục tiêu (cập nhật Firestore)
async function toggleGoalCompleted(goalId, completedStatus) {
    const goalRef = doc(db, "goals", goalId);
    try {
        await updateDoc(goalRef, {
            completed: completedStatus
        });
        console.log("Mục tiêu đã được cập nhật trạng thái trong Firestore.");
    } catch (e) {
        console.error("Lỗi khi cập nhật trạng thái mục tiêu: ", e);
        showMessage("Có lỗi xảy ra khi cập nhật trạng thái. Vui lòng thử lại.", 'goalMessage');
    }
}

// Hàm xóa mục tiêu
async function deleteGoal(goalId) {
    if (!confirm('Bạn có chắc chắn muốn xóa mục tiêu này?')) {
        return;
    }
    const goalRef = doc(db, "goals", goalId);
    try {
        await deleteDoc(goalRef);
        const goalElement = listContainer.querySelector(`li[data-id="${goalId}"]`);
        if (goalElement) {
            goalElement.remove(); // Xóa khỏi DOM
        }
        console.log("Mục tiêu đã được xóa.");
        showMessage("Mục tiêu đã được xóa thành công!", 'goalMessage');
    } catch (e) {
        console.error("Lỗi khi xóa mục tiêu: ", e);
        showMessage("Có lỗi xảy ra khi xóa mục tiêu. Vui lòng thử lại.", 'goalMessage');
    }
}

// Xử lý sự kiện khi DOM được tải
document.addEventListener('DOMContentLoaded', () => {
    // Lắng nghe trạng thái đăng nhập của người dùng Firebase Authentication
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user; // Lưu thông tin người dùng hiện tại
            console.log("Người dùng đã đăng nhập: ", user.uid);
            loadGoals(user.uid); // Tải mục tiêu của người dùng này
        } else {
            currentUser = null;
            // Nếu người dùng chưa đăng nhập, hiển thị thông báo
            listContainer.innerHTML = '<li>Vui lòng đăng nhập để xem và thêm mục tiêu.</li>';
            console.log("Người dùng chưa đăng nhập.");
            // Tùy chọn: Chuyển hướng người dùng đến trang đăng nhập nếu cần
            // window.location.href = '../html/login.html';
        }
    });

    // Gán sự kiện click cho nút "Thêm"
    addBtn.addEventListener('click', addGoal);

    // Gán sự kiện 'keypress' cho input để cho phép thêm mục tiêu bằng phím Enter
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addGoal();
        }
    });
});
