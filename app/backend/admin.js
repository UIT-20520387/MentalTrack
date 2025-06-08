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
  updateDoc,
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

// DOM Elements
const mainContent = document.getElementById("mainContent");
const navUsers = document.getElementById("navUsers");
const navTests = document.getElementById("navTests");
const navPosts = document.getElementById("navPosts");

let currentAdminUser = null;
let editingAssessmentId = null;
let editingPostId = null;

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

// ----- QUẢN LÝ NGƯỜI DÙNG -----
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

// ----- QUẢN LÝ BÀI KIỂM TRA -----
// --- Tải và hiển thị nội dung Quản lý Bài kiểm tra ---
async function loadAssessmentManagementContent() {
  editingAssessmentId = null;
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
    document.getElementById("assessmentListContainer").innerHTML =
      assessmentsHtml;

    // Gắn sự kiện cho nút Sửa
    document.querySelectorAll(".edit-assessment-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const assessmentIdToEdit = e.currentTarget.dataset.id;
        loadEditAssessmentForm(assessmentIdToEdit); // GỌI HÀM SỬA
      });
    });

    // Gắn sự kiện cho nút Xoá
    document.querySelectorAll(".delete-assessment-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const assessmentIdToDelete = e.currentTarget.dataset.id;
        if (
          confirm(
            `Bạn có chắc chắn muốn xóa bài kiểm tra "${assessmentIdToDelete}" không? Hành động này sẽ xóa vĩnh viễn định nghĩa bài kiểm tra và các câu hỏi của nó. Nó KHÔNG xóa kết quả bài kiểm tra của người dùng.`
          )
        ) {
          try {
            await deleteAssessment(assessmentIdToDelete); // Gọi hàm xóa
            alert(`Đã xóa bài kiểm tra: ${assessmentIdToDelete}`);
            loadAssessmentManagementContent(); // Tải lại danh sách sau khi xóa
          } catch (error) {
            console.error("Lỗi khi xóa bài kiểm tra:", error);
            alert(
              `Không thể xóa bài kiểm tra: ${error.message}. Vui lòng kiểm tra console.`
            );
          }
        }
      });
    });
  } catch (error) {
    console.error("Lỗi khi tải danh sách bài kiểm tra:", error);
    document.getElementById(
      "assessmentListContainer"
    ).innerHTML = `<p class="error-message">Không thể tải danh sách bài kiểm tra: ${error.message}</p>`;
  }
}

