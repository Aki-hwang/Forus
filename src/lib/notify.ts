// 리드 발생 알림 — 텔레그램 봇으로 즉시 통지.
// TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID 환경변수가 없으면 조용히 건너뛴다.
// 알림 실패가 접수 자체를 막으면 안 되므로 오류는 삼킨다 (호출부는 void 로 fire-and-forget).

export async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 3800) }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    /* 무시 — 접수는 이미 저장됨 */
  }
}
