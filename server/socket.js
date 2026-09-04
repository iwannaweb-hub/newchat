// server/socket.js
// 실시간 채팅(Socket.io)을 설정하는 파일입니다.
// 흐름: 클라이언트 접속 -> 토큰 검증 -> 자기 전용 room("user:아이디")에 입장
//       -> 'chat message' 이벤트를 받으면 -> 번역 -> DB 저장 -> 상대방 room으로 전달

const db = require('./db');
const { verifyToken } = require('./auth');
const { translateText } = require('./translate');

function areFriends(userIdA, userIdB) {
  const [a, b] = [userIdA, userIdB].sort((x, y) => x - y);
  return db
    .prepare('SELECT id FROM friendships WHERE user_id_a = ? AND user_id_b = ?')
    .get(a, b);
}

function setupSocket(io) {
  // 소켓 연결 시 토큰을 검증하는 미들웨어
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('로그인이 필요합니다.'));

    try {
      const payload = verifyToken(token);
      socket.user = payload; // { id, username }
      next();
    } catch (err) {
      next(new Error('토큰이 유효하지 않습니다.'));
    }
  });

  io.on('connection', (socket) => {
    const myId = socket.user.id;
    socket.join(`user:${myId}`);
    console.log(`[socket] ${socket.user.username} 접속 (id=${myId})`);

    socket.on('chat message', async ({ toUserId, text }, ack) => {
      try {
        if (!toUserId || !text || !text.trim()) {
          if (ack) ack({ ok: false, error: '메시지 내용이 비어있습니다.' });
          return;
        }
        if (!areFriends(myId, toUserId)) {
          if (ack) ack({ ok: false, error: '친구 사이가 아닙니다.' });
          return;
        }

        const me = db.prepare('SELECT ui_lang FROM users WHERE id = ?').get(myId);
        const friend = db.prepare('SELECT ui_lang FROM users WHERE id = ?').get(toUserId);
        if (!friend) {
          if (ack) ack({ ok: false, error: '상대방을 찾을 수 없습니다.' });
          return;
        }

        const originalLang = me.ui_lang;
        const translatedLang = friend.ui_lang;
        const translatedText = await translateText(text.trim(), originalLang, translatedLang);

        const result = db
          .prepare(
            `INSERT INTO messages
              (from_user_id, to_user_id, original_text, original_lang, translated_text, translated_lang)
             VALUES (?, ?, ?, ?, ?, ?)`
          )
          .run(myId, toUserId, text.trim(), originalLang, translatedText, translatedLang);

        const savedMessage = {
          id: result.lastInsertRowid,
          createdAt: new Date().toISOString(),
        };

        // 상대방에게 실시간 전달 (상대방이 접속 중이 아니면 그냥 무시되고, 나중에 REST로 기록을 불러갑니다)
        io.to(`user:${toUserId}`).emit('chat message', {
          fromUserId: myId,
          text: translatedText,
          id: savedMessage.id,
          createdAt: savedMessage.createdAt,
        });

        if (ack) ack({ ok: true, id: savedMessage.id, createdAt: savedMessage.createdAt });
      } catch (err) {
        console.error('[socket] chat message 처리 중 오류:', err);
        if (ack) ack({ ok: false, error: '서버 오류로 메시지를 보내지 못했습니다.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[socket] ${socket.user.username} 연결 종료`);
    });
  });
}

module.exports = setupSocket;
