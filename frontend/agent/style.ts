// Style helpers: opener rotation and post-processing to enforce one-question rule

const openers = [
  "Thanks for reaching out.",
  "Appreciate the message.",
  "Got your note.",
  "Happy to help.",
  "Good to hear from you.",
];

export function getOpener(ctx: any): string {
  const lastIdx: number = (ctx?.style?.lastOpenerIdx ?? -1) as number;
  const nextIdx = (lastIdx + 1) % openers.length;
  // store nextIdx on ctx if caller persists
  if (!ctx.style) ctx.style = {};
  ctx.style.lastOpenerIdx = nextIdx;
  return openers[nextIdx];
}

export function postProcess(reply: string, _ctx: any): string {
  let text = (reply || "").trim();
  // Enforce one-question rule: keep only the first question mark
  const firstQ = text.indexOf("?");
  if (firstQ >= 0) {
    // remove subsequent questions
    const head = text.slice(0, firstQ + 1);
    const tail = text.slice(firstQ + 1).replace(/\?/g, ".");
    text = head + tail;
  }
  // Limit sentences to 2-4, but allow 1 for short replies
  const sentences = text.split(/([.!?])\s+/).reduce<string[]>((acc, cur, i, arr) => {
    if (i % 2 === 0) {
      const punct = arr[i + 1] || ".";
      acc.push((cur + punct).trim());
    }
    return acc;
  }, []);
  const limit = Math.min(Math.max(sentences.length, 1), 4);
  text = sentences.slice(0, limit).join(" ");
  // Trim boilerplate duplicates
  text = text.replace(/\b(I'd love to help|I'm happy to help)\b/gi, "Happy to help");
  return text;
}


