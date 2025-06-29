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
  addDoc,
  orderBy,
  Timestamp,
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
    const q = query(assessmentsColRef, orderBy("updatedAt", "desc"));
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

// --- HÀM: TẢI VÀ LÀM BÀI KIỂM TRA' ---
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
async function handleSubmitQuiz() {
  let totalScore = 0;
  let answeredCount = 0;
  let depressionScore = 0;
  let anxietyScore = 0;
  let stressScore = 0;
  let responses = [];

  // Lấy ID bài kiểm tra từ URL để lưu vào Firestore
  const urlParams = new URLSearchParams(window.location.search);
  const assessmentId = urlParams.get("id");

  // Đảm bảo currentAssessment đã được load
  if (!currentAssessment) {
    console.error("Dữ liệu bài kiểm tra chưa được tải đầy đủ.");
    showMessage(
      "Không thể xử lý bài kiểm tra. Vui lòng tải lại trang.",
      "generalMessage"
    );
    return;
  }

  // assessmentId = currentAssessment.id; // Lấy loại bài kiểm tra từ currentAssessment
  // const isDASS21ById = assessmentId === "DASS-21";

  // Đối với mỗi câu hỏi trong currentQuestions
  currentQuestions.forEach((q, qIndex) => {
    const questionElement = document.querySelector(
      `.quiz-question[data-question-index="${qIndex}"]`
    );
    if (!questionElement) return;

    let selectedScore = 0;
    let selectedOptionText = ""; // Để lưu trữ text của câu trả lời

    if (q.type === "Chọn nhiều đáp án") {
      // Đối với câu hỏi chọn nhiều đáp án (checkbox)
      const selectedOptions = questionElement.querySelectorAll(
        `input[name="question-${qIndex}"]:checked`
      );
      if (selectedOptions.length > 0) {
        answeredCount++;
        selectedOptions.forEach((selected) => {
          const score = parseInt(selected.dataset.optionValue || 0);
          selectedScore += score;
          // Lấy text của option để lưu lại
          const optionIndex = parseInt(selected.value, 10);
          if (q.options[optionIndex]) {
            selectedOptionText += q.options[optionIndex].text + "; ";
          }
        });
      }
    } else {
      const selectedOption = questionElement.querySelector(
        `input[name="question-${qIndex}"]:checked`
      );
      if (selectedOption) {
        answeredCount++;
        selectedScore = parseInt(selectedOption.dataset.optionValue || 0);
        // Lấy text của option để lưu lại
        const optionIndex = parseInt(selectedOption.value, 10);
        if (q.options[optionIndex]) {
          selectedOptionText = q.options[optionIndex].text;
        }
      }
    }
    totalScore += selectedScore;
    responses.push({
      questionId: q.order, // Sử dụng order làm ID câu hỏi để dễ truy xuất
      questionText: q.text,
      selectedScore: selectedScore,
      selectedOptionText: selectedOptionText,
      section: q.section || null, // Thêm category vào responses nếu có
    });

    // Nếu là DASS-21, tính điểm cho từng phần
    if (assessmentId === "DASS-21" && q.section) {
      if (q.section === "Depression") depressionScore += selectedScore;
      if (q.section === "Anxiety") anxietyScore += selectedScore;
      if (q.section === "Stress") stressScore += selectedScore;
    }
  });

  if (answeredCount !== currentQuestions.length) {
    showMessage(
      `Vui lòng trả lời tất cả các câu hỏi (${answeredCount}/${currentQuestions.length}).`,
      "generalMessage"
    );
    return;
  }

  // Vô hiệu hóa các input sau khi nộp bài
  document.querySelectorAll(".quiz-options input").forEach((input) => {
    input.disabled = true;
  });
  const submitQuizBtn = document.getElementById("submitQuizBtn");
  if (submitQuizBtn) submitQuizBtn.style.display = "none"; // Ẩn nút nộp bài

  // --- Xử lý đánh giá và hiển thị kết quả chi tiết ---
  const quizResultDiv = document.getElementById("quizResult");
  const quizResultDetailsDiv = document.getElementById("quizResultDetails");

  if (quizResultDiv) {
    quizResultDiv.style.display = "block";
    quizResultDiv.innerHTML = `
            <h2>Kết quả của bạn</h2>
            <p>Bạn đã hoàn thành ${answeredCount} trên tổng số ${currentQuestions.length} câu hỏi.</p>
            <p>Tổng điểm của bạn: <strong>${totalScore}</strong></p>
        `;
  }

  let resultDetails = {};
  if (assessmentId === "GAD-7") {
    resultDetails = evaluateGAD7(totalScore);
    if (quizResultDetailsDiv) {
      quizResultDetailsDiv.style.display = "block";
      quizResultDetailsDiv.innerHTML = `
                <h3>Đánh giá chi tiết (GAD-7)</h3>
                <p>Mức độ lo âu của bạn: <strong>${resultDetails.level}</strong></p>
                <p>${resultDetails.message}</p>
            `;
    }
  } else if (assessmentId === "DASS-21") {
    resultDetails = evaluateDASS21(depressionScore, anxietyScore, stressScore);
    if (quizResultDetailsDiv) {
      quizResultDetailsDiv.style.display = "block";
      quizResultDetailsDiv.innerHTML = `
                <h3>Đánh giá chi tiết (DASS-21)</h3>
                <p>Điểm Trầm cảm: <strong>${depressionScore}</strong> (Mức độ: ${resultDetails.level.depression})</p>
                <p>Điểm Lo âu: <strong>${anxietyScore}</strong> (Mức độ: ${resultDetails.level.anxiety})</p>
                <p>Điểm Stress: <strong>${stressScore}</strong> (Mức độ: ${resultDetails.level.stress})</p>
                ${resultDetails.message}
            `;
    }
  } else {
    // Đối với các loại bài kiểm tra khác, chỉ hiển thị tổng điểm
    if (quizResultDetailsDiv) {
      quizResultDetailsDiv.style.display = "block";
      quizResultDetailsDiv.innerHTML = `
                <p>Không có đánh giá chi tiết cho loại bài kiểm tra này.</p>
            `;
    }
  }

  // --- Lưu kết quả vào Firestore ---
  if (currentUser) {
    try {
      const userAssessmentRef = collection(
        db,
        `users/${currentUser.uid}/assessmentsCompleted`
      );
      addDoc(userAssessmentRef, {
        assessmentId: assessmentId,
        assessmentName: currentAssessment.name,
        assessmentType: assessmentType, // Lưu loại bài kiểm tra
        totalScore: totalScore,
        // Lưu điểm chi tiết cho DASS-21
        depressionScore: assessmentId === "DASS-21" ? depressionScore : null,
        anxietyScore: assessmentId === "DASS-21" ? anxietyScore : null,
        stressScore: assessmentId === "DASS-21" ? stressScore : null,
        // Lưu kết quả phân loại
        resultLevelGAD7:
          assessmentId === "GAD-7" ? resultDetails.level : null,
        resultMessageGAD7:
          assessmentId === "GAD-7" ? resultDetails.message : null,
        resultLevelDASS21:
          assessmentId === "DASS-21" ? resultDetails.level : null, // object {depression, anxiety, stress}
        resultMessageDASS21:
          assessmentId === "DASS-21" ? resultDetails.message : null, // HTML string

        responses: responses, // Lưu cả câu trả lời chi tiết
        completedAt: serverTimestamp(),
      });
      showMessage("Bài kiểm tra đã được nộp thành công!", "generalMessage");
    } catch (error) {
      console.error("Lỗi khi lưu kết quả bài kiểm tra:", error);
      showMessage(
        "Có lỗi xảy ra khi lưu kết quả. Vui lòng thử lại.",
        "generalMessage"
      );
    }
  } else {
    showMessage(
      "Bạn cần đăng nhập để lưu kết quả bài kiểm tra.",
      "generalMessage"
    );
  }

  // Thêm nút quay lại danh sách bài kiểm tra sau khi xem kết quả
  if (quizResultDiv) {
    quizResultDiv.innerHTML += `
            <a href="../html/test.html" class="back-to-list-btn action-btn">Quay lại danh sách bài kiểm tra</a>
        `;
  }
}

