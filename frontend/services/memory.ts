// Simple in-memory LeadFacts + last N turns abstraction for local/client usage.
// In production, the backend owns persistence and PII handling. No secrets here.

type Turn = { sender: "customer" | "agent"; message: string; ts?: number };

type LeadContext = {
  leadFacts: Record<string, any>;
  turns: Turn[];
  style?: Record<string, any>;
};

const STORE = new Map<string, LeadContext>();

export async function getConversationContext(leadId: string, lastN: number): Promise<LeadContext> {
  const ctx = STORE.get(leadId) || { leadFacts: {}, turns: [], style: {} };
  const cloned: LeadContext = {
    leadFacts: { ...ctx.leadFacts },
    turns: ctx.turns.slice(-lastN),
    style: { ...(ctx.style || {}) },
  };
  return cloned;
}

export async function setLeadFacts(leadId: string, facts: Record<string, any>): Promise<void> {
  const ctx = STORE.get(leadId) || { leadFacts: {}, turns: [], style: {} };
  ctx.leadFacts = { ...ctx.leadFacts, ...facts };
  STORE.set(leadId, ctx);
}

export async function persistTurn(leadId: string, turn: Turn): Promise<void> {
  const ctx = STORE.get(leadId) || { leadFacts: {}, turns: [], style: {} };
  ctx.turns.push({ ...turn, ts: Date.now() });
  STORE.set(leadId, ctx);
}

// Minimal fact retriever stub. In production, call backend for inventory/policies.
export async function retrieveFactsForIntent(intent: string, text: string, ctx: LeadContext) {
  const t = (text || "").toLowerCase();
  if (intent === "availability" || /\b(civic|camry|rav4|pilot|highlander)\b/.test(t)) {
    return { inventoryHint: "matching vehicles exist" };
  }
  if (intent === "details") {
    return { detailFields: ["mileage", "color", "features"] };
  }
  return {};
}


