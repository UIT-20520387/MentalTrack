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
  const gad7Form = document.getElementById("gad7-form");
  const questionsContainer = document.getElementById("questions-container");
  const submitGad7Btn = document.getElementById("submit-gad7-btn");
  const gad7FinalResult = document.getElementById("gad7-final-result");

  // === Biến lưu trữ dữ liệu ===
  let gad7Questions = []; // Mảng các câu hỏi GAD-7 đã tải
  let gad7ScaleOptions = []; // Mảng các lựa chọn đáp án cho GAD-7
  let currentUser = null; // Thông tin người dùng hiện tại

  // === Khởi tạo Listener cho trạng thái đăng nhập ===
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      console.log("Người dùng đã đăng nhập:", currentUser.uid);
      loadGad7Assessment(); // Tải bài kiểm tra khi người dùng đăng nhập
    } else {
      currentUser = null;
      console.log("Người dùng chưa đăng nhập. Không thể lưu kết quả.");
      showMessage(
        "Vui lòng đăng nhập để làm bài kiểm tra và lưu kết quả.",
        "aboveMessage"
      );
      questionsContainer.innerHTML =
        "<p>Vui lòng đăng nhập để xem bài kiểm tra.</p>";
      gad7Form.style.display = "none"; // Ẩn form nếu chưa đăng nhập
    }
  });

  // === Hàm tải dữ liệu bài kiểm tra GAD-7 từ Firestore ===
  async function loadGad7Assessment() {
    try {
      // 1. Tải thông tin chung của bài GAD-7
      const gad7DocRef = doc(db, "assessments", "GAD-7");
      const gad7DocSnap = await getDoc(gad7DocRef);

      if (gad7DocSnap.exists()) {
        const assessmentData = gad7DocSnap.data();
        assessmentDescription.textContent = assessmentData.description;
        gad7ScaleOptions = assessmentData.scaleOptions || []; // Lưu các lựa chọn thang đo

        // 2. Tải các câu hỏi của GAD-7
        const questionsCollectionRef = collection(gad7DocRef, "questions"); // Sub-collection
        const q = query(questionsCollectionRef, orderBy("order")); // Sắp xếp theo trường 'order'
        const questionSnap = await getDocs(q);

        gad7Questions = []; // Reset mảng câu hỏi
        questionsContainer.innerHTML = ""; // Xóa nội dung cũ

        let questionNumber = 1;
        questionSnap.forEach((qDoc) => {
          const questionData = qDoc.data();
          gad7Questions.push({ id: qDoc.id, ...questionData }); // Lưu câu hỏi
          renderQuestion(questionData, questionNumber++); // Hiển thị câu hỏi
        });

        gad7Form.style.display = "block"; // Hiển thị form
        showMessage("Bài kiểm tra GAD-7 đã sẵn sàng!", "aboveMessage");
      } else {
        showMessage(
          "Không tìm thấy dữ liệu bài kiểm tra GAD-7.",
          "aboveMessage"
        );
        console.error("No GAD-7 assessment document found!");
      }
    } catch (error) {
      console.error("Lỗi khi tải bài kiểm tra GAD-7:", error);
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
            ${gad7ScaleOptions
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
  async function handleSubmitGad7(event) {
    console.log("Nút submit đã được click! Hàm handleSubmitGad7 đang chạy.");
    event.preventDefault(); // Ngăn chặn form gửi đi mặc định

    if (!currentUser) {
      console.log("Debug: currentUser là NULL. Thoát khỏi hàm.");
      showMessage("Bạn cần đăng nhập để nộp bài kiểm tra.", "belowMessage");
      return;
    }
    console.log("Debug: currentUser có giá trị. Tiếp tục xử lý.");

    const formData = new FormData(gad7Form);
    let totalScore = 0;
    const answers = {}; // Lưu câu trả lời chi tiết

    // Kiểm tra xem tất cả câu hỏi đã được trả lời chưa
    let allQuestionsAnswered = true;
    gad7Questions.forEach((q) => {
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
    gad7Questions.forEach((q) => {
      const selectedValue = formData.get(`q${q.order}`);
      const score = parseInt(selectedValue);
      answers[q.id] = score; // Lưu câu trả lời theo ID câu hỏi
      totalScore += score;
    });

    // TODO: Hiển thị kết quả cho người dùng (tính mức độ)
    let resultHtml = `<h3>Kết quả bài kiểm tra GAD-7 của bạn:</h3>`;
        resultHtml += `<p>Tổng điểm: <strong>${totalScore}</strong> (${getGad7Level(totalScore)})</p>`;

    // Hiển thị kết quả
    if (gad7FinalResult) {
      gad7FinalResult.innerHTML = resultHtml;
      gad7FinalResult.style.display = "block";
      gad7FinalResult.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
        console.error("Lỗi: Không tìm thấy phần tử #gad7-final-result trong DOM.");
    }

    // Ẩn form sau khi nộp bài và hiển thị kết quả
    if (gad7Form) {
      gad7Form.style.display = "none";
    }

    // === Lưu kết quả vào Firestore ===
    try {
      await addDoc(collection(db, "userAssessments"), {
        uid: currentUser.uid,
        assessmentType: "GAD-7",
        dateCompleted: new Date(),
        totalScore: totalScore, // Tổng điểm
        answers: answers, // Lưu chi tiết câu trả lời
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

  // === Hàm lấy mức độ GAD-7 ===
  function getGad7Level(score) {
    if (score >= 15) return "Lo âu nặng";
    if (score >= 10) return "Lo âu trung bình";
    if (score >= 5) return "Lo âu nhẹ";
    return "Bình thường" ;
  }

  // === Gắn sự kiện ===
  if (submitGad7Btn) {
    submitGad7Btn.addEventListener("click", handleSubmitGad7);
    console.log("Sự kiện click cho submitGad7Btn đã được gắn.");
  } else {
    console.error("Lỗi: Nút submitGad7Btn không tìm thấy.");
  }
});
