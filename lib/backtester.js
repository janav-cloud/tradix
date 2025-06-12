// lib/backtester.js
const { ANNUALIZATION_FACTOR, RISK_FREE_RATE, parseDate, formatDate } = require('./utils');

class Backtester {
  constructor(initialCapital = 100000.0) {
    this.initialCapital = initialCapital;
    this.cash = initialCapital;
    this.positions = {}; // Stores current stock positions (ticker: shares)
    this.portfolioHistory = []; // Logs daily portfolio value
    this.transactionsLog = []; // Logs buy/sell transactions
    this.fetchedData = {}; // Stores fetched historical data by ticker { 'AAPL': [{date: '...', close: ...}] }
    this.simulationStartDate = null; // Actual date strategy begins simulation
  }

  /**
   * Runs the specified trading strategy over the historical data.
   * @param {Function} strategyFunc - The strategy function to execute.
   * It should accept (bt: Backtester, currentDate: Date, dailyData: Object).
   * @param {Object.<string, Array<Object>>} data - A dictionary where keys are ticker symbols and values are arrays
   * containing historical data for each ticker (from lib/db.js).
   * @param {string} simulationStartDateStr - The date from which the strategy simulation should begin ('YYYY-MM-DD').
   * @returns {Object} - An object containing performance analysis results.
   */
  runStrategy(strategyFunc, data, simulationStartDateStr) {
    if (!data || Object.keys(data).length === 0) {
      return { error: "No data provided to run strategy." };
    }

    this.fetchedData = data; // Store the full fetched data for strategy access

    this.simulationStartDate = parseDate(simulationStartDateStr);

    const firstTicker = Object.keys(data)[0];
    if (!data[firstTicker] || data[firstTicker].length === 0) {
      return { error: `Data for ticker '${firstTicker}' is empty.` };
    }

    const allFetchedDates = [...new Set(
        Object.values(data).flatMap(df => df.map(item => item.date))
    )].sort((a, b) => new Date(a) - new Date(b));


    const datesToSimulate = allFetchedDates.filter(d => parseDate(d) >= this.simulationStartDate);

    if (datesToSimulate.length === 0) {
      return { error: `No simulation dates found after ${simulationStartDateStr} in the fetched data.` };
    }

    for (const currentDateStr of datesToSimulate) {
      const currentDate = parseDate(currentDateStr);

      const dailyData = {};
      for (const ticker in data) {
        const dailyRecord = data[ticker].find(item => item.date === currentDateStr);
        if (dailyRecord) {
          dailyData[ticker] = dailyRecord;
        }
      }

      if (Object.keys(dailyData).length === 0) {
        continue;
      }

      // --- Execute the trading strategy for the current day ---
      strategyFunc(this, currentDate, dailyData);

      // --- Calculate and log the current portfolio value ---
      let currentPortfolioValue = this.cash;
      for (const ticker in this.positions) {
        const shares = this.positions[ticker];
        if (dailyData[ticker] && dailyData[ticker].close) {
          currentPortfolioValue += shares * dailyData[ticker].close;
        }
      }

      this.portfolioHistory.push({
        date: currentDateStr,
        cash: parseFloat(this.cash.toFixed(2)),
        positions: { ...this.positions },
        total_value: parseFloat(currentPortfolioValue.toFixed(2))
      });
    }

    return this.analyzePerformance();
  }

  buy(ticker, shares, price, currentDate) {
    const cost = shares * price;
    if (this.cash >= cost) {
      this.cash -= cost;
      this.positions[ticker] = (this.positions[ticker] || 0) + shares;
      this.transactionsLog.push({
        date: formatDate(currentDate),
        type: 'BUY',
        ticker: ticker,
        shares: shares,
        price: parseFloat(price.toFixed(4)),
        cost: parseFloat(cost.toFixed(2)),
        revenue: null,
        cash_after: parseFloat(this.cash.toFixed(2))
      });
      // console.log(`[${formatDate(currentDate)}] BUY ${shares} of ${ticker} at ${price.toFixed(2)}. Cash: ${this.cash.toFixed(2)}`);
    }
  }

  sell(ticker, shares, price, currentDate) {
    if (this.positions[ticker] && this.positions[ticker] >= shares) {
      const revenue = shares * price;
      this.cash += revenue;
      this.positions[ticker] -= shares;
      if (this.positions[ticker] === 0) {
        delete this.positions[ticker];
      }
      this.transactionsLog.push({
        date: formatDate(currentDate),
        type: 'SELL',
        ticker: ticker,
        shares: shares,
        price: parseFloat(price.toFixed(4)),
        cost: null,
        revenue: parseFloat(revenue.toFixed(2)),
        cash_after: parseFloat(this.cash.toFixed(2))
      });
      // console.log(`[${formatDate(currentDate)}] SELL ${shares} of ${ticker} at ${price.toFixed(2)}. Cash: ${this.cash.toFixed(2)}`);
    }
  }

