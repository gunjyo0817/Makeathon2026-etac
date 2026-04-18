export type Temperature = "hot" | "warm" | "cold";
export type LeadStatus =
  | "new"
  | "contacted"
  | "responded"
  | "qualified"
  | "meeting"
  | "closed";

export type MeetingType = "demo" | "follow-up" | "intro";
export type Channel = "email" | "sms" | "phone";

export interface Project {
  id: string;
  name: string;
  description: string;
  leadCount: number;
  color: string; // tailwind text-color token
}

export interface Message {
  id: string;
  sender: "agent" | "customer";
  senderName: string;
  channel: Channel;
  text: string;
  timestamp: string; // ISO
}

export interface Meeting {
  id: string;
  leadId: string;
  customerName: string;
  company: string;
  type: MeetingType;
  start: string; // ISO
  durationMin: number;
}

export interface AgentAction {
  id: string;
  title: string;
  reason: string;
  scheduledFor: string; // ISO
  priority: "high" | "medium" | "low";
}

export interface Lead {
  id: string;
  projectId: string;
  name: string;
  role: string;
  company: string;
  email: string;
  status: LeadStatus;
  temperature: Temperature;
  lastInteractionAt: string; // ISO
  intentScore: number; // 0-100
  budget: string;
  urgency: "Low" | "Medium" | "High";
  interestLevel: "Low" | "Medium" | "High";
  agentPaused: boolean;
  currentChannel: Channel;
  availableChannels: Channel[];
  messages: Message[];
  actions: AgentAction[];
  meetings: Meeting[];
}

export const STATUS_COLUMNS: { id: LeadStatus; label: string }[] = [
  { id: "new", label: "New Lead" },
  { id: "contacted", label: "Contacted" },
  { id: "responded", label: "Responded" },
  { id: "qualified", label: "Qualified" },
  { id: "meeting", label: "Meeting Scheduled" },
  { id: "closed", label: "Closed" },
];

export const projects: Project[] = [
  { id: "p1", name: "AI SDR for SaaS", description: "Outbound to mid-market B2B SaaS", leadCount: 18, color: "text-primary" },
  { id: "p2", name: "Enterprise Outreach", description: "Fortune 1000 strategic accounts", leadCount: 9, color: "text-info" },
  { id: "p3", name: "Inbound Demo Requests", description: "Website demo form responses", leadCount: 12, color: "text-success" },
];

const now = new Date();
const iso = (offsetMin: number) => new Date(now.getTime() + offsetMin * 60_000).toISOString();
const isoDay = (offsetDay: number, hour = 10, minute = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + offsetDay);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const DEFAULT_CHANNELS: Channel[] = ["sms", "email", "phone"];

const getLastMessageChannel = (messages: Message[] | undefined) => {
  if (!messages || messages.length === 0) return "email" as Channel;
  return messages[messages.length - 1].channel;
};

const make = (l: Partial<Lead> & Pick<Lead, "id" | "projectId" | "name" | "role" | "company" | "status" | "temperature">): Lead => ({
  email: `${l.name!.split(" ")[0].toLowerCase()}@${l.company!.toLowerCase().replace(/\s+/g, "")}.com`,
  lastInteractionAt: iso(-Math.floor(Math.random() * 600) - 30),
  intentScore: 50 + Math.floor(Math.random() * 50),
  budget: "$25k–$60k ARR",
  urgency: "Medium",
  interestLevel: "Medium",
  agentPaused: false,
  currentChannel: l.currentChannel ?? getLastMessageChannel(l.messages),
  availableChannels: DEFAULT_CHANNELS,
  messages: [],
  actions: [],
  meetings: [],
  ...l,
} as Lead);

