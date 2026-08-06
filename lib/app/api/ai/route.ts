import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { question, context } = await req.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        answer:
          "Demo mode: add OPENAI_API_KEY in your deployment environment to activate the trading tutor. " +
          "A good break-and-retest setup normally requires a decisive close beyond a meaningful level, " +
          "a controlled return to that level, and clear confirmation that it is holding or rejecting."
      });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      input: [
        {
          role: "system",
          content:
            "You are a cautious futures education tutor. Explain price action, break-and-retest setups, " +
            "risk management, and chart-reading concepts. Never promise profits, never give personalized " +
            "financial advice, and clearly separate educational examples from live trade recommendations."
        },
        {
          role: "user",
          content: `Chart context: ${context || "none"}\n\nQuestion: ${question}`
        }
      ]
    });

    return NextResponse.json({ answer: response.output_text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "The AI tutor could not respond." }, { status: 500 });
  }
}
