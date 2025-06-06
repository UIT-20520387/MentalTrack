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
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  addDoc,
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

document.addEventListener("DOMContentLoaded", () => {
  //DOM Elements
  const assessmentDescription = document.getElementById(
    "assessment-description"
  );
  const dass21Form = document.getElementById("dass21-form");
  const questionsContainer = document.getElementById("questions-container");
  const submitDass21Btn = document.getElementById("submit-dass21-btn");
  const dass21FinalResult = document.getElementById("dass21-final-result");

  // === Biến lưu trữ dữ liệu ===
  let dass21Questions = []; // Mảng các câu hỏi DASS-21 đã tải
  let dass21ScaleOptions = []; // Mảng các lựa chọn đáp án cho DASS-21
  let currentUser = null; // Thông tin người dùng hiện tại

  // === Khởi tạo Listener cho trạng thái đăng nhập ===
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      console.log("Người dùng đã đăng nhập:", currentUser.uid);
      loadDass21Assessment(); // Tải bài kiểm tra khi người dùng đăng nhập
    } else {
      currentUser = null;
      console.log("Người dùng chưa đăng nhập. Không thể lưu kết quả.");
      showMessage(
        "Vui lòng đăng nhập để làm bài kiểm tra và lưu kết quả.",
        "aboveMessage"
      );
      questionsContainer.innerHTML =
        "<p>Vui lòng đăng nhập để xem bài kiểm tra.</p>";
      dass21Form.style.display = "none"; // Ẩn form nếu chưa đăng nhập
    }
  });

  // === Hàm tải dữ liệu bài kiểm tra DASS-21 từ Firestore ===
  async function loadDass21Assessment() {
    try {
      // 1. Tải thông tin chung của bài DASS-21
      const dass21DocRef = doc(db, "assessments", "DASS-21");
      const dass21DocSnap = await getDoc(dass21DocRef);

      if (dass21DocSnap.exists()) {
        const assessmentData = dass21DocSnap.data();
        assessmentDescription.textContent = assessmentData.description;
        dass21ScaleOptions = assessmentData.scaleOptions || []; // Lưu các lựa chọn thang đo

        // 2. Tải các câu hỏi của DASS-21
        const questionsCollectionRef = collection(dass21DocRef, "questions"); // Sub-collection
        const q = query(questionsCollectionRef, orderBy("order")); // Sắp xếp theo trường 'order'
        const questionSnap = await getDocs(q);

        dass21Questions = []; // Reset mảng câu hỏi
        questionsContainer.innerHTML = ""; // Xóa nội dung cũ

        let questionNumber = 1;
        questionSnap.forEach((qDoc) => {
          const questionData = qDoc.data();
          dass21Questions.push({ id: qDoc.id, ...questionData }); // Lưu câu hỏi
          renderQuestion(questionData, questionNumber++); // Hiển thị câu hỏi
        });

        dass21Form.style.display = "block"; // Hiển thị form
        showMessage("Bài kiểm tra DASS-21 đã sẵn sàng!", "aboveMessage");
      } else {
        showMessage(
          "Không tìm thấy dữ liệu bài kiểm tra DASS-21.",
          "aboveMessage"
        );
        console.error("No DASS-21 assessment document found!");
      }
    } catch (error) {
      console.error("Lỗi khi tải bài kiểm tra DASS-21:", error);
      showMessage(
        "Không thể tải bài kiểm tra. Vui lòng thử lại sau.",
        "aboveMessage"
      );
    }
  }

  // === Hàm hiển thị một câu hỏi trên trang HTML ===
  function renderQuestion(questionData, number) {
    const questionDiv = document.createElement("div");
    questionDiv.classList.add("test-item"); // Sử dụng class của bạn
    questionDiv.innerHTML = `
        <h3 class="questions">${number}. ${questionData.text}</h3>
        <div class="options-group">
            ${dass21ScaleOptions
              .map(
                (option, index) => `
                <label for="q${questionData.order}-opt${index}">
                    <input type="radio" id="q${questionData.order}-opt${index}" name="q${questionData.order}" value="${option.value}" required>
                    ${option.text}
                </label>
            `
              )
              .join("")}
        </div>
    `;
    questionsContainer.appendChild(questionDiv);
  }

  // === Hàm xử lý khi người dùng nộp bài ===
  async function handleSubmitDass21(event) {
    console.log("Nút submit đã được click! Hàm handleSubmitDass21 đang chạy.");
    event.preventDefault(); // Ngăn chặn form gửi đi mặc định

    if (!currentUser) {
      console.log("Debug: currentUser là NULL. Thoát khỏi hàm.");
      showMessage("Bạn cần đăng nhập để nộp bài kiểm tra.", "belowMessage");
      return;
    }
    console.log("Debug: currentUser có giá trị. Tiếp tục xử lý.");

    const formData = new FormData(dass21Form);
    let totalScore = 0;
    const answers = {}; // Lưu câu trả lời chi tiết
    const sectionScores = {
      Depression: 0,
      Anxiety: 0,
      Stress: 0,
    };

    // Kiểm tra xem tất cả câu hỏi đã được trả lời chưa
    let allQuestionsAnswered = true;
    dass21Questions.forEach((q) => {
      const selectedValue = formData.get(`q${q.order}`);
      if (selectedValue === null) {
        allQuestionsAnswered = false;
      }
    });

    if (!allQuestionsAnswered) {
      console.log("Debug: Chưa trả lời đủ câu hỏi. Thoát khỏi hàm.");
      showMessage(
        "Vui lòng trả lời tất cả các câu hỏi trước khi nộp bài.",
        "belowMessage"
      );
      return;
    }
    console.log("Debug: Tất cả câu hỏi đã được trả lời. Tiếp tục xử lý.");

    // Tính điểm
    dass21Questions.forEach((q) => {
      const selectedValue = formData.get(`q${q.order}`);
      const score = parseInt(selectedValue);
      answers[q.id] = score; // Lưu câu trả lời theo ID câu hỏi

      // Cộng điểm vào section tương ứng
      if (q.section && sectionScores.hasOwnProperty(q.section)) {
        sectionScores[q.section] += score;
      }
    });

    // Tính điểm DASS-21 cuối cùng (nhân đôi mỗi section)
    const finalDassScores = {
      Depression: sectionScores.Depression * 2,
      Anxiety: sectionScores.Anxiety * 2,
      Stress: sectionScores.Stress * 2,
    };

    // Tổng điểm (nếu muốn hiển thị tổng, không phải tiêu chuẩn DASS-21)
    totalScore =
      finalDassScores.Depression +
      finalDassScores.Anxiety +
      finalDassScores.Stress;

    // TODO: Hiển thị kết quả cho người dùng (tính mức độ)
    let resultHtml = `<h3>Kết quả bài kiểm tra của bạn:</h3>`;
    resultHtml += `<p><strong>Trầm cảm:</strong> ${
      finalDassScores.Depression
    } (${getDassLevel("Depression", finalDassScores.Depression)})</p>`;
    resultHtml += `<p><strong>Lo âu:</strong> ${
      finalDassScores.Anxiety
    } (${getDassLevel("Anxiety", finalDassScores.Anxiety)})</p>`;
    resultHtml += `<p><strong>Stress:</strong> ${
      finalDassScores.Stress
    } (${getDassLevel("Stress", finalDassScores.Stress)})</p>`;

    // Hiển thị kết quả
    if (dass21FinalResult) {
      dass21FinalResult.innerHTML = resultHtml;
      dass21FinalResult.style.display = "block";
      dass21FinalResult.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
        console.error("Lỗi: Không tìm thấy phần tử #dass21-final-result trong DOM.");
    }

    // Ẩn form sau khi nộp bài và hiển thị kết quả
    if (dass21Form) {
      dass21Form.style.display = "none";
    }

    // === Lưu kết quả vào Firestore ===
    try {
      await addDoc(collection(db, "userAssessments"), {
        uid: currentUser.uid,
        assessmentType: "DASS-21",
        dateCompleted: new Date(),
        rawScores: sectionScores, // Điểm thô trước khi nhân đôi
        finalScores: finalDassScores, // Điểm cuối cùng đã nhân đôi
        totalScore: totalScore, // Tổng điểm của tất cả section (tùy chọn)
        answers: answers, // Tùy chọn: lưu chi tiết câu trả lời
      });
      console.log("Debug: Đã cố gắng lưu kết quả vào Firestore.");
      showMessage(
        "Kết quả của bạn đã được lưu lại thành công!",
        "belowMessage"
      );
    } catch (e) {
      console.error("Lỗi khi lưu kết quả bài kiểm tra:", e);
      showMessage("Không thể lưu kết quả. Vui lòng thử lại.", "belowMessage");
    }
  }

  // === Hàm lấy mức độ DASS-21 ===
  function getDassLevel(section, score) {
    if (section === "Depression") {
      if (score >= 28) return "Rất nặng";
      if (score >= 21) return "Nặng";
      if (score >= 14) return "Vừa";
      if (score >= 10) return "Nhẹ";
      return "Bình thường";
    } else if (section === "Anxiety") {
      if (score >= 20) return "Rất nặng";
      if (score >= 15) return "Nặng";
      if (score >= 10) return "Vừa";
      if (score >= 8) return "Nhẹ";
      return "Bình thường";
    } else if (section === "Stress") {
      if (score >= 34) return "Rất nặng";
      if (score >= 26) return "Nặng";
      if (score >= 19) return "Vừa";
      if (score >= 15) return "Nhẹ";
      return "Bình thường";
    }
    return "Không xác định";
  }

  // === Gắn sự kiện ===
  if (submitDass21Btn) {
    submitDass21Btn.addEventListener("click", handleSubmitDass21);
    console.log("Sự kiện click cho submitDass21Btn đã được gắn.");
  } else {
    console.error("Lỗi: Nút submitDass21Btn không tìm thấy.");
  }
});
