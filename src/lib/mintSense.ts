/**
 * MintSense AI — Natural language expense parser
 * Uses the Groq API (llama3-70b) to extract structured data from plain text.
 */

import type { SplitMode, ExpenseWithSplits, GroupMember } from '../types';

/** The raw shape returned by Claude */
export interface ParsedExpense {
  description: string;
  amount: number;
  /** Name string (e.g. "Rahul") — caller maps to member ID */
  paidBy: string;
  /** Name strings of all participants */
  participants: string[];
  splitMode: SplitMode;
  /** For 'exact' or 'percentage' splits — name → value */
  splits?: Record<string, number>;
}

const SYSTEM_PROMPT = `You are an expense parser. Extract structured data from natural language expense descriptions.
Return ONLY valid JSON with this shape:
{ "description": string, "amount": number, "paidBy": string, "participants": string[], "splitMode": "equal" | "exact" | "percentage", "splits": Record<string, number> | undefined }
Rules:
- "paidBy" is a single name string of who paid.
- "participants" includes everyone sharing the expense (including the payer).
- For equal splits, omit "splits" entirely.
- For exact splits, "splits" maps each participant name to their exact rupee/dollar amount.
- For percentage splits, "splits" maps each participant name to their percentage (e.g. 60, 40).
- The sum of splits must equal the total amount (for exact) or 100 (for percentage).
Do not return any explanation, markdown, or code fences. Only the raw JSON object.`;

/**
 * Calls the Groq API and returns a parsed expense object.
 * @throws If the API call fails or the response cannot be parsed as JSON.
 */
export async function parseExpenseNL(text: string): Promise<ParsedExpense> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string;

  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    throw new Error('VITE_GROQ_API_KEY is not configured in your .env file.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text }
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content ?? '';

  // Strip any accidental markdown code fences
  const clean = raw.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();

  let parsed: ParsedExpense;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error('Groq returned invalid JSON. Try rephrasing your input.');
  }

  // Basic sanity checks
  if (typeof parsed.amount !== 'number' || parsed.amount <= 0) {
    throw new Error('Could not extract a valid amount from the description.');
  }
  if (!parsed.paidBy || !Array.isArray(parsed.participants)) {
    throw new Error('Could not identify payer or participants from the description.');
  }

  return parsed;
}

const SUMMARY_PROMPT = `You are a fun, casual financial assistant analyzing a group trip or shared tab. 
Your job is to read the expense history and net balances, and write a snappy 2-3 sentence summary.
Highlight the biggest purchase, the total spending vibe, and briefly mention who the heavy spender is or who owes the most setup.
Rules:
- STRICTLY kept to 2-3 short sentences.
- Completely conversational (no bullet points, no code).
- Use basic markdown bolding to highlight numbers or names if you want.
- Be positive and upbeat.`;

/**
 * Summarizes the group spending history via Groq AI
 */
export async function summarizeHistoryNL(
  expenses: ExpenseWithSplits[], 
  members: GroupMember[], 
  netBalances: Record<string, number>
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string;

  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    throw new Error('VITE_GROQ_API_KEY is not configured in your .env file.');
  }

  const memberMap = Object.fromEntries(members.map(m => [m.id, m.nickname || 'Unknown']));
  
  const realExpenses = expenses.filter(e => e.description !== 'Settled Debt');
  if (realExpenses.length === 0) return "No actual expenses to summarize yet!";

  const expenseStrings = realExpenses.map(e => 
    `- ${memberMap[e.paid_by]} paid $${e.amount} for "${e.description}" on ${e.date}`
  );

  const balanceStrings = Object.entries(netBalances).map(([id, bal]) => {
    const name = memberMap[id];
    if (!name) return '';
    if (bal > 0.01) return `${name} is owed $${bal.toFixed(2)}`;
    if (bal < -0.01) return `${name} owes $${Math.abs(bal).toFixed(2)}`;
    return `${name} is perfectly settled up`;
  }).filter(Boolean);

  const contextStr = `Here is the data:\n\nSpend History:\n${expenseStrings.join('\n')}\n\nCurrent Balances:\n${balanceStrings.join('\n')}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 150,
      messages: [
        { role: 'system', content: SUMMARY_PROMPT },
        { role: 'user', content: contextStr }
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Groq error:", text);
    throw new Error('AI summary generation failed.');
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content || 'Failed to generate summary.';
}

/**
 * Fuzzy-match a name string against group member nicknames.
 * Returns the member ID on match, or undefined.
 */
export function matchMemberByName(
  name: string,
  members: { id: string; nickname: string | null }[]
): string | undefined {
  const lower = name.toLowerCase().trim();
  // Exact match first
  const exact = members.find(m => m.nickname?.toLowerCase() === lower);
  if (exact) return exact.id;
  // Partial / starts-with match
  const partial = members.find(m => m.nickname?.toLowerCase().startsWith(lower) || lower.startsWith(m.nickname?.toLowerCase() ?? '___'));
  return partial?.id;
}
