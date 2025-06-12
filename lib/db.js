// lib/db.js
const Database = require('better-sqlite3');
const path = require('path');

// --- Database Path and COnnection ---
const DB_PATH = path.resolve(process.cwd(), 'database', 'stock_data.db');

let db = null; 

function getDb() {
  if (!db) {
    try {
      db = new Database(DB_PATH, { verbose: console.log }); 
      console.log('Database connected successfully at:', DB_PATH);
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }
  return db;
}

// --- Fetching Stock Data Query ---
function getStockData(ticker, startDate, endDate) {
  const dbInstance = getDb();
  let query = 'SELECT ticker, date, open, high, low, close FROM stock_data WHERE ticker = ?';
  const params = [ticker.toUpperCase()];

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY date ASC';

  try {
    const stmt = dbInstance.prepare(query);
    const data = stmt.all(params);
    return data;
  } catch (error) {
    console.error(`Error fetching data for ${ticker}:`, error);
    throw error;
  }
}

// --- Fetching Tickers ---
function getUniqueTickers() {
  const dbInstance = getDb();
  const query = 'SELECT ticker FROM tickers';
  try {
    const stmt = dbInstance.prepare(query);
    const rows = stmt.all();
    return rows.map(row => row.ticker);
  } catch (error) {
    console.error('Error fetching unique tickers:', error);
    throw error;
  }
}

// --- Exporting the Modules ---
module.exports = {
  getDb,
  getStockData,
  getUniqueTickers,
};