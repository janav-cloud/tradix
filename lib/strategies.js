// lib/strategies.js
const { parseDate, formatDate } = require('./utils'); // For date comparisons

/**
 * Moving Average Crossover Strategy.
 * Buys when the short MA crosses above the long MA (Golden Cross).
 * Sells when the short MA crosses below the long MA (Death Cross).
 *
 * @param {import('./backtester').Backtester} bt - The Backtester instance.
 * @param {Date} currentDate - The current date of the simulation (as a Date object).
 * @param {Object.<string, Object>} dailyData - Object with current day's data for all tickers (e.g., { 'AAPL': { date: '...', close: ... } }).
 * @param {Object} strategyParams - Parameters for the strategy (e.g., { shortWindow: 5, longWindow: 20 }).
 */
function maCrossoverStrategy(bt, currentDate, dailyData, strategyParams = { shortWindow: 5, longWindow: 20 }) {
  const { shortWindow, longWindow } = strategyParams;

  if (!dailyData || Object.keys(dailyData).length === 0) {
    return;
  }

  const ticker = Object.keys(dailyData)[0];
  const historicalData = bt.fetchedData[ticker];

  if (!historicalData || historicalData.length === 0) {
    return;
  }

  if (bt.simulationStartDate && currentDate < bt.simulationStartDate) {
    return;
  }

  // --- Filter and sort data to ensure correct chronological order ---
  const dataUpToToday = historicalData
    .filter(item => parseDate(item.date) <= currentDate)
    .sort((a, b) => parseDate(a.date) - parseDate(b.date));


  const requiredMinRows = longWindow + 1;

  if (dataUpToToday.length < requiredMinRows) {
    return;
  }

  // --- Slice the data to only include the necessary recent history for MA calculation ---
  const maCalcData = dataUpToToday.slice(-requiredMinRows);

  if (maCalcData.some(item => typeof item.close !== 'number' || isNaN(item.close))) {
    return;
  }

  // --- Helper to calculate a simple moving average ---
  const calculateMA = (dataSlice, window) => {
    if (dataSlice.length < window) return NaN;
    const slice = dataSlice.slice(-window);
    const sum = slice.reduce((acc, item) => acc + item.close, 0);
    return sum / window;
  };

  // --- Calculate current moving averages ---
  const shortMa = calculateMA(maCalcData, shortWindow);
  const longMa = calculateMA(maCalcData, longWindow);

  // --- To get previous day's MAs, we calculate MAs on data excluding the current day ---
  const maCalcDataPrevious = dataUpToToday.slice(-requiredMinRows, -1);
  if (maCalcDataPrevious.length < requiredMinRows - 1) {
      return;
  }
  const previousShortMa = calculateMA(maCalcDataPrevious, shortWindow);
  const previousLongMa = calculateMA(maCalcDataPrevious, longWindow);


  const currentPrice = dailyData[ticker].close;

  if (
    isNaN(shortMa) || isNaN(longMa) ||
    isNaN(previousShortMa) || isNaN(previousLongMa)
  ) {
    return;
  }

  // Trading logic
  // Golden Cross: Short MA crosses above Long MA (Buy signal)
  if ((shortMa > longMa) && (previousShortMa <= previousLongMa)) {
    if (bt.positions[ticker] === undefined || bt.positions[ticker] === 0) { // Only buy if not already holding shares
      const sharesToBuy = Math.floor(bt.cash / currentPrice);
      if (sharesToBuy > 0) {
        bt.buy(ticker, sharesToBuy, currentPrice, currentDate);
      }
    }
  }
  // Death Cross: Short MA crosses below Long MA (Sell signal)
  else if ((shortMa < longMa) && (previousShortMa >= previousLongMa)) {
    if (bt.positions[ticker] > 0) { // Only sell if holding shares
      bt.sell(ticker, bt.positions[ticker], currentPrice, currentDate);
    }
  }
}

/**
 * Bollinger Bands Strategy.
 * Buys when price crosses below the lower band, sells when price crosses above the upper band.
 * @param {import('./backtester').Backtester} bt
 * @param {Date} currentDate
 * @param {Object.<string, Object>} dailyData
 * @param {Object} strategyParams - { window: 20, numStdDev: 2 }
 */
