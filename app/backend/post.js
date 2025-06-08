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

// ----- HIỂN THỊ BÀI ĐĂNG -----
const mainContent = document.getElementById("mainContent");

// --- HÀM TẢI BÀI ĐĂNG CHO TRANG CHỦ ---
async function loadHomepagePosts() {
  const homepageArticleSection = document.getElementById("article-list"); // ID của section bài viết trên homepage
  if (!homepageArticleSection) return; // Chỉ chạy nếu đang ở trang chủ

  try {
    const postsColRef = collection(db, "posts");
    // Truy vấn 3 bài đăng loại 'article', sắp xếp theo ngày tạo mới nhất
    const q = query(
      postsColRef,
      where("postType", "==", "article"),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    let articlesHtml = "";
    if (querySnapshot.empty) {
      articlesHtml = "<p>Hiện chưa có bài viết nào.</p>";
    } else {
      let count = 0;
      querySnapshot.forEach((docSnap) => {
        if (count < 3) {
          // Giới hạn chỉ lấy 3 bài
          const post = docSnap.data();
          articlesHtml += `
                        <div class="article-item">
                            <h3><a href="../html/post-detail.html?id=${docSnap.id}">${post.title}</a></h3>
                            <p>${post.description}</p>
                            <a href="../html/post-detail.html?id=${docSnap.id}" class="read-more">Đọc thêm</a>
                        </div>
                    `;
          count++;
        }
      });
    }
    homepageArticleSection.innerHTML = articlesHtml;
  } catch (error) {
    console.error("Lỗi khi tải bài viết cho trang chủ:", error);
    homepageArticleSection.innerHTML =
      '<p class="error-message">Không thể tải bài viết. Vui lòng thử lại.</p>';
  }
}

// --- HÀM TẢI TẤT CẢ BÀI ĐĂNG CHO TRANG 'post.html' ---
async function loadAllPosts() {
  const articleTabContent = document.getElementById("articleTabContent");
  const videoTabContent = document.getElementById("videoTabContent");
  const podcastTabContent = document.getElementById("podcastTabContent");

  if (!articleTabContent || !videoTabContent || !podcastTabContent) return; // Chỉ chạy nếu đang ở trang post.html

  // Reset nội dung các tab
  articleTabContent.innerHTML =
    '<p class="no-posts-message">Đang tải bài viết...</p>';
  videoTabContent.innerHTML =
    '<p class="no-posts-message">Đang tải video...</p>';
  podcastTabContent.innerHTML =
    '<p class="no-posts-message">Đang tải podcast...</p>';

  try {
    const postsColRef = collection(db, "posts");
    const q = query(postsColRef, orderBy("createdAt", "desc")); // Sắp xếp theo ngày tạo mới nhất
    const querySnapshot = await getDocs(q);

    let articlesHtml = "";
    let videosHtml = "";
    let podcastsHtml = "";

    if (querySnapshot.empty) {
      articlesHtml =
        videosHtml =
        podcastsHtml =
          '<p class="no-posts-message">Hiện chưa có bài đăng nào.</p>';
    } else {
      querySnapshot.forEach((docSnap) => {
        const post = docSnap.data();
        const postId = docSnap.id;
        const thumbnailUrl =
          post.thumbnailUrl ||
          "https://via.placeholder.com/200x150?text=No+Image"; // Ảnh placeholder nếu không có thumbnail

        let postCardHtml = `
                    <div class="post-card">
                        <img src="${thumbnailUrl}" alt="${
          post.title
        }" class="post-card-thumbnail">
                        <div class="post-card-content">
                            <h3><a href="../html/post-detail.html?id=${postId}">${
          post.title
        }</a></h3>
                            <p>${
                              post.description
                                ? post.description.substring(0, 150) + "..."
                                : "Không có mô tả."
                            }</p>
                            <a href="../html/post-detail.html?id=${postId}" class="read-more">Xem chi tiết</a>
                        </div>
                    </div>
                `;

        switch (post.postType) {
          case "article":
            articlesHtml += postCardHtml;
            break;
          case "video":
            videosHtml += postCardHtml;
            break;
          case "podcast":
            podcastsHtml += postCardHtml;
            break;
        }
      });

      // Nếu một loại bài đăng không có, hiển thị thông báo
      if (articlesHtml === "")
        articlesHtml =
          '<p class="no-posts-message">Hiện chưa có bài viết nào.</p>';
      if (videosHtml === "")
        videosHtml = '<p class="no-posts-message">Hiện chưa có video nào.</p>';
      if (podcastsHtml === "")
        podcastsHtml =
          '<p class="no-posts-message">Hiện chưa có podcast nào.</p>';
    }

    articleTabContent.innerHTML = articlesHtml;
    videoTabContent.innerHTML = videosHtml;
    podcastTabContent.innerHTML = podcastsHtml;

    // Gắn sự kiện cho các nút tab
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", function () {
        // Xóa active class khỏi tất cả các nút và nội dung
        document
          .querySelectorAll(".tab-button")
          .forEach((btn) => btn.classList.remove("active"));
        document
          .querySelectorAll(".tab-content")
          .forEach((content) => content.classList.remove("active"));

        // Thêm active class cho nút và nội dung tương ứng
        this.classList.add("active");
        const targetType = this.dataset.type;
        document
          .getElementById(`${targetType}TabContent`)
          .classList.add("active");
      });
    });
  } catch (error) {
    console.error("Lỗi khi tải tất cả bài đăng:", error);
    articleTabContent.innerHTML = `<p class="error-message">Không thể tải bài đăng: ${error.message}</p>`;
    videoTabContent.innerHTML = `<p class="error-message">Không thể tải bài đăng: ${error.message}</p>`;
    podcastTabContent.innerHTML = `<p class="error-message">Không thể tải bài đăng: ${error.message}</p>`;
  }
}