// --- HÀM ĐÁNH GIÁ KẾT QUẢ GAD-7 ---
function evaluateGAD7(totalScore) {
  let level = "";
  let message = "";

  if (totalScore >= 15) {
    level = "Lo âu nặng";
    message =
      "Điểm số của bạn cho thấy mức độ lo âu nặng. Bạn nên tìm kiếm sự hỗ trợ từ chuyên gia sức khỏe tâm thần.";
  } else if (totalScore >= 10) {
    level = "Lo âu vừa";
    message =
      "Điểm số của bạn cho thấy mức độ lo âu vừa phải. Việc nói chuyện với chuyên gia hoặc áp dụng các kỹ thuật thư giãn có thể hữu ích.";
  } else if (totalScore >= 5) {
    level = "Lo âu nhẹ";
    message =
      "Điểm số của bạn cho thấy mức độ lo âu nhẹ. Hãy chú ý đến cảm xúc của mình và tìm cách thư giãn.";
  } else {
    // totalScore from 0 to 4
    level = "Bình thường";
    message =
      "Điểm số của bạn cho thấy mức độ lo âu bình thường. Hãy tiếp tục duy trì sức khỏe tinh thần tốt.";
  }

  return { totalScore, level, message };
}

// --- HÀM ĐÁNH GIÁ KẾT QUẢ DASS-21 ---
function evaluateDASS21(depressionScore, anxietyScore, stressScore) {
  let depressionLevel = "";
  let anxietyLevel = "";
  let stressLevel = "";

  // Evaluate Depression
  if (depressionScore >= 28) depressionLevel = "Trầm cảm rất nặng";
  else if (depressionScore >= 21) depressionLevel = "Trầm cảm nặng";
  else if (depressionScore >= 14) depressionLevel = "Trầm cảm vừa";
  else if (depressionScore >= 10) depressionLevel = "Trầm cảm nhẹ";
  else depressionLevel = "Bình thường";

  // Evaluate Anxiety
  if (anxietyScore >= 20) anxietyLevel = "Lo âu rất nặng";
  else if (anxietyScore >= 15) anxietyLevel = "Lo âu nặng";
  else if (anxietyScore >= 10) anxietyLevel = "Lo âu vừa";
  else if (anxietyScore >= 8) anxietyLevel = "Lo âu nhẹ";
  else anxietyLevel = "Bình thường";

  // Evaluate Stress
  if (stressScore >= 34) stressLevel = "Stress rất nặng";
  else if (stressScore >= 26) stressLevel = "Stress nặng";
  else if (stressScore >= 19) stressLevel = "Stress vừa";
  else if (stressScore >= 15) stressLevel = "Stress nhẹ";
  else stressLevel = "Bình thường";

  const overallMessage = `
        <p><em>Lưu ý: Đây chỉ là kết quả tự đánh giá. Nếu bạn có bất kỳ lo lắng nào về sức khỏe tinh thần, vui lòng tìm kiếm sự tư vấn từ chuyên gia.</em></p>
    `;

  return {
    depressionScore,
    anxietyScore,
    stressScore,
    level: {
      depression: depressionLevel,
      anxiety: anxietyLevel,
      stress: stressLevel,
    },
    message: overallMessage, // Sử dụng message đơn giản hơn, phần level đã trực quan hóa trong HTML
  };
}
