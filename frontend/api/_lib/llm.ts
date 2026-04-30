type LLMProvider = "openai" | "anthropic" | "gemini" | "deepseek";

type LLMMessage = { role: "system" | "user" | "assistant"; content: string };

type LLMResponse = {
  content: string;
  model: string;
  provider: LLMProvider;
};

const detectProvider = (): LLMProvider | null => {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.DEEPSEEK_API_KEY) return "deepseek";
  return null;
};

const callOpenAI = async (messages: LLMMessage[]): Promise<string> => {
  const key = process.env.OPENAI_API_KEY!;
  const url = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0].message.content;
};

const callAnthropic = async (messages: LLMMessage[]): Promise<string> => {
  const key = process.env.ANTHROPIC_API_KEY!;
  const url = process.env.ANTHROPIC_API_URL || "https://api.anthropic.com/v1/messages";
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";

  const systemMsg = messages.find((m) => m.role === "system");
  const userMsgs = messages.filter((m) => m.role !== "system");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: systemMsg?.content || "",
      messages: userMsgs.map((m) => ({ role: "user", content: m.content })),
      max_tokens: 4000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic error: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  return data.content.find((c) => c.type === "text")?.text || "";
};

const callGemini = async (messages: LLMMessage[]): Promise<string> => {
  const key = process.env.GEMINI_API_KEY!;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url =
    process.env.GEMINI_API_URL ||
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const systemMsg = messages.find((m) => m.role === "system");
  const userMsgs = messages.filter((m) => m.role !== "system");
  const prompt = [
    systemMsg ? `Instructions: ${systemMsg.content}\n\n` : "",
    ...userMsgs.map((m) => m.content),
  ].join("\n\n");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4000 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini error: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  return data.candidates[0]?.content?.parts[0]?.text || "";
};

const callDeepSeek = async (messages: LLMMessage[]): Promise<string> => {
  const key = process.env.DEEPSEEK_API_KEY!;
  const url = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1/chat/completions";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek error: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0].message.content;
};

const providers: Record<
  LLMProvider,
  (messages: LLMMessage[]) => Promise<string>
> = {
  openai: callOpenAI,
  anthropic: callAnthropic,
  gemini: callGemini,
  deepseek: callDeepSeek,
};

export const llmChat = async (messages: LLMMessage[]): Promise<LLMResponse> => {
  const provider = detectProvider();
  if (!provider) {
    throw new Error(
      "No LLM provider configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, or DEEPSEEK_API_KEY.",
    );
  }

  const content = await providers[provider](messages);

  const models: Record<LLMProvider, string> = {
    openai: process.env.OPENAI_MODEL || "gpt-4o-mini",
    anthropic: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
    gemini: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    deepseek: process.env.DEEPSEEK_MODEL || "deepseek-chat",
  };

  return { content, model: models[provider], provider };
};

export const isLLMAvailable = (): boolean => detectProvider() !== null;

export type { LLMMessage, LLMResponse, LLMProvider };
