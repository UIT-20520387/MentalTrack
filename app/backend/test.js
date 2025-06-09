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
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  Timestamp,
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

let currentUser = null;

// --- LISTENER TRẠNG THÁI XÁC THỰC CỦA FIREBASE ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    const path = window.location.pathname;
    if (path.includes("test.html")) {
      if (user) {
        loadAssessmentsList();
      }
    } else if (path.includes("test-detail.html")) {
      if (user) {
        loadQuizDetail();
      }
    }
  } else {
    currentUser = null;
    // Nếu người dùng chưa đăng nhập, hiển thị thông báo
    window.location.href = "../html/restricted-access.html";
    console.log("Người dùng chưa đăng nhập.");
  }
});

// --- TẢI DANH SÁCH BÀI KIỂM TRA CHO 'assessments.html' ---
async function loadAssessmentsList() {
  const assessmentsListDiv = document.getElementById("assessmentsList");
  if (!assessmentsListDiv) return;

  assessmentsListDiv.innerHTML =
    '<p class="no-assessments-message">Đang tải bài kiểm tra...</p>';

  try {
    const assessmentsColRef = collection(db, "assessments");
    const q = query(assessmentsColRef, orderBy("updatedAt" , "desc"));
    const querySnapshot = await getDocs(q);

    let assessmentsHtml = "";
    if (querySnapshot.empty) {
      assessmentsHtml =
        '<p class="no-assessments-message">Hiện chưa có bài kiểm tra nào.</p>';
    } else {
      querySnapshot.forEach((docSnap) => {
        const assessment = docSnap.data();
        const assessmentId = docSnap.id; // ID của document là tên bài kiểm tra
        assessmentsHtml += `
                    <div class="assessment-card">
                        <div class="assessment-info">
                            <h3>${assessment.name}</h3>
                            <p>${
                              assessment.description || "Không có mô tả."
                            }</p>
                            <a href="test-detail.html?id=${assessmentId}" class="start-quiz-btn action-btn">Làm bài</a>
                        </div>
                    </div>
                `;
      });
    }
    assessmentsListDiv.innerHTML = assessmentsHtml;
  } catch (error) {
    console.error("Lỗi khi tải danh sách bài kiểm tra:", error);
    assessmentsListDiv.innerHTML = `<p class="no-assessments-message error-message">Không thể tải bài kiểm tra: ${error.message}</p>`;
  }
}

// --- HÀM: TẢI VÀ LÀM BÀI KIỂM TRA CHO 'quiz_detail.html' ---
let currentAssessment = null; // Biến để lưu trữ dữ liệu bài kiểm tra chính
let currentQuestions = []; // Biến để lưu trữ các câu hỏi từ sub-collection

