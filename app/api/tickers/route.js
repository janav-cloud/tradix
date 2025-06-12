import { NextResponse } from 'next/server';
import { getUniqueTickers } from '../../../lib/db';

export async function GET() {
  try {
    const tickers = await getUniqueTickers();
    return NextResponse.json(tickers, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tickers' }, { status: 500 });
  }
}