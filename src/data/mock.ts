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

export interface Product {
  id: string;
  createdAt: string;
  name: string;
  description: string;
  objective: string;
  price: number;
  texture: string;
  leadCount: number;
  color: string; // tailwind text-color token
}

export interface ProductAgentConfig {
  productId: string;
  persona: string;
  dataKnowledge: string;
  dailyMessageLimit: number;
  replyDelayMinutes: number;
  autoEngage: boolean;
  escalateComplex: boolean;
  aggressiveFollowUp: boolean;
}

export interface AgentProfile {
  id: string;
  productId: string;
  name: string;
  initials: string;
  role: string;
  status: "active" | "paused";
  description: string;
  conversations: number;
  meetings: number;
  qualRate: number;
  channels: string[];
  voice: string;
  personality: string;
  happyRobot: {
    phoneEnabled: boolean;
    apiBaseUrl: string;
    agentRef: string;
  };
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
  icon?: "phone";
  kind?: "follow_up" | "history";
}

export type AttentionReason = "no_response" | "objection_detected" | "needs_manual_review" | "scheduling_mismatch";

export interface ConversationAttentionItem {
  id: string;
  productId: string;
  leadId: string;
  customerName: string;
  company: string;
  reason: AttentionReason;
  summary: string;
  lastMessageAt: string; // ISO
}

export interface Lead {
  id: string;
  productId: string;
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
  { id: "meeting", label: "Trial scheduled" },
  { id: "closed", label: "Closed" },
];

export const products: Product[] = [
  {
    id: "p1",
    createdAt: "2026-01-12T09:30:00.000Z",
    name: "Linden Lounge Chair",
    description: "Low-slung accent chair with rounded arms and deep cushioning.",
    objective: "Designed for boutique hotel lounges, reading corners, and warm residential interiors.",
    price: 1299,
    texture: "Boucle fabric",
    leadCount: 18,
    color: "text-primary",
  },
  {
    id: "p2",
    createdAt: "2026-02-03T14:15:00.000Z",
    name: "Alder Dining Table",
    description: "Solid oak dining table with softened edges and a quiet architectural base.",
    objective: "Built for family dining rooms, hospitality suites, and refined shared spaces.",
    price: 2490,
    texture: "Natural oak grain",
    leadCount: 9,
    color: "text-info",
  },
  {
    id: "p3",
    createdAt: "2026-02-25T11:45:00.000Z",
    name: "Harbor Modular Sofa",
    description: "Flexible sectional sofa system with generous proportions and soft lines.",
    objective: "Intended for premium living rooms, lobbies, and open-plan gathering spaces.",
    price: 3890,
    texture: "Stonewashed linen blend",
    leadCount: 12,
    color: "text-success",
  },
];

export const productAgentConfigs: Record<string, ProductAgentConfig> = {
  p1: {
    productId: "p1",
    persona:
      "You are an outbound SDR for SaaS. Keep the tone consultative, ask sharp qualification questions, and tailor outreach by company growth signal and role seniority.",
    dataKnowledge:
      "Use firmographic enrichment, recent funding/news, website messaging, and previous thread context. Prioritize pains around pipeline coverage and SDR productivity.",
    dailyMessageLimit: 80,
    replyDelayMinutes: 15,
    autoEngage: true,
    escalateComplex: true,
    aggressiveFollowUp: false,
  },
  p2: {
    productId: "p2",
    persona:
      "You are an enterprise account development agent. Stay concise, executive-friendly, and de-risk conversations with credibility signals and concrete rollout plans.",
    dataKnowledge:
      "Use account hierarchy, procurement timeline, security requirements, and multi-stakeholder notes. Emphasize integration risk, compliance, and change management.",
    dailyMessageLimit: 45,
    replyDelayMinutes: 35,
    autoEngage: false,
    escalateComplex: true,
    aggressiveFollowUp: false,
  },
  p3: {
    productId: "p3",
    persona:
      "You are an inbound qualification specialist. Respond quickly, map use case fit, and optimize for fast demo booking while staying warm and direct.",
    dataKnowledge:
      "Use form fields, UTM/source channel, product page history, and prior support interactions. Prioritize urgency, expected timeline, and buying intent.",
    dailyMessageLimit: 120,
    replyDelayMinutes: 5,
    autoEngage: true,
    escalateComplex: true,
    aggressiveFollowUp: true,
  },
};