// --- Tải form Sửa Bài kiểm tra ---
async function loadEditAssessmentForm(assessmentId) {
  editingAssessmentId = assessmentId; // Lưu ID bài kiểm tra đang chỉnh sửa
  mainContent.innerHTML = `
        <h2>Sửa Bài kiểm tra</h2>
        <p>Đang tải thông tin bài kiểm tra...</p>
    `;

  try {
    const assessmentDocRef = doc(db, "assessments", assessmentId);
    const assessmentDocSnap = await getDoc(assessmentDocRef);

    if (!assessmentDocSnap.exists()) {
      alert("Không tìm thấy bài kiểm tra này.");
      loadAssessmentManagementContent();
      return;
    }
    const assessmentData = assessmentDocSnap.data();

    // Lấy sub-collection questions
    const questionsColRef = collection(assessmentDocRef, "questions");
    const questionsSnapshot = await getDocs(questionsColRef);
    const questionsData = [];
    questionsSnapshot.forEach((qDoc) => {
      questionsData.push({ id: qDoc.id, ...qDoc.data() });
    });
    // Sắp xếp câu hỏi theo thứ tự để hiển thị đúng
    questionsData.sort((a, b) => a.order - b.order);

    // Render form với dữ liệu đã load
    mainContent.innerHTML = `
            <h2>Sửa Bài kiểm tra</h2>
            <form id="addAssessmentForm" class="assessment-form">
                <div class="form-section">
                    <h3>Thông tin chung</h3>
                    <label for="assessmentId">ID Bài kiểm tra (Duy nhất, không thể thay đổi):</label>
                    <input type="text" id="assessmentId" value="${assessmentId}" readonly required>
                    <label for="assessmentName">Tên Bài kiểm tra:</label>
                    <input type="text" id="assessmentName" value="${
                      assessmentData.name || ""
                    }" required>
                    <label for="assessmentDescription">Mô tả:</label>
                    <textarea id="assessmentDescription" rows="3">${
                      assessmentData.description || ""
                    }</textarea>
                    <label for="assessmentType">Loại Bài kiểm tra (ví dụ: Chọn một đáp án, Chọn nhiều đáp án, Đúng/Sai,...):</label>
                    <input type="text" id="assessmentType" value="${
                      assessmentData.type || ""
                    }" required>
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
                      Cập nhật Bài kiểm tra
                    </button>
                    <button type="button" id="cancelAddAssessmentBtn" class="cancel-btn action-btn delete-btn">
                      Hủy
                    </button>
                </div>
            </form>
        `;

    // Gắn sự kiện cho các nút động
  const addScaleOptionBtn = document.getElementById("addScaleOptionBtn");
  addScaleOptionBtn.addEventListener("click", addScaleOptionField);

  const addSectionBtn = document.getElementById("addSectionBtn");
  addSectionBtn.addEventListener("click", () => addSectionField());

  const addQuestionBtn = document.getElementById("addQuestionBtn");
  addQuestionBtn.addEventListener("click", () => addQuestionField());

  // Quay lại trang quản lý bài kiểm tra sau khi nhấn nút Huỷ
  const cancelAddAssessmentBtn = document.getElementById("cancelAddAssessmentBtn");
  cancelAddAssessmentBtn.addEventListener("click",loadAssessmentManagementContent); 

    // Gắn sự kiện cho form
    document
      .getElementById("addAssessmentForm")
      .addEventListener("submit", handleAddAssessmentSubmit);

    // Điền dữ liệu Scale Options
    if (assessmentData.scaleOptions && assessmentData.scaleOptions.length > 0) {
      //
      assessmentData.scaleOptions.forEach((option) =>
        addScaleOptionField(option.text, option.value)
      ); //
    } else {
      addScaleOptionField(); // Thêm ít nhất 1 cái nếu không có
    }

    // Điền dữ liệu Sections
    if (assessmentData.section && Array.isArray(assessmentData.section)) {
      assessmentData.section.forEach((sectionName) =>
        addSectionField(sectionName)
      );
    }

    // Điền dữ liệu Questions và Options
    if (questionsData.length > 0) {
      //
      questionsData.forEach((qData) => {
        //
        addQuestionField(
          qData.text,
          qData.section || "", // Đảm bảo truyền string rỗng nếu không có section
          qData.type,
          qData.options,
          qData.id // Truyền ID câu hỏi để duy trì khi cập nhật
        );
      });
    } else {
      addQuestionField(); // Thêm ít nhất 1 cái nếu không có
    }
  } catch (error) {
    console.error("Lỗi khi tải thông tin bài kiểm tra để sửa:", error);
    mainContent.innerHTML = `<p class="error-message">Không thể tải thông tin bài kiểm tra: ${error.message}</p>`;
  }
}

// --- Xóa Bài kiểm tra ---
async function deleteAssessment(assessmentId) {
  // Xóa tất cả các câu hỏi trong sub-collection 'questions' trước
  const questionsColRef = collection(
    db,
    "assessments",
    assessmentId,
    "questions"
  );
  const questionsSnapshot = await getDocs(questionsColRef);
  const deleteQuestionPromises = [];
  questionsSnapshot.forEach((qDoc) => {
    deleteQuestionPromises.push(
      deleteDoc(doc(db, "assessments", assessmentId, "questions", qDoc.id))
    );
  });
  await Promise.all(deleteQuestionPromises); // Chờ tất cả câu hỏi được xóa

  // Xóa tài liệu bài kiểm tra chính
  const assessmentDocRef = doc(db, "assessments", assessmentId);
  await deleteDoc(assessmentDocRef);

  console.log(`Đã xóa bài kiểm tra: ${assessmentId} và các câu hỏi liên quan.`);
}