// --- HÀM TẢI CHI TIẾT BÀI ĐĂNG CHO TRANG 'post-detail.html' ---
async function loadPostDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");
  const postDetailContentDiv = document.getElementById("postDetailContent");
  const postDetailTitleTag = document.getElementById("postDetailTitle");

  if (!postId) {
    if (postDetailContentDiv)
      postDetailContentDiv.innerHTML =
        '<p class="error-message">Không tìm thấy ID bài đăng.</p>';
    if (postDetailTitleTag)
      postDetailTitleTag.textContent = "Lỗi - Mental Track";
    return;
  }

  try {
    const postDocRef = doc(db, "posts", postId);
    const postDocSnap = await getDoc(postDocRef);

    if (!postDocSnap.exists()) {
      if (postDetailContentDiv)
        postDetailContentDiv.innerHTML =
          '<p class="error-message">Bài đăng không tồn tại.</p>';
      if (postDetailTitleTag)
        postDetailTitleTag.textContent =
          "Bài đăng không tồn tại - Mental Track";
      return;
    }

    const post = postDocSnap.data();
    if (postDetailTitleTag)
      postDetailTitleTag.textContent = `${post.title} - Mental Track`;

    let contentHtml = "";
    const thumbnailUrl =
      post.thumbnailUrl || "https://via.placeholder.com/800x450?text=No+Image";
    const createdAtDate = post.createdAt
      ? new Date(post.createdAt.toDate()).toLocaleDateString("vi-VN")
      : "N/A";
    const updatedAtDate = post.updatedAt
      ? new Date(post.updatedAt.toDate()).toLocaleDateString("vi-VN")
      : "N/A";
    const author = post.author || "Ẩn danh";

    contentHtml += `
            <div class="post-detail-container">
                <h1>${post.title}</h1>
                <div class="post-meta">
                    <p>Loại: ${
                      post.postType === "article"
                        ? "Bài viết"
                        : post.postType === "video"
                        ? "Video"
                        : post.postType === "podcast"
                        ? "Podcast"
                        : "Khác"
                    } | 
                    Ngày tạo: ${createdAtDate} | 
                    Cập nhật: ${updatedAtDate}
                    ${
                      post.postType === "article" && post.author
                        ? `| Tác giả: ${post.author}`
                        : ""
                    }
                    </p>
                </div>
                ${
                  post.thumbnailUrl
                    ? `<img src="${thumbnailUrl}" alt="${post.title}" class="main-thumbnail">`
                    : ""
                }
                <p>${post.description || "Không có mô tả."}</p>
                
                <div class="post-detail-content">
        `;

    switch (post.postType) {
      case "article":
        contentHtml += `<p>${
          post.content || "Nội dung bài viết đang được cập nhật."
        }</p>`;
        break;
      case "video":
        const youtubeEmbedUrl =
          post.url && post.url.includes("youtube.com/watch?v=")
            ? `https://www.youtube.com/embed/${new URLSearchParams(
                new URL(post.url).search
              ).get("v")}`
            : post.url; // Giả định là URL trực tiếp nếu không phải YouTube
        contentHtml += `
                    <div class="video-embed">
                        ${
                          youtubeEmbedUrl
                            ? `<iframe src="${youtubeEmbedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
                            : "<p>Không có video để hiển thị.</p>"
                        }
                        ${
                          post.platform
                            ? `<p>Nền tảng: ${post.platform}</p>`
                            : ""
                        }
                        ${
                          post.duration
                            ? `<p>Thời lượng: ${post.duration} giây</p>`
                            : ""
                        }
                    </div>
                `;
        break;
      case "podcast":
        contentHtml += `
                    <div class="podcast-embed">
                        ${
                          post.url
                            ? `<audio controls src="${post.url}"></audio>`
                            : "<p>Không có file âm thanh để hiển thị.</p>"
                        }
                        ${
                          post.platform
                            ? `<p>Nền tảng: ${post.platform}</p>`
                            : ""
                        }
                        ${
                          post.duration
                            ? `<p>Thời lượng: ${post.duration} giây</p>`
                            : ""
                        }
                    </div>
                `;
        break;
    }

    contentHtml += `
                </div>
                <a href="../html/post.html" class="back-button action-btn">Quay lại danh sách bài đăng</a>
            </div>
        `;

    if (postDetailContentDiv) postDetailContentDiv.innerHTML = contentHtml;
  } catch (error) {
    console.error("Lỗi khi tải chi tiết bài đăng:", error);
    if (postDetailContentDiv)
      postDetailContentDiv.innerHTML = `<p class="error-message">Không thể tải chi tiết bài đăng: ${error.message}</p>`;
    if (postDetailTitleTag)
      postDetailTitleTag.textContent = "Lỗi - Mental Track";
  }
}

// --- XÁC ĐỊNH TRANG ĐANG CHẠY VÀ GỌI HÀM PHÙ HỢP ---
// Lắng nghe sự kiện DOMContentLoaded để đảm bảo HTML đã được tải đầy đủ
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (
    path.includes("index.html") ||
    path === "/" ||
    path.includes("homepage_signed_in.html")
  ) {
    // Tải bài đăng cho trang chủ
    loadHomepagePosts();
    // Bạn có thể thêm các hàm khác cho trang chủ ở đây
  } else if (path.includes("post.html")) {
    // Tải tất cả bài đăng cho trang bài đăng
    loadAllPosts();
  } else if (path.includes("post-detail.html")) {
    // Tải chi tiết bài đăng
    loadPostDetail();
  }
  // Thêm các điều kiện khác cho các trang khác nếu cần (ví dụ: assessments.html)
});
