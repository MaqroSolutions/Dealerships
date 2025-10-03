// Regex-based intent classifier and hard handoff rules

export type Intent =
  | "greeting"
  | "availability"
  | "details" // mileage/color/features
  | "pricing"
  | "financing"
  | "trade_in"
  | "legal"
  | "schedule_test_drive"
  | "post_appointment"
  | "out_of_scope"
  | "generic";

export function classifyIntent(text: string): Intent {
  const t = (text || "").toLowerCase().trim();
  if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(t)) return "greeting";
  if (/(do you have|in stock|available|still available|have any)\b/.test(t)) return "availability";
  if (/(mileage|color|features|year|trim)\b/.test(t)) return "details";
  if (/(price|out the door|best price|total cost|final price|negotiate)\b/.test(t)) return "pricing";
  if (/(finance|financing|apr|interest rate|monthly payment|lease)\b/.test(t)) return "financing";
  if (/(trade[- ]?in|appraisal|what's my car worth|trade value)\b/.test(t)) return "trade_in";
  if (/(legal|contract|policy|policies|warranty terms?)\b/.test(t)) return "legal";
  if (/(test drive|schedule|book|come in)\b/.test(t)) return "schedule_test_drive";
  if (/(see you at|appointment booked|scheduled for)\b/.test(t)) return "post_appointment";
  if (/(motorcycle|bike|bikes)\b/.test(t)) return "out_of_scope";
  return "generic";
}

export function shouldHandoff(intent: Intent, ctx: any): { should: boolean; reason?: string; note?: string } {
  // Hard triggers per requirements
  if (intent === "financing") return { should: true, reason: "financing" };
  if (intent === "trade_in") return { should: true, reason: "trade_in" };
  if (intent === "pricing") return { should: true, reason: "pricing" };
  if (intent === "legal") return { should: true, reason: "legal" };
  if (intent === "out_of_scope") return { should: true, reason: "out_of_scope" };
  if (intent === "post_appointment") return { should: true, reason: "appointment_scheduled" };
  return { should: false };
}


