import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/backend';

// Soru setleri VPS'teki Go backend'de (library.json); bu rota yalnızca aracı.
// Yönetici anahtarı burada saklanmaz: yönetim panelinden gelen X-Admin-Key aynen iletilir, doğrulamayı backend yapar.
// GET ?id=… anahtarsız çalışır (oyun kurmak için); liste ve kaydetme anahtar ister.
async function ilet(request: Request, method: 'GET' | 'POST') {
  const { search } = new URL(request.url);
  try {
    const res = await fetch(`${BACKEND_URL}/api/kanhoots${search}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': request.headers.get('X-Admin-Key') ?? '' },
      body: method === 'POST' ? await request.text() : undefined,
      cache: 'no-store',
    });
    return new NextResponse(await res.text(), { status: res.status, headers: { 'Content-Type': 'application/json' } });
  } catch {
    return NextResponse.json({ error: 'Kanhoot sunucusuna ulaşılamıyor' }, { status: 502 });
  }
}

export const GET = (request: Request) => ilet(request, 'GET');
export const POST = (request: Request) => ilet(request, 'POST');