export const leads: Lead[] = [
  make({
    id: "l1", projectId: "p1", name: "Sarah Chen", role: "VP of Sales", company: "Meridian Logistics",
    status: "responded", temperature: "hot", intentScore: 87, budget: "$80k–$120k ARR",
    urgency: "High", interestLevel: "High",
    lastInteractionAt: iso(-23),
    currentChannel: "sms",
    messages: [
      { id: "m1", sender: "agent", senderName: "Aura AI", channel: "email", text: "Hi Sarah — I noticed Meridian recently expanded into the Pacific Northwest. We help logistics teams reduce dispatch overhead by 30%. Worth a quick chat?", timestamp: iso(-2880) },
      { id: "m2", sender: "customer", senderName: "Sarah Chen", channel: "email", text: "Hey — interesting timing. We're actually evaluating tools right now. Can you share more about how it integrates with our existing TMS?", timestamp: iso(-2700) },
      { id: "m3", sender: "agent", senderName: "Aura AI", channel: "phone", text: "Quick call recap: MercuryGate is fully supported and onboarding is usually 2–3 weeks.", timestamp: iso(-220) },
      { id: "m4", sender: "customer", senderName: "Sarah Chen", channel: "sms", text: "We use MercuryGate. Also — what's the typical onboarding timeline?", timestamp: iso(-180) },
      { id: "m5", sender: "agent", senderName: "Aura AI", channel: "sms", text: "MercuryGate is fully supported. I can send a few times for a 20-min walkthrough — does Thursday or Friday afternoon work?", timestamp: iso(-23) },
    ],
    actions: [
      { id: "a1", title: "Send meeting link with 3 time slots", reason: "Lead replied positively but has not chosen a meeting slot yet.", scheduledFor: iso(60), priority: "high" },
      { id: "a2", title: "Share MercuryGate integration one-pager", reason: "Customer asked specifically about TMS integration.", scheduledFor: iso(120), priority: "medium" },
    ],
    meetings: [],
  }),
  make({
    id: "l2", projectId: "p1", name: "Marcus Webb", role: "Head of Revenue Ops", company: "Kinetics Copilot",
    status: "qualified", temperature: "hot", intentScore: 92, budget: "$45k–$60k ARR",
    urgency: "High", interestLevel: "High",
    lastInteractionAt: iso(-90),
    currentChannel: "phone",
    messages: [
      { id: "m1", sender: "agent", senderName: "Aura AI", channel: "email", text: "Marcus — saw your team is hiring 5 SDRs. Curious if you've considered AI-assisted prospecting?", timestamp: iso(-4320) },
      { id: "m2", sender: "customer", senderName: "Marcus Webb", channel: "email", text: "Yes, evaluating now. Send me a deck.", timestamp: iso(-4000) },
      { id: "m3", sender: "agent", senderName: "Aura AI", channel: "phone", text: "Call summary: deck sent, solutions architect looped in, and Thursday afternoon works for the demo.", timestamp: iso(-90) },
    ],
    actions: [
      { id: "a1", title: "Confirm pricing tier with sales lead", reason: "Lead requested enterprise pricing — needs human approval.", scheduledFor: iso(30), priority: "high" },
    ],
    meetings: [
      { id: "mt1", leadId: "l2", customerName: "Marcus Webb", company: "Kinetics Copilot", type: "demo", start: isoDay(0, 14, 0), durationMin: 45 },
    ],
  }),
  make({
    id: "l3", projectId: "p1", name: "Elena Vasquez", role: "Director of Marketing", company: "Vesper Retail",
    status: "meeting", temperature: "hot", intentScore: 89, budget: "$120k+ ARR",
    urgency: "High", interestLevel: "High",
    lastInteractionAt: iso(-200),
    currentChannel: "sms",
    messages: [
      { id: "m1", sender: "agent", senderName: "Aura AI", channel: "email", text: "Elena — congrats on the Series C. Quick question: how is your team currently handling outbound to enterprise retail?", timestamp: iso(-7200) },
      { id: "m2", sender: "customer", senderName: "Elena Vasquez", channel: "email", text: "Manually, mostly. Open to a conversation.", timestamp: iso(-7000) },
      { id: "m3", sender: "agent", senderName: "Aura AI", channel: "sms", text: "Booked you in for Thursday at 10:30am with our CEO. Calendar invite sent.", timestamp: iso(-200) },
    ],
    actions: [
      { id: "a1", title: "Send pre-meeting brief to CEO", reason: "Important enterprise meeting — internal prep needed.", scheduledFor: iso(-30), priority: "high" },
    ],
    meetings: [
      { id: "mt2", leadId: "l3", customerName: "Elena Vasquez", company: "Vesper Retail", type: "demo", start: isoDay(0, 10, 30), durationMin: 60 },
    ],
  }),
  make({
    id: "l4", projectId: "p1", name: "James O'Connor", role: "CTO", company: "Nereus Bio",
    status: "contacted", temperature: "warm", intentScore: 64,
    lastInteractionAt: iso(-1440),
    currentChannel: "sms",
    messages: [
      { id: "m1", sender: "agent", senderName: "Aura AI", channel: "sms", text: "James — following up on your data infra post. Worth a 15-min chat this week?", timestamp: iso(-1440) },
    ],
    actions: [
      { id: "a1", title: "Follow up in 2 days", reason: "Initial outreach unanswered. Soft second touch recommended.", scheduledFor: iso(2880), priority: "medium" },
    ],
  }),
  make({
    id: "l5", projectId: "p1", name: "Priya Anand", role: "Head of Growth", company: "Aethelgard Dynamics",
    status: "new", temperature: "cold", intentScore: 38,
    lastInteractionAt: iso(-60),
    currentChannel: "email",
    actions: [
      { id: "a1", title: "Send first-touch personalized email", reason: "Lead just enriched. Initial sequence starts now.", scheduledFor: iso(15), priority: "medium" },
    ],
  }),
  make({
    id: "l6", projectId: "p1", name: "David Park", role: "RevOps Lead", company: "Solstice Energy",
    status: "qualified", temperature: "warm", intentScore: 71, budget: "$30k–$50k ARR",
    lastInteractionAt: iso(-320),
    currentChannel: "email",
    actions: [
      { id: "a1", title: "Ask about budget approval timeline", reason: "Stage is qualified but budget signal is missing.", scheduledFor: iso(180), priority: "medium" },
    ],
    meetings: [
      { id: "mt3", leadId: "l6", customerName: "David Park", company: "Solstice Energy", type: "follow-up", start: isoDay(1, 11, 0), durationMin: 30 },
    ],
  }),
  make({
    id: "l7", projectId: "p1", name: "Hannah Liu", role: "VP Product", company: "Oculus Freight",
    status: "responded", temperature: "warm", intentScore: 66,
    lastInteractionAt: iso(-440),
    currentChannel: "phone",
    actions: [
      { id: "a1", title: "Escalate to human sales rep", reason: "Customer asked complex security/compliance questions outside agent scope.", scheduledFor: iso(45), priority: "high" },
    ],
  }),
  make({
    id: "l8", projectId: "p1", name: "Tom Reyes", role: "COO", company: "Vanguard Logistics",
    status: "meeting", temperature: "warm", intentScore: 74,
    lastInteractionAt: iso(-720),
    currentChannel: "phone",
    meetings: [
      { id: "mt4", leadId: "l8", customerName: "Tom Reyes", company: "Vanguard Logistics", type: "intro", start: isoDay(0, 9, 30), durationMin: 30 },
    ],
  }),
  make({
    id: "l9", projectId: "p1", name: "Ingrid Larsen", role: "Head of Sales", company: "Northwind Trade",
    status: "closed", temperature: "warm", intentScore: 95,
    lastInteractionAt: iso(-4320),
    currentChannel: "email",
  }),
  make({
    id: "l10", projectId: "p1", name: "Rafael Ortiz", role: "Director of Ops", company: "Pinecrest Labs",
    status: "new", temperature: "cold", intentScore: 42,
    lastInteractionAt: iso(-30),
    currentChannel: "sms",
  }),
  make({
    id: "l11", projectId: "p1", name: "Yuki Tanaka", role: "Founder", company: "Lumen Studio",
    status: "contacted", temperature: "warm", intentScore: 58,
    lastInteractionAt: iso(-2200),
    currentChannel: "phone",
  }),
  make({
    id: "l12", projectId: "p2", name: "Margaret Holbrook", role: "SVP Procurement", company: "Brightline Industries",
    status: "qualified", temperature: "hot", intentScore: 84, budget: "$250k+ ARR",
    lastInteractionAt: iso(-150),
    currentChannel: "phone",
    meetings: [
      { id: "mt5", leadId: "l12", customerName: "Margaret Holbrook", company: "Brightline Industries", type: "demo", start: isoDay(2, 15, 0), durationMin: 60 },
    ],
  }),
  make({
    id: "l13", projectId: "p3", name: "Chris Bell", role: "Sales Manager", company: "Tidewater Co.",
    status: "responded", temperature: "hot", intentScore: 78,
    lastInteractionAt: iso(-50),
    currentChannel: "sms",
  }),
];

// Aggregate today's meetings for calendar
export const todaysMeetings: Meeting[] = leads
  .flatMap((l) => l.meetings)
  .sort((a, b) => a.start.localeCompare(b.start));

export const getLeadById = (id: string) => leads.find((l) => l.id === id);
export const getProjectById = (id: string) => projects.find((p) => p.id === id);

// Aggregate metrics
export const metrics = {
  activeLeads: leads.filter((l) => l.status !== "closed").length,
  qualifiedLeads: leads.filter((l) => l.status === "qualified" || l.status === "meeting").length,
  scheduledMeetings: leads.flatMap((l) => l.meetings).length,
  responseRate: 64,
};
