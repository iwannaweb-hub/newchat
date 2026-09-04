// server/auth.js
// JWT(로그인 토큰) 발급/검증을 담당합니다.

const jwt = require('jsonwebtoken');

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET이 .env 파일에 설정되어 있지 않습니다.');
  }
  return secret;
}

function createToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    getSecret(),
    { expiresIn: '7d' }
  );
}

// REST API 요청에 로그인이 필요할 때 사용하는 미들웨어입니다.
// 프론트엔드는 요청 헤더에 "Authorization: Bearer <토큰>" 을 담아 보내야 합니다.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  try {
    const payload = jwt.verify(token, getSecret());
    req.user = payload; // { id, username }
    next();
  } catch (err) {
    return res.status(401).json({ error: '토큰이 유효하지 않습니다. 다시 로그인해주세요.' });
  }
}

// Socket.io 연결에서 토큰을 검증할 때 사용합니다.
function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

module.exports = { createToken, requireAuth, verifyToken };
