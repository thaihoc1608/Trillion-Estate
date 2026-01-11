# 🤖 Smart Chatbot với RAG Pattern

Chatbot tư vấn thông minh sử dụng Google Gemini AI và Retrieval Augmented Generation (RAG) pattern.

## ⭐ Tính Năng

- ✅ **Semantic Search**: Tìm phòng trọ relevant nhất dựa trên ý nghĩa câu hỏi
- ✅ **Conversation Context**: Nhớ lịch sử hội thoại (10 messages gần nhất)
- ✅ **Scalable**: Xử lý được 5000+ posts (có thể scale lên millions)
- ✅ **Smart Recommendations**: Chỉ recommend 2-3 options tốt nhất
- ✅ **Fast**: Response time < 3 giây
- ✅ **Easy Migration**: Dễ nâng cấp từ Approach 1 → Approach 2

## 🏗️ Kiến Trúc

### Files Structure
```
server/src/utils/Chatbot/
├── IVectorStore.js                    # Interface/Abstract class
├── InMemoryVectorStore.js             # Approach 1 (hiện tại)
├── MongoDBAtlasVectorStore.js         # Approach 2 (tương lai)
├── vectorStoreFactory.js              # Factory pattern để swap
├── chatbot.js                         # Main chatbot logic
├── promptTemplates.js                 # Prompt engineering
└── conversationManager.js             # Conversation history

server/scripts/
└── generateAllEmbeddings.js           # Batch generate embeddings

server/src/models/
└── post.model.js                      # Updated với embedding fields
```

### RAG Flow
```
User Question
    ↓
Generate Embedding (768 dimensions)
    ↓
Semantic Search → Find Top 5 Relevant Posts
    ↓
Build Prompt (Question + Relevant Posts + Context)
    ↓
Gemini Generate Response
    ↓
Save to Conversation History
    ↓
Return Answer
```

## 🚀 Setup Instructions

### 1. Cài Đặt (Không Cần Dependencies Mới!)

Code đã sử dụng Google Gemini API có sẵn, không cần install thêm gì.

### 2. Environment Variables

Đảm bảo có trong `.env`:
```bash
# Google Gemini API
GOOGLE_API_KEY=your_api_key_here

# MongoDB
CONNECT_DB=your_mongodb_connection_string

# Vector Store Type (optional)
VECTOR_STORE_TYPE=memory    # Mặc định: memory (Approach 1)
# VECTOR_STORE_TYPE=atlas   # Uncomment để dùng Approach 2
```

### 3. Generate Embeddings cho Posts Hiện Có

**QUAN TRỌNG:** Chạy script này MỘT LẦN sau khi deploy code:

```bash
# CD vào thư mục server
cd server

# Chạy script generate embeddings
node scripts/generateAllEmbeddings.js

# Force regenerate (nếu cần)
node scripts/generateAllEmbeddings.js --force

# Custom batch size
node scripts/generateAllEmbeddings.js --batch-size=100
```

**Lưu ý:**
- Script sẽ chạy ~1-2 phút cho 100 posts
- Free tier Gemini API: 60 requests/minute, 1500/day
- Nếu có >1500 posts, script sẽ chạy qua nhiều ngày (hoặc upgrade lên paid tier)

### 4. Restart Server

Sau khi generate embeddings xong:
```bash
npm run dev
```

Chatbot sẽ tự động load embeddings vào memory khi server start.

## 📡 API Endpoints

### Chat Endpoint (Updated)
```javascript
POST /chat

Request:
{
  "question": "Tìm phòng gần ĐHQG dưới 2 triệu",
  "userId": "user123"  // Optional, để track conversation
}

Response:
{
  "success": true,
  "data": "Câu trả lời từ chatbot...",
  "metadata": {
    "postsFound": 10,        // Số posts tìm thấy
    "postsUsed": 3,          // Số posts đã dùng để trả lời
    "responseTime": 1234,     // Response time (ms)
    "hasConversationContext": true
  }
}
```

### Management Endpoints

```javascript
// Get chatbot stats
GET /chatbot/stats

Response:
{
  "success": true,
  "data": {
    "vectorStore": {
      "totalVectors": 5000,
      "dimensions": 768,
      "storageType": "in-memory"
    },
    "conversations": {
      "activeConversations": 10,
      "totalMessages": 150
    }
  }
}

// Clear conversation (reset context)
POST /chatbot/clear-conversation
{
  "userId": "user123"
}

// Reload embeddings (sau khi có posts mới)
POST /chatbot/reload
```

## 🔄 Auto-generate Embedding cho Posts Mới

Hiện tại: **Chưa tự động**. Sau khi tạo post mới, cần:

### Option 1: Manual Reload
```bash
# Call API endpoint
curl -X POST http://localhost:3000/chatbot/reload
```

### Option 2: Code Hook (Recommended)

