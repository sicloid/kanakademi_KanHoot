import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const kanhoot = await prisma.kanhoot.findUnique({
        where: { id },
        include: { questions: true }
      });
      return NextResponse.json(kanhoot);
    }

    const kanhoots = await prisma.kanhoot.findMany({
      include: {
        questions: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(kanhoots);
  } catch (error: any) {
    console.error("Error fetching kanhoots:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.title || !data.questions) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (data.id) {
      // Update existing
      // First delete old questions
      await prisma.question.deleteMany({
        where: { kanhootId: data.id }
      });
      
      const updated = await prisma.kanhoot.update({
        where: { id: data.id },
        data: {
          title: data.title,
          questions: {
            create: data.questions.map((q: any) => ({
              question: q.question,
              time_limit_sec: Number(q.time_limit_sec),
              options: q.options,
              correct_index: Number(q.correct_index)
            }))
          }
        },
        include: { questions: true }
      });
      return NextResponse.json(updated);
    } else {
      // Create new
      const created = await prisma.kanhoot.create({
        data: {
          title: data.title,
          questions: {
            create: data.questions.map((q: any) => ({
              question: q.question,
              time_limit_sec: Number(q.time_limit_sec),
              options: q.options,
              correct_index: Number(q.correct_index)
            }))
          }
        },
        include: { questions: true }
      });
      return NextResponse.json(created);
    }
  } catch (error: any) {
    console.error("Error saving kanhoot:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
