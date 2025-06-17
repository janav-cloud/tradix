"use client";

import React, { useState, useEffect } from 'react';
import StockChart from '../components/StockChart';
import BacktestForm from '../components/BacktestForm';
import BacktestResults from '../components/BacktestResults';

export default function Home() {
  const [stockData, setStockData] = useState([]);
  const [tickerForChart, setTickerForChart] = useState('AAPL');
  const [startDateForChart, setStartDateForChart] = useState('2020-01-01');
  const [endDateForChart, setEndDateForChart] = useState('2024-12-31');
  const [selectedDate, setSelectedDate] = useState(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [chartError, setChartError] = useState(null);

  const [backtestResults, setBacktestResults] = useState(null);
  const [loadingBacktest, setLoadingBacktest] = useState(false);
  const [backtestError, setBacktestError] = useState(null);

  const fetchStockData = async (ticker, startDate, endDate) => {
    setLoadingChart(true);
    setChartError(null);
    try {
      const response = await fetch(`/api/data/${ticker}?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStockData(data);
    } catch (e) {
      console.error("Failed to fetch stock data:", e);
      setChartError(e.message);
      setStockData([]);
    } finally {
      setLoadingChart(false);
    }
  };

  useEffect(() => {
    fetchStockData(tickerForChart, startDateForChart, endDateForChart);
  }, [tickerForChart, startDateForChart, endDateForChart]);

  const handleShowChart = ({ ticker, dataFetchStartDate, dataFetchEndDate }) => {
    setTickerForChart(ticker);
    setStartDateForChart(dataFetchStartDate);
    setEndDateForChart(dataFetchEndDate);
    setSelectedDate(null); // Optionally reset selected date
  };

  const handleBacktestSubmit = async (params) => {
    setLoadingBacktest(true);
    setBacktestError(null);
    setBacktestResults(null);

    setTickerForChart(params.ticker);
    setStartDateForChart(params.dataFetchStartDate);
    setEndDateForChart(params.dataFetchEndDate);

    try {
      const response = await fetch('/api/backtest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const results = await response.json();
      setBacktestResults(results);
    } catch (e) {
      console.error("Failed to run backtest:", e);
      setBacktestError(e.message);
    } finally {
      setLoadingBacktest(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-6">
      <div className="max-w-7xl mx-auto">
        {/* Main Grid: Chart (Left) and Form (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Stock Chart Section */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow p-6">
            {loadingChart && (
              <div className="flex justify-center items-center h-64">
                <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mr-3"></span>
                <span className="text-gray-400">Loading chart...</span>
              </div>
            )}
            {chartError && (
              <div className="text-center text-red-400 bg-gray-700 rounded-lg py-3 px-4">
                Chart Error: {chartError}
              </div>
            )}
            {!loadingChart && !chartError && stockData.length > 0 && (
              <>
                <StockChart
                  data={stockData}
                  title={
                  <div className="flex items-center gap-3">
                    <div className='bg-slate-200 rounded-full'>
                      <img
                        src={`https://assets-netstorage.groww.in/intl-stocks/logos/${tickerForChart}.png`} // Primary image source
                        alt={`${tickerForChart} Logo`}
                        className="p-1 w-7 h-7 md:w-10 md:h-10 object-contain items-center mix-blend-multiply"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'globe.svg';
                          e.target.style.display = 'block';
                        }}
                      />
                    </div>
                    <span className="text-2xl">{tickerForChart}</span>
                  </div>
                }
                onDateSelect={setSelectedDate}
                />
                {(selectedDate || stockData.length > 0) && (
                  (() => {
                    const detail =
                      selectedDate ||
                      (() => {
                        const last = stockData[stockData.length - 1];
                        // Format date to match chart display
                        return {
                          ...last,
                          date: new Date(last.date).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }),
                          volume: (last.volume || 0) / 1_000_000,
                        };
                      })();

                    return (
                      <div className="mt-8 bg-gray-700 rounded-lg p-8 text-gray-100 text-sm md:text-xl">
                        <div className="w-full md:w-3/4 flex flex-row justify-between">
                          <div className='flex flex-col gap-2'>
                            <strong>Date:</strong>
                            <div className="text-sm md:text-xl">{detail.date}</div>
                            <strong>Volume:</strong>
                            <div className="text-sm md:text-xl text-amber-300">▣ {detail.volume} M</div>
                          </div>
                          <div className='flex flex-col gap-2'>
                            <strong>Open:</strong>
                            <div className="text-sm md:text-xl">{detail.open}</div>
                            <strong>High:</strong>
                            <div className="text-sm md:text-xl text-green-400">{detail.high} ▲</div>
                          </div>
                          <div className='flex flex-col gap-2'>
                            <strong>Close:</strong>
                            <div className="text-sm md:text-xl">{detail.close}</div>
                            <strong>Low:</strong>
                            <div className="text-sm md:text-xl text-red-400">{detail.low} ▼</div>
                          </div>
                        </div>
                        <hr className='mt-5 opacity-20'/>
                        <p className='text-xs md:text-sm mt-5 -mb-2 text-slate-300 text-justify'>*Backtesting offers insights before investing. All simulations are based on historical data and do not guarantee future performance. Real market conditions can vary significantly.</p>
                      </div>
                    );
                  })()
                )}
              </>
            )}
            {!loadingChart && !chartError && stockData.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No chart data loaded.<br />
                <span className="text-gray-600 text-sm">Enter a ticker and date range.</span>
              </div>
            )}
          </div>

          {/* Backtest Form Section */}
          <div className="bg-gray-800 rounded-lg shadow p-6">
            <BacktestForm
              onSubmit={handleBacktestSubmit}
              onShowChart={handleShowChart}
              loading={loadingBacktest}
              error={backtestError}
            />
          </div>
        </div>

        {/* Backtest Results Section */}
        {backtestResults && (
          <div className="bg-gray-800 rounded-lg shadow p-6">
            <BacktestResults results={backtestResults} />
          </div>
        )}
      </div>
    </div>
  );
}