  analyzePerformance() {
    const results = {};

    if (this.portfolioHistory.length === 0) {
      return { error: "No portfolio history to analyze. The simulation might not have run or generated any records." };
    }

    // --- Convert portfolioHistory to a more DataFrame-like structure for calculations ---
    const portfolioDf = this.portfolioHistory.map(record => ({
      date: parseDate(record.date),
      total_value: record.total_value
    })).sort((a, b) => a.date - b.date); // Ensure sorted by date

    // --- Filter to only include dates from simulation start ---
    const filteredPortfolioDf = portfolioDf.filter(record => record.date >= this.simulationStartDate);

    if (filteredPortfolioDf.length === 0) {
        return { error: `No portfolio history available from simulation start date ${formatDate(this.simulationStartDate)}. ` +
                         `This might indicate insufficient data or simulation period.`};
    }

    const initialValue = filteredPortfolioDf[0].total_value;
    const finalValue = filteredPortfolioDf[filteredPortfolioDf.length - 1].total_value;
    const totalReturn = (finalValue - initialValue) / initialValue * 100;

    results.initial_capital = parseFloat(initialValue.toFixed(2));
    results.final_portfolio_value = parseFloat(finalValue.toFixed(2));
    results.total_return_percent = parseFloat(totalReturn.toFixed(2));

    // Calculate daily returns
    const dailyReturns = [];
    for (let i = 1; i < filteredPortfolioDf.length; i++) {
      const prevValue = filteredPortfolioDf[i - 1].total_value;
      const currValue = filteredPortfolioDf[i].total_value;
      if (prevValue !== 0) { // Avoid division by zero
        dailyReturns.push((currValue - prevValue) / prevValue);
      } else {
        dailyReturns.push(0);
      }
    }

    if (dailyReturns.length === 0) {
      results.message = "Not enough daily returns to calculate advanced metrics. This can happen if no trades were made or the simulation period is too short.";
      results.annualized_return_percent = "N/A";
      results.annualized_volatility_percent = "N/A";
      results.sharpe_ratio = "N/A";
      results.max_drawdown_percent = "N/A";
      results.calmar_ratio = "N/A";
      results.sortino_ratio = "N/A";
    } else {
      const meanDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
      const annualizedReturn = (1 + meanDailyReturn) ** ANNUALIZATION_FACTOR - 1;
      results.annualized_return_percent = parseFloat((annualizedReturn * 100).toFixed(2));

      const dailyVolatility = Math.sqrt(
        dailyReturns.reduce((sum, r) => sum + (r - meanDailyReturn) ** 2, 0) / dailyReturns.length
      );
      const annualizedVolatility = dailyVolatility * Math.sqrt(ANNUALIZATION_FACTOR);
      results.annualized_volatility_percent = parseFloat((annualizedVolatility * 100).toFixed(2));

      if (annualizedVolatility !== 0) {
        const sharpeRatio = (annualizedReturn - RISK_FREE_RATE) / annualizedVolatility;
        results.sharpe_ratio = parseFloat(sharpeRatio.toFixed(2));
      } else {
        results.sharpe_ratio = "N/A";
      }

      // --- Max Drawdown calculation ---
      let maxDrawdown = 0;
      let peak = initialValue;
      for (const record of filteredPortfolioDf) {
        if (record.total_value > peak) {
          peak = record.total_value;
        }
        const drawdown = (record.total_value - peak) / peak;
        if (drawdown < maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
      results.max_drawdown_percent = parseFloat((maxDrawdown * 100).toFixed(2));

      // Calmar Ratio
      if (Math.abs(maxDrawdown) > 0) {
        const calmarRatio = annualizedReturn / Math.abs(maxDrawdown);
        results.calmar_ratio = parseFloat(calmarRatio.toFixed(2));
      } else {
        results.calmar_ratio = "N/A";
      }

      // Sortino Ratio
      const downsideReturns = dailyReturns.filter(r => r < 0);
      if (downsideReturns.length > 0) {
        const meanDownsideReturn = downsideReturns.reduce((sum, r) => sum + r, 0) / downsideReturns.length;
        const downsideDeviation = Math.sqrt(
          downsideReturns.reduce((sum, r) => sum + (r - meanDownsideReturn) ** 2, 0) / downsideReturns.length
        ) * Math.sqrt(ANNUALIZATION_FACTOR);
        if (downsideDeviation !== 0) {
          const sortinoRatio = (annualizedReturn - RISK_FREE_RATE) / downsideDeviation;
          results.sortino_ratio = parseFloat(sortinoRatio.toFixed(2));
        } else {
          results.sortino_ratio = "N/A";
        }
      } else {
        results.sortino_ratio = "N/A (No downside volatility)";
      }
    }

    // --- Format transaction and portfolio history dates for JSON serialization ---
    const formattedTransactions = this.transactionsLog.map(transaction => ({
      ...transaction,
      date: transaction.date
    }));
    results.transactions = formattedTransactions;

    const formattedPortfolioHistory = this.portfolioHistory.map(record => ({
      ...record,
      date: record.date
    }));
    results.portfolio_history = formattedPortfolioHistory;

    return results;
  }
}

module.exports = Backtester;