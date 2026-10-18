import { enforceRateLimit, openAiRateLimiter } from './openai/rate-limit.js';
import { readRequestBody } from './common/request.js';
import { toFunctionTools } from '../../src/tools/functions.js';
import {
  CLIMATE_TOOLS,
  runClimateTool,
} from '../../src/tools/queries/climate.js';
import { check } from '../../src/intelligence/grounding.js';

const MODEL_DEFAULT = 'gpt-5-mini';
const MAX_TOOL_ROUNDS = 4;
const MAX_QUESTION_CHARS = 500;
const LANG_NAMES = { en: 'English', ur: 'Urdu' };
const TOOLS = toFunctionTools(CLIMATE_TOOLS);
const NO_DATA_ANSWER = {
  en: 'No computed values are available for that question. Ask about risk in a monitored area or cell.',
  ur: 'اس سوال کے لیے کوئی حساب شدہ ڈیٹا دستیاب نہیں۔ کسی نگرانی والے علاقے یا خانے کے خطرے کے بارے میں پوچھیں۔',
};

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function instructionsFor(lang) {
  return (
    'You are the Agaahi climate risk copilot. Answer only from tool results. ' +
    'Never estimate, extrapolate or re-round a number. If a value is null say ' +
    '"no data". If the question cannot be answered from the tools, say so ' +
    'and do not guess or predict. Name the source dataset. Be brief. ' +
    `Answer in ${LANG_NAMES[lang]}.`
  );
}

function extractText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim())
    return data.output_text.trim();
  if (!Array.isArray(data?.output)) return '';
  return data.output
    .flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
    .map((part) => part?.text || part?.output_text || '')
    .join(' ')
    .trim();
}

function parseRequest(body) {
  let parsed;
  try {
    parsed = JSON.parse(body || '{}');
  } catch {
    return null;
  }
  const question =
    typeof parsed?.question === 'string' ? parsed.question.trim() : '';
  if (!question || [...question].length > MAX_QUESTION_CHARS) return null;
  const lang = parsed.lang === 'ur' ? 'ur' : 'en';
  const aoi =
    typeof parsed.aoi === 'string' && /^[a-z0-9_]{1,40}$/.test(parsed.aoi)
      ? parsed.aoi
      : null;
  const cellId =
    typeof parsed.cellId === 'string' &&
    /^[a-z0-9_]{1,40}:[0-9]{1,5}:[0-9]{1,5}$/.test(parsed.cellId)
      ? parsed.cellId
      : null;
  return { question, lang, aoi, cellId };
}

function userInput({ question, aoi, cellId }) {
  const context = [
    aoi && `Selected area: ${aoi}.`,
    cellId && `Selected cell: ${cellId}.`,
  ]
    .filter(Boolean)
    .join(' ');
  return context ? `${context}\n\n${question}` : question;
}

async function callModel(apiKey, lang, input, toolChoice) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_AGAHI_MODEL || MODEL_DEFAULT,
      instructions: instructionsFor(lang),
      input,
      tools: TOOLS,
      tool_choice: toolChoice,
      reasoning: { effort: 'minimal' },
      max_output_tokens: 1500,
    }),
  });
  if (!response.ok) {
    console.warn(`[agahi-copilot] upstream HTTP ${response.status}`);
    throw new Error('upstream failed');
  }
  return response.json();
}

async function runCall(item) {
  let args;
  try {
    args = JSON.parse(item.arguments || '{}');
  } catch {
    return {
      ok: false,
      tool: item.name,
      args: {},
      error: 'Arguments were not valid JSON',
    };
  }
  try {
    const result = await runClimateTool(item.name, args);
    const data = { ...result.data };
    delete data.view;
    return { ok: true, tool: item.name, summary: result.summary, data, args };
  } catch (error) {
    return {
      ok: false,
      tool: item.name,
      args,
      error:
        error?.name === 'ToolError' ? error.message : 'The tool failed',
    };
  }
}

function groundingInput(results) {
  return results.map(({ summary, data }) => ({ summary, data }));
}

function deterministicAnswer(results, lang) {
  const last = [...results].reverse().find((item) => item.ok);
  return last ? last.summary : NO_DATA_ANSWER[lang];
}

async function handleAgahiCopilot(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendJson(res, 503, { error: 'OPENAI_API_KEY not set' });
    return;
  }

  if (!enforceRateLimit(openAiRateLimiter(), req, res)) return;

  let request;
  try {
    request = parseRequest(await readRequestBody(req, 16 * 1024));
  } catch {
    sendJson(res, 413, { error: 'Request body too large' });
    return;
  }
  if (!request) {
    sendJson(res, 400, { error: 'Invalid request' });
    return;
  }

  try {
    const input = [{ role: 'user', content: userInput(request) }];
    const results = [];
    let answer = '';
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
      const data = await callModel(
        apiKey,
        request.lang,
        input,
        round === MAX_TOOL_ROUNDS ? 'none' : 'auto',
      );
      const calls = (data.output || []).filter(
        (item) => item.type === 'function_call',
      );
      if (!calls.length) {
        answer = extractText(data);
        break;
      }
      input.push(...data.output);
      for (const call of calls) {
        const result = await runCall(call);
        results.push(result);
        input.push({
          type: 'function_call_output',
          call_id: call.call_id,
          output: JSON.stringify(result),
        });
      }
    }

    const grounded =
      Boolean(answer) && check(answer, groundingInput(results)).ok;
    sendJson(res, 200, {
      answer: grounded ? answer : deterministicAnswer(results, request.lang),
      grounded,
      calls: results.map(({ tool, args }) => ({ tool, args })),
      ...(grounded ? {} : { fallback: 'deterministic' }),
    });
  } catch {
    console.warn('[agahi-copilot] request failed');
    sendJson(res, 502, { error: 'Copilot request failed' });
  }
}

export { handleAgahiCopilot };
