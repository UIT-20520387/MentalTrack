document.addEventListener('DOMContentLoaded', function() {
    const moodButtons = document.querySelectorAll('.mood-btn');
    const feelingSpan = document.querySelector('.diary-link span');

    // Mảng ánh xạ data-mood sang text hiển thị
    const moodTextMap = {
        'happy': 'Hạnh phúc',
        'joyful': 'Vui vẻ',
        'normal': 'Bình thường',
        'sad': 'Buồn',
        'awful': 'Tồi tệ'
    };

    moodButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Loại bỏ class 'selected' khỏi tất cả các button
            moodButtons.forEach(btn => {
                btn.classList.remove('selected');
            });

            // Thêm class 'selected' vào button vừa được nhấp
            this.classList.add('selected');

            // Cập nhật text trong dòng "Tôi cảm thấy"
            const moodValue = this.dataset.mood; // Lấy giá trị từ data-mood
            feelingSpan.textContent = `Tôi cảm thấy ${moodTextMap[moodValue]}.`;
        });
    });

    const normalButton = document.querySelector('.mood-btn[data-mood="normal"]');
    if (normalButton) {
        normalButton.click();
    }
});