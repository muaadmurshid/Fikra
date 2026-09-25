import "dotenv/config";

import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is not defined.");
}

export const openai = new OpenAI({
  apiKey,
});

export const OPENAI_MODEL =
  process.env.OPENAI_MODEL || "gpt-5.6-sol";