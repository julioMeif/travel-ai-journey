import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const count = searchParams.get('count') || '5';

  //https://api.unsplash.com/search/photos?client_id=IN9x7J0VW6yoXdVbeyr-BdXKLrH00owE4ezcgoMQLSo&query=elegant,hotel&page=1&per_page=2

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query || '')}&per_page=${count}&client_id=${process.env.UNSPLASH_ACCESS_KEY}`
  );

  if (!res.ok) {
    return NextResponse.json({ error: 'Error fetching images' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
