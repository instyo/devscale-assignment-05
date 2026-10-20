export const DEFAULT_USER_ID = "default";

export function pendingMessageKey(sessionId: string) {
  return `pending-message:${sessionId}`;
}

export function setPendingMessage(sessionId: string, text: string) {
  sessionStorage.setItem(pendingMessageKey(sessionId), text);
}

/** Read without removing — survives React Strict Mode remounts. */
export function peekPendingMessage(sessionId: string) {
  return sessionStorage.getItem(pendingMessageKey(sessionId));
}

export function clearPendingMessage(sessionId: string) {
  sessionStorage.removeItem(pendingMessageKey(sessionId));
}

export type SessionSummary = {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
};

export async function fetchSessions(): Promise<SessionSummary[]> {
  try {
    const response = await fetch(
      `/api/chat/sessions?userId=${encodeURIComponent(DEFAULT_USER_ID)}`,
    );
    if (!response.ok) return [];
    const data = (await response.json()) as { sessions?: SessionSummary[] };
    return data.sessions ?? [];
  } catch {
    return [];
  }
}

export async function fetchSessionMessages(sessionId: string) {
  const response = await fetch(
    `/api/chat/session?sessionId=${encodeURIComponent(sessionId)}&userId=${encodeURIComponent(DEFAULT_USER_ID)}`,
    {
      headers: {
        "x-session-id": sessionId,
        "x-user-id": DEFAULT_USER_ID,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to load session");
  }

  return response.json() as Promise<{
    sessionId: string;
    messages: Parameters<
      typeof import("@anvia/react").initialMessagesFromMemory
    >[0];
  }>;
}