export const agents: AgentProfile[] = [
  {
    id: "a1",
    productId: "p1",
    name: "Aria",
    initials: "AR",
    role: "Outbound SDR",
    status: "active",
    description: "Cold outbound specialist for SaaS mid-market accounts.",
    conversations: 1284,
    meetings: 187,
    qualRate: 41,
    channels: ["Email", "SMS", "Phone"],
    voice: "Warm female, en-US",
    personality: "Friendly, consultative, persistent but never pushy.",
    happyRobot: {
      phoneEnabled: true,
      apiBaseUrl: "https://api.happyrobot.ai/v1",
      agentRef: "hr_saas_outbound_aria",
    },
  },
  {
    id: "a2",
    productId: "p2",
    name: "Echo",
    initials: "EC",
    role: "Enterprise Follow-up Specialist",
    status: "paused",
    description: "Handles long-cycle enterprise follow-ups and stakeholder sequencing.",
    conversations: 2104,
    meetings: 312,
    qualRate: 34,
    channels: ["Email", "SMS", "Phone"],
    voice: "Patient and polite enterprise tone",
    personality: "Patient, helpful, and methodical around compliance-heavy deals.",
    happyRobot: {
      phoneEnabled: true,
      apiBaseUrl: "https://api.happyrobot.ai/v1",
      agentRef: "hr_enterprise_echo",
    },
  },
  {
    id: "a3",
    productId: "p3",
    name: "Nova",
    initials: "NV",
    role: "Inbound Qualifier",
    status: "active",
    description: "Responds to inbound demo requests in under 30 seconds.",
    conversations: 932,
    meetings: 264,
    qualRate: 58,
    channels: ["Chat", "Email", "WhatsApp"],
    voice: "Quick text-first response style",
    personality: "Quick, sharp, asks great qualifying questions.",
    happyRobot: {
      phoneEnabled: false,
      apiBaseUrl: "https://api.happyrobot.ai/v1",
      agentRef: "hr_inbound_nova",
    },
  },
];

export const getAgentByProductId = (productId: string) =>
  agents.find((agent) => agent.productId === productId);

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

