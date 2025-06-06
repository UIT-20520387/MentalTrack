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
  setDoc,
  doc,
  getDoc,
  deleteDoc,
  where,
  query,
  orderBy,
  serverTimestamp,
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
      window.location.href = "../html/login.html";
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
            <table class="user-table table">
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
                          <button class="action-btn view-assessments-btn" data-uid="${
                            docSnap.id
                          }" data-name="${userData.fullName || userData.email}">
                                Xem lịch sử test
                            </button>
                            <button class="action-btn delete-user-btn delete-btn" data-uid="${
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

    // Gắn sự kiện cho nút "Xem lịch sử test"
    document.querySelectorAll(".view-assessments-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const uid = e.currentTarget.dataset.uid;
        const userName = e.currentTarget.dataset.name;
        viewUserAssessmentHistory(uid, userName);
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

// --- Tải và hiển thị nội dung Quản lý Bài kiểm tra ---
async function loadAssessmentManagementContent() {
  mainContent.innerHTML = `
        <h2>Quản lý Bài kiểm tra</h2>
        <button id="addNewAssessmentBtn" class="add-btn">
          Thêm Bài kiểm tra mới
        </button>
        <h3>Xem Lịch sử Bài kiểm tra của người dùng</h3>
        <div id="assessmentListContainer">
            <p>Đang tải danh sách bài kiểm tra hiện có...</p>
        </div>
    `;
  const addNewAssessmentBtn = document.getElementById("addNewAssessmentBtn");
  addNewAssessmentBtn.addEventListener("click", () => {
    loadAddAssessmentForm(); // Gọi hàm hiển thị form thêm bài kiểm tra
  });

  // TODO: Hiển thị danh sách các bài kiểm tra hiện có (DASS-21, GAD-7)
  // và các nút Sửa/Xóa cho từng bài.
  // Tạm thời hiển thị message placeholder
  try {
    const assessmentsColRef = collection(db, "assessments");
    const assessmentsSnapshot = await getDocs(assessmentsColRef);

    let assessmentsHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID Bài kiểm tra</th>
                        <th>Tên</th>
                        <th>Mô tả</th>
                        <th>Loại</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
        `;

    if (assessmentsSnapshot.empty) {
      assessmentsHtml += `<tr><td colspan="5">Không có bài kiểm tra nào được định nghĩa.</td></tr>`;
    } else {
      assessmentsSnapshot.forEach((docSnap) => {
        const assessmentData = docSnap.data();
        assessmentsHtml += `
                    <tr>
                        <td>${docSnap.id}</td>
                        <td>${assessmentData.name || "N/A"}</td>
                        <td>${assessmentData.description || "N/A"}</td>
                        <td>${assessmentData.type || "N/A"}</td>
                        <td>
                            <button class="action-btn edit-btn edit-assessment-btn" data-id="${
                              docSnap.id
                            }"> Sửa </button>
                            <button class="action-btn delete-btn delete-assessment-btn" data-id="${
                              docSnap.id
                            }">Xóa</button>
                        </td>
                    </tr>
                `;
      });
    }
    assessmentsHtml += `
                </tbody>
            </table>
        `;
    document.getElementById("assessmentListContainer").innerHTML = assessmentsHtml;

    // Gắn sự kiện cho nút Sửa/Xóa 
    document.querySelectorAll(".edit-assessment-btn").forEach((btn) => {
      btn.addEventListener("click", () =>
        alert(`Chức năng sửa bài kiểm tra ${btn.dataset.id} đang phát triển!`)
      );
    });
    document.querySelectorAll(".delete-assessment-btn").forEach((btn) => {
      btn.addEventListener("click", () =>
        alert(`Chức năng xóa bài kiểm tra ${btn.dataset.id} đang phát triển!`)
      );
    });
  } catch (error) {
    console.error("Lỗi khi tải danh sách bài kiểm tra:", error);
    document.getElementById(
      "assessmentListContainer"
    ).innerHTML = `<p class="error-message">Không thể tải danh sách bài kiểm tra: ${error.message}</p>`;
  }
}

// --- Hiển thị Form Thêm Bài kiểm tra mới ---
async function loadAddAssessmentForm() {
    mainContent.innerHTML = `
        <h2>Thêm Bài kiểm tra mới</h2>
        <form id="addAssessmentForm" class="assessment-form">
            <div class="form-section">
                <h3>Thông tin chung</h3>
                <label for="assessmentId">ID Bài kiểm tra (Duy nhất, ví dụ: dass-21, gad-7):</label>
                <input type="text" id="assessmentId" required>
                <label for="assessmentName">Tên Bài kiểm tra:</label>
                <input type="text" id="assessmentName" required>
                <label for="assessmentDescription">Mô tả:</label>
                <textarea id="assessmentDescription" rows="3"></textarea>
                <label for="assessmentType">Loại Bài kiểm tra (ví dụ: Chọn một đáp án, Chọn nhiều đáp án):</label>
                <input type="text" id="assessmentType" required>
            </div>

            <div class="form-section">
                <h3>Tùy chọn thang điểm (Scale Options)</h3>
                <div id="scaleOptionsContainer">
                    </div>
                <button type="button" id="addScaleOptionBtn" class="add-small-btn add-btn">
                  Thêm Tùy chọn thang điểm
                </button>
            </div>

            <div class="form-section">
                <h3>Các Nhóm câu hỏi (Sections) - Tùy chọn</h3>
                <div id="sectionsContainer">
                    </div>
                <button type="button" id="addSectionBtn" class="add-small-btn add-btn">
                    Thêm Nhóm mới
                </button>
            </div>

            <div class="form-section">
                <h3>Câu hỏi</h3>
                <div id="questionsContainer">
                    </div>
                <button type="button" id="addQuestionBtn" class="add-small-btn add-btn">
                  Thêm Câu hỏi
                </button>
            </div>

            <div class="form-actions">
                <button type="submit" class="submit-btn add-btn">
                  Lưu Bài kiểm tra
                </button>
                <button type="button" id="cancelAddAssessmentBtn" class="cancel-btn action-btn delete-btn">
                  Hủy
                </button>
            </div>
        </form>
    `;

    // Gắn sự kiện cho các nút động
    document.getElementById('addScaleOptionBtn').addEventListener('click', addScaleOptionField);
    document.getElementById('addSectionBtn').addEventListener('click', addSectionField);
    document.getElementById('addQuestionBtn').addEventListener('click', addQuestionField);
    document.getElementById('cancelAddAssessmentBtn').addEventListener('click', loadAssessmentManagementContent); // Quay lại trang quản lý bài kiểm tra

    // Gắn sự kiện cho form
    document.getElementById('addAssessmentForm').addEventListener('submit', handleAddAssessmentSubmit);

    // Thêm ít nhất 1 scale option và 1 câu hỏi ban đầu
    addScaleOptionField();
    addQuestionField();
}

// --- Thêm trường nhập Scale Option động ---
function addScaleOptionField() {
    const container = document.getElementById('scaleOptionsContainer');
    const index = container.children.length; // Sử dụng số lượng con hiện tại làm index
    const div = document.createElement('div');
    div.classList.add('dynamic-item');
    div.innerHTML = `
        <h4>Tùy chọn ${index}</h4>
        <label for="scaleOptionText${index}">Text:</label>
        <input type="text" id="scaleOptionText${index}" placeholder="Ví dụ: Hoàn toàn không đúng">
        <label for="scaleOptionValue${index}">Giá trị (0-3):</label>
        <input type="number" id="scaleOptionValue${index}" min="0" max="3" required>
        <button type="button" class="remove-btn action-btn delete-btn" onclick="this.parentNode.remove()">
          Xóa
        </button>
    `;
    container.appendChild(div);
}

// --- Thêm trường nhập Section động ---
function addSectionField() {
    const container = document.getElementById('sectionsContainer');
    const index = container.children.length;
    const div = document.createElement('div');
    div.classList.add('dynamic-item');
    div.innerHTML = `
        <h4>Nhóm câu hỏi ${index}</h4>
        <label for="sectionName${index}">Tên Nhóm câu hỏi (ví dụ: Depression):</label>
        <input type="text" id="sectionName${index}" required>
        <button type="button" class="remove-btn action-btn delete-btn" onclick="this.parentNode.remove()">
          Xóa
        </button>
    `;
    container.appendChild(div);
}

// --- Thêm trường nhập Câu hỏi động ---
function addQuestionField() {
    const container = document.getElementById('questionsContainer');
    const index = container.children.length; // Số lượng câu hỏi hiện có
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('dynamic-item', 'question-item');
    questionDiv.innerHTML = `
        <h4>Câu hỏi ${index + 1}</h4>
        <label for="questionText${index}">Câu hỏi:</label>
        <textarea id="questionText${index}" rows="2" required></textarea>
        
        <label for="questionSection${index}">Nhóm câu hỏi (Tùy chọn, ví dụ: Depression, Anxiety, Stress):</label>
        <input type="text" id="questionSection${index}" placeholder="Để trống nếu không có nhóm">

        <label for="questionType${index}">Loại câu trả lời:</label>
        <select id="questionType${index}" class="question-type-select" required>
            <option value="select_one">Chọn một đáp án</option>
            <option value="select_multiple">Chọn nhiều đáp án</option>
        </select>
        
        <div class="question-options-container">
            <label>Các lựa chọn đáp án:</label>
            <div id="optionsForQuestion${index}">
                </div>
            <button type="button" class="add-small-btn add-option-btn add-btn" data-question-index="${index}">
              Thêm đáp án cho câu hỏi này
            </button>
        </div>
        <button type="button" class="remove-btn action-btn delete-btn" onclick="this.parentNode.remove()">
          Xóa Câu hỏi
        </button>
    `;
    container.appendChild(questionDiv);

    // Gắn sự kiện cho nút "Thêm đáp án" của câu hỏi này
    document.querySelector(`.add-option-btn[data-question-index="${index}"]`).addEventListener('click', (e) => {
        addOptionField(e.target.dataset.questionIndex);
    });

    // Thêm ít nhất 1 option mặc định cho câu hỏi mới
    addOptionField(index);
}


// --- Thêm trường nhập Lựa chọn đáp án cho câu hỏi động ---
function addOptionField(questionIndex) {
    const container = document.getElementById(`optionsForQuestion${questionIndex}`);
    const optionIndex = container.children.length;
    const div = document.createElement('div');
    div.classList.add('dynamic-item', 'option-item');
    div.innerHTML = `
        <h5>Đáp án ${optionIndex + 1}</h5>
        <label for="optionText${questionIndex}-${optionIndex}">Text:</label>
        <input type="text" id="optionText${questionIndex}-${optionIndex}" placeholder="Ví dụ: Không đúng chút nào" required>
        <label for="optionValue${questionIndex}-${optionIndex}">Giá trị điểm (Tùy chọn):</label>
        <input type="number" id="optionValue${questionIndex}-${optionIndex}" placeholder="Để trống nếu không có điểm riêng">
        <button type="button" class="remove-btn action-btn delete-btn" onclick="this.parentNode.remove()">
          Xóa
        </button>
    `;
    container.appendChild(div);
}

// --- HÀM XỬ LÝ SUBMIT FORM THÊM BÀI KIỂM TRA ---
async function handleAddAssessmentSubmit(e) {
    e.preventDefault();

    const assessmentId = document.getElementById('assessmentId').value.trim();
    const assessmentName = document.getElementById('assessmentName').value.trim();
    const assessmentDescription = document.getElementById('assessmentDescription').value.trim();
    const assessmentType = document.getElementById('assessmentType').value.trim();

    if (!assessmentId || !assessmentName || !assessmentType) {
        alert('Vui lòng điền đầy đủ ID, Tên và Loại Bài kiểm tra.');
        return;
    }

    // Lấy Scale Options
    const scaleOptions = [];
    document.querySelectorAll('#scaleOptionsContainer .dynamic-item').forEach((item, index) => {
        const text = item.querySelector(`input[id="scaleOptionText${index}"]`).value.trim();
        const value = parseInt(item.querySelector(`input[id="scaleOptionValue${index}"]`).value, 10);
        if (text && !isNaN(value)) {
            scaleOptions.push({ text, value });
        }
    });
    if (scaleOptions.length === 0 || scaleOptions.length === 1) {
        alert('Vui lòng thêm ít nhất 2 Tùy chọn thang điểm.');
        return;
    }

    // Lấy Sections (tùy chọn)
    const sections = [];
    document.querySelectorAll('#sectionsContainer .dynamic-item').forEach((item, index) => {
        const sectionName = item.querySelector(`input[id="sectionName${index}"]`).value.trim();
        if (sectionName) {
            sections.push(sectionName);
        }
    });

    // Lấy Questions và Options
    const questions = [];
    const questionsDataForSubcollection = {}; // Dùng để lưu vào subcollection
    let questionOrder = 1;

    for (const questionItem of document.querySelectorAll('#questionsContainer .question-item')) {
        const qIndex = parseInt(questionItem.querySelector('.add-option-btn').dataset.questionIndex, 10); // Lấy index của câu hỏi
        const questionText = questionItem.querySelector(`textarea[id="questionText${qIndex}"]`).value.trim();
        const questionSection = questionItem.querySelector(`input[id="questionSection${qIndex}"]`).value.trim();
        const questionType = questionItem.querySelector(`select[id="questionType${qIndex}"]`).value;

        if (!questionText) {
            alert(`Câu hỏi số ${questionOrder} không thể trống.`);
            return;
        }

        const options = [];
        questionItem.querySelectorAll('.option-item').forEach((optionItem, optIndex) => {
            const optionText = optionItem.querySelector(`input[id="optionText${qIndex}-${optIndex}"]`).value.trim();
            const optionValueInput = optionItem.querySelector(`input[id="optionValue${qIndex}-${optIndex}"]`).value.trim();
            const optionValue = optionValueInput ? parseInt(optionValueInput, 10) : null; // Có thể để trống

            if (optionText) {
                options.push({ text: optionText, value: optionValue });
            }
        });

        if (options.length === 0) {
            alert(`Câu hỏi số ${questionOrder} phải có ít nhất một lựa chọn đáp án.`);
            return;
        }

        const questionDocId = `q${questionOrder}`;
        questionsDataForSubcollection[questionDocId] = {
            order: questionOrder,
            text: questionText,
            type: questionType, // select_one hoặc select_multiple
            options: options, // Lưu options trực tiếp trong document câu hỏi
        };

        if (questionSection) {
            questionsDataForSubcollection[questionDocId].section = questionSection;
        }
        
        questionOrder++; // Tăng thứ tự câu hỏi cho câu tiếp theo
    }

    if (Object.keys(questionsDataForSubcollection).length === 0) {
        alert('Vui lòng thêm ít nhất một câu hỏi.');
        return;
    }

    const newAssessmentData = {
        name: assessmentName,
        description: assessmentDescription,
        scaleOptions: scaleOptions,
        type: assessmentType,
        createdAt: serverTimestamp(),
    };

    if (sections.length > 0) {
        newAssessmentData.section = sections; // Lưu mảng sections nếu có
    }

    try {
        // Tạo tài liệu chính trong collection 'assessments'
        const assessmentDocRef = doc(db, 'assessments', assessmentId);
        await setDoc(assessmentDocRef, newAssessmentData);

        // Tạo subcollection 'questions' và thêm từng câu hỏi
        const questionsSubColRef = collection(assessmentDocRef, 'questions');
        for (const qId in questionsDataForSubcollection) {
            await setDoc(doc(questionsSubColRef, qId), questionsDataForSubcollection[qId]);
        }

        alert('Bài kiểm tra mới đã được thêm thành công!');
        loadAssessmentManagementContent(); // Quay lại màn hình quản lý bài kiểm tra
    } catch (error) {
        console.error("Lỗi khi thêm bài kiểm tra mới:", error);
        alert(`Không thể thêm bài kiểm tra: ${error.message}. Vui lòng kiểm tra console.`);
    }
}

// --- Xem lịch sử bài kiểm tra của một người dùng cụ thể ---
async function viewUserAssessmentHistory(uid, userName) {
  mainContent.innerHTML = `
        <h2>Lịch sử Bài kiểm tra của ${userName}</h2>
        <button id="backToUserManagementBtn" class="action-btn back-btn">
            Quay lại Quản lý Người dùng
        </button>
        <div id="assessmentResultsList">
            <p>Đang tải kết quả bài kiểm tra...</p>
        </div>
    `;

  document
    .getElementById("backToUserManagementBtn")
    .addEventListener("click", () => {
      loadUserManagementContent(); // Quay lại màn hình quản lý người dùng
    });

  try {
    // Lấy tất cả các kết quả bài kiểm tra của người dùng này, sắp xếp theo ngày hoàn thành mới nhất
    const q = query(
      collection(db, "userAssessments"),
      where("uid", "==", uid),
      orderBy("dateCompleted", "desc") // Sắp xếp theo ngày hoàn thành mới nhất
    );
    const querySnapshot = await getDocs(q);

    let resultsHtml = `
            <table class="assessment-results-table table">
                <thead>
                    <tr>
                        <th>Tên bài kiểm tra</th>
                        <th>Ngày hoàn thành</th>
                        <th>Tổng điểm</th>
                        <th>Đánh giá</th>
                        <th>Chi tiết</th>
                    </tr>
                </thead>
                <tbody>
        `;

    if (querySnapshot.empty) {
      resultsHtml += `<tr><td colspan="5">Người dùng này chưa hoàn thành bài kiểm tra nào.</td></tr>`;
    } else {
      // Lấy tất cả định nghĩa bài kiểm tra để có thông tin tên, mô tả
      const assessmentDefs = {};
      const assessmentDefsSnapshot = await getDocs(
        collection(db, "assessments")
      );
      assessmentDefsSnapshot.forEach((doc) => {
        assessmentDefs[doc.id] = doc.data();
      });

      for (const docSnap of querySnapshot.docs) {
        const resultData = docSnap.data();
        const assessmentDef = assessmentDefs[resultData.assessmentType]; // assessmentType là ID của bài kiểm tra

        const assessmentName = assessmentDef
          ? assessmentDef.name
          : "Không xác định";
        const date = resultData.dateCompleted
          ? new Date(resultData.dateCompleted.toDate()).toLocaleString()
          : "N/A"; // Chuyển đổi Timestamp sang Date

        let scoreDisplay = "";
        let evaluation = "";

        // Logic hiển thị điểm và đánh giá tùy thuộc vào loại bài kiểm tra
        if (resultData.assessmentType === "DASS-21" && resultData.finalScores) {
          const depressionScore = resultData.finalScores.Depression || 0;
          const anxietyScore = resultData.finalScores.Anxiety || 0;
          const stressScore = resultData.finalScores.Stress || 0;

          scoreDisplay = `D: ${depressionScore}, A: ${anxietyScore}, S: ${stressScore}`;

          evaluation = getDASS21Evaluation(
            depressionScore,
            anxietyScore,
            stressScore
          );
        } else if (
          resultData.assessmentType === "GAD-7" &&
          resultData.totalScore !== undefined
        ) {
          const gad7Score = resultData.totalScore;
          scoreDisplay = `${gad7Score} điểm`;
          evaluation = getGAD7Evaluation(gad7Score);
        } else {
          scoreDisplay = "N/A";
          evaluation = "Không có đánh giá";
        }

        resultsHtml += `
                    <tr>
                        <td>${assessmentName}</td>
                        <td>${date}</td>
                        <td>${scoreDisplay}</td>
                        <td>${evaluation}</td>
                        <td>
                            <button class="action-btn view-details-btn" data-doc-id="${docSnap.id}">
                              Xem chi tiết
                            </button>
                        </td>
                    </tr>
                `;
      }
    }
    resultsHtml += `
                </tbody>
            </table>
        `;
    document.getElementById("assessmentResultsList").innerHTML = resultsHtml;

    // Gắn sự kiện cho nút "Xem chi tiết" (sẽ phát triển sau)
    document.querySelectorAll(".view-details-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const resultDocId = e.currentTarget.dataset.docId;
        alert(
          `Xem chi tiết kết quả ${resultDocId} (Chức năng đang phát triển)`
        );
        // Gọi hàm hiển thị chi tiết kết quả từng câu trả lời tại đây
      });
    });
  } catch (error) {
    console.error("Lỗi khi tải lịch sử bài kiểm tra:", error);
    document.getElementById(
      "assessmentResultsList"
    ).innerHTML = `<p class="error-message">Không thể tải lịch sử bài kiểm tra: ${error.message}</p>`;
  }
}

// --- Đánh giá DASS-21 ---
function getDASS21Evaluation(d, a, s) {
  let depressionLevel = "";
  let anxietyLevel = "";
  let stressLevel = "";

  // Depression
  if (d >= 28) depressionLevel = "Rất nặng";
  else if (d >= 21) depressionLevel = "Nặng";
  else if (d >= 14) depressionLevel = "Vừa";
  else if (d >= 10) depressionLevel = "Nhẹ";
  else depressionLevel = "Bình thường";

  // Anxiety
  if (a >= 20) anxietyLevel = "Rất nặng";
  else if (a >= 15) anxietyLevel = "Nặng";
  else if (a >= 10) anxietyLevel = "Vừa";
  else if (a >= 8) anxietyLevel = "Nhẹ";
  else anxietyLevel = "Bình thường";

  // Stress
  if (s >= 34) stressLevel = "Rất nặng";
  else if (s >= 26) stressLevel = "Nặng";
  else if (s >= 19) stressLevel = "Vừa";
  else if (s >= 15) stressLevel = "Nhẹ";
  else stressLevel = "Bình thường";

  return `Trầm cảm: ${depressionLevel}, Lo âu: ${anxietyLevel}, Stress: ${stressLevel}`;
}

// --- Đánh giá GAD-7 ---
function getGAD7Evaluation(score) {
  if (score >= 15) return "Lo âu nặng";
  else if (score >= 10) return "Lo âu vừa";
  else if (score >= 5) return "Lo âu nhẹ";
  else return "Bình thường";
}

// --- Event Listeners cho menu điều hướng Admin ---
if (navUsers) {
  navUsers.addEventListener("click", async (e) => {
    e.preventDefault();
    await loadUserManagementContent();
  });
}

if (navTests) {
  navTests.addEventListener("click", async (e) => {
    e.preventDefault();
    await loadAssessmentManagementContent();
  });
}

navPosts.addEventListener("click", (e) => {
  e.preventDefault();
  mainContent.innerHTML =
    '<h2>Quản lý Bài đăng</h2><p class="info-message">Chức năng này đang được phát triển...</p>';
});