Tự động generate khi post được approved. Update [posts.controller.js](file:///d:/web_phong_tro/phongtro123/server/src/controllers/posts.controller.js):

```javascript
// Trong approvePost function
const { getChatbotInstance } = require('../utils/Chatbot/chatbot');

async approvePost(req, res) {
  // ... existing code ...
  
  // Sau khi approve
  await modelPost.findByIdAndUpdate(id, { status: 'active' });
  
  // 🆕 Auto-generate embedding
  try {
    const chatbot = getChatbotInstance();
    await chatbot.generatePostEmbedding(id);
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    // Không throw error để không block approve flow
  }
  
  return new OK({ ... });
}
```

## 📈 Nâng Cấp lên Approach 2 (MongoDB Atlas Vector Search)

### Khi Nào Nên Nâng Cấp?

- ✅ Có >10,000 posts
- ✅ Cần response time nhanh hơn (<1s)
- ✅ Muốn scale lên millions posts
- ✅ Đang dùng MongoDB Atlas

### Steps để Nâng Cấp

#### 1. Tạo Vector Search Index trong MongoDB Atlas

1. Vào MongoDB Atlas UI
2. Navigate to: Database → Browse Collections → posts
3. Click "Search Indexes" tab
4. Create Index với config:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    }
  ]
}
```

5. Đợi index build xong (~5-10 phút)

#### 2. Update Environment Variable

```bash
# .env
VECTOR_STORE_TYPE=atlas
```

#### 3. Restart Server

```bash
npm run dev
```

**Xong!** Vector store tự động switch sang MongoDB Atlas Vector Search.

### Rollback về Approach 1

Nếu gặp vấn đề, chỉ cần:

```bash
# .env
VECTOR_STORE_TYPE=memory
```

Restart server là xong.

## 🧪 Testing

### Test Manual

```bash
# Test chat
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Tìm phòng trọ gần ĐHQG giá rẻ", "userId": "test_user"}'

# Test stats
curl http://localhost:3000/chatbot/stats

# Test reload
curl -X POST http://localhost:3000/chatbot/reload
```

### Test Cases Recommended

1. **Semantic search quality**:
   - "Tìm phòng trọ gần ĐHQG dưới 2 triệu"
   - "Cần căn hộ có điều hòa, giá tầm 3-4 triệu"
   - "Phòng rộng, gần trường đại học"

2. **Conversation context**:
   - U: "Tìm phòng gần ĐHQG"
   - B: "Đây là 3 phòng gần ĐHQG..."
   - U: "Cái nào rẻ nhất?" ← Should remember context

3. **Edge cases**:
   - Câu hỏi không liên quan
   - Không có posts phù hợp
   - Posts hết hạn (expired)

## 📊 Monitoring

### Metrics to Track

- **Response time**: Mục tiêu <3s
- **Posts found vs used**: Đảm bảo quality filtering
- **Conversation length**: Average messages per conversation
- **Error rate**: Gemini API failures

### Logs

Chatbot log các events quan trọng:
- ✅ Initialized với X embeddings
- 🔍 Search tìm thấy Y posts
- 💬 Response time
- ❌ Errors

Check logs để debug issues.

## ⚠️ Troubleshooting

### "Chatbot đang khởi động"

**Nguyên nhân**: Vector store chưa load xong

**Fix**: Đợi 10-30s sau khi server start

### "No embeddings found"

**Nguyên nhân**: Chưa chạy script generate embeddings

**Fix**: Chạy `node scripts/generateAllEmbeddings.js`

### Response chậm (>5s)

**Nguyên nhân**: 
- Quá nhiều posts trong memory (>10k)
- Gemini API rate limiting

**Fix**:
1. Nâng cấp lên Approach 2 (Atlas Vector Search)
2. Hoặc upgrade Gemini API plan

### Chatbot không nhớ context

**Nguyên nhân**: userId không được gửi hoặc conversation expired (>30 phút)

**Fix**: 
- Đảm bảo client gửi userId
- Hoặc tăng TTL trong conversationManager

## 💡 Tips & Best Practices

### Prompt Engineering

Update [promptTemplates.js](file:///d:/web_phong_tro/phongtro123/server/src/utils/Chatbot/promptTemplates.js) để improve responses:

```javascript
const SYSTEM_PROMPT = `
Bạn là trợ lý tư vấn chuyên nghiệp...

🎯 MỚI: Luôn hỏi về ngân sách nếu user chưa nói
🎯 MỚI: Giải thích chi phí thêm (điện, nước, internet)
...
`;
```

### Caching Frequent Questions

Có thể thêm Redis cache cho câu hỏi phổ biến:

```javascript
// Check cache trước khi call Gemini
const cached = await redis.get(`chat:${questionHash}`);
if (cached) return cached;
```

### A/B Testing Prompts

Test nhiều versions của prompts để tìm best performance.

## 📝 Changelog

### v2.0.0 - Smart Chatbot với RAG (2025-12-19)

- ✅ Added vector embeddings (768 dimensions)
- ✅ Implemented semantic search
- ✅ Added conversation context management
- ✅ Professional prompt templates
- ✅ Approach 1: In-memory vector store
- ✅ Approach 2: ready for MongoDB Atlas (future)
- ✅ Factory pattern cho easy migration
- ✅ Batch embedding generation script
- ✅ Updated API endpoints

### v1.0.0 - Simple Chatbot (Previous)

- Basic chatbot load tất cả posts vào prompt
- Không scale >10 posts

---

## 🆘 Support

Nếu gặp vấn đề:

1. Check logs trong terminal
2. Check `/chatbot/stats` endpoint
3. Verify embeddings đã được generate (`data.vectorStore.totalVectors > 0`)
4. Test với câu hỏi đơn giản trước

## 📚 References

- [Google Gemini AI](https://ai.google.dev/)
- [MongoDB Vector Search](https://www.mongodb.com/docs/atlas/atlas-vector-search/)
- [RAG Pattern](https://www.pinecone.io/learn/retrieval-augmented-generation/)