const make = (l: Partial<Lead> & Pick<Lead, "id" | "productId" | "name" | "role" | "company" | "status" | "temperature">): Lead => ({
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
    id: "l1", productId: "p1", name: "Sarah Chen", role: "VP of Sales", company: "Meridian Logistics",
    status: "responded", temperature: "hot", intentScore: 87, budget: "$80k–$120k ARR",
    urgency: "High", interestLevel: "High",
    lastInteractionAt: iso(-23),
    currentChannel: "sms",
    messages: [
      { id: "m1", sender: "agent", senderName: "Etac AI", channel: "email", text: "Hi Sarah — I noticed Meridian recently expanded into the Pacific Northwest. We help logistics teams reduce dispatch overhead by 30%. Worth a quick chat?", timestamp: iso(-2880) },
      { id: "m2", sender: "customer", senderName: "Sarah Chen", channel: "email", text: "Hey — interesting timing. We're actually evaluating tools right now. Can you share more about how it integrates with our existing TMS?", timestamp: iso(-2700) },
      { id: "m3", sender: "agent", senderName: "Etac AI", channel: "phone", text: "Quick call recap: MercuryGate is fully supported and onboarding is usually 2–3 weeks.", timestamp: iso(-220) },
      { id: "m4", sender: "customer", senderName: "Sarah Chen", channel: "sms", text: "We use MercuryGate. Also — what's the typical onboarding timeline?", timestamp: iso(-180) },
      { id: "m5", sender: "agent", senderName: "Etac AI", channel: "sms", text: "MercuryGate is fully supported. I can send a few times for a 20-min walkthrough — does Thursday or Friday afternoon work?", timestamp: iso(-23) },
    ],
    actions: [
      { id: "a1", title: "Send meeting link with 3 time slots", reason: "Lead replied positively but has not chosen a meeting slot yet.", scheduledFor: iso(60), priority: "high" },
      { id: "a2", title: "Share MercuryGate integration one-pager", reason: "Customer asked specifically about TMS integration.", scheduledFor: iso(120), priority: "medium" },
    ],
    meetings: [],
  }),
  make({
    id: "l2", productId: "p1", name: "Marcus Webb", role: "Head of Revenue Ops", company: "Kinetics Copilot",
    status: "qualified", temperature: "hot", intentScore: 92, budget: "$45k–$60k ARR",
    urgency: "High", interestLevel: "High",
    lastInteractionAt: iso(-90),
    currentChannel: "phone",
    messages: [
      { id: "m1", sender: "agent", senderName: "Etac AI", channel: "email", text: "Marcus — saw your team is hiring 5 SDRs. Curious if you've considered AI-assisted prospecting?", timestamp: iso(-4320) },
      { id: "m2", sender: "customer", senderName: "Marcus Webb", channel: "email", text: "Yes, evaluating now. Send me a deck.", timestamp: iso(-4000) },
      { id: "m3", sender: "agent", senderName: "Etac AI", channel: "phone", text: "Call summary: deck sent, solutions architect looped in, and Thursday afternoon works for the demo.", timestamp: iso(-90) },
    ],
    actions: [
      { id: "a1", title: "Confirm pricing tier with sales lead", reason: "Lead requested enterprise pricing — needs human approval.", scheduledFor: iso(30), priority: "high" },
    ],
    meetings: [
      { id: "mt1", leadId: "l2", customerName: "Marcus Webb", company: "Kinetics Copilot", type: "demo", start: isoDay(0, 14, 0), durationMin: 45 },
    ],
  }),
  make({
    id: "l3", productId: "p1", name: "Elena Vasquez", role: "Director of Marketing", company: "Vesper Retail",
    status: "meeting", temperature: "hot", intentScore: 89, budget: "$120k+ ARR",
    urgency: "High", interestLevel: "High",
    lastInteractionAt: iso(-200),
    currentChannel: "sms",
    messages: [
      { id: "m1", sender: "agent", senderName: "Etac AI", channel: "email", text: "Elena — congrats on the Series C. Quick question: how is your team currently handling outbound to enterprise retail?", timestamp: iso(-7200) },
      { id: "m2", sender: "customer", senderName: "Elena Vasquez", channel: "email", text: "Manually, mostly. Open to a conversation.", timestamp: iso(-7000) },
      { id: "m3", sender: "agent", senderName: "Etac AI", channel: "sms", text: "Booked you in for Thursday at 10:30am with our CEO. Calendar invite sent.", timestamp: iso(-200) },
    ],
    actions: [
      { id: "a1", title: "Send pre-meeting brief to CEO", reason: "Important enterprise meeting — internal prep needed.", scheduledFor: iso(-30), priority: "high" },
    ],
    meetings: [
      { id: "mt2", leadId: "l3", customerName: "Elena Vasquez", company: "Vesper Retail", type: "demo", start: isoDay(0, 10, 30), durationMin: 60 },
    ],
  }),
  make({
    id: "l4", productId: "p1", name: "James O'Connor", role: "CTO", company: "Nereus Bio",
    status: "contacted", temperature: "warm", intentScore: 64,
    lastInteractionAt: iso(-1440),
    currentChannel: "sms",
    messages: [
      { id: "m1", sender: "agent", senderName: "Etac AI", channel: "sms", text: "James — following up on your data infra post. Worth a 15-min chat this week?", timestamp: iso(-1440) },
    ],
    actions: [
      { id: "a1", title: "Follow up in 2 days", reason: "Initial outreach unanswered. Soft second touch recommended.", scheduledFor: iso(2880), priority: "medium" },
    ],
  }),
  make({
    id: "l5", productId: "p1", name: "Priya Anand", role: "Head of Growth", company: "Aethelgard Dynamics",
    status: "new", temperature: "cold", intentScore: 38,
    lastInteractionAt: iso(-60),
    currentChannel: "email",
    actions: [
      { id: "a1", title: "Send first-touch personalized email", reason: "Lead just enriched. Initial sequence starts now.", scheduledFor: iso(15), priority: "medium" },
    ],
  }),
  make({
    id: "l6", productId: "p1", name: "David Park", role: "RevOps Lead", company: "Solstice Energy",
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
    id: "l7", productId: "p1", name: "Hannah Liu", role: "VP Product", company: "Oculus Freight",
    status: "responded", temperature: "warm", intentScore: 66,
    lastInteractionAt: iso(-440),
    currentChannel: "phone",
    actions: [
      { id: "a1", title: "Escalate to human sales rep", reason: "Customer asked complex security/compliance questions outside agent scope.", scheduledFor: iso(45), priority: "high" },
    ],
  }),
  make({
    id: "l8", productId: "p1", name: "Tom Reyes", role: "COO", company: "Vanguard Logistics",
    status: "meeting", temperature: "warm", intentScore: 74,
    lastInteractionAt: iso(-720),
    currentChannel: "phone",
    meetings: [
      { id: "mt4", leadId: "l8", customerName: "Tom Reyes", company: "Vanguard Logistics", type: "intro", start: isoDay(0, 9, 30), durationMin: 30 },
    ],
  }),
  make({
    id: "l9", productId: "p1", name: "Ingrid Larsen", role: "Head of Sales", company: "Northwind Trade",
    status: "closed", temperature: "warm", intentScore: 95,
    lastInteractionAt: iso(-4320),
    currentChannel: "email",
  }),
  make({
    id: "l10", productId: "p1", name: "Rafael Ortiz", role: "Director of Ops", company: "Pinecrest Labs",
    status: "new", temperature: "cold", intentScore: 42,
    lastInteractionAt: iso(-30),
    currentChannel: "sms",
  }),
  make({
    id: "l11", productId: "p1", name: "Yuki Tanaka", role: "Founder", company: "Lumen Studio",
    status: "contacted", temperature: "warm", intentScore: 58,
    lastInteractionAt: iso(-2200),
    currentChannel: "phone",
  }),
  make({
    id: "l12", productId: "p2", name: "Margaret Holbrook", role: "SVP Procurement", company: "Brightline Industries",
    status: "qualified", temperature: "hot", intentScore: 84, budget: "$250k+ ARR",
    lastInteractionAt: iso(-150),
    currentChannel: "phone",
    meetings: [
      { id: "mt5", leadId: "l12", customerName: "Margaret Holbrook", company: "Brightline Industries", type: "demo", start: isoDay(2, 15, 0), durationMin: 60 },
    ],
  }),
  make({
    id: "l13", productId: "p3", name: "Chris Bell", role: "Sales Manager", company: "Tidewater Co.",
    status: "responded", temperature: "hot", intentScore: 78,
    lastInteractionAt: iso(-50),
    currentChannel: "sms",
  }),
];

