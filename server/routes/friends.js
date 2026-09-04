// server/routes/friends.js
// 친구 찾기(검색) / 친구 요청 보내기·수락·거절 / 친구 목록 조회 API

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

function areFriends(userIdA, userIdB) {
  const [a, b] = [userIdA, userIdB].sort((x, y) => x - y);
  return db
    .prepare('SELECT id FROM friendships WHERE user_id_a = ? AND user_id_b = ?')
    .get(a, b);
}

function makeFriendship(userIdA, userIdB) {
  const [a, b] = [userIdA, userIdB].sort((x, y) => x - y);
  db.prepare('INSERT INTO friendships (user_id_a, user_id_b) VALUES (?, ?)').run(a, b);
}

// 아이디로 사용자 검색 (친구 찾기)
router.get('/search', requireAuth, (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ users: [] });

  const rows = db
    .prepare(
      `SELECT id, username FROM users
       WHERE username LIKE ? AND id != ?
       ORDER BY username ASC
       LIMIT 20`
    )
    .all(`%${q}%`, req.user.id);

  const users = rows.map((u) => {
    let status = 'none'; // none | friends | pending_sent | pending_received
    if (areFriends(req.user.id, u.id)) {
      status = 'friends';
    } else {
      const sent = db
        .prepare(
          "SELECT id FROM friend_requests WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'"
        )
        .get(req.user.id, u.id);
      const received = db
        .prepare(
          "SELECT id FROM friend_requests WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'"
        )
        .get(u.id, req.user.id);
      if (sent) status = 'pending_sent';
      else if (received) status = 'pending_received';
    }
    return { id: u.id, username: u.username, status };
  });

  res.json({ users });
});

// 친구 요청 보내기
router.post('/requests', requireAuth, (req, res) => {
  const { toUsername } = req.body || {};
  if (!toUsername) return res.status(400).json({ error: '친구의 아이디를 입력해주세요.' });

  const target = db.prepare('SELECT id FROM users WHERE username = ?').get(toUsername);
  if (!target) return res.status(404).json({ error: '존재하지 않는 아이디입니다.' });
  if (target.id === req.user.id) {
    return res.status(400).json({ error: '자기 자신에게는 친구 요청을 보낼 수 없습니다.' });
  }
  if (areFriends(req.user.id, target.id)) {
    return res.status(409).json({ error: '이미 친구입니다.' });
  }

  const existing = db
    .prepare(
      "SELECT id FROM friend_requests WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'"
    )
    .get(req.user.id, target.id);
  if (existing) {
    return res.status(409).json({ error: '이미 친구 요청을 보냈습니다.' });
  }

  db.prepare('INSERT INTO friend_requests (from_user_id, to_user_id) VALUES (?, ?)').run(
    req.user.id,
    target.id
  );

  res.status(201).json({ ok: true });
});

// 나에게 온 친구 요청 목록
router.get('/requests', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT fr.id, u.username AS from_username
       FROM friend_requests fr
       JOIN users u ON u.id = fr.from_user_id
       WHERE fr.to_user_id = ? AND fr.status = 'pending'
       ORDER BY fr.created_at DESC`
    )
    .all(req.user.id);

  res.json({ requests: rows });
});

// 친구 요청 수락
router.post('/requests/:id/accept', requireAuth, (req, res) => {
  const reqRow = db
    .prepare("SELECT * FROM friend_requests WHERE id = ? AND status = 'pending'")
    .get(req.params.id);

  if (!reqRow || reqRow.to_user_id !== req.user.id) {
    return res.status(404).json({ error: '요청을 찾을 수 없습니다.' });
  }

  db.prepare("UPDATE friend_requests SET status = 'accepted' WHERE id = ?").run(reqRow.id);
  if (!areFriends(reqRow.from_user_id, reqRow.to_user_id)) {
    makeFriendship(reqRow.from_user_id, reqRow.to_user_id);
  }

  res.json({ ok: true });
});

// 친구 요청 거절
router.post('/requests/:id/reject', requireAuth, (req, res) => {
  const reqRow = db
    .prepare("SELECT * FROM friend_requests WHERE id = ? AND status = 'pending'")
    .get(req.params.id);

  if (!reqRow || reqRow.to_user_id !== req.user.id) {
    return res.status(404).json({ error: '요청을 찾을 수 없습니다.' });
  }

  db.prepare("UPDATE friend_requests SET status = 'rejected' WHERE id = ?").run(reqRow.id);
  res.json({ ok: true });
});

// 내 친구 목록
router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id, u.username, u.ui_lang
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.user_id_a = ? THEN f.user_id_b ELSE f.user_id_a END
       WHERE f.user_id_a = ? OR f.user_id_b = ?
       ORDER BY u.username ASC`
    )
    .all(req.user.id, req.user.id, req.user.id);

  res.json({ friends: rows });
});

module.exports = router;
