import type { AgentAction, Channel, Message } from "@/data/mock";

export type TranscriptRow = {
  id?: string | number;
  created_at?: string;
  createdAt?: string;
  customer_id?: string | number;
  customerId?: string | number;
  medium?: string;
  transcript?: string | unknown[];
  summary?: string;
  Summary?: string;
  notes?: string;
  note?: string;
};

type TranscriptTurn = {
  id?: string;
  role?: string;
  content?: string;
};

function mediumToChannel(medium?: string): Channel {
  const m = (medium ?? "").toLowerCase();
  if (m.includes("phone") || m.includes("call") || m.includes("voice")) return "phone";
  if (m.includes("sms") || m.includes("text")) return "sms";
  return "email";
}

function roleToSender(role?: string): "agent" | "customer" {
  const r = (role ?? "").toLowerCase();
  if (r === "assistant" || r === "agent" || r === "system" || r === "bot" || r === "tool") return "agent";
  return "customer";
}

export function stripLangPrefix(text: string): string {
  return text.replace(/^\[[a-z]{2}\]\s*/i, "").trim();
}

function parseTranscriptPayload(raw: string | unknown[] | undefined): TranscriptTurn[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.filter((x): x is TranscriptTurn => x != null && typeof x === "object");
  }
  if (typeof raw !== "string") return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((x): x is TranscriptTurn => x != null && typeof x === "object")
      : [];
  } catch {
    return [];
  }
}

function transcriptRowSummary(row: TranscriptRow): string {
  const directSummary =
    [row.summary, row.Summary, row.notes, row.note]
      .find((value) => typeof value === "string" && value.trim())?.trim();
  if (directSummary) return directSummary;
  return "";
}

/** Build Message list from etac_transcript rows (sorted by row created_at, then turn order). */
export function transcriptRowsToMessages(rows: TranscriptRow[], customerName: string): Message[] {
  const out: Message[] = [];

  for (const row of rows) {
    const created =
      row.created_at ?? row.createdAt ?? new Date().toISOString();
    const baseTime = new Date(created).getTime();
    const channel = mediumToChannel(row.medium);
    const turns = parseTranscriptPayload(row.transcript);

    turns.forEach((turn, i) => {
      const sender = roleToSender(turn.role);
      const text = stripLangPrefix(String(turn.content ?? ""));
      if (!text) return;
      out.push({
        id: String(turn.id ?? `transcript-${row.id}-${i}`),
        sender,
        senderName: sender === "agent" ? "Etac AI" : customerName || "Customer",
        channel,
        text,
        timestamp: new Date(baseTime + i * 1000).toISOString(),
      });
    });
  }

  return out.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function transcriptRowsToHistoryActions(rows: TranscriptRow[]): AgentAction[] {
  return [...rows]
    .sort((a, b) => {
      const at = new Date(a.created_at ?? a.createdAt ?? 0).getTime();
      const bt = new Date(b.created_at ?? b.createdAt ?? 0).getTime();
      return at - bt;
    })
    .map((row, index) => {
      const createdAt = row.created_at ?? row.createdAt ?? new Date().toISOString();
      return {
        id: String(row.id ?? `transcript-history-${index}`),
        title: `History date: ${new Date(createdAt).toLocaleString([], {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}`,
        reason: transcriptRowSummary(row),
        scheduledFor: createdAt,
        priority: "medium",
        icon: "phone",
        kind: "history",
      };
    });
}

export function dominantChannelFromMessages(messages: Message[]): Channel {
  if (messages.length === 0) return "email";
  const counts = new Map<Channel, number>();
  for (const m of messages) {
    counts.set(m.channel, (counts.get(m.channel) ?? 0) + 1);
  }
  let best: Channel = messages[messages.length - 1].channel;
  let max = 0;
  for (const [ch, n] of counts) {
    if (n > max) {
      max = n;
      best = ch;
    }
  }
  return best;
}
