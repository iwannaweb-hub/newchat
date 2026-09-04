// server/index.js
// 이 프로젝트의 "진입점(entry point)" 입니다. `npm start` 를 하면 이 파일이 실행됩니다.

require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const friendRoutes = require('./routes/friends');
const messageRoutes = require('./routes/messages');
const setupSocket = require('./socket');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());

// public 폴더 안의 html/css/js 파일들을 그대로 웹에서 볼 수 있게 해줍니다.
app.use(express.static(path.join(__dirname, '..', 'public')));

// API 라우트 연결
app.use('/api/auth', authRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);

// 실시간 채팅(Socket.io) 연결
setupSocket(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`서버가 실행되었습니다: http://localhost:${PORT}`);
});
