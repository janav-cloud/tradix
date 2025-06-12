import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

function BacktestResults({ results }) {
  if (!results) return null;

  const {
    initial_capital,
    final_portfolio_value,
    total_return_percent,
    annualized_return_percent,
    annualized_volatility_percent,
    sharpe_ratio,
    max_drawdown_percent,
    calmar_ratio,
    sortino_ratio,
    transactions,
    portfolio_history,
    message
  } = results;

  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;
  const totalPages = transactions ? Math.ceil(transactions.length / transactionsPerPage) : 1;

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions ? transactions.slice(indexOfFirstTransaction, indexOfLastTransaction) : [];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Process portfolio history with validation
    const formattedPortfolioHistory = Array.isArray(portfolio_history)
    ? portfolio_history
        .map((item, index) => {
          // Defensive: handle both string and number values
          const date = new Date(item?.date);
          const value = Number(item?.total_value);
          if (isNaN(date.getTime()) || isNaN(value)) return null;
          return {
            date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
            value,
          };
        })
        .filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      {message && (
        <div className="bg-gray-700 border border-green-600 text-green-300 px-4 py-2 rounded-lg text-sm font-medium text-center">
          {message}
        </div>
      )}

      <section className="bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Key Performance Metrics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <span className="block text-sm text-gray-400">Initial Capital</span>
            <span className="font-semibold text-gray-200">
              {typeof initial_capital === 'number' && !isNaN(initial_capital)
                ? `$${initial_capital.toFixed(2)}`
                : 'N/A'}
            </span>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <span className="block text-sm text-gray-400">Final Portfolio Value</span>
            <span className="font-semibold text-gray-200">
              {typeof final_portfolio_value === 'number' && !isNaN(final_portfolio_value)
                ? `$${final_portfolio_value.toFixed(2)}`
                : 'N/A'}
            </span>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <span className="block text-sm text-gray-400">Total Return</span>
            <span className={`font-semibold ${typeof total_return_percent === 'number' && total_return_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {typeof total_return_percent === 'number' && !isNaN(total_return_percent)
                ? `${total_return_percent.toFixed(2)}%`
                : 'N/A'}
            </span>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <span className="block text-sm text-gray-400">Annualized Return</span>
            <span className="font-semibold text-gray-200">
              {typeof annualized_return_percent === 'number' && !isNaN(annualized_return_percent)
                ? `${annualized_return_percent.toFixed(2)}%`
                : 'N/A'}
            </span>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <span className="block text-sm text-gray-400">Annualized Volatility</span>
            <span className="font-semibold text-gray-200">
              {typeof annualized_volatility_percent === 'number' && !isNaN(annualized_volatility_percent)
                ? `${annualized_volatility_percent.toFixed(2)}%`
                : 'N/A'}
            </span>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <span className="block text-sm text-gray-400">Sharpe Ratio</span>
            <span className="font-semibold text-gray-200">
              {typeof sharpe_ratio === 'number' && !isNaN(sharpe_ratio)
                ? sharpe_ratio.toFixed(2)
                : 'N/A'}
            </span>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <span className="block text-sm text-gray-400">Max Drawdown</span>
            <span className={`font-semibold ${typeof max_drawdown_percent === 'number' && max_drawdown_percent < 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {typeof max_drawdown_percent === 'number' && !isNaN(max_drawdown_percent)
                ? `${max_drawdown_percent.toFixed(2)}%`
                : 'N/A'}
            </span>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <span className="block text-sm text-gray-400">Calmar Ratio</span>
            <span className="font-semibold text-gray-200">
              {typeof calmar_ratio === 'number' && !isNaN(calmar_ratio)
                ? calmar_ratio.toFixed(2)
                : 'N/A'}
            </span>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <span className="block text-sm text-gray-400">Sortino Ratio</span>
            <span className="font-semibold text-gray-200">
              {typeof sortino_ratio === 'number' && !isNaN(sortino_ratio)
                ? sortino_ratio.toFixed(2)
                : 'N/A'}
            </span>
          </div>
        </div>
      </section>

      <section className="bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Portfolio Value Over Time</h3>
        {formattedPortfolioHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={formattedPortfolioHistory}
              margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
            >
              <CartesianGrid stroke="#4A5568" strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="#718096"
                tick={{ fill: "#A0AEC0", fontSize: 12 }}
                axisLine={{ stroke: "#4A5568" }}
                tickLine={{ stroke: "#4A5568" }}
                tickMargin={8}
              />
              <YAxis
                stroke="#718096"
                tick={{ fill: "#A0AEC0", fontSize: 12 }}
                axisLine={{ stroke: "#4A5568" }}
                tickLine={{ stroke: "#4A5568" }}
                domain={['auto', 'auto']}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                tickMargin={8}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#2D3748',
                  border: '1px solid #4A5568',
                  borderRadius: '8px',
                  color: '#E2E8F0',
                  fontSize: 12,
                  padding: '8px 12px',
                }}
                labelStyle={{ color: '#A0AEC0', fontWeight: '500' }}
                formatter={(value) => [`$${value.toFixed(2)}`, 'Portfolio Value']}
              />
              {(() => {
                let lineColor = "#00C805";
                if (formattedPortfolioHistory.length > 1) {
                  const first = formattedPortfolioHistory[0].value;
                  const last = formattedPortfolioHistory[formattedPortfolioHistory.length - 1].value;
                  lineColor = last >= first ? "#00C805" : "#FF3B30";
                }
                return (
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={lineColor}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: '#E2E8F0', stroke: lineColor, strokeWidth: 2 }}
                    animationDuration={800}
                    animationEasing="ease-in-out"
                  />
                );
              })()}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-gray-500 h-48 flex items-center justify-center text-sm">
            No portfolio history data available.
          </div>
        )}
      </section>

      <section className="bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Transactions Log</h3>
        {transactions && transactions.length > 0 ? (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-600 mb-4">
              <table className="min-w-full text-sm divide-y divide-gray-600">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-400">Date</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-400">Type</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-400">Ticker</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-400">Shares</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-400">Price</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-400">Cash After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {currentTransactions.map((tx, index) => (
                    <tr key={index} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-2 text-gray-200">{tx.date}</td>
                      <td className={`px-4 py-2 font-medium ${tx.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type}
                      </td>
                      <td className="px-4 py-2 text-gray-400">{tx.ticker}</td>
                      <td className="px-4 py-2 text-gray-400">{tx.shares}</td>
                      <td className="px-4 py-2 text-gray-400">${tx.price.toFixed(2)}</td>
                      <td className="px-4 py-2 text-gray-400">${tx.cash_after.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-lg text-sm ${
                  currentPage === 1
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                } transition-colors`}
              >
                Previous
              </button>
              <span className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-lg text-sm ${
                  currentPage === totalPages
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                } transition-colors`}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-4 text-sm">
            No transactions recorded for this backtest.
          </div>
        )}
      </section>
    </div>
  );
}

export default BacktestResults;