// --- Hiển thị Form Thêm Bài kiểm tra mới ---
async function loadAddAssessmentForm() {
  mainContent.innerHTML = `
        <h2>Thêm Bài kiểm tra mới</h2>
        <form id="addAssessmentForm" class="assessment-form">
            <div class="form-section">
                <h3>Thông tin chung</h3>
                <label for="assessmentId">ID Bài kiểm tra (Duy nhất, ví dụ: DASS-21, GAD-7):</label>
                <input type="text" id="assessmentId" required>
                <label for="assessmentName">Tên Bài kiểm tra:</label>
                <input type="text" id="assessmentName" required>
                <label for="assessmentDescription">Mô tả:</label>
                <textarea id="assessmentDescription" rows="3"></textarea>
                <label for="assessmentType">Loại Bài kiểm tra (ví dụ: Chọn một đáp án, Chọn nhiều đáp án, Đúng/Sai,...):</label>
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
  const addScaleOptionBtn = document.getElementById("addScaleOptionBtn");
  addScaleOptionBtn.addEventListener("click", addScaleOptionField);

  const addSectionBtn = document.getElementById("addSectionBtn");
  addSectionBtn.addEventListener("click", () => addSectionField());

  const addQuestionBtn = document.getElementById("addQuestionBtn");
  addQuestionBtn.addEventListener("click", () => addQuestionField());

  // Quay lại trang quản lý bài kiểm tra sau khi nhấn nút Huỷ
  const cancelAddAssessmentBtn = document.getElementById("cancelAddAssessmentBtn");
  cancelAddAssessmentBtn.addEventListener("click",loadAssessmentManagementContent); 

  // Gắn sự kiện cho form
  document
    .getElementById("addAssessmentForm")
    .addEventListener("submit", handleAddAssessmentSubmit);

  // Thêm ít nhất 1 scale option và 1 câu hỏi ban đầu
  addScaleOptionField();
  addQuestionField();
}

// --- Thêm trường nhập Scale Option động ---
function addScaleOptionField(defaultText = "", defaultValue = "") {
  const container = document.getElementById("scaleOptionsContainer");
  const index = container.children.length; // Sử dụng số lượng con hiện tại làm index
  const div = document.createElement("div");
  div.classList.add("dynamic-item");
  div.innerHTML = `
        <h4>Tùy chọn ${index}</h4>
        <label for="scaleOptionText${index}">Text:</label>
        <input type="text" id="scaleOptionText${index}" value="${defaultText}" placeholder="Ví dụ: Hoàn toàn không đúng">
        <label for="scaleOptionValue${index}">Giá trị (0-3):</label>
        <input type="number" id="scaleOptionValue${index}" min="0" max="3" value="${defaultValue}" required>
        <button type="button" class="remove-btn action-btn delete-btn" onclick="this.parentNode.remove()">
          Xóa
        </button>
    `;
  container.appendChild(div);
}

// --- Thêm trường nhập Section động ---
function addSectionField(defaultSectionName = "") {
  const container = document.getElementById("sectionsContainer");
  const index = container.children.length;
  const div = document.createElement("div");
  div.classList.add("dynamic-item");
  div.innerHTML = `
        <h4>Nhóm câu hỏi ${index}</h4>
        <label for="sectionName${index}">Tên Nhóm câu hỏi (ví dụ: Depression):</label>
        <input type="text" id="sectionName${index}" value="${defaultSectionName}" required>
        <button type="button" class="remove-btn action-btn delete-btn" onclick="this.parentNode.remove()">
          Xóa
        </button>
    `;
  container.appendChild(div);
}

// --- Thêm trường nhập Câu hỏi động ---
function addQuestionField(
  defaultText = "",
  defaultSection = "",
  defaultType = "select_one",
  defaultOptions = [],
  defaultQuestionId = null
) {
  const container = document.getElementById("questionsContainer");
  const index = container.children.length; // Số lượng câu hỏi hiện có
  const questionDiv = document.createElement("div");
  questionDiv.classList.add("dynamic-item", "question-item");
  questionDiv.innerHTML = `
        <h4>Câu hỏi ${index + 1}</h4>
        <input type="hidden" class="question-original-id" value="${
          defaultQuestionId || ""
        }"> <label for="questionText${index}">Câu hỏi:</label>        
        <textarea id="questionText${index}" rows="2" required>${defaultText}</textarea>
        
        <label for="questionSection${index}">Nhóm câu hỏi (Tùy chọn, ví dụ: Depression, Anxiety, Stress):</label>
        <input type="text" id="questionSection${index}" value="${defaultSection}" placeholder="Để trống nếu không có nhóm">

        <label for="questionType${index}">Loại câu trả lời:</label>
        <select id="questionType${index}" class="question-type-select" required>
            <option value="select_one" ${
              defaultType === "select_one" ? "selected" : ""
            }>Chọn một đáp án</option>
            <option value="select_multiple" ${
              defaultType === "select_multiple" ? "selected" : ""
            }>Chọn nhiều đáp án</option>
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
  document
    .querySelector(`.add-option-btn[data-question-index="${index}"]`)
    .addEventListener("click", (e) => {
      addOptionField(e.target.dataset.questionIndex);
    });

  // Điền dữ liệu options nếu có
  if (defaultOptions && defaultOptions.length > 0) {
    defaultOptions.forEach((option) =>
      addOptionField(index, option.text, option.value)
    );
  } else {
    // Thêm ít nhất 1 option mặc định nếu không có option nào
    addOptionField(index);
  }
}

