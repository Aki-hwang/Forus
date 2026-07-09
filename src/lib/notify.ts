// 리드 발생 알림 — 텔레그램 봇으로 즉시 통지.
// TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID 환경변수가 없으면 조용히 건너뛴다.
// 알림 실패가 접수 자체를 막으면 안 되므로 throw 하지 않는다. 호출부는 void 로
// fire-and-forget — Railway 상시 프로세스 전제이며, 서버리스로 옮기면 응답 후
// 프로세스가 얼어 유실되므로 next/server 의 after() 로 감쌀 것.

export async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 3800) }),
      signal: AbortSignal.timeout(5000),
    });
    // 본문을 소비해 keep-alive 커넥션을 풀에 반환. 실패는 서버 로그로 남긴다 —
    // 토큰 만료·chat_id 오류로 알림이 무음 유실되는 걸 Railway 로그에서 발견 가능하게.
    const body = await res.text();
    if (!res.ok) console.error(`[notify] telegram ${res.status}: ${body.slice(0, 200)}`);
  } catch (e) {
    console.error("[notify] telegram failed:", e);
  }
}
