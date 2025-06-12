// app/api/data/[ticker]/route.js
import { getStockData } from '../../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const ticker = params.ticker;
  const { searchParams } = new URL(request.url);

  const startDate = searchParams.get('startDate'); // e.g., ?startDate=2021-01-01
  const endDate = searchParams.get('endDate');   // e.g., ?endDate=2022-12-31

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required.' }, { status: 400 });
  }

  try {
    const data = getStockData(ticker, startDate, endDate);
    
    if (data.length === 0) {
      return NextResponse.json(
        { message: `No data found for ticker: ${ticker}${startDate || endDate ? ' in specified date range.' : '.'}` },
        { status: 404 }
      );
    }

    // --- Convert Decimal values from DB (if any) to plain numbers for JSON serialization ---
    const serializedData = data.map(row => ({
      ...row,
      open: parseFloat(row.open),
      high: parseFloat(row.high),
      low: parseFloat(row.low),
      close: parseFloat(row.close),
    }));

    return NextResponse.json(serializedData, { status: 200 });

  } catch (error) {
    console.error('API Error fetching stock data:', error);
    return NextResponse.json({ error: 'Failed to fetch stock data.' }, { status: 500 });
  }
}