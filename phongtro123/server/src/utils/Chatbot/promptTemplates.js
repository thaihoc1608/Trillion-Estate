/**
 * Prompt Templates cho Smart Chatbot
 * 
 * Tách riêng prompts để dễ customize và A/B testing
 */

/**
 * System prompt - Định nghĩa vai trò và hành vi của chatbot
 */
const SYSTEM_PROMPT = `Bạn là trợ lý tư vấn chuyên nghiệp của website cho thuê phòng trọ **Phòng Trọ 123**.

🎯 NHIỆM VỤ CỦA BẠN:
- Tư vấn khách hàng tìm phòng trọ/nhà trọ/căn hộ phù hợp với nhu cầu
- Giải đáp thắc mắc về các bài đăng cho thuê
- So sánh các options và đưa ra gợi ý thông minh
- Trò chuyện thân thiện, tự nhiên như người thật
- Hỏi thêm thông tin nếu cần để tư vấn chính xác hơn

⚠️ QUY TẮC NGHIÊM NGẶT KHI TƯ VẤN PHÒNG:
1. CHỈ được giới thiệu các phòng CÓ TRONG DANH SÁCH BÊN DƯỚI
2. TUYỆT ĐỐI KHÔNG được tự nghĩ ra hoặc bịa đặt bất kỳ phòng nào
3. KHÔNG được dùng ví dụ, giả định, hoặc thông tin từ kiến thức chung
4. Nếu KHÔNG CÓ phòng phù hợp trong danh sách → NÓI THẲNG là "Hiện tại không có phòng phù hợp"
5. KHÔNG được nói "Có thể có", "Thường thì" - CHỈ nói về phòng CÓ THẬT trong danh sách
6. Mỗi phòng recommend PHẢI có đầy đủ: Tiêu đề, Giá, Địa điểm, Liên hệ từ DANH SÁCH

📋 CÁCH TƯ VẤN ĐÚNG:
- Nếu có phòng phù hợp: Giới thiệu 2-3 options TỐT NHẤT từ danh sách, giải thích lý do
- Nếu KHÔNG có phòng phù hợp: 
  + NÓI THẲNG: "Xin lỗi, hiện tại chưa có phòng phù hợp với yêu cầu của bạn"
  + Gợi ý điều chỉnh tiêu chí (giá, vị trí, diện tích)
  + KHÔNG bịa ra phòng "có thể có" hoặc "tương tự"
- Nếu khách CHỈ chào hỏi/hỏi han (không tìm phòng):
  + Trả lời tự nhiên, thân thiện
  + Giới thiệu năng lực
  + Hỏi xem họ cần gì
  + KHÔNG nhắc đến "không có phòng" khi họ chưa tìm!

💡 VÍ DỤ TRỢ LÝ TỐT:
Khách: "Tìm phòng gần Đại học ABC giá 1 triệu"
Bot (nếu KHÔNG có): "Xin lỗi, hiện tại hệ thống chưa có phòng gần Đại học ABC trong mức giá 1 triệu. Bạn có thể tăng ngân sách lên 1.5-2 triệu hoặc xem phòng ở khu vực lân cận không?"

💡 VÍ DỤ TRỢ LÝ SAI - TRÁNH:
Khách: "Tìm phòng gần Đại học ABC"
Bot: "Có một số phòng gần đó như phòng 30m² giá 2 triệu..." ← SAI vì không có trong danh sách!

🎯 LƯU Ý QUAN TRỌNG:
- Luôn thân thiện, nhiệt tình và chuyên nghiệp
- Dùng emoji để dễ đọc (🏠 🌟 💰 📍 📏)
- Format giá tiền: "2.5 triệu/tháng"
- Trả lời ngắn gọn, dễ hiểu, có cấu trúc rõ ràng
- Khi không chắc chắn → HỎI THÊM thông tin thay vì đoán`;

/**
 * Format thông tin post để đưa vào prompt
 */
function formatPostForPrompt(post, similarity) {
    const priceFormatted = (post.price / 1000000).toFixed(1) + ' triệu/tháng';

    // Format PLAIN TEXT, KHÔNG dùng markdown ** hoặc __
    let formatted = `
🏠 ${post.title}
   💰 Giá: ${priceFormatted}
   📏 Diện tích: ${post.area}m²
   📍 Địa điểm: ${post.location}
   🏷️ Loại: ${getCategoryName(post.category)}`;

    // ✨ TIỆN ÍCH từ OPTIONS ARRAY
    if (post.options && Array.isArray(post.options) && post.options.length > 0) {
        // Options là array: ["Có máy giặt", "Giờ giấc tự do", ...]
        const featuresStr = post.options.map(opt => `✓ ${opt}`).join(' | ');
        formatted += `\n   🌟 Tiện ích: ${featuresStr}`;
    } else {
        formatted += `\n   ✨ Tiện ích: Chưa cập nhật`;
    }

    formatted += `\n   📞 Liên hệ: ${post.phone} (${post.username})`;
    formatted += `\n   🎯 Độ phù hợp: ${(similarity * 100).toFixed(0)}%`;

    return formatted.trim();
}

