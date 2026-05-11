import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ADMIN_KEY = process.env.ADMIN_PASSWORD || "K2026"; // Fallback to K2026

export async function GET(req: Request) {
  const adminKey = req.headers.get("X-Admin-Key");
  if (adminKey !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const kanhoots = await prisma.kanhootQuiz.findMany({
      include: {
        questions: {
          orderBy: {
            id: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Format for frontend
    const formatted = kanhoots.map(k => ({
      id: k.id,
      title: k.title,
      questions: k.questions.map(q => ({
        question: q.question,
        time_limit_sec: q.time_limit_sec,
        options: q.options,
        correct_index: q.correct_index
      }))
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET kanhoots error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const adminKey = req.headers.get("X-Admin-Key");
  if (adminKey !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();

    if (!data.title || !data.questions) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    // Check if updating
    if (data.id) {
      // Clear existing questions and recreate them
      await prisma.kanhootQuestion.deleteMany({
        where: { quizId: data.id }
      });

      const updated = await prisma.kanhootQuiz.update({
        where: { id: data.id },
        data: {
          title: data.title,
          questions: {
            create: data.questions.map((q: any) => ({
              question: q.question,
              time_limit_sec: q.time_limit_sec,
              options: q.options,
              correct_index: q.correct_index
            }))
          }
        }
      });
      return NextResponse.json(updated);
    } else {
      // Create new
      const created = await prisma.kanhootQuiz.create({
        data: {
          title: data.title,
          questions: {
            create: data.questions.map((q: any) => ({
              question: q.question,
              time_limit_sec: q.time_limit_sec,
              options: q.options,
              correct_index: q.correct_index
            }))
          }
        }
      });
      return NextResponse.json(created);
    }
  } catch (error) {
    console.error("POST kanhoots error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
