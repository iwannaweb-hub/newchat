// server/routes/messages.js
// 친구와 나눈 채팅 기록을 불러오는 API 입니다.
// (실시간 전송/수신 자체는 server/socket.js 에서 처리합니다)

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

router.get('/:friendId', requireAuth, (req, res) => {
  const friendId = Number(req.params.friendId);
  const myId = req.user.id;

  const rows = db
    .prepare(
      `SELECT * FROM messages
       WHERE (from_user_id = ? AND to_user_id = ?)
          OR (from_user_id = ? AND to_user_id = ?)
       ORDER BY created_at ASC
       LIMIT 200`
    )
    .all(myId, friendId, friendId, myId);

  // 내가 보낸 메시지는 내가 원래 입력한 언어(original) 그대로,
  // 상대가 보낸 메시지는 나의 언어로 번역된(translated) 텍스트로 보여줍니다.
  const messages = rows.map((m) => ({
    id: m.id,
    mine: m.from_user_id === myId,
    text: m.from_user_id === myId ? m.original_text : m.translated_text,
    createdAt: m.created_at,
  }));

  res.json({ messages });
});

module.exports = router;