// --- Thêm trường nhập Lựa chọn đáp án cho câu hỏi động ---
function addOptionField(questionIndex, defaultText = "", defaultValue = "") {
  const container = document.getElementById(
    `optionsForQuestion${questionIndex}`
  );
  const optionIndex = container.children.length;
  const div = document.createElement("div");
  div.classList.add("dynamic-item", "option-item");
  div.innerHTML = `
        <h5>Đáp án ${optionIndex + 1}</h5>
        <label for="optionText${questionIndex}-${optionIndex}">Text:</label>
        <input type="text" id="optionText${questionIndex}-${optionIndex}" value="${defaultText}" placeholder="Ví dụ: Không đúng chút nào" required>
        <label for="optionValue${questionIndex}-${optionIndex}">Giá trị điểm (Tùy chọn):</label>
        <input type="number" id="optionValue${questionIndex}-${optionIndex}" value="${
    defaultValue !== null ? defaultValue : ""
  }" placeholder="Để trống nếu không có điểm riêng">
        <button type="button" class="remove-btn action-btn delete-btn" onclick="this.parentNode.remove()">
          Xóa
        </button>
    `;
  container.appendChild(div);
}

// --- HÀM XỬ LÝ SUBMIT FORM THÊM BÀI KIỂM TRA ---
async function handleAddAssessmentSubmit(e) {
  e.preventDefault();

  const assessmentId = document.getElementById("assessmentId").value.trim();
  const assessmentName = document.getElementById("assessmentName").value.trim();
  const assessmentDescription = document
    .getElementById("assessmentDescription")
    .value.trim();
  const assessmentType = document.getElementById("assessmentType").value.trim();

  if (!assessmentId || !assessmentName || !assessmentType) {
    alert("Vui lòng điền đầy đủ ID, Tên và Loại Bài kiểm tra.");
    return;
  }

  // Lấy Scale Options
  const scaleOptions = [];
  document
    .querySelectorAll("#scaleOptionsContainer .dynamic-item")
    .forEach((item, index) => {
      const text = item
        .querySelector(`input[id="scaleOptionText${index}"]`)
        .value.trim();
      const value = parseInt(
        item.querySelector(`input[id="scaleOptionValue${index}"]`).value,
        10
      );
      if (text && !isNaN(value)) {
        scaleOptions.push({ text, value });
      }
    });
  if (scaleOptions.length === 0 || scaleOptions.length === 1) {
    alert("Vui lòng thêm ít nhất 2 Tùy chọn thang điểm.");
    return;
  }

  // Lấy Sections (tùy chọn)
  const sections = [];
  document
    .querySelectorAll("#sectionsContainer .dynamic-item")
    .forEach((item, index) => {
      const sectionName = item
        .querySelector(`input[id="sectionName${index}"]`)
        .value.trim();
      if (sectionName) {
        sections.push(sectionName);
      }
    });

  // Lấy Questions và Options
  const questionsDataForSubcollection = {}; // Dùng để lưu vào subcollection
  let questionOrder = 1;

  // Theo dõi các câu hỏi hiện có trong DB để xóa những câu đã bị gỡ
  const existingQuestionIds = new Set();
  if (editingAssessmentId) {
    // Lấy danh sách ID câu hỏi hiện có từ DB trước khi cập nhật
    const currentQuestionsSnapshot = await getDocs(
      collection(db, "assessments", editingAssessmentId, "questions")
    );
    currentQuestionsSnapshot.forEach((qDoc) =>
      existingQuestionIds.add(qDoc.id)
    );
  }

  // Thu thập các câu hỏi từ form
  const currentFormQuestionIds = new Set(); // ID của các câu hỏi CÓ TRONG FORM HIỆN TẠI
  for (const questionItem of document.querySelectorAll(
    "#questionsContainer .question-item"
  )) {
    const qIndex = parseInt(
      questionItem.querySelector(".add-option-btn").dataset.questionIndex,
      10
    );
    const questionText = questionItem
      .querySelector(`textarea[id="questionText${qIndex}"]`)
      .value.trim();
    const questionSection = questionItem
      .querySelector(`input[id="questionSection${qIndex}"]`)
      .value.trim();
    const questionType = questionItem.querySelector(
      `select[id="questionType${qIndex}"]`
    ).value;
    const originalQuestionId = questionItem.querySelector(
      ".question-original-id"
    ).value; // Lấy ID gốc (nếu có)

    if (!questionText) {
      alert(`Câu hỏi số ${questionOrder} không thể trống.`);
      return;
    }

    const options = [];
    questionItem
      .querySelectorAll(".option-item")
      .forEach((optionItem, optIndex) => {
        const optionText = optionItem
          .querySelector(`input[id="optionText${qIndex}-${optIndex}"]`)
          .value.trim();
        const optionValueInput = optionItem
          .querySelector(`input[id="optionValue${qIndex}-${optIndex}"]`)
          .value.trim();
        const optionValue = optionValueInput
          ? parseInt(optionValueInput, 10)
          : null;

        if (optionText) {
          options.push({ text: optionText, value: optionValue });
        }
      });

    if (options.length === 0) {
      alert(`Câu hỏi số ${questionOrder} phải có ít nhất một lựa chọn đáp án.`);
      return;
    }

    // Sử dụng lại ID gốc nếu có, hoặc tạo ID mới theo thứ tự
    const qDocId = originalQuestionId || `q${questionOrder}`;
    questionsDataForSubcollection[qDocId] = {
      order: questionOrder, // Luôn cập nhật lại thứ tự
      text: questionText,
      type: questionType,
      options: options,
    };

    if (questionSection) {
      questionsDataForSubcollection[qDocId].section = questionSection;
    }

    currentFormQuestionIds.add(qDocId); // Thêm ID của câu hỏi từ form vào tập hợp này
    questionOrder++;
  }

  if (Object.keys(questionsDataForSubcollection).length === 0) {
    alert("Vui lòng thêm ít nhất một câu hỏi.");
    return;
  }

  const assessmentDocRef = doc(db, "assessments", assessmentId);
  const questionsSubColRef = collection(assessmentDocRef, "questions");

  try {
    // Xóa các câu hỏi đã bị gỡ khỏi form (chỉ khi đang ở chế độ sửa)
    if (editingAssessmentId) {
      const deletedQuestionPromises = [];
      for (const existingId of existingQuestionIds) {
        if (!currentFormQuestionIds.has(existingId)) {
          // Nếu ID này không còn trong form, xóa nó khỏi DB
          deletedQuestionPromises.push(
            deleteDoc(doc(questionsSubColRef, existingId))
          );
        }
      }
      await Promise.all(deletedQuestionPromises);
    }

    // Cập nhật tài liệu chính trong collection 'assessments'
    const newAssessmentData = {
      name: assessmentName,
      description: assessmentDescription,
      scaleOptions: scaleOptions,
      type: assessmentType,
      // createdAt: serverTimestamp(), // Giữ nguyên createdAt nếu là cập nhật
      updatedAt: serverTimestamp(), // Thêm updatedAt
    };

    if (sections.length > 0) {
      newAssessmentData.section = sections;
    } else {
      // Nếu không có sections, đảm bảo xóa trường section nếu trước đó có
      newAssessmentData.section = null;
    }

    // Nếu đang sửa bài kiểm tra, dùng updateDoc. Nếu thêm mới, dùng setDoc.
    if (editingAssessmentId) {
      await updateDoc(assessmentDocRef, newAssessmentData);
      alert("Bài kiểm tra đã được cập nhật thành công!");
    } else {
      // Khi thêm mới, đảm bảo createdAt được thêm
      newAssessmentData.createdAt = serverTimestamp();
      await setDoc(assessmentDocRef, newAssessmentData);
      alert("Bài kiểm tra mới đã được thêm thành công!");
    }

    // Thêm/Cập nhật từng câu hỏi trong subcollection 'questions'
    const addUpdateQuestionPromises = [];
    for (const qId in questionsDataForSubcollection) {
      // Dùng setDoc với merge: true để thêm mới hoặc cập nhật câu hỏi hiện có
      addUpdateQuestionPromises.push(
        setDoc(
          doc(questionsSubColRef, qId),
          questionsDataForSubcollection[qId],
          { merge: true }
        )
      );
    }
    await Promise.all(addUpdateQuestionPromises);

    loadAssessmentManagementContent(); // Quay lại màn hình quản lý bài kiểm tra
  } catch (error) {
    console.error("Lỗi khi thêm bài kiểm tra mới:", error);
    alert(
      `Không thể thêm bài kiểm tra: ${error.message}. Vui lòng kiểm tra console.`
    );
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

// ----- QUẢN LÝ BÀI ĐĂNG -----
// --- Tải và hiển thị nội dung Quản lý Bài Đăng ---
async function loadPostManagementContent() {
    // Reset biến editingPostId khi vào trang quản lý bài đăng
    editingPostId = null;

    mainContent.innerHTML = `
        <h2>Quản lý Bài Đăng</h2>
        <button id="addNewPostBtn" class="add-btn">
          Thêm Bài Đăng mới
        </button>
        <div id="postListContainer">
            <p>Đang tải danh sách bài đăng hiện có...</p>
        </div>
    `;

    document.getElementById('addNewPostBtn').addEventListener('click', () => {
        loadAddPostForm(); // Gọi hàm hiển thị form thêm bài đăng
    });

    try {
        const postsColRef = collection(db, 'posts');
        const postsSnapshot = await getDocs(postsColRef);

        let postsHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID Bài Đăng</th>
                        <th>Tiêu đề</th>
                        <th>Loại</th>
                        <th>Mô tả</th>
                        <th>Ngày tạo</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (postsSnapshot.empty) {
            postsHtml += `<tr><td colspan="6">Không có bài đăng nào được định nghĩa.</td></tr>`;
        } else {
            postsSnapshot.forEach(docSnap => {
                const postData = docSnap.data();
                const createdAtDate = postData.createdAt ? new Date(postData.createdAt.toDate()).toLocaleDateString('vi-VN') : 'N/A';
                postsHtml += `
                    <tr>
                        <td>${docSnap.id}</td>
                        <td>${postData.title || 'N/A'}</td>
                        <td>${postData.postType || 'N/A'}</td>
                        <td>${postData.description ? postData.description.substring(0, 100) + '...' : 'N/A'}</td>
                        <td>${createdAtDate}</td>
                        <td>
                            <div class="action-buttons-group">
                                <button class="action-btn edit-post-btn" data-id="${docSnap.id}">
                                  Sửa
                                </button>
                                <button class="action-btn delete-post-btn delete-btn" data-id="${docSnap.id}">
                                  Xóa
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }
        postsHtml += `
                </tbody>
            </table>
        `;
        document.getElementById('postListContainer').innerHTML = postsHtml;

        // Gắn sự kiện cho nút Sửa
        document.querySelectorAll('.edit-post-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postIdToEdit = e.currentTarget.dataset.id;
                loadEditPostForm(postIdToEdit);
            });
        });

        // Gắn sự kiện cho nút Xóa
        document.querySelectorAll('.delete-post-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const postIdToDelete = e.currentTarget.dataset.id;
                if (confirm(`Bạn có chắc chắn muốn xóa bài đăng "${postIdToDelete}" không?`)) {
                    try {
                        await deletePost(postIdToDelete);
                        alert(`Đã xóa bài đăng: ${postIdToDelete}`);
                        loadPostManagementContent(); // Tải lại danh sách sau khi xóa
                    } catch (error) {
                        console.error("Lỗi khi xóa bài đăng:", error);
                        alert(`Không thể xóa bài đăng: ${error.message}. Vui lòng kiểm tra console.`);
                    }
                }
            });
        });

    } catch (error) {
        console.error("Lỗi khi tải danh sách bài đăng:", error);
        document.getElementById('postListContainer').innerHTML = `<p class="error-message">Không thể tải danh sách bài đăng: ${error.message}</p>`;
    }
}

// --- Xóa Bài Đăng ---
async function deletePost(postId) {
    const postDocRef = doc(db, 'posts', postId);
    await deleteDoc(postDocRef);
    console.log(`Đã xóa bài đăng: ${postId}`);
}

// --- Tải Form Thêm Bài Đăng Mới ---
function loadAddPostForm() {
    editingPostId = null; // Đảm bảo không ở chế độ sửa
    renderPostForm("Thêm Bài Đăng mới");
}

// --- Tải Form Sửa Bài Đăng ---
async function loadEditPostForm(postId) {
    editingPostId = postId; // Đặt ID bài đăng đang sửa
    mainContent.innerHTML = `
        <h2>Sửa Bài Đăng</h2>
        <p>Đang tải thông tin bài đăng...</p>
    `;

    try {
        const postDocRef = doc(db, 'posts', postId);
        const postDocSnap = await getDoc(postDocRef);

        if (!postDocSnap.exists()) {
            alert('Không tìm thấy bài đăng này.');
            loadPostManagementContent();
            return;
        }
        const postData = postDocSnap.data();
        postData.id = postDocSnap.id; 
        renderPostForm("Sửa Bài Đăng", postData); // Truyền dữ liệu để điền vào form

    } catch (error) {
        console.error("Lỗi khi tải thông tin bài đăng để sửa:", error);
        mainContent.innerHTML = `<p class="error-message">Không thể tải thông tin bài đăng: ${error.message}</p>`;
    }
}

// --- Hàm chung để render form thêm/sửa bài đăng ---
function renderPostForm(title, postData = {}) {
    mainContent.innerHTML = `
        <h2>${title}</h2>
        <form id="addEditPostForm" class="post-form">
            <div class="form-section">
                <h3>Thông tin chung</h3>
                <label for="postId">ID Bài Đăng (Duy nhất, không thể thay đổi khi sửa. Ví dụ: post-xx):</label>
                <input type="text" id="postId" value="${postData.id || ''}" ${postData.id ? 'readonly' : ''} required placeholder="Để trống nếu muốn tự động tạo">
                
                <label for="postTitle">Tiêu đề Bài Đăng:</label>
                <input type="text" id="postTitle" value="${postData.title || ''}" required>
                
                <label for="postDescription">Mô tả ngắn:</label>
                <textarea id="postDescription" rows="3">${postData.description || ''}</textarea>
                
                <label for="postType">Loại Bài Đăng:</label>
                <select id="postType" required>
                    <option value="">-- Chọn loại --</option>
                    <option value="article" ${postData.postType === 'article' ? 'selected' : ''}>Bài viết</option>
                    <option value="video" ${postData.postType === 'video' ? 'selected' : ''}>Video</option>
                    <option value="podcast" ${postData.postType === 'podcast' ? 'selected' : ''}>Podcast</option>
                </select>
                
                <label for="postThumbnailUrl">URL Ảnh đại diện (Thumbnail):</label>
                <input type="url" id="postThumbnailUrl" value="${postData.thumbnailUrl || ''}" placeholder="Dán URL ảnh thumbnail tại đây (ví dụ: https://example.com/image.jpg)">
                ${postData.thumbnailUrl ? `<img src="${postData.thumbnailUrl}" alt="Thumbnail hiện tại" class="current-thumbnail">` : ''}

            </div>

            <div id="typeSpecificFields" class="form-section">
                </div>

            <div class="form-actions">
                <button type="submit" class="submit-btn add-btn">
                  ${editingPostId ? 'Cập nhật Bài Đăng' : 'Lưu Bài Đăng'}
                </button>
                <button type="button" id="cancelAddEditPostBtn" class="cancel-btn action-btn delete-btn">
                  Hủy
                </button>
            </div>
        </form>
    `;

    // Gắn sự kiện cho select postType để thay đổi các trường động
    document.getElementById('postType').addEventListener('change', (e) => {
        loadTypeSpecificFields(e.target.value, postData);
    });

    // Gắn sự kiện cho nút hủy
    const cancelAddEditPostBtn = document.getElementById('cancelAddEditPostBtn');
    cancelAddEditPostBtn.addEventListener('click', loadPostManagementContent);

    // Gắn sự kiện cho form submit
    const addEditPostForm = document.getElementById('addEditPostForm');
    addEditPostForm.addEventListener('submit', handleAddEditPostSubmit);

    // Load ban đầu các trường đặc thù nếu đang sửa hoặc đã chọn loại
    if (postData.postType) {
        loadTypeSpecificFields(postData.postType, postData);
    }
}

// --- Hàm tải các trường đặc thù theo loại bài đăng ---
function loadTypeSpecificFields(postType, postData = {}) {
    const typeSpecificFieldsContainer = document.getElementById('typeSpecificFields');
    let html = '';

    switch (postType) {
        case 'article':
            html = `
                <h3>Nội dung Bài viết</h3>
                <label for="articleContent">Nội dung:</label>
                <textarea id="articleContent" rows="10" required>${postData.content || ''}</textarea>
                <label for="articleAuthor">Tác giả (Tùy chọn):</label>
                <input type="text" id="articleAuthor" value="${postData.author || ''}">
            `;
            break;
        case 'video':
            html = `
                <h3>Thông tin Video</h3>
                <label for="videoUrl">URL Video (YouTube, Vimeo, v.v.):</label>
                <input type="url" id="videoUrl" value="${postData.url || ''}" required placeholder="Ví dụ: https://www.youtube.com/watch?v=xxxxxxxx">
                <label for="videoPlatform">Nền tảng Video (ví dụ: YouTube, Vimeo, Custom):</label>
                <input type="text" id="videoPlatform" value="${postData.platform || ''}" placeholder="Ví dụ: YouTube">
                <label for="videoExternalId">ID Video Bên Ngoài (Tùy chọn, ví dụ: ID YouTube):</label>
                <input type="text" id="videoExternalId" value="${postData.externalId || ''}" placeholder="Để trống nếu không có">
                <label for="videoDuration">Thời lượng (giây, tùy chọn):</label>
                <input type="number" id="videoDuration" value="${postData.duration || ''}" min="0">
            `;
            break;
        case 'podcast':
            html = `
                <h3>Thông tin Podcast</h3>
                <label for="podcastUrl">URL File Âm thanh (MP3, v.v.):</label>
                <input type="url" id="podcastUrl" value="${postData.url || ''}" required placeholder="Ví dụ: https://example.com/my-podcast.mp3">
                <label for="podcastPlatform">Nền tảng Podcast (ví dụ: Spotify, Apple Podcast, Custom):</label>
                <input type="text" id="podcastPlatform" value="${postData.platform || ''}" placeholder="Ví dụ: Spotify">
                <label for="podcastExternalId">ID Podcast Bên Ngoài (Tùy chọn, ví dụ: ID Spotify):</label>
                <input type="text" id="podcastExternalId" value="${postData.externalId || ''}" placeholder="Để trống nếu không có">
                <label for="podcastDuration">Thời lượng (giây, tùy chọn):</label>
                <input type="number" id="podcastDuration" value="${postData.duration || ''}" min="0">
            `;
            break;
        default:
            html = '<p>Vui lòng chọn loại bài đăng để hiển thị các trường chi tiết.</p>';
            break;
    }
    typeSpecificFieldsContainer.innerHTML = html;
}

// --- Hàm xử lý submit form Thêm/Sửa Bài Đăng ---
async function handleAddEditPostSubmit(e) {
    e.preventDefault();

    const postIdInput = document.getElementById('postId');
    let postId = postIdInput.value.trim(); 

    const postTitle = document.getElementById('postTitle').value.trim();
    const postDescription = document.getElementById('postDescription').value.trim();
    const postType = document.getElementById('postType').value;
    const postThumbnailUrl = document.getElementById('postThumbnailUrl').value.trim();

    if (!postTitle || !postType) {
        alert('Vui lòng điền tiêu đề và chọn loại bài đăng.');
        return;
    }

    let postData = {
        title: postTitle,
        description: postDescription,
        postType: postType,
        thumbnailUrl: postThumbnailUrl || null,
        updatedAt: serverTimestamp(),
    };

    if (!editingPostId) { // Nếu là thêm mới
        postData.createdAt = serverTimestamp();
        postData.createdBy = currentAdminUser.uid; // Lấy UID của admin hiện tại
    }

    // Xử lý các trường đặc thù theo loại bài đăng
    switch (postType) {
        case 'article':
            const articleContent = document.getElementById('articleContent')?.value.trim();
            const articleAuthor = document.getElementById('articleAuthor')?.value.trim();
            if (!articleContent) {
                alert('Nội dung bài viết không thể trống.');
                return;
            }
            postData.content = articleContent;
            if (articleAuthor) postData.author = articleAuthor;
            break;
        case 'video':
            const videoUrl = document.getElementById('videoUrl')?.value.trim();
            const videoPlatform = document.getElementById('videoPlatform')?.value.trim();
            const videoExternalId = document.getElementById('videoExternalId')?.value.trim();
            const videoDuration = document.getElementById('videoDuration')?.value.trim();

            if (!videoUrl) {
                alert('URL Video không thể trống.');
                return;
            }
            postData.url = videoUrl;
            if (videoPlatform) postData.platform = videoPlatform;
            if (videoExternalId) postData.externalId = videoExternalId;
            if (videoDuration) postData.duration = parseInt(videoDuration, 10);
            break;
        case 'podcast':
            const podcastUrl = document.getElementById('podcastUrl')?.value.trim();
            const podcastPlatform = document.getElementById('podcastPlatform')?.value.trim();
            const podcastExternalId = document.getElementById('podcastExternalId')?.value.trim();
            const podcastDuration = document.getElementById('podcastDuration')?.value.trim();

            if (!podcastUrl) {
                alert('URL File Âm thanh không thể trống.');
                return;
            }
            postData.url = podcastUrl;
            if (podcastPlatform) postData.platform = podcastPlatform;
            if (podcastExternalId) postData.externalId = podcastExternalId;
            if (podcastDuration) postData.duration = parseInt(podcastDuration, 10);
            break;
        default:
            alert('Vui lòng chọn loại bài đăng hợp lệ.');
            return;
    }

    // Xử lý upload thumbnail
    try {
        if (editingPostId) { // Chế độ sửa
            await updateDoc(doc(db, 'posts', editingPostId), postData);
            alert('Bài đăng đã được cập nhật thành công!');
        } else { // Chế độ thêm mới
            let newPostDocRef;
            if (postId) { // Admin cung cấp ID
                const existingDoc = await getDoc(doc(db, 'posts', postId));
                if (existingDoc.exists()) {
                    alert(`ID bài đăng "${postId}" đã tồn tại. Vui lòng chọn ID khác hoặc để trống để tự động tạo.`);
                    return;
                }
                newPostDocRef = doc(db, 'posts', postId);
                await setDoc(newPostDocRef, postData);
            } else { // Tự động tạo ID
                newPostDocRef = await addDoc(collection(db, 'posts'), postData);
                postId = newPostDocRef.id; // Lấy ID vừa tạo
            }
            alert('Bài đăng mới đã được thêm thành công!');
        }
        loadPostManagementContent(); // Quay lại màn hình quản lý bài đăng
    } catch (error) {
        console.error("Lỗi khi lưu bài đăng:", error);
        alert(`Không thể lưu bài đăng: ${error.message}. Vui lòng kiểm tra console.`);
    }
}

// --- Event Listeners cho menu điều hướng Admin ---
// Menu Quản lý Người dùng
if (navUsers) {
  navUsers.addEventListener("click", async (e) => {
    e.preventDefault();
    await loadUserManagementContent();
  });
}

// Menu Quản lý Bài kiểm tra
if (navTests) {
  navTests.addEventListener("click", async (e) => {
    e.preventDefault();
    await loadAssessmentManagementContent();
  });
}

// Menu Quản lý Bài đăng
if (navPosts) {
    navPosts.addEventListener('click', async (e) => {
        e.preventDefault();
        await loadPostManagementContent();
    });
}