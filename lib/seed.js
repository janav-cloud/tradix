const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('../database/stock_data.db');

// // --- Comment out everything else to use this query. Use with CAUTION! ---
// const dropQuery = `
//     DROP TABLE tickers;
// `;
// db.exec(dropQuery);
// console.log("tickers TABLE dropped from Database.")

// --- Creation, Insertion, Selection of tickers for verification ---
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS tickers (
    ticker VARCHAR(10) PRIMARY KEY
  );
`;
db.exec(createTableQuery);
console.log('Table "tickers" is ready.');

const tickerFilePath = '../database/tickers.txt';

try {
  const fileContent = fs.readFileSync(tickerFilePath, 'utf8');
  const tickers = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const insertStmt = db.prepare('INSERT OR IGNORE INTO tickers (ticker) VALUES (?)');

  db.transaction(() => {
    for (const ticker of tickers) {
      insertStmt.run(ticker);
    }
  })();

  console.log(`Inserted ${tickers.length} tickers from ${tickerFilePath}.`);

} catch (error) {
  console.error(`Error processing tickers from ${tickerFilePath}:`, error.message);
}

const selectTableQuery = `
  SELECT ticker FROM tickers ORDER BY ticker;
`;
const rows = db.prepare(selectTableQuery).all();
console.log('\nTickers currently in database:');
if (rows.length > 0) {
  rows.forEach(row => console.log(row.ticker));
} else {
  console.log('No tickers found.');
}

db.close();
console.log('Database connection closed.');