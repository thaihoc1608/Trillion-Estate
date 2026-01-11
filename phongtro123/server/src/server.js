const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs');

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    transports: ['websocket'],
    credentials: true,
});

global.io = io;

require('dotenv').config();

const bodyParser = require('body-parser');
const cookiesParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const cookie = require('cookie');

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

const connectDB = require('./config/ConnectDB');
const routes = require('./routes/index');
const { verifyToken } = require('./services/tokenSevices');
const modelMessager = require('./models/Messager.model');
const { askQuestion } = require('./utils/Chatbot/chatbot');
const { AiSearch } = require('./utils/AISearch/AISearch');
const socketServices = require('./services/socketServices');

app.use(express.static(path.join(__dirname, '../src')));
app.use(cookiesParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

routes(app);

connectDB();

app.use((req, res, next) => {
    req.io = io;
    next();
});


global.io.on('connect', socketServices.connection);

// 🤖 Smart Chatbot Endpoints
const { getChatbotInstance } = require('./utils/Chatbot/chatbot');

// Initialize chatbot khi server start
let chatbotReady = false;
getChatbotInstance()
    .initialize()
    .then(() => {
        chatbotReady = true;
        console.log('✅ Smart Chatbot initialized successfully');
    })
    .catch((error) => {
        console.error('❌ Failed to initialize Smart Chatbot:', error);
    });

// Chat endpoint (đã nâng cấp)
app.post('/chat', async (req, res) => {
    try {
        const { question, userId } = req.body;

        if (!question) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập câu hỏi',
            });
        }

        if (!chatbotReady) {
            return res.status(503).json({
                success: false,
                message: 'Chatbot đang khởi động, vui lòng thử lại sau',
            });
        }

        const chatbot = getChatbotInstance();
        const result = await chatbot.askQuestion(question, userId);

        return res.status(200).json({
            success: true,
            data: result.answer,
            metadata: result.metadata,
        });
    } catch (error) {
        console.error('Error in /chat:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
});

// Chatbot stats endpoint
app.get('/chatbot/stats', async (req, res) => {
    try {
        const chatbot = getChatbotInstance();
        const stats = await chatbot.getStats();

        return res.status(200).json({
            success: true,
            data: stats,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// Clear conversation endpoint
app.post('/chatbot/clear-conversation', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required',
            });
        }

        const chatbot = getChatbotInstance();
        chatbot.clearConversation(userId);

        return res.status(200).json({
            success: true,
            message: 'Conversation cleared',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// Reload embeddings endpoint (admin only, sau khi có posts mới)
app.post('/chatbot/reload', async (req, res) => {
    try {
        const chatbot = getChatbotInstance();
        await chatbot.reload();

        return res.status(200).json({
            success: true,
            message: 'Embeddings reloaded successfully',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

app.get('/ai-search', async (req, res) => {
    const { question } = req.query;
    console.log('question', question);
    const data = await AiSearch(question);
    return res.status(200).json(data);
});


app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Lỗi server',
    });
});

app.post('/api/add-search', (req, res) => {
    const { title } = req.body;
    const index = hotSearch.findIndex((item) => item.title === title);
    if (index !== -1) {
        hotSearch[index].count++;
    } else {
        hotSearch.push({ title, count: 1 });
    }
    return res.status(200).json({ message: 'Thêm từ khóa thành công' });
});

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
