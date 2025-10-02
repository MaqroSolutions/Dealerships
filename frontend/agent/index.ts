// Orchestrator for Maqro agent message handling (pure logic - no secrets, no network calls)
// Responsibilities:
// - loadConversationContext(leadId)
// - classifyIntent(text)
// - shouldHandoff(intent, ctx)
// - retrieveFacts(intent, text, ctx)
// - generateReply({...}) -> returns prompt inputs (system + messages + few-shot anchors)
// - post-process reply: enforce <=1 question, vary openers, trim boilerplate
// - persistTurn(...), notifyAssignee if handoff (delegated to caller)

import { classifyIntent, shouldHandoff } from "../agent/intent";
import { systemPrompt, fewShotExamples, buildUserMessage } from "../agent/prompt";
import { postProcess, getOpener } from "../agent/style";
import { getConversationContext, persistTurn, retrieveFactsForIntent } from "../services/memory";

export type HandleMessageEvent = {
  leadId: string;
  text: string;
  dealershipName: string;
};

export type AgentAction =
  | { type: "reply"; text: string }
  | { type: "handoff"; reason: string; note?: string };

export async function handleMessage(evt: HandleMessageEvent): Promise<{
  action: AgentAction;
  promptPayload: {
    system: string;
    fewShots: Array<{ input: string; output: string }>;
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  };
  context: any;
}> {
  const ctx = await getConversationContext(evt.leadId, 12);

  const intent = classifyIntent(evt.text);
  const handoff = shouldHandoff(intent, ctx);

  // Retrieve facts conditionally (inventory/policies/slots) based on intent/text
  const facts = await retrieveFactsForIntent(intent, evt.text, ctx);

  // Compose prompt messages
  const opener = getOpener(ctx);
  const userMsg = buildUserMessage({
    opener,
    text: evt.text,
    facts,
    leadFacts: ctx.leadFacts,
    history: ctx.turns,
    dealershipName: evt.dealershipName,
  });

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt(evt.dealershipName) },
    { role: "user", content: userMsg },
  ];

  // The actual LLM call is performed by the backend. We only return payload here.
  // Caller will send to backend model and feed the response back for post-processing.

  const promptPayload = {
    system: systemPrompt(evt.dealershipName),
    fewShots: fewShotExamples,
    messages,
  };

  // Generate a provisional reply shape for callers that mock locally (optional)
  // Callers should replace with real model output.
  const provisional = postProcess(
    // Simple seed reply when mocking
    `${opener} I hear you about "${evt.text}". Let me check a couple of options that fit what you mentioned. What matters more right now—daily comfort or keeping the cost down?`,
    ctx
  );

  // Persist user turn; agent turn will be persisted by caller after sending
  await persistTurn(evt.leadId, { sender: "customer", message: evt.text });

  if (handoff.should) {
    return {
      action: { type: "handoff", reason: handoff.reason, note: handoff.note },
      promptPayload,
      context: { ...ctx, intent, facts },
    };
  }

  return {
    action: { type: "reply", text: provisional },
    promptPayload,
    context: { ...ctx, intent, facts },
  };
}


