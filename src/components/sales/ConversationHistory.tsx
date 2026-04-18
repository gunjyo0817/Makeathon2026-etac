import { useEffect, useMemo, useState } from "react";
import { type Channel, type Lead, type Message } from "@/data/mock";
import { formatTime, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ArrowRightLeft, Columns3, Mail, MessageSquare, Phone, Sparkles } from "lucide-react";

const CHANNEL_META: Record<Channel, { label: string; Icon: typeof Mail }> = {
  email: { label: "Email", Icon: Mail },
  sms: { label: "SMS", Icon: MessageSquare },
  phone: { label: "Phone", Icon: Phone },
};

const PRIMARY_CHANNELS: Channel[] = ["sms", "email", "phone"];

export function ConversationHistory({ lead }: { lead: Lead }) {
  const [selectedChannel, setSelectedChannel] = useState<Channel>(lead.currentChannel);
  const [isSplitView, setIsSplitView] = useState(false);

  useEffect(() => {
    setSelectedChannel(lead.currentChannel);
    setIsSplitView(false);
  }, [lead.currentChannel, lead.id]);

  const visibleMessages = useMemo(
    () => lead.messages.filter((message) => message.channel === selectedChannel),
    [lead.messages, selectedChannel]
  );

  const currentChannel = CHANNEL_META[selectedChannel];
  const headerCopy = isSplitView
    ? `${PRIMARY_CHANNELS.length} channels side by side · with ${lead.name}`
    : `${visibleMessages.length} ${currentChannel.label.toLowerCase()} messages · with ${lead.name}`;

  return (
    <div className="bg-card border border-border rounded-3xl shadow-card flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
            <MessageSquare className="size-4" />
          </div>
          <div>
            <div className="text-sm font-bold leading-none">Conversation History</div>
            <div className="text-[11px] text-muted-foreground mt-1">{headerCopy}</div>
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
            {PRIMARY_CHANNELS.length} channels available for this buyer
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {PRIMARY_CHANNELS.map((channel) => {
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
          <button
            type="button"
            onClick={() => setIsSplitView((value) => !value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-all",
              isSplitView
                ? "border-primary/20 bg-card text-foreground shadow-soft"
                : "border-border bg-background/70 text-muted-foreground hover:bg-card hover:text-foreground"
            )}
          >
            <Columns3 className={cn("size-3.5", isSplitView ? "text-primary" : "text-muted-foreground")} />
            {isSplitView ? "Split View On" : "Split View"}
          </button>
        </div>
      </div>

      {isSplitView ? (
        <div className="px-5 py-6 overflow-x-auto scrollbar-thin">
          <div className="grid min-w-[860px] grid-cols-3 gap-4">
            {PRIMARY_CHANNELS.map((channel) => {
              const meta = CHANNEL_META[channel];
              const messages = lead.messages.filter((message) => message.channel === channel);

              return (
                <div key={channel} className="min-h-[420px] rounded-2xl border border-border bg-background/80 flex flex-col overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <meta.Icon className="size-4 text-primary" />
                      {meta.label}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {messages.length} messages
                    </div>
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto scrollbar-thin">
                    <MessageList messages={messages} channelLabel={meta.label} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="px-5 py-6 flex flex-col gap-5 max-h-[520px] overflow-y-auto scrollbar-thin">
          <MessageList messages={visibleMessages} channelLabel={currentChannel.label} />
        </div>
      )}

      <div className="border-t border-border p-3 bg-muted/40">
        <div className="flex items-center gap-2 bg-card rounded-full border border-border px-4 py-2 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          Etac AI is monitoring {lead.name}'s {isSplitView ? "multi-channel" : currentChannel.label.toLowerCase()} conversation and can continue the follow-up automatically.
        </div>
      </div>
    </div>
  );
}

function MessageList({ messages, channelLabel }: { messages: Message[]; channelLabel: string }) {
  if (messages.length === 0) {
    return <EmptyState message={`No messages on ${channelLabel} yet.`} />;
  }

  return (
    <div className="flex flex-col gap-5">
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
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-5 py-8 text-center">
      <div className="text-sm font-semibold">{message}</div>
      <div className="text-xs text-muted-foreground mt-1">
        Etac can switch into this channel when the buyer responds there.
      </div>
    </div>
  );
}
