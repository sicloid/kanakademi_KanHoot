import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const urlParam = searchParams.get("url");

  if (!urlParam) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const parts = urlParam.split("/");
    const uuid = parts[parts.length - 1];

    const resp = await fetch(`https://create.kahoot.it/rest/kahoots/${uuid}`);
    if (!resp.ok) {
      throw new Error("Failed to fetch kahoot");
    }

    const data = await resp.json();
    
    const questions = data.questions.map((kq: any) => {
      const cleanQ = kq.question.replace(/<[^>]*>/g, "").trim();
      const options: string[] = [];
      let correctIndex = 0;
      
      kq.choices.forEach((c: any, i: number) => {
        // Kahoot limits options to 4 max, but we check anyway
        if (i < 4) {
          options.push(c.answer);
          if (c.correct) correctIndex = i;
        }
      });

      // Fill remaining options if less than 4 (Kanhoot builder expects up to 4, though it can handle less)
      while(options.length < 4) {
          options.push("");
      }

      return {
        question: cleanQ,
        time_limit_sec: Math.floor(kq.time / 1000),
        options,
        correct_index: correctIndex
      };
    });

    return NextResponse.json({
      title: data.title || "İçe Aktarılan Kanhoot",
      questions
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed to import" }, { status: 500 });
  }
}
