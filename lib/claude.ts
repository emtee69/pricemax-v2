import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ProposalInput {
  projectType: string;
  clientIndustry: string;
  deliverables: string[];
  usageRights: string;
  turnaround: string;
  currentRate: number;
  additionalNotes?: string;
  title?: string;
}

const SYSTEM = `You are PriceMax — a pricing strategist for freelance video editors.
Generate a 3-tier proposal (Good/Better/Best) with psychological anchoring.
Good = stripped down. Better = irresistible (60-70% pick this). Best = aspirational anchor.
Price gaps: Good→Better = 70-90% jump. Better→Best = 40-50% jump.
Usage rights: organic=1x, paid ads=1.6x, broadcast=2.5x. Rush <72h adds 40%.
Return ONLY valid JSON, no markdown.`;

export async function generateProposal(input: ProposalInput) {
  const msg = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1800,
    system: SYSTEM,
    messages: [{
      role: "user",
      content: `Generate proposal for:
Project: ${input.projectType}
Industry: ${input.clientIndustry}
Deliverables: ${input.deliverables.join(", ")}
Usage: ${input.usageRights}
Turnaround: ${input.turnaround}
Base rate: $${input.currentRate}
Notes: ${input.additionalNotes || "None"}

Return this JSON:
{
  "tiers": {
    "good": {"name":"string","price":0,"deliverables":[],"tagline":"string","recommended":false},
    "better": {"name":"string","price":0,"deliverables":[],"tagline":"string","recommended":true},
    "best": {"name":"string","price":0,"deliverables":[],"tagline":"string","recommended":false}
  },
  "upsells": [{"name":"string","price":0,"description":"string"}],
  "scarcityBlock": "string",
  "urgencyLine": "string",
  "revenueLiftEstimate": {"conservative":0,"optimistic":0},
  "closingLine": "string",
  "subjectLine": "string"
}`
    }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}