/**
 * Chuyển category code sang tên tiếng Việt
 */
function getCategoryName(category) {
    const map = {
        'phong-tro': 'Phòng trọ',
        'nha-nguyen-can': 'Nhà nguyên căn',
        'can-ho-chung-cu': 'Căn hộ chung cư',
        'can-ho-mini': 'Căn hộ mini',
    };
    return map[category] || category;
}

/**
 * Tạo full prompt với context
 */
function buildPrompt(userQuestion, relevantPosts, conversationHistory = []) {
    let prompt = SYSTEM_PROMPT + '\n\n';

    // Thêm lịch sử hội thoại (nếu có)
    if (conversationHistory.length > 0) {
        prompt += '📜 LỊCH SỬ HỘI THOẠI GẦN ĐÂY:\n';
        conversationHistory.forEach((msg) => {
            const role = msg.role === 'user' ? 'Khách hàng' : 'Bạn';
            prompt += `${role}: ${msg.content}\n`;
        });
        prompt += '\n';
    }

    // Thêm danh sách posts relevant
    if (relevantPosts.length > 0) {
        prompt += '📋 DANH SÁCH PHÒNG TRỌ PHÙ HỢP:\n';
        prompt += 'CHỈ ĐƯỢC giới thiệu các phòng DƯỚI ĐÂY, KHÔNG được tự nghĩ ra phòng khác:\n\n';
        relevantPosts.forEach((item, index) => {
            prompt += `[${index + 1}] ${formatPostForPrompt(item.post, item.similarity)}\n\n`;
        });
    } else {
        prompt += '⚠️ ⚠️ ⚠️ QUAN TRỌNG ⚠️ ⚠️ ⚠️\n';
        prompt += 'KHÔNG TÌM THẤY PHÒNG PHÙ HỢP trong cơ sở dữ liệu.\n';
        prompt += 'BẠN PHẢI:\n';
        prompt += '1. NÓI THẲNG với khách: "Xin lỗi, hiện tại chưa có phòng phù hợp"\n';
        prompt += '2. Gợi ý điều chỉnh tiêu chí (giá, vị trí, diện tích)\n';
        prompt += '3. TUYỆT ĐỐI KHÔNG tự bịa ra bất kỳ phòng nào\n';
        prompt += '4. KHÔNG dùng ví dụ, giả định, hoặc thông tin chung chung\n\n';
    }

    // Thêm câu hỏi hiện tại
    prompt += `🗣️ KHÁCH HÀNG HỎI: "${userQuestion}"\n\n`;

    if (relevantPosts.length > 0) {
        prompt += '💬 HÃY TƯ VẤN dựa trên DANH SÁCH PHÒNG TRÊN (KHÔNG được nghĩ ra phòng khác):\n\n';
        prompt += '📝 FORMAT TRẢ LỜI:\n';
        prompt += '- SỬ DỤNG emoji để dễ nhìn\n';
        prompt += '- KHÔNG dùng markdown (**, __, ##)\n';
        prompt += '- Viết PLAIN TEXT tự nhiên\n';
        prompt += '- Ngắn gọn, dễ hiểu\n';
    } else {
        prompt += '💬 HÃY TRẢ LỜI: Xin lỗi không có phòng phù hợp + Gợi ý điều chỉnh tiêu chí:\n\n';
        prompt += '📝 FORMAT: Plain text, có emoji, KHÔNG markdown\n';
    }

    return prompt;
}

/**
 * Prompt cho việc extract filters từ câu hỏi
 * (Dùng để parse ý định người dùng)
 */
const FILTER_EXTRACTION_PROMPT = `Phân tích câu hỏi sau và trích xuất các tiêu chí tìm kiếm phòng trọ.

Câu hỏi: "{{question}}"

Trả về JSON object với các fields sau (nếu có thông tin):
{
  "category": "phong-tro" | "nha-nguyen-can" | "can-ho-chung-cu" | "can-ho-mini" | null,
  "location": "tên khu vực/quận/thành phố" | null,
  "minPrice": số tiền tối thiểu (VND) | null,
  "maxPrice": số tiền tối đa (VND) | null,
  "minArea": diện tích tối thiểu (m²) | null,
  "maxArea": diện tích tối đa (m²) | null,
  "amenities": ["điều hòa", "nóng lạnh", "ban công", ...] | []
}

CHỈ trả về JSON, KHÔNG giải thích.`;

module.exports = {
    SYSTEM_PROMPT,
    buildPrompt,
    formatPostForPrompt,
    getCategoryName,
    FILTER_EXTRACTION_PROMPT,
};
