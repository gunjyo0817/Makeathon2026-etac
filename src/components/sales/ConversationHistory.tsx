import { useEffect, useMemo, useState } from "react";
import { type Channel, type Lead } from "@/data/mock";
import { formatTime, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ArrowRightLeft, Linkedin, Mail, MessageCircle, MessageSquare, Phone, Sparkles } from "lucide-react";

const CHANNEL_META: Record<Channel, { label: string; Icon: typeof Mail }> = {
  email: { label: "Email", Icon: Mail },
  sms: { label: "SMS", Icon: MessageSquare },
  phone: { label: "Phone", Icon: Phone },
  linkedin: { label: "LinkedIn", Icon: Linkedin },
  whatsapp: { label: "WhatsApp", Icon: MessageCircle },
  chat: { label: "Live Chat", Icon: MessageCircle },
};

export function ConversationHistory({ lead }: { lead: Lead }) {
  const [selectedChannel, setSelectedChannel] = useState<Channel>(lead.currentChannel);

  useEffect(() => {
    setSelectedChannel(lead.currentChannel);
  }, [lead.currentChannel, lead.id]);

  const visibleMessages = useMemo(
    () => lead.messages.filter((message) => message.channel === selectedChannel),
    [lead.messages, selectedChannel]
  );

  const currentChannel = CHANNEL_META[selectedChannel];

  return (
    <div className="bg-card border border-border rounded-3xl shadow-card flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
            <MessageSquare className="size-4" />
          </div>
          <div>
            <div className="text-sm font-bold leading-none">Conversation History</div>
            <div className="text-[11px] text-muted-foreground mt-1">{visibleMessages.length} {currentChannel.label.toLowerCase()} messages · with {lead.name}</div>
          </div>
        </div>
        <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
          <ArrowRightLeft className="size-3" />
          Switch channel
        </div>
      </div>

      <div className="px-5 py-4 border-b border-border bg-muted/35">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">Current channel</div>
            <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
              <currentChannel.Icon className="size-4 text-primary" />
              {currentChannel.label}
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {lead.availableChannels.length} channels available for this lead
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {lead.availableChannels.map((channel) => {
            const meta = CHANNEL_META[channel];
            const isActive = channel === selectedChannel;
            return (
              <button
                key={channel}
                type="button"
                onClick={() => setSelectedChannel(channel)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-all",
                  isActive
                    ? "border-primary/20 bg-card text-foreground shadow-soft"
                    : "border-border bg-background/70 text-muted-foreground hover:bg-card hover:text-foreground"
                )}
              >
                <meta.Icon className={cn("size-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-6 flex flex-col gap-5 max-h-[520px] overflow-y-auto scrollbar-thin">
        {visibleMessages.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-5 py-8 text-center">
            <div className="text-sm font-semibold">No messages on {currentChannel.label} yet.</div>
            <div className="text-xs text-muted-foreground mt-1">
              Aura can switch into this channel when the lead responds there.
            </div>
          </div>
        )}
        {visibleMessages.map((m) => {
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
          Aura AI is monitoring {lead.name}'s {currentChannel.label.toLowerCase()} conversation and will reply automatically.
        </div>
      </div>
    </div>
  );
}
