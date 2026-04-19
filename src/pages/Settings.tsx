import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { User, Bell, Plug, Shield, CreditCard, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
];

export default function Settings() {
  const [active, setActive] = useState("profile");

  return (
    <AppShell>
      <div className="px-8 pb-10 pt-2 flex flex-col gap-7 max-w-[1400px] mx-auto">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2 text-sm">Manage your account, agents, and workspace preferences.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <nav className="bg-card border border-border rounded-3xl shadow-card p-3 h-fit">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors",
                  active === s.id ? "bg-primary-soft text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <s.icon className="size-4" />
                {s.label}
                <ChevronRight className={cn("size-4 ml-auto transition-opacity", active === s.id ? "opacity-100" : "opacity-0")} />
              </button>
            ))}
          </nav>

          <div className="bg-card border border-border rounded-3xl shadow-card p-7 flex flex-col gap-7">
            {active === "profile" && <ProfileSection />}
            {active === "notifications" && <NotificationsSection />}
            {active === "integrations" && <IntegrationsSection />}
            {active === "security" && <PlaceholderSection title="Security" desc="2FA, sessions, and audit logs." />}
            {active === "billing" && <PlaceholderSection title="Billing" desc="Plan, invoices, and payment methods." />}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-11 px-4 rounded-2xl bg-muted border border-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 focus:bg-card transition-all"
    />
  );
}

function ProfileSection() {
  return (
    <>
      <SectionHeader title="Profile" desc="How your teammates and customers see you in Etac." />
      <div className="flex items-center gap-5">
        <div className="size-20 rounded-full bg-gradient-clay text-primary-foreground flex items-center justify-center font-bold text-2xl shadow-clay">ET</div>
        <div className="flex flex-col gap-1.5">
          <button className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-clay hover:opacity-90 transition-opacity">
            Upload new photo
          </button>
          <span className="text-xs text-muted-foreground">JPG or PNG, max 2MB.</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Full name"><Input defaultValue="Elias Thorne" /></Field>
        <Field label="Title"><Input defaultValue="Director of Sales" /></Field>
        <Field label="Email"><Input type="email" defaultValue="elias@etac.ai" /></Field>
        <Field label="Timezone"><Input defaultValue="America/Los_Angeles" /></Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
        <button className="px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold shadow-clay hover:opacity-90 transition-opacity">Save changes</button>
      </div>
    </>
  );
}

function NotificationsSection() {
  const [hot, setHot] = useState(true);
  const [meetings, setMeetings] = useState(true);
  const [digest, setDigest] = useState(true);
  const [marketing, setMarketing] = useState(false);

  return (
    <>
      <SectionHeader title="Notifications" desc="Decide what Etac should ping you about." />
      <div className="flex flex-col gap-3">
        <Toggle label="New hot leads" desc="When intent score crosses 80." value={hot} onChange={setHot} />
        <Toggle label="Trial booked" desc="A lead books an in-person trial." value={meetings} onChange={setMeetings} />
        <Toggle label="Daily digest" desc="Morning summary at 8:00 AM." value={digest} onChange={setDigest} />
        <Toggle label="Product updates" desc="Newsletters and feature announcements." value={marketing} onChange={setMarketing} />
      </div>
    </>
  );
}

function IntegrationsSection() {
  const items = [
    { name: "Salesforce", desc: "Sync leads, contacts, and opportunities", connected: true },
    { name: "HubSpot", desc: "Two-way contact + deal sync", connected: false },
    { name: "Google Calendar", desc: "Block in-person trials on your calendar", connected: true },
    { name: "Slack", desc: "Notifications in your sales channel", connected: true },
    { name: "Gmail", desc: "Send replies from your address", connected: false },
    { name: "Zoom", desc: "Auto-create video links for hybrid follow-ups", connected: true },
  ];
  return (
    <>
      <SectionHeader title="Integrations" desc="Connect Etac to the tools your team already uses." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((i) => (
          <div key={i.name} className="border border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-muted flex items-center justify-center font-bold text-sm">
              {i.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold leading-tight">{i.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5 truncate">{i.desc}</div>
            </div>
            <button
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0",
                i.connected
                  ? "bg-success-soft text-success hover:opacity-80"
                  : "bg-primary text-primary-foreground shadow-clay hover:opacity-90"
              )}
            >
              {i.connected ? <span className="inline-flex items-center gap-1"><Check className="size-3" /> Connected</span> : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function PlaceholderSection({ title, desc }: { title: string; desc: string }) {
  return (
    <>
      <SectionHeader title={title} desc={desc} />
      <div className="text-sm text-muted-foreground bg-muted rounded-2xl p-8 text-center">Coming soon.</div>
    </>
  );
}

function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-start gap-4 p-4 border border-border rounded-2xl hover:bg-muted/60 transition-colors text-left"
    >
      <div className="flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground mt-1">{desc}</div>
      </div>
      <div className={cn("w-10 h-6 rounded-full p-0.5 transition-colors shrink-0 mt-0.5", value ? "bg-primary" : "bg-muted-foreground/30")}>
        <div className={cn("size-5 rounded-full bg-card shadow-soft transition-transform", value && "translate-x-4")} />
      </div>
    </button>
  );
}
