import { type Message } from "@/data/mock";
import { formatTime, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Sparkles, MessageSquare } from "lucide-react";

export function ConversationHistory({ messages, customerName }: { messages: Message[]; customerName: string }) {
  return (
    <div className="bg-card border border-border rounded-3xl shadow-card flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
            <MessageSquare className="size-4" />
          </div>
          <div>
            <div className="text-sm font-bold leading-none">Conversation History</div>
            <div className="text-[11px] text-muted-foreground mt-1">{messages.length} messages · with {customerName}</div>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 flex flex-col gap-5 max-h-[520px] overflow-y-auto scrollbar-thin">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">No messages yet.</div>
        )}
        {messages.map((m) => {
          const isAgent = m.sender === "agent";
          return (
            <div key={m.id} className={cn("flex gap-3", isAgent ? "" : "flex-row-reverse")}>
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold",
                  isAgent ? "bg-gradient-clay text-primary-foreground" : "bg-muted text-foreground border border-border"
                )}
              >
                {isAgent ? <Sparkles className="size-3.5" /> : m.senderName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className={cn("max-w-[78%] flex flex-col gap-1", isAgent ? "items-start" : "items-end")}>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">{m.senderName}</span>
                  <span>·</span>
                  <span>{formatDate(m.timestamp)} {formatTime(m.timestamp)}</span>
                </div>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed text-pretty",
                    isAgent
                      ? "bg-primary-soft text-foreground rounded-tl-sm"
                      : "bg-muted text-foreground rounded-tr-sm"
                  )}
                >
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border p-3 bg-muted/40">
        <div className="flex items-center gap-2 bg-card rounded-full border border-border px-4 py-2 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          Aura AI is monitoring this conversation and will reply automatically.
        </div>
      </div>
    </div>
  );
}
