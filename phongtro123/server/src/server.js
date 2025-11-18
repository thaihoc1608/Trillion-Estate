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

app.post('/chat', async (req, res) => {
    const { question } = req.body;
    const data = await askQuestion(question);
    return res.status(200).json(data);
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
