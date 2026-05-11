import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uuid = searchParams.get('uuid');

  if (!uuid) {
    return NextResponse.json({ error: 'Eksik uuid parametresi' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://create.kahoot.it/rest/kahoots/${uuid}`);
    
    if (!res.ok) {
       return NextResponse.json({ error: 'Kanhoot bulunamadı' }, { status: 404 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Kanhoot Proxy Error:", error);
    return NextResponse.json({ error: 'Kanhoot verisi çekilemedi' }, { status: 500 });
  }
}