async function loadQuizDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const assessmentId = urlParams.get("id"); // Lấy ID bài kiểm tra (ví dụ: DASS-21)
  const quizDetailContentDiv = document.getElementById("quizDetailContent");
  const quizDetailTitleTag = document.getElementById("quizDetailTitle");

  if (!assessmentId) {
    if (quizDetailContentDiv)
      quizDetailContentDiv.innerHTML =
        '<p class="error-message">Không tìm thấy ID bài kiểm tra.</p>';
    if (quizDetailTitleTag)
      quizDetailTitleTag.textContent = "Lỗi - Mental Track";
    return;
  }

  try {
    // Tải tài liệu bài kiểm tra chính
    const assessmentDocRef = doc(db, "assessments", assessmentId);
    const assessmentDocSnap = await getDoc(assessmentDocRef);

    if (!assessmentDocSnap.exists()) {
      if (quizDetailContentDiv)
        quizDetailContentDiv.innerHTML =
          '<p class="error-message">Bài kiểm tra không tồn tại.</p>';
      if (quizDetailTitleTag)
        quizDetailTitleTag.textContent =
          "Bài kiểm tra không tồn tại - Mental Track";
      return;
    }

    currentAssessment = assessmentDocSnap.data();
    if (quizDetailTitleTag)
      quizDetailTitleTag.textContent = `${currentAssessment.name} - Mental Track`;

    // Tải sub-collection 'questions'
    const questionsColRef = collection(
      db,
      "assessments",
      assessmentId,
      "questions"
    );
    const qQuestions = query(questionsColRef, orderBy("order", "asc")); // Sắp xếp theo trường 'order'
    const questionsSnapshot = await getDocs(qQuestions);

    currentQuestions = []; // Reset mảng câu hỏi
    questionsSnapshot.forEach((doc) => {
      currentQuestions.push(doc.data());
    });

    if (currentQuestions.length === 0) {
      if (quizDetailContentDiv)
        quizDetailContentDiv.innerHTML =
          '<p class="no-quiz-message">Bài kiểm tra này chưa có câu hỏi nào.</p>';
      return;
    }

    // Bắt đầu render HTML cho bài kiểm tra
    let quizHtml = `
            <h1>${currentAssessment.name}</h1>
            <p class="quiz-description">${
              currentAssessment.description || "Không có mô tả."
            }</p>
        `;

    // Hiển thị thang điểm nếu có
    if (
      currentAssessment.scaleOptions &&
      currentAssessment.scaleOptions.length > 0
    ) {
      quizHtml += `
                <div class="quiz-scale-options">
                    <h4>Thang điểm:</h4>
                    <ul>
            `;
      currentAssessment.scaleOptions.forEach((option) => {
        quizHtml += `<li>${option.text} (${option.value} điểm)</li>`;
      });
      quizHtml += `
                    </ul>
                </div>
            `;
    }

    quizHtml += `<div class="quiz-questions-section" id="quizQuestions">`;

    // Render từng câu hỏi
    currentQuestions.forEach((q, qIndex) => {
      const inputType = q.type === "Chọn nhiều đáp án" ? "checkbox" : "radio"; // Xác định loại input
      const inputName = `question-${qIndex}`; // Tên cho radio group

      quizHtml += `
                <div class="quiz-question" data-question-index="${qIndex}">
                    <p class="question-text">Câu ${q.order}: ${q.text}</p>
                    <div class="quiz-options">
            `;
      q.options.forEach((option, oIndex) => {
        quizHtml += `
                    <label>
                        <input type="${inputType}" name="${inputName}" value="${oIndex}" 
                               data-question-index="${qIndex}" 
                               data-option-value="${option.value || 0}">
                        ${option.text}
                    </label>
                `;
      });
      quizHtml += `
                    </div>
                </div>
            `;
    });

    quizHtml += `
            </div>
            <button class="submit-quiz-btn add-btn" id="submitQuizBtn">Nộp bài</button>
            <div id="quizResult" class="quiz-result-section" style="display:none;"></div>
        `;

    if (quizDetailContentDiv) quizDetailContentDiv.innerHTML = quizHtml;

    const submitQuizBtn = document.getElementById("submitQuizBtn");
    if (submitQuizBtn) {
      submitQuizBtn.addEventListener("click", handleSubmitQuiz);
    }
  } catch (error) {
    console.error("Lỗi khi tải chi tiết bài kiểm tra:", error);
    if (quizDetailContentDiv)
      quizDetailContentDiv.innerHTML = `<p class="error-message">Không thể tải bài kiểm tra: ${error.message}</p>`;
    if (quizDetailTitleTag)
      quizDetailTitleTag.textContent = "Lỗi - Mental Track";
  }
}

// --- HÀM XỬ LÝ NỘP BÀI KIỂM TRA (Sử dụng scaleOptions và question.options.value) ---
function handleSubmitQuiz() {
  let totalScore = 0;
  let answeredCount = 0;

  // Đối với mỗi câu hỏi trong currentQuestions
  currentQuestions.forEach((q, qIndex) => {
    const questionElement = document.querySelector(
      `.quiz-question[data-question-index="${qIndex}"]`
    );
    if (!questionElement) return;

    if (q.type === "Chọn nhiều đáp án") {
      // Đối với câu hỏi chọn nhiều đáp án (checkbox)
      const selectedOptions = questionElement.querySelectorAll(
        `input[name="question-${qIndex}"]:checked`
      );
      if (selectedOptions.length > 0) {
        answeredCount++;
        selectedOptions.forEach((selected) => {
          totalScore += parseInt(selected.dataset.optionValue || 0);
        });
      }
    } else {
      // Mặc định là 'Chọn một đáp án' (radio)
      const selectedOption = questionElement.querySelector(
        `input[name="question-${qIndex}"]:checked`
      );
      if (selectedOption) {
        answeredCount++;
        totalScore += parseInt(selectedOption.dataset.optionValue || 0);
      }
    }
  });

  const quizResultDiv = document.getElementById("quizResult");
  if (quizResultDiv) {
    quizResultDiv.style.display = "block";
    quizResultDiv.innerHTML = `
            <h2>Kết quả của bạn</h2>
            <p>Bạn đã hoàn thành ${answeredCount} trên tổng số ${currentQuestions.length} câu hỏi.</p>
            <p>Tổng điểm của bạn: <strong>${totalScore}</strong></p>
            <a href="../html/test.html" class="back-to-list-btn action-btn">Quay lại danh sách bài kiểm tra</a>
        `;
  }

  // Vô hiệu hóa các input sau khi nộp bài
  document.querySelectorAll(".quiz-options input").forEach((input) => {
    input.disabled = true;
  });
  const submitQuizBtn = document.getElementById("submitQuizBtn");
  if (submitQuizBtn) submitQuizBtn.style.display = "none"; // Ẩn nút nộp bài
}
