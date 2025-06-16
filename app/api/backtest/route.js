import { NextResponse } from 'next/server';
import { getStockData } from '../../../lib/db';
import Backtester from '../../../lib/backtester';
import {
  maCrossoverStrategy,
  bollingerBands,
  MACD,
  donchianChannelBreakout,
  stochasticOscillator,
} from '../../../lib/strategies';

export async function POST(request) {
  try {
    const {
      ticker,
      initialCapital,
      dataFetchStartDate,
      dataFetchEndDate,
      simulationStartDate,
      strategyName,
      strategyParams
    } = await request.json();

    // --- Input Validation ---
    if (!ticker || !initialCapital || !dataFetchStartDate || !dataFetchEndDate || !simulationStartDate || !strategyName) {
      return NextResponse.json(
        { error: 'Missing required backtest parameters.' },
        { status: 400 }
      );
    }

    if (isNaN(parseFloat(initialCapital)) || parseFloat(initialCapital) <= 0) {
      return NextResponse.json(
        { error: 'Initial capital must be a positive number.' },
        { status: 400 }
      );
    }

    if (
      new Date(dataFetchStartDate) > new Date(dataFetchEndDate) ||
      new Date(simulationStartDate) > new Date(dataFetchEndDate) ||
      new Date(dataFetchStartDate) > new Date(simulationStartDate)
    ) {
      return NextResponse.json(
        { error: 'Invalid date range: Start dates cannot be after end dates.' },
        { status: 400 }
      );
    }

    // --- Fetch Historical Data ---
    const historicalData = getStockData(ticker, dataFetchStartDate, dataFetchEndDate);

    if (!historicalData || historicalData.length === 0) {
      return NextResponse.json(
        { message: `No historical data found for ${ticker} from ${dataFetchStartDate} to ${dataFetchEndDate}.` },
        { status: 404 }
      );
    }

    // --- Format historical data into the structure expected by the Backtester ---
    const formattedDataForBacktester = {
      [ticker]: historicalData.map(d => ({
        ...d,
        open: parseFloat(d.open),
        high: parseFloat(d.high),
        low: parseFloat(d.low),
        close: parseFloat(d.close),
        volume: parseFloat(d.volume)
      }))
    };

    // --- Select and Run Strategy ---
    let selectedStrategy;
    switch (strategyName) {
      case 'maCrossover':
        selectedStrategy = maCrossoverStrategy;
        break;
      case 'bollingerBands':
        selectedStrategy = bollingerBands;
        break;
      case 'MACD':
        selectedStrategy = MACD;
        break;
      case 'donchianChannelBreakout':
        selectedStrategy = donchianChannelBreakout;
        break;
      case 'stochasticOscillator':
        selectedStrategy = stochasticOscillator;
        break;
      default:
        return NextResponse.json(
          { error: `Strategy "${strategyName}" not found or not implemented.` },
          { status: 400 }
        );
    }

    const backtester = new Backtester(parseFloat(initialCapital));
    const results = backtester.runStrategy(selectedStrategy, formattedDataForBacktester, simulationStartDate, strategyParams);

    if (results.error) {
      return NextResponse.json({ error: `Backtest failed: ${results.error}` }, { status: 500 });
    }

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('API Error during backtest:', error);
    return NextResponse.json({ error: 'An internal server error occurred during backtest.' }, { status: 500 });
  }
}