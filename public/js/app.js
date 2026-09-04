// public/js/app.js
// chat.html (메인 채팅 화면) 의 모든 동작을 담당합니다.
// 크게 4가지 일을 합니다: 1) 로그인 확인  2) 친구 검색/요청/목록  3) 채팅 기록 불러오기  4) 실시간 송수신(Socket.io)

const token = localStorage.getItem('token');
const me = JSON.parse(localStorage.getItem('user') || 'null');

if (!token || !me) {
  window.location.href = '/index.html';
}

let currentFriend = null; // { id, username }
let socket = null;
let friendsById = {}; // { [id]: { id, username, ui_lang } } - 알림에 보낸 사람 이름을 표시할 때 씁니다.
let unreadCounts = {}; // { [friendId]: 안읽은 메시지 개수 } - 새로고침하면 초기화됩니다(서버에 저장하지 않음).

// 공통: 인증 헤더가 포함된 fetch
async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `요청 실패 (${res.status})`);
  return data;
}

function el(html) {
  const div = document.createElement('div');
  div.innerHTML = html.trim();
  return div.firstChild;
}

// ---------- 초기화 ----------
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('myUsername').textContent = me.username;
  applyLang(me.ui_lang);

  document.getElementById('topLangSelect').addEventListener('change', async (e) => {
    const lang = e.target.value;
    applyLang(lang);
    updateNotifyBtn();
    try {
      await api('/api/auth/me/lang', { method: 'PATCH', body: JSON.stringify({ ui_lang: lang }) });
      me.ui_lang = lang;
      localStorage.setItem('user', JSON.stringify(me));
    } catch (err) {
      console.error(err);
    }
  });

  setupNotifyButton();

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
  });

  document.getElementById('searchBtn').addEventListener('click', runSearch);
  document.getElementById('searchInput').addEventListener('keydown', (e) => {
    // e.isComposing / keyCode 229 체크: 한글·일본어처럼 여러 키를 조합해서 글자를 만드는
    // 입력기(IME)가 아직 글자를 조합 중일 때 Enter가 눌리면 무시합니다.
    // 이 체크가 없으면 조합 중이던 마지막 글자가 한 번 더 전송되는 중복 버그가 생깁니다.
    if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) runSearch();
  });

  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('messageInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) sendMessage();
  });

  connectSocket();
  loadFriends();
  loadRequests();
});

// ---------- Socket.io ----------
function connectSocket() {
  socket = io({ auth: { token } });

  socket.on('connect_error', (err) => {
    console.error('소켓 연결 실패:', err.message);
  });

  socket.on('chat message', (msg) => {
    const isSameFriend = currentFriend && msg.fromUserId === currentFriend.id;

    // 지금 대화창을 열어둔 상대라면 화면에 바로 추가 (모바일에서 뒤로가기 상태여도
    // 나중에 다시 들어왔을 때 어차피 서버에서 새로 불러오므로 미리 넣어둬도 무해합니다)
    if (isSameFriend) {
      appendBubble(msg.text, false);
    }

    // "지금 실제로 화면에 보이는 대화"인지 확인: 같은 친구 + 탭이 활성 상태 + (모바일이면) 채팅 화면이 열려있는 상태
    const isActivelyViewing = isSameFriend && !document.hidden && isChatViewVisible();

    if (!isActivelyViewing) {
      incrementUnread(msg.fromUserId);
      notifyNewMessage(msg.fromUserId, msg.text);
    }
  });
}

// 모바일 화면에서 채팅 화면(.chat-open)이 실제로 보이는 상태인지 확인합니다.
// PC처럼 넓은 화면에서는 친구목록+채팅창이 항상 같이 보이므로 언제나 true 입니다.
function isChatViewVisible() {
  const isMobileLayout = window.matchMedia('(max-width: 768px)').matches;
  if (!isMobileLayout) return true;
  return document.getElementById('chatLayout').classList.contains('chat-open');
}

// ---------- 브라우저 알림 ----------
function setupNotifyButton() {
  const btn = document.getElementById('notifyBtn');
  if (!('Notification' in window)) {
    // 이 브라우저는 알림 기능 자체를 지원하지 않음
    btn.style.display = 'none';
    return;
  }
  updateNotifyBtn();
  btn.addEventListener('click', async () => {
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
      updateNotifyBtn();
    } else if (Notification.permission === 'denied') {
      alert(t('notify_denied'));
    }
  });
}

function updateNotifyBtn() {
  const btn = document.getElementById('notifyBtn');
  if (!btn || !('Notification' in window)) return;
  if (Notification.permission === 'granted') btn.textContent = t('notify_on');
  else if (Notification.permission === 'denied') btn.textContent = t('notify_denied');
  else btn.textContent = t('notify_off');
}

// ---------- 안 읽은 메시지 개수(배지) ----------
function incrementUnread(friendId) {
  unreadCounts[friendId] = (unreadCounts[friendId] || 0) + 1;
  renderUnreadBadge(friendId);
}

function renderUnreadBadge(friendId) {
  const item = document.querySelector(`#friendList .list-item[data-id="${friendId}"]`);
  if (!item) return;
  const badge = item.querySelector('.badge');
  if (!badge) return;

  const count = unreadCounts[friendId] || 0;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

function notifyNewMessage(fromUserId, text) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const friend = friendsById[fromUserId];
  const title = friend ? friend.username : t('app_name');

  const notif = new Notification(title, { body: text });
  notif.onclick = () => {
    window.focus();
    if (friend) openChat(friend);
    notif.close();
  };
}

// ---------- 친구 검색 ----------
async function runSearch() {
  const q = document.getElementById('searchInput').value.trim();
  const container = document.getElementById('searchResults');
  container.innerHTML = '';
  if (!q) return;

  try {
    const { users } = await api(`/api/friends/search?q=${encodeURIComponent(q)}`);
    users.forEach((u) => {
      const row = el(`
        <div class="list-item">
          <span class="friend-name">${u.username}</span>
          <button class="small-btn" ${u.status !== 'none' ? 'disabled' : ''}></button>
        </div>
      `);
      const btn = row.querySelector('button');
      if (u.status === 'friends') {
        btn.textContent = t('already_friends');
      } else if (u.status === 'pending_sent') {
        btn.textContent = t('requested_button');
      } else if (u.status === 'pending_received') {
        btn.textContent = t('requests_label');
      } else {
        btn.textContent = t('add_friend_button');
        btn.addEventListener('click', async () => {
          try {
            await api('/api/friends/requests', {
              method: 'POST',
              body: JSON.stringify({ toUsername: u.username }),
            });
            btn.textContent = t('requested_button');
            btn.disabled = true;
          } catch (err) {
            alert(err.message);
          }
        });
      }
      container.appendChild(row);
    });
  } catch (err) {
    console.error(err);
  }
}

// ---------- 받은 친구 요청 ----------
async function loadRequests() {
  const container = document.getElementById('requestList');
  container.innerHTML = '';
  try {
    const { requests } = await api('/api/friends/requests');
    if (requests.length === 0) {
      container.appendChild(el(`<p class="muted" data-i18n="no_requests">${t('no_requests')}</p>`));
      return;
    }
    requests.forEach((r) => {
      const row = el(`
        <div class="list-item">
          <span>${r.from_username}</span>
          <span>
            <button class="small-btn" data-action="accept">${t('accept_button')}</button>
            <button class="small-btn secondary" data-action="reject">${t('reject_button')}</button>
          </span>
        </div>
      `);
      row.querySelector('[data-action="accept"]').addEventListener('click', async () => {
        await api(`/api/friends/requests/${r.id}/accept`, { method: 'POST' });
        loadRequests();
        loadFriends();
      });
      row.querySelector('[data-action="reject"]').addEventListener('click', async () => {
        await api(`/api/friends/requests/${r.id}/reject`, { method: 'POST' });
        loadRequests();
      });
      container.appendChild(row);
    });
  } catch (err) {
    console.error(err);
  }
}

// ---------- 친구 목록 ----------
async function loadFriends() {
  const container = document.getElementById('friendList');
  container.innerHTML = '';
  try {
    const { friends } = await api('/api/friends');
    friendsById = {};
    friends.forEach((f) => { friendsById[f.id] = f; });

    if (friends.length === 0) {
      container.appendChild(el(`<p class="muted">${t('no_friends_yet')}</p>`));
      return;
    }
    friends.forEach((f) => {
      const row = el(`
        <div class="list-item" data-id="${f.id}">
          <span class="friend-name">${f.username}</span>
          <span class="badge"></span>
        </div>
      `);
      row.addEventListener('click', () => openChat(f));
      container.appendChild(row);
      renderUnreadBadge(f.id); // 새로고침 전에 쌓여있던 안읽은 개수가 있으면 표시
    });
  } catch (err) {
    console.error(err);
  }
}

// ---------- 채팅방 열기 ----------
async function openChat(friend) {
  currentFriend = friend;

  // 이 친구와의 대화를 열었으니 안읽은 개수를 0으로 초기화
  unreadCounts[friend.id] = 0;
  renderUnreadBadge(friend.id);

  document.querySelectorAll('#friendList .list-item').forEach((item) => {
    item.classList.toggle('active', Number(item.dataset.id) === friend.id);
  });

  // 모바일 화면에서는 친구 목록을 숨기고 채팅 화면을 꽉 채워 보여줍니다.
  document.getElementById('chatLayout').classList.add('chat-open');

  document.getElementById('chatHeader').innerHTML = `
    <button class="back-btn" id="backBtn" aria-label="back">←</button>
    <span>${friend.username}</span>
  `;
  document.getElementById('backBtn').addEventListener('click', closeChatView);
  document.getElementById('composer').style.display = 'flex';

  const messagesEl = document.getElementById('messages');
  messagesEl.innerHTML = '';

  try {
    const { messages } = await api(`/api/messages/${friend.id}`);
    messages.forEach((m) => appendBubble(m.text, m.mine));
  } catch (err) {
    console.error(err);
  }
}

// 모바일 화면에서 "뒤로가기"를 누르면 채팅 화면을 닫고 친구 목록으로 돌아갑니다.
// (PC 화면에서는 이 버튼 자체가 CSS로 숨겨져 있어서 호출되지 않습니다)
function closeChatView() {
  document.getElementById('chatLayout').classList.remove('chat-open');
}

function appendBubble(text, mine) {
  const messagesEl = document.getElementById('messages');
  const bubble = el(`<div class="bubble ${mine ? 'mine' : 'theirs'}"></div>`);
  bubble.textContent = text;
  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ---------- 메시지 보내기 ----------
function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text || !currentFriend) return;

  socket.emit('chat message', { toUserId: currentFriend.id, text }, (ack) => {
    if (!ack || !ack.ok) {
      alert((ack && ack.error) || '메시지 전송 실패');
      return;
    }
  });

  // 내가 보낸 메시지는 번역을 기다릴 필요 없이 바로 화면에 표시합니다 (내 언어 그대로).
  appendBubble(text, true);
  input.value = '';
}