function bollingerBands(bt, currentDate, dailyData, strategyParams = { window: 20, numStdDev: 2 }) {
  const { window, numStdDev } = strategyParams;
  const ticker = Object.keys(dailyData)[0];
  const historicalData = bt.fetchedData[ticker];
  if (!historicalData) return;

  const idx = historicalData.findIndex(d => d.date === formatDate(currentDate));
  if (idx < window - 1) return;

  const windowData = historicalData.slice(idx - window + 1, idx + 1);
  const closes = windowData.map(d => d.close);
  const mean = closes.reduce((a, b) => a + b, 0) / closes.length;
  const std = Math.sqrt(closes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / closes.length);
  const upper = mean + numStdDev * std;
  const lower = mean - numStdDev * std;
  const price = dailyData[ticker].close;

  // Buy if price crosses below lower band, sell if above upper band
  if (price < lower && (!bt.positions[ticker] || bt.positions[ticker] === 0)) {
    const sharesToBuy = Math.floor(bt.cash / price);
    if (sharesToBuy > 0) bt.buy(ticker, sharesToBuy, price, currentDate);
  } else if (price > upper && bt.positions[ticker] > 0) {
    bt.sell(ticker, bt.positions[ticker], price, currentDate);
  }
}

/**
 * MACD Strategy.
 * Buys when MACD crosses above signal, sells when crosses below.
 * @param {import('./backtester').Backtester} bt
 * @param {Date} currentDate
 * @param {Object.<string, Object>} dailyData
 * @param {Object} strategyParams - { fast: 12, slow: 26, signal: 9 }
 */
function MACD(bt, currentDate, dailyData, strategyParams = { fast: 12, slow: 26, signal: 9 }) {
  const { fast, slow, signal } = strategyParams;
  const ticker = Object.keys(dailyData)[0];
  const historicalData = bt.fetchedData[ticker];
  if (!historicalData) return;

  const idx = historicalData.findIndex(d => d.date === formatDate(currentDate));
  if (idx < slow + signal - 1) return;

  // Helper for EMA
  const ema = (data, period) => {
    const k = 2 / (period + 1);
    let emaPrev = data.slice(0, period).reduce((a, b) => a + b.close, 0) / period;
    for (let i = period; i < data.length; i++) {
      emaPrev = data[i].close * k + emaPrev * (1 - k);
    }
    return emaPrev;
  };

  const slice = historicalData.slice(idx - slow - signal + 1, idx + 1);
  const macdLine = ema(slice, fast) - ema(slice, slow);

  // Signal line is EMA of MACD line
  let macdArr = [];
  for (let i = 0; i < slice.length - slow + 1; i++) {
    const fastEma = ema(slice.slice(i, i + slow), fast);
    const slowEma = ema(slice.slice(i, i + slow), slow);
    macdArr.push(fastEma - slowEma);
  }
  const signalLine = macdArr.length >= signal
    ? macdArr.slice(-signal).reduce((a, b) => a + b, 0) / signal
    : null;

  if (signalLine === null) return;

  // Previous MACD and signal
  const prevMacd = macdArr.length > signal ? macdArr[macdArr.length - signal - 1] : null;
  const prevSignal = macdArr.length > signal ? macdArr.slice(-signal - 1, -1).reduce((a, b) => a + b, 0) / signal : null;

  // Buy when MACD crosses above signal, sell when crosses below
  if (prevMacd !== null && prevSignal !== null) {
    if (prevMacd < prevSignal && macdLine > signalLine && (!bt.positions[ticker] || bt.positions[ticker] === 0)) {
      const sharesToBuy = Math.floor(bt.cash / dailyData[ticker].close);
      if (sharesToBuy > 0) bt.buy(ticker, sharesToBuy, dailyData[ticker].close, currentDate);
    } else if (prevMacd > prevSignal && macdLine < signalLine && bt.positions[ticker] > 0) {
      bt.sell(ticker, bt.positions[ticker], dailyData[ticker].close, currentDate);
    }
  }
}

/**
 * Donchian Channel Breakout Strategy.
 * Buys when price breaks above highest high of N days, sells on lowest low.
 * @param {import('./backtester').Backtester} bt
 * @param {Date} currentDate
 * @param {Object.<string, Object>} dailyData
 * @param {Object} strategyParams - { window: 20 }
 */
function donchianChannelBreakout(bt, currentDate, dailyData, strategyParams = { window: 20 }) {
  const { window } = strategyParams;
  const ticker = Object.keys(dailyData)[0];
  const historicalData = bt.fetchedData[ticker];
  if (!historicalData) return;

  const idx = historicalData.findIndex(d => d.date === formatDate(currentDate));
  if (idx < window) return;

  const windowData = historicalData.slice(idx - window, idx);
  const highestHigh = Math.max(...windowData.map(d => d.close));
  const lowestLow = Math.min(...windowData.map(d => d.close));
  const price = dailyData[ticker].close;

  // Buy breakout
  if (price > highestHigh && (!bt.positions[ticker] || bt.positions[ticker] === 0)) {
    const sharesToBuy = Math.floor(bt.cash / price);
    if (sharesToBuy > 0) bt.buy(ticker, sharesToBuy, price, currentDate);
  }
  // Sell breakdown
  else if (price < lowestLow && bt.positions[ticker] > 0) {
    bt.sell(ticker, bt.positions[ticker], price, currentDate);
  }
}

/**
 * Stochastic Oscillator Strategy.
 * Buys when %K crosses above %D below threshold, sells when above.
 * @param {import('./backtester').Backtester} bt
 * @param {Date} currentDate
 * @param {Object.<string, Object>} dailyData
 * @param {Object} strategyParams - { kPeriod: 14, dPeriod: 3, oversold: 20, overbought: 80 }
 */
function stochasticOscillator(bt, currentDate, dailyData, strategyParams = { kPeriod: 14, dPeriod: 3, oversold: 20, overbought: 80 }) {
  const { kPeriod, dPeriod, oversold, overbought } = strategyParams;
  const ticker = Object.keys(dailyData)[0];
  const historicalData = bt.fetchedData[ticker];
  if (!historicalData) return;

  const idx = historicalData.findIndex(d => d.date === formatDate(currentDate));
  if (idx < kPeriod + dPeriod - 1) return;

  const kWindow = historicalData.slice(idx - kPeriod + 1, idx + 1);
  const high = Math.max(...kWindow.map(d => d.close));
  const low = Math.min(...kWindow.map(d => d.close));
  const close = dailyData[ticker].close;
  const percentK = ((close - low) / (high - low)) * 100;

  // Calculate %D as SMA of %K
  let percentDs = [];
  for (let i = 0; i < dPeriod; i++) {
    const subWindow = historicalData.slice(idx - kPeriod - i + 1, idx - i + 1);
    const subHigh = Math.max(...subWindow.map(d => d.close));
    const subLow = Math.min(...subWindow.map(d => d.close));
    const subClose = historicalData[idx - i].close;
    percentDs.push(((subClose - subLow) / (subHigh - subLow)) * 100);
  }
  const percentD = percentDs.reduce((a, b) => a + b, 0) / percentDs.length;

  // Buy when %K crosses above %D below oversold, sell when above overbought
  if (percentK < oversold && percentK > percentD && (!bt.positions[ticker] || bt.positions[ticker] === 0)) {
    const sharesToBuy = Math.floor(bt.cash / close);
    if (sharesToBuy > 0) bt.buy(ticker, sharesToBuy, close, currentDate);
  } else if (percentK > overbought && percentK < percentD && bt.positions[ticker] > 0) {
    bt.sell(ticker, bt.positions[ticker], close, currentDate);
  }
}

/**
 * Custom Strategy.
 * Placeholder for user-defined logic.
 * @param {import('./backtester').Backtester} bt
 * @param {Date} currentDate
 * @param {Object.<string, Object>} dailyData
 * @param {Object} strategyParams - User-defined parameters or logic.
 */
function customStrategy(bt, currentDate, dailyData, strategyParams = {}) {
  // Implement user-defined logic here, e.g., via a DSL or JSON rules.
  // For now, this is a placeholder.
  // Example: if (dailyData[ticker].close > strategyParams.threshold) { ... }
}

// --- Export all predefined strategies here ---
module.exports = {
  maCrossoverStrategy,
  bollingerBands,
  MACD,
  donchianChannelBreakout,
  stochasticOscillator,
};