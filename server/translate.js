// server/translate.js
// 번역을 담당하는 파일입니다. 두 단계로 시도합니다:
//   1차: 구글 번역(비공식 무료 엔드포인트) - 품질이 좋고 짧은 단어도 대체로 정확합니다.
//   2차: 1차가 실패하면 MyMemory API로 재시도합니다.
//   둘 다 실패하면 원문을 그대로 돌려줘서, 번역이 안 되더라도 채팅 자체는 멈추지 않게 합니다.
//
// 나중에 DeepL이나 Google Cloud Translation(정식 유료 API)으로 바꾸고 싶다면
// 이 파일의 translateText() 안쪽 로직만 바꾸면 됩니다. 다른 파일은 손댈 필요 없습니다.

async function translateViaGoogle(text, fromLang, toLang) {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: fromLang,
    tl: toLang,
    dt: 't',
    q: text,
  });
  const url = `https://translate.googleapis.com/translate_a/single?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`google translate status ${res.status}`);
  const data = await res.json();

  // 구글 응답은 [[["번역문","원문",...], ["번역문2","원문2",...]], ...] 형태입니다.
  // 문장이 여러 개로 쪼개져 올 수 있어서 조각들을 순서대로 이어 붙입니다.
  const segments = data?.[0];
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new Error('google translate: empty response');
  }
  const translated = segments.map((seg) => seg[0]).join('');
  if (!translated) throw new Error('google translate: no text');
  return translated;
}

async function translateViaMyMemory(text, fromLang, toLang) {
  const email = process.env.MYMEMORY_EMAIL;
  const params = new URLSearchParams({
    q: text,
    langpair: `${fromLang}|${toLang}`,
  });
  if (email) params.set('de', email);

  const url = `https://api.mymemory.translated.net/get?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`mymemory status ${res.status}`);
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  if (!translated) throw new Error('mymemory: no translatedText in response');
  return translated;
}

async function translateText(text, fromLang, toLang) {
  // 같은 언어면 번역할 필요가 없습니다.
  if (!text || !text.trim() || fromLang === toLang) {
    return text;
  }

  try {
    return await translateViaGoogle(text, fromLang, toLang);
  } catch (err1) {
    console.error('[translate] 구글 번역 실패, MyMemory로 재시도합니다:', err1.message);
    try {
      return await translateViaMyMemory(text, fromLang, toLang);
    } catch (err2) {
      console.error('[translate] MyMemory도 실패, 원문을 대신 사용합니다:', err2.message);
      return text;
    }
  }
}

module.exports = { translateText };