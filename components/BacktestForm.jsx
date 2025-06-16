"use client";

import { useEffect } from 'react';
import React, { useState } from 'react';
import { PlayIcon, ChartCandlestick } from 'lucide-react';

function BacktestForm({ onSubmit, onShowChart, loading, error }) {
  const [tickerOptions, setTickerOptions] = useState([]);
  const [ticker, setTicker] = useState('AAPL');
  const [initialCapital, setInitialCapital] = useState(100000);
  const [dataFetchStartDate, setDataFetchStartDate] = useState('2020-01-01');
  const [dataFetchEndDate, setDataFetchEndDate] = useState('2024-12-31');
  const [simulationStartDate, setSimulationStartDate] = useState('2021-01-01');
  const [strategyName, setStrategyName] = useState('maCrossover');
  // Parameters for maCrossover
  const [shortWindow, setShortWindow] = useState(20);
  const [longWindow, setLongWindow] = useState(50);
  // Parameters for bollingerBands and donchianChannelBreakout
  const [window, setWindow] = useState(20);
  const [numStdDev, setNumStdDev] = useState(2);
  // Parameters for MACD
  const [fast, setFast] = useState(12);
  const [slow, setSlow] = useState(26);
  const [signal, setSignal] = useState(9);
  // Parameters for stochasticOscillator
  const [kPeriod, setKPeriod] = useState(14);
  const [dPeriod, setDPeriod] = useState(3);
  const [oversold, setOversold] = useState(20);
  const [overbought, setOverbought] = useState(80);

  const [customBuyOperator, setCustomBuyOperator] = useState('AND');
  const [customSellOperator, setCustomSellOperator] = useState('AND');
  const [customBuyConditions, setCustomBuyConditions] = useState([
    { type: 'priceThreshold', operator: 'lt', value: 100 }
  ]);
  const [customSellConditions, setCustomSellConditions] = useState([
    { type: 'priceThreshold', operator: 'gt', value: 200 }
  ]);

  const handleCustomConditionChange = (type, idx, field, value, isBuy) => {
    const setter = isBuy ? setCustomBuyConditions : setCustomSellConditions;
    const conditions = isBuy ? [...customBuyConditions] : [...customSellConditions];
    conditions[idx][field] = value;
    setter(conditions);
  };

  const handleAddCustomCondition = (isBuy) => {
    const setter = isBuy ? setCustomBuyConditions : setCustomSellConditions;
    setter((prev) => [...prev, { type: 'priceThreshold', operator: 'lt', value: 100 }]);
  };

  const handleRemoveCustomCondition = (idx, isBuy) => {
    const setter = isBuy ? setCustomBuyConditions : setCustomSellConditions;
    setter((prev) => prev.filter((_, i) => i !== idx));
  };

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    async function fetchTickers() {
      try {
        const res = await fetch('/api/tickers');
        if (!res.ok) throw new Error('Failed to fetch tickers');
        const data = await res.json();
        setTickerOptions(data);
        if (data.length > 0 && !ticker) setTicker(data[0]);
      } catch {
        setTickerOptions([]);
      }
    }
    fetchTickers();
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!ticker.trim()) errors.ticker = 'Ticker is required';
    if (initialCapital <= 0) errors.initialCapital = 'Initial capital must be greater than 0';
    if (new Date(dataFetchStartDate) >= new Date(dataFetchEndDate)) {
      errors.dataFetchDates = 'Start date must be before end date';
    }
    if (
      new Date(simulationStartDate) < new Date(dataFetchStartDate) ||
      new Date(simulationStartDate) > new Date(dataFetchEndDate)
    ) {
      errors.simulationStartDate = 'Simulation start must be within data fetch range';
    }

    // Strategy-specific validations
    switch (strategyName) {
      case 'maCrossover':
        if (shortWindow <= 0) errors.shortWindow = 'Short window must be greater than 0';
        if (longWindow <= 0) errors.longWindow = 'Long window must be greater than 0';
        if (shortWindow >= longWindow) errors.windows = 'Short window must be less than long window';
        break;
      case 'bollingerBands':
        if (window <= 0) errors.window = 'Window must be greater than 0';
        if (numStdDev <= 0) errors.numStdDev = 'Number of standard deviations must be greater than 0';
        break;
      case 'MACD':
        if (fast <= 0) errors.fast = 'Fast period must be greater than 0';
        if (slow <= 0) errors.slow = 'Slow period must be greater than 0';
        if (signal <= 0) errors.signal = 'Signal period must be greater than 0';
        if (fast >= slow) errors.macdPeriods = 'Fast period must be less than slow period';
        break;
      case 'donchianChannelBreakout':
        if (window <= 0) errors.window = 'Window must be greater than 0';
        break;
      case 'stochasticOscillator':
        if (kPeriod <= 0) errors.kPeriod = 'K period must be greater than 0';
        if (dPeriod <= 0) errors.dPeriod = 'D period must be greater than 0';
        if (oversold < 0 || oversold > 100) errors.oversold = 'Oversold must be between 0 and 100';
        if (overbought < 0 || overbought > 100) errors.overbought = 'Overbought must be between 0 and 100';
        if (oversold >= overbought) errors.stochasticLevels = 'Oversold must be less than overbought';
        break;
      case 'customStrategy':
        if (customBuyConditions.length === 0) errors.customBuyConditions = 'At least one buy condition is required';
        if (customSellConditions.length === 0) errors.customSellConditions = 'At least one sell condition is required';
        customBuyConditions.forEach((cond, idx) => {
          if (cond.type === 'priceThreshold') {
            if (cond.value <= 0) errors[`buyCondition${idx}`] = `Price threshold for buy condition ${idx + 1} must be greater than 0`;
          } else if (cond.type === 'maCrossover') {
            if (cond.shortWindow <= 0) errors[`buyCondition${idx}`] = `Short window for buy condition ${idx + 1} must be greater than 0`;
            if (cond.longWindow <= 0) errors[`buyCondition${idx}`] = `Long window for buy condition ${idx + 1} must be greater than 0`;
            if (cond.shortWindow >= cond.longWindow) errors[`buyCondition${idx}`] = `Short window must be less than long window for buy condition ${idx + 1}`;
          } else if (cond.type === 'rsi') {
            if (cond.period <= 0) errors[`buyCondition${idx}`] = `Period for buy condition ${idx + 1} must be greater than 0`;
            if (cond.value < 0 || cond.value > 100) errors[`buyCondition${idx}`] = `RSI value for buy condition ${idx + 1} must be between 0 and 100`;
          } else if (cond.type === 'bollingerBands') {
            if (cond.window <= 0) errors[`buyCondition${idx}`] = `Window for buy condition ${idx + 1} must be greater than 0`;
            if (cond.numStdDev <= 0) errors[`buyCondition${idx}`] = `Number of standard deviations for buy condition ${idx + 1} must be greater than 0`;
          }
        });
        customSellConditions.forEach((cond, idx) => {
          if (cond.type === 'priceThreshold') {
            if (cond.value <= 0) errors[`sellCondition${idx}`] = `Price threshold for sell condition ${idx + 1} must be greater than 0`;
          } else if (cond.type === 'maCrossover') {
            if (cond.shortWindow <= 0) errors[`sellCondition${idx}`] = `Short window for sell condition ${idx + 1} must be greater than 0`;
            if (cond.longWindow <= 0) errors[`sellCondition${idx}`] = `Long window for sell condition ${idx + 1} must be greater than 0`;
            if (cond.shortWindow >= cond.longWindow) errors[`sellCondition${idx}`] = `Short window must be less than long window for sell condition ${idx + 1}`;
          } else if (cond.type === 'rsi') {
            if (cond.period <= 0) errors[`sellCondition${idx}`] = `Period for sell condition ${idx + 1} must be greater than 0`;
            if (cond.value < 0 || cond.value > 100) errors[`sellCondition${idx}`] = `RSI value for sell condition ${idx + 1} must be between 0 and 100`;
          } else if (cond.type === 'bollingerBands') {
            if (cond.window <= 0) errors[`sellCondition${idx}`] = `Window for sell condition ${idx + 1} must be greater than 0`;
            if (cond.numStdDev <= 0) errors[`sellCondition${idx}`] = `Number of standard deviations for sell condition ${idx + 1} must be greater than 0`;
          }
        });
        break;
    }

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      let strategyParams = {};
      switch (strategyName) {
        case 'maCrossover':
          strategyParams = {
            shortWindow: parseInt(shortWindow, 10),
            longWindow: parseInt(longWindow, 10),
          };
          break;
        case 'bollingerBands':
          strategyParams = {
            window: parseInt(window, 10),
            numStdDev: parseFloat(numStdDev),
          };
          break;
        case 'MACD':
          strategyParams = {
            fast: parseInt(fast, 10),
            slow: parseInt(slow, 10),
            signal: parseInt(signal, 10),
          };
          break;
        case 'donchianChannelBreakout':
          strategyParams = {
            window: parseInt(window, 10),
          };
          break;
        case 'stochasticOscillator':
          strategyParams = {
            kPeriod: parseInt(kPeriod, 10),
            dPeriod: parseInt(dPeriod, 10),
            oversold: parseInt(oversold, 10),
            overbought: parseInt(overbought, 10),
          };
          break;
        case 'customStrategy':
          strategyParams = {
            rules: {
              buy: {
                operator: customBuyOperator,
                conditions: customBuyConditions.map((c) => ({
                  type: c.type,
                  ...(c.type === 'priceThreshold' && { operator: c.operator, value: Number(c.value) }),
                  ...(c.type === 'maCrossover' && {
                    shortWindow: Number(c.shortWindow),
                    longWindow: Number(c.longWindow),
                    direction: c.direction,
                  }),
                  ...(c.type === 'rsi' && { period: Number(c.period), operator: c.operator, value: Number(c.value) }),
                  ...(c.type === 'bollingerBands' && {
                    window: Number(c.window),
                    numStdDev: Number(c.numStdDev),
                    band: c.band,
                    direction: c.direction,
                  }),
                })),
              },
              sell: {
                operator: customSellOperator,
                conditions: customSellConditions.map((c) => ({
                  type: c.type,
                  ...(c.type === 'priceThreshold' && { operator: c.operator, value: Number(c.value) }),
                  ...(c.type === 'maCrossover' && {
                    shortWindow: Number(c.shortWindow),
                    longWindow: Number(c.longWindow),
                    direction: c.direction,
                  }),
                  ...(c.type === 'rsi' && { period: Number(c.period), operator: c.operator, value: Number(c.value) }),
                  ...(c.type === 'bollingerBands' && {
                    window: Number(c.window),
                    numStdDev: Number(c.numStdDev),
                    band: c.band,
                    direction: c.direction,
                  }),
                })),
              },
            },
          };
          break;
        default:
          strategyParams = {};
      }

      const params = {
        ticker: ticker.toUpperCase(),
        initialCapital: parseFloat(initialCapital),
        dataFetchStartDate,
        dataFetchEndDate,
        simulationStartDate,
        strategyName,
        strategyParams,
      };
      onSubmit(params);
    }
  };

  return (
    <div className="h-full">
      <h2 className="text-lg font-semibold text-gray-200 mb-4">Backtest Strategy</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="ticker" className="block text-sm font-medium text-gray-400 mb-1">
            Ticker
          </label>
          <select
            id="ticker"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            required
            className="w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          >
            <option value="" disabled>Select a ticker</option>
            {tickerOptions.length === 0 && (
              <option value="" disabled>Loading...</option>
            )}
            {tickerOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {formErrors.ticker && <p className="text-xs text-red-400 mt-1">{formErrors.ticker}</p>}
        </div>

        <div>
          <label htmlFor="initialCapital" className="block text-sm font-medium text-gray-400 mb-1">
            Initial Capital ($)
          </label>
          <input
            type="number"
            id="initialCapital"
            value={initialCapital}
            onChange={(e) => setInitialCapital(e.target.value)}
            min="1"
            step="0.01"
            required
            className="w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          />
          {formErrors.initialCapital && <p className="text-xs text-red-400 mt-1">{formErrors.initialCapital}</p>}
        </div>

        <div>
          <label htmlFor="dataFetchStartDate" className="block text-sm font-medium text-gray-400 mb-1">
            Data Fetch Start
          </label>
          <input
            type="date"
            id="dataFetchStartDate"
            value={dataFetchStartDate}
            onChange={(e) => setDataFetchStartDate(e.target.value)}
            required
            className="w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          />
          {formErrors.dataFetchDates && <p className="text-xs text-red-400 mt-1">{formErrors.dataFetchDates}</p>}
        </div>

        <div>
          <label htmlFor="dataFetchEndDate" className="block text-sm font-medium text-gray-400 mb-1">
            Data Fetch End
          </label>
          <input
            type="date"
            id="dataFetchEndDate"
            value={dataFetchEndDate}
            onChange={(e) => setDataFetchEndDate(e.target.value)}
            required
            className="w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label htmlFor="simulationStartDate" className="block text-sm font-medium text-gray-400 mb-1">
            Simulation Start
          </label>
          <input
            type="date"
            id="simulationStartDate"
            value={simulationStartDate}
            onChange={(e) => setSimulationStartDate(e.target.value)}
            required
            className="w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          />
          {formErrors.simulationStartDate && <p className="text-xs text-red-400 mt-1">{formErrors.simulationStartDate}</p>}
        </div>

        <div className='mt-5'>
          <button
            type="button"
            className="w-full mb-2 px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800 transition flex items-center justify-center gap-2 text-sm"
            onClick={() => {
              if (onShowChart) {
                onShowChart({
                  ticker,
                  dataFetchStartDate,
                  dataFetchEndDate,
                });
              }
            }}
          >
            <ChartCandlestick className="h-4 w-4" /> Show Chart
          </button>
        </div>
        <div>
          <label htmlFor="strategyName" className="block text-sm font-medium text-gray-400 mb-1">
            Strategy
          </label>
          <select
            id="strategyName"
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
            required
            className="w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          >
            <option value="maCrossover">Moving Average Crossover</option>
            <option value="bollingerBands">Bollinger Bands</option>
            <option value="MACD">MACD</option>
            <option value="donchianChannelBreakout">Donchian Channel Breakout</option>
            <option value="stochasticOscillator">Stochastic Oscillator</option>
            <option value="customStrategy">Custom Strategy</option>
          </select>
        </div>

        {strategyName === 'maCrossover' && (
          <>
            <div>
              <label htmlFor="shortWindow" className="block text-sm font-medium text-gray-400 mb-1">
                Short MA Window
              </label>
              <input
                type="number"
                id="shortWindow"
                value={shortWindow}
                onChange={(e) => setShortWindow(e.target.value)}
                min="1"
                required
                className="w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
              {formErrors.shortWindow && <p className="text-xs text-red-400 mt-1">{formErrors.shortWindow}</p>}
            </div>
            <div>
              <label htmlFor="longWindow" className="block text-sm font-medium text-gray-400 mb-1">
                Long MA Window
              </label>
              <input
                type="number"
                id="longWindow"
                value={longWindow}
                onChange={(e) => setLongWindow(e.target.value)}
                min="1"
                required
                className="w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
              {formErrors.longWindow && <p className="text-xs text-red-400 mt-1">{formErrors.longWindow}</p>}
              {formErrors.windows && <p className="text-xs text-red-400 mt-1">{formErrors.windows}</p>}
            </div>
          </>
        )}

        {strategyName === 'bollingerBands' && (
          <>
            <div>
              <label htmlFor="window" className="block text-sm font-medium text-gray-400 mb-1">
                Window
              </label>
              <input
                type="number"
                id="window"
                value={window}
                onChange={(e) => setWindow(e.target.value)}
                min="1"
                required
                className="w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
              {formErrors.window && <p className="text-xs text-red-400 mt-1">{formErrors.window}</p>}
            </div>
            <div>
              <label htmlFor="numStdDev" className="block text-sm font-medium text-gray-400 mb-1">
                Number of Std Dev
              </label>
              <input
                type="number"
                id="numStdDev"
                value={numStdDev}
                onChange={(e) => setNumStdDev(e.target.value)}
                min="0.1"
                step="0.1"
                required
                className="w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
              {formErrors.numStdDev && <p className="text-xs text-red-400 mt-1">{formErrors.numStdDev}</p>}
            </div>
          </>
        )}

        {strategyName === 'MACD' && (
          <>
            <div>
              <label htmlFor="fast" className="block text-sm font-medium text-gray-400 mb-1">
                Fast Period
              </label>
              <input
                type="number"
                id="fast"
                value={fast}
                onChange={(e) => setFast(e.target.value)}
                min="1"
                required
                className="w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
              {formErrors.fast && <p className="text-xs text-red-400 mt-1">{formErrors.fast}</p>}
            </div>
            <div>
              <label htmlFor="slow" className="block text-sm font-medium text-gray-400 mb-1">
                Slow Period
              </label>
              <input
                type="number"
                id="slow"
                value={slow}
                onChange={(e) => setSlow(e.target.value)}
                min="1"
                required
                className="w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
              {formErrors.slow && <p className="text-xs text-red-400 mt-1">{formErrors.slow}</p>}
            </div>
            <div>
              <label htmlFor="signal" className="block text-sm font-medium text-gray-400 mb-1">
                Signal Period
              </label>
              <input
                type="number"
                id="signal"
                value={signal}
                onChange={(e) => setSignal(e.target.value)}
                min="1"
                required
                className="w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
              {formErrors.signal && <p className="text-xs text-red-400 mt-1">{formErrors.signal}</p>}
              {formErrors.macdPeriods && <p className="text-xs text-red-400 mt-1">{formErrors.macdPeriods}</p>}
            </div>
          </>
        )}

        {strategyName === 'donchianChannelBreakout' && (
          <div>
            <label htmlFor="window" className="block text-sm font-medium text-gray-400 mb-1">
              Window
            </label>
            <input
              type="number"
              id="window"
              value={window}
              onChange={(e) => setWindow(e.target.value)}
              min="1"
              required
              className="w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            />
            {formErrors.window && <p className="text-xs text-red-400 mt-1">{formErrors.window}</p>}
          </div>
        )}

        {strategyName === 'stochasticOscillator' && (
          <>
            <div>
              <label htmlFor="kPeriod" className="block text-sm font-medium text-gray-400 mb-1">
                K Period
              </label>
              <input
                type="number"
                id="kPeriod"
                value={kPeriod}
                onChange={(e) => setKPeriod(e.target.value)}
                min="1"
                required
                className="w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
              {formErrors.kPeriod && <p className="text-xs text-red-400 mt-1">{formErrors.kPeriod}</p>}
            </div>
            <div>
              <label htmlFor="dPeriod" className="block text-sm font-medium text-gray-400 mb-1">
                D Period
              </label>
              <input
                type="number"
                id="dPeriod"
                value={dPeriod}
                onChange={(e) => setDPeriod(e.target.value)}
                min="1"
                required
                className="w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
              {formErrors.dPeriod && <p className="text-xs text-red-400 mt-1">{formErrors.dPeriod}</p>}
            </div>
            <div>
              <label htmlFor="oversold" className="block text-sm font-medium text-gray-400 mb-1">
                Oversold Threshold
              </label>
              <input
                type="number"
                id="oversold"
                value={oversold}
                onChange={(e) => setOversold(e.target.value)}
                min="0"
                max="100"
                required
                className="w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
              {formErrors.oversold && <p className="text-xs text-red-400 mt-1">{formErrors.oversold}</p>}
            </div>
            <div>
              <label htmlFor="overbought" className="block text-sm font-medium text-gray-400 mb-1">
                Overbought Threshold
              </label>
              <input
                type="number"
                id="overbought"
                value={overbought}
                onChange={(e) => setOverbought(e.target.value)}
                min="0"
                max="100"
                required
                className="w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
              {formErrors.overbought && <p className="text-xs text-red-400 mt-1">{formErrors.overbought}</p>}
              {formErrors.stochasticLevels && <p className="text-xs text-red-400 mt-1">{formErrors.stochasticLevels}</p>}
            </div>
          </>
        )}

        {strategyName === 'customStrategy' && (
          <div className="space-y-4 border border-gray-600 rounded-lg p-4 bg-gray-800 mt-2">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Custom Strategy Rules</h3>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Buy Rule Operator</label>
              <select
                value={customBuyOperator}
                onChange={e => setCustomBuyOperator(e.target.value)}
                className="rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>
              {formErrors.customBuyConditions && <p className="text-xs text-red-400 mt-1">{formErrors.customBuyConditions}</p>}
              {customBuyConditions.map((cond, idx) => (
                <div key={idx} className="flex items-center gap-2 mt-2 flex-wrap">
                  <select
                    value={cond.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const newCond = { type: newType };
                      if (newType === 'priceThreshold') {
                        newCond.operator = 'lt';
                        newCond.value = 100;
                      } else if (newType === 'maCrossover') {
                        newCond.shortWindow = 5;
                        newCond.longWindow = 20;
                        newCond.direction = 'above';
                      } else if (newType === 'rsi') {
                        newCond.period = 14;
                        newCond.operator = 'lt';
                        newCond.value = 30;
                      } else if (newType === 'bollingerBands') {
                        newCond.window = 20;
                        newCond.numStdDev = 2;
                        newCond.band = 'lower';
                        newCond.direction = 'crossBelow';
                      }
                      handleCustomConditionChange('type', idx, 'type', newType, true);
                      setCustomBuyConditions((prev) => {
                        const newConditions = [...prev];
                        newConditions[idx] = newCond;
                        return newConditions;
                      });
                    }}
                    className="rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                  >
                    <option value="priceThreshold">Price Threshold</option>
                    <option value="maCrossover">MA Crossover</option>
                    <option value="rsi">RSI</option>
                    <option value="bollingerBands">Bollinger Bands</option>
                  </select>
                  {cond.type === 'priceThreshold' && (
                    <>
                      <select
                        value={cond.operator}
                        onChange={e => handleCustomConditionChange('operator', idx, 'operator', e.target.value, true)}
                        className="rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                      >
                        <option value="lt">&lt;</option>
                        <option value="gt">&gt;</option>
                        <option value="eq">=</option>
                      </select>
                      <input
                        type="number"
                        value={cond.value}
                        onChange={e => handleCustomConditionChange('value', idx, 'value', e.target.value, true)}
                        className="w-20 rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                        min="0"
                        step="0.01"
                      />
                    </>
                  )}
                  {cond.type === 'maCrossover' && (
                    <>
                      <input
                        type="number"
                        value={cond.shortWindow || 5}
                        onChange={e => handleCustomConditionChange('shortWindow', idx, 'shortWindow', e.target.value, true)}
                        className="w-20 rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                        min="1"
                        placeholder="Short Window"
                      />
                      <input
                        type="number"
                        value={cond.longWindow || 20}
                        onChange={e => handleCustomConditionChange('longWindow', idx, 'longWindow', e.target.value, true)}
                        className="w-20 rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                        min="1"
                        placeholder="Long Window"
                      />
                      <select
                        value={cond.direction}
                        onChange={e => handleCustomConditionChange('direction', idx, 'direction', e.target.value, true)}
                        className="rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                      >
                        <option value="above">Short MA &gt; Long MA</option>
                        <option value="below">Short MA &lt; Long MA</option>
                      </select>
                    </>
                  )}
                  {cond.type === 'rsi' && (
                    <>
                      <input
                        type="number"
                        value={cond.period || 14}
                        onChange={e => handleCustomConditionChange('period', idx, 'period', e.target.value, true)}
                        className="w-20 rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                        min="1"
                        placeholder="Period"
                      />
                      <select
                        value={cond.operator}
                        onChange={e => handleCustomConditionChange('operator', idx, 'operator', e.target.value, true)}
                        className="rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                      >
                        <option value="lt">&lt;</option>
                        <option value="gt">&gt;</option>
                        <option value="eq">=</option>
                      </select>
                      <input
                        type="number"
                        value={cond.value || 30}
                        onChange={e => handleCustomConditionChange('value', idx, 'value', e.target.value, true)}
                        className="w-20 rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="RSI Value"
                      />
                    </>
                  )}
                  {cond.type === 'bollingerBands' && (
                    <>
                      <input
                        type="number"
                        value={cond.window || 20}
                        onChange={e => handleCustomConditionChange('window', idx, 'window', e.target.value, true)}
                        className="w-20 rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                        min="1"
                        placeholder="Window"
                      />
                      <input
                        type="number"
                        value={cond.numStdDev || 2}
                        onChange={e => handleCustomConditionChange('numStdDev', idx, 'numStdDev', e.target.value, true)}
                        className="w-20 rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                        min="0.1"
                        step="0.1"
                        placeholder="Std Dev"
                      />
                      <select
                        value={cond.band}
                        onChange={e => handleCustomConditionChange('band', idx, 'band', e.target.value, true)}
                        className="rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                      >
                        <option value="upper">Upper Band</option>
                        <option value="lower">Lower Band</option>
                      </select>
                      <select
                        value={cond.direction}
                        onChange={e => handleCustomConditionChange('direction', idx, 'direction', e.target.value, true)}
                        className="rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                      >
                        <option value="crossAbove">Cross Above</option>
                        <option value="crossBelow">Cross Below</option>
                      </select>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomCondition(idx, true)}
                    className="text-xs text-red-400 hover:underline"
                    disabled={customBuyConditions.length === 1}
                  >
                    Remove
                  </button>
                  {formErrors[`buyCondition${idx}`] && <p className="text-xs text-red-400 mt-1 w-full">{formErrors[`buyCondition${idx}`]}</p>}
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddCustomCondition(true)}
                className="mt-2 text-xs text-green-400 hover:underline"
              >
                + Add Buy Condition
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Sell Rule Operator</label>
              <select
                value={customSellOperator}
                onChange={e => setCustomSellOperator(e.target.value)}
                className="rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>
              {formErrors.customSellConditions && <p className="text-xs text-red-400 mt-1">{formErrors.customSellConditions}</p>}
              {customSellConditions.map((cond, idx) => (
                <div key={idx} className="flex items-center gap-2 mt-2 flex-wrap">
                  <select
                    value={cond.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const newCond = { type: newType };
                      if (newType === 'priceThreshold') {
                        newCond.operator = 'gt';
                        newCond.value = 200;
                      } else if (newType === 'maCrossover') {
                        newCond.shortWindow = 5;
                        newCond.longWindow = 20;
                        newCond.direction = 'below';
                      } else if (newType === 'rsi') {
                        newCond.period = 14;
                        newCond.operator = 'gt';
                        newCond.value = 70;
                      } else if (newType === 'bollingerBands') {
                        newCond.window = 20;
                        newCond.numStdDev = 2;
                        newCond.band = 'upper';
                        newCond.direction = 'crossAbove';
                      }
                      handleCustomConditionChange('type', idx, 'type', newType, false);
                      setCustomSellConditions((prev) => {
                        const newConditions = [...prev];
                        newConditions[idx] = newCond;
                        return newConditions;
                      });
                    }}
                    className="rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                  >
                    <option value="priceThreshold">Price Threshold</option>
                    <option value="maCrossover">MA Crossover</option>
                    <option value="rsi">RSI</option>
                    <option value="bollingerBands">Bollinger Bands</option>
                  </select>
                  {cond.type === 'priceThreshold' && (
                    <>
                      <select
                        value={cond.operator}
                        onChange={e => handleCustomConditionChange('operator', idx, 'operator', e.target.value, false)}
                        className="rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                      >
                        <option value="lt">&lt;</option>
                        <option value="gt">&gt;</option>
                        <option value="eq">=</option>
                      </select>
                      <input
                        type="number"
                        value={cond.value}
                        onChange={e => handleCustomConditionChange('value', idx, 'value', e.target.value, false)}
                        className="w-20 rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                        min="0"
                        step="0.01"
                      />
                    </>
                  )}
                  {cond.type === 'maCrossover' && (
                    <>
                      <input
                        type="number"
                        value={cond.shortWindow || 5}
                        onChange={e => handleCustomConditionChange('shortWindow', idx, 'shortWindow', e.target.value, false)}
                        className="w-20 rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                        min="1"
                        placeholder="Short Window"
                      />
                      <input
                        type="number"
                        value={cond.longWindow || 20}
                        onChange={e => handleCustomConditionChange('longWindow', idx, 'longWindow', e.target.value, false)}
                        className="w-20 rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                        min="1"
                        placeholder="Long Window"
                      />
                      <select
                        value={cond.direction}
                        onChange={e => handleCustomConditionChange('direction', idx, 'direction', e.target.value, false)}
                        className="rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                      >
                        <option value="above">Short MA &gt; Long MA</option>
                        <option value="below">Short MA &lt; Long MA</option>
                      </select>
                    </>
                  )}
                  {cond.type === 'rsi' && (
                    <>
                      <input
                        type="number"
                        value={cond.period || 14}
                        onChange={e => handleCustomConditionChange('period', idx, 'period', e.target.value, false)}
                        className="w-20 rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                        min="1"
                        placeholder="Period"
                      />
                      <select
                        value={cond.operator}
                        onChange={e => handleCustomConditionChange('operator', idx, 'operator', e.target.value, false)}
                        className="rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                      >
                        <option value="lt">&lt;</option>
                        <option value="gt">&gt;</option>
                        <option value="eq">=</option>
                      </select>
                      <input
                        type="number"
                        value={cond.value || 70}
                        onChange={e => handleCustomConditionChange('value', idx, 'value', e.target.value, false)}
                        className="w-20 rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="RSI Value"
                      />
                    </>
                  )}
                  {cond.type === 'bollingerBands' && (
                    <>
                      <input
                        type="number"
                        value={cond.window || 20}
                        onChange={e => handleCustomConditionChange('window', idx, 'window', e.target.value, false)}
                        className="w-20 rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                        min="1"
                        placeholder="Window"
                      />
                      <input
                        type="number"
                        value={cond.numStdDev || 2}
                        onChange={e => handleCustomConditionChange('numStdDev', idx, 'numStdDev', e.target.value, false)}
                        className="w-20 rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                        min="0.1"
                        step="0.1"
                        placeholder="Std Dev"
                      />
                      <select
                        value={cond.band}
                        onChange={e => handleCustomConditionChange('band', idx, 'band', e.target.value, false)}
                        className="rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                      >
                        <option value="upper">Upper Band</option>
                        <option value="lower">Lower Band</option>
                      </select>
                      <select
                        value={cond.direction}
                        onChange={e => handleCustomConditionChange('direction', idx, 'direction', e.target.value, false)}
                        className="rounded bg-gray-700 border border-gray-600 text-gray-200 px-2 py-1 text-xs"
                      >
                        <option value="crossAbove">Cross Above</option>
                        <option value="crossBelow">Cross Below</option>
                      </select>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomCondition(idx, false)}
                    className="text-xs text-red-400 hover:underline"
                    disabled={customSellConditions.length === 1}
                  >
                    Remove
                  </button>
                  {formErrors[`sellCondition${idx}`] && <p className="text-xs text-red-400 mt-1 w-full">{formErrors[`sellCondition${idx}`]}</p>}
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddCustomCondition(false)}
                className="mt-2 text-xs text-green-400 hover:underline"
              >
                + Add Sell Condition
              </button>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            className="w-full px-6 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-800 transition flex items-center justify-center gap-2 text-sm disabled:bg-green-500/50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <PlayIcon className="h-4 w-4" />
            )}
            <span>{loading ? 'Running...' : 'Run Backtest'}</span>
          </button>
        </div>

        {error && <p className="text-center text-red-400 text-xs mt-4">{error}</p>}
      </form>
    </div>
  );
}

export default BacktestForm;