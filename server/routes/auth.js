// server/routes/auth.js
// 회원가입 / 로그인 / 내 정보 조회·수정 API

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { createToken, requireAuth } = require('../auth');

const router = express.Router();
const ALLOWED_LANGS = ['ko', 'en', 'fr', 'ja'];

// 회원가입
router.post('/register', async (req, res) => {
  const { username, password, ui_lang } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 모두 입력해주세요.' });
  }
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: '아이디는 3~20자로 입력해주세요.' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: '비밀번호는 4자 이상이어야 합니다.' });
  }

  const lang = ALLOWED_LANGS.includes(ui_lang) ? ui_lang : 'ko';

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: '이미 사용 중인 아이디입니다.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = db
    .prepare('INSERT INTO users (username, password_hash, ui_lang) VALUES (?, ?, ?)')
    .run(username, passwordHash, lang);

  const user = { id: result.lastInsertRowid, username, ui_lang: lang };
  const token = createToken(user);

  res.status(201).json({ token, user });
});

// 로그인
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 모두 입력해주세요.' });
  }

  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!row) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  }

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  }

  const user = { id: row.id, username: row.username, ui_lang: row.ui_lang };
  const token = createToken(user);

  res.json({ token, user });
});

// 내 정보 조회
router.get('/me', requireAuth, (req, res) => {
  const row = db.prepare('SELECT id, username, ui_lang FROM users WHERE id = ?').get(req.user.id);
  if (!row) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  res.json({ user: row });
});

// 내 UI 언어 변경
router.patch('/me/lang', requireAuth, (req, res) => {
  const { ui_lang } = req.body || {};
  if (!ALLOWED_LANGS.includes(ui_lang)) {
    return res.status(400).json({ error: '지원하지 않는 언어입니다.' });
  }
  db.prepare('UPDATE users SET ui_lang = ? WHERE id = ?').run(ui_lang, req.user.id);
  res.json({ ok: true });
});

module.exports = router;