export const conversationsNeedingAttention: ConversationAttentionItem[] = [
  {
    id: "attn_1",
    productId: "p1",
    leadId: "l4",
    customerName: "James O'Connor",
    company: "Nereus Bio",
    reason: "no_response",
    summary: "No reply after first outreach for 48 hours. Next touch likely needs a channel switch.",
    lastMessageAt: iso(-2880),
  },
  {
    id: "attn_2",
    productId: "p1",
    leadId: "l7",
    customerName: "Hannah Liu",
    company: "Oculus Freight",
    reason: "objection_detected",
    summary: "Security and compliance objections detected. Customer asked for SOC2 and data retention details.",
    lastMessageAt: iso(-440),
  },
  {
    id: "attn_3",
    productId: "p2",
    leadId: "l12",
    customerName: "Margaret Holbrook",
    company: "Brightline Industries",
    reason: "needs_manual_review",
    summary: "Enterprise pricing terms requested with legal redline language. Human review required.",
    lastMessageAt: iso(-200),
  },
  {
    id: "attn_4",
    productId: "p1",
    leadId: "l1",
    customerName: "Sarah Chen",
    company: "Meridian Logistics",
    reason: "scheduling_mismatch",
    summary: "Lead asked for available slots, but none match their preferred time windows today.",
    lastMessageAt: iso(-23),
  },
  {
    id: "attn_5",
    productId: "p3",
    leadId: "l13",
    customerName: "Chris Bell",
    company: "Tidewater Co.",
    reason: "scheduling_mismatch",
    summary: "Lead is open to book, but the proposed sales availability does not fit their schedule.",
    lastMessageAt: iso(-50),
  },
];

// Aggregate today's meetings for calendar
export const todaysMeetings: Meeting[] = leads
  .flatMap((l) => l.meetings)
  .sort((a, b) => a.start.localeCompare(b.start));

export const getLeadById = (id: string) => leads.find((l) => l.id === id);
export const getProductById = (id: string) => products.find((p) => p.id === id);
// Aggregate metrics
export const metrics = {
  activeLeads: leads.filter((l) => l.status !== "closed").length,
  qualifiedLeads: leads.filter((l) => l.status === "qualified" || l.status === "meeting").length,
  scheduledMeetings: leads.flatMap((l) => l.meetings).length,
  responseRate: 64,
};
