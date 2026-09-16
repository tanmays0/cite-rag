import {
  REFUSAL_MESSAGE,
  applyGroundingGate,
  buildCitedSystemPrompt,
} from "@cite-rag/rag";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { conversations, messageCitations, messages } from "@/db/schema";
import {
  chatRateLimit,
  rateLimitHeaders,
  takeToken,
} from "@/lib/rate-limit";
import { retrieveTopK, retrievalThreshold } from "@/lib/retrieve";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = chatRateLimit();
  const rl = takeToken(`chat:${session.user.id}`, limit);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again shortly." },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured" },
      { status: 503, headers: rateLimitHeaders(rl) },
    );
  }

  const body = (await req.json()) as {
    messages?: Array<{ role: string; content: string }>;
    conversationId?: string;
  };

  const userMessages = body.messages || [];
  const lastUser = [...userMessages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content?.trim()) {
    return NextResponse.json({ error: "Missing user message" }, { status: 400 });
  }

  let conversationId = body.conversationId;
  if (!conversationId) {
    const [conv] = await db
      .insert(conversations)
      .values({ userId: session.user.id })
      .returning();
    conversationId = conv!.id;
  } else {
    const owned = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);
    if (!owned[0] || owned[0].userId !== session.user.id) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
  }

  await db.insert(messages).values({
    conversationId,
    role: "user",
    content: lastUser.content,
  });

  const retrieved = await retrieveTopK(lastUser.content);
  const gate = applyGroundingGate(retrieved, retrievalThreshold());

  if (!gate.grounded) {
    const refusal = `${REFUSAL_MESSAGE} (${gate.reason})`;
    const [assistantMsg] = await db
      .insert(messages)
      .values({
        conversationId,
        role: "assistant",
        content: refusal,
        refused: true,
      })
      .returning();

    return NextResponse.json(
      {
        conversationId,
        refused: true,
        message: refusal,
        messageId: assistantMsg!.id,
        citations: [],
      },
      { headers: rateLimitHeaders(rl) },
    );
  }

  const citations = gate.citations;
  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
  const model = process.env.LLM_MODEL || "openai/gpt-oss-20b";

  let text: string;
  try {
    const result = await generateText({
      model: groq(model),
      system: buildCitedSystemPrompt(citations),
      messages: [{ role: "user", content: lastUser.content }],
    });
    text = result.text;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "LLM failed";
    return NextResponse.json(
      { error: msg, conversationId, citations },
      { status: 502, headers: rateLimitHeaders(rl) },
    );
  }

  const [assistantMsg] = await db
    .insert(messages)
    .values({
      conversationId,
      role: "assistant",
      content: text,
      refused: false,
    })
    .returning();
  for (const c of citations) {
    await db.insert(messageCitations).values({
      messageId: assistantMsg!.id,
      chunkId: c.chunkId,
      rank: c.rank,
      score: c.score,
    });
  }

  return NextResponse.json(
    {
      conversationId,
      refused: false,
      message: text,
      messageId: assistantMsg!.id,
      citations,
    },
    { headers: rateLimitHeaders(rl) },
  );
}
