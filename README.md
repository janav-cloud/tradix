# Stock Backtester App

A simple web application for backtesting trading strategies on historical stock data.  
Visualize stock price charts, select strategies, and run backtests with ease.

## Features

- Interactive stock price chart with date selection
- Backtest multiple strategies with customizable parameters
- Fetch and select tickers from a dropdown (populated from your database)
- Clean, modern UI with chart and results display

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/stock-backtester-app.git
cd stock-backtester-app/stock-backtester
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up the Database

The app uses SQLite by default.  
You need two tables: `stock_data` and `tickers`.

#### Create the Tables

Note: Ensure to create a folder in the root directory of your project named "database". This is where your stock_data.db will reside

If you wish to use any other naming conventions - make sure to change the paths in the below listed files

```
lib\db.js
lib\seed.js
```

You can use any SQLite client or the CLI:

```sql
-- stock_data table
CREATE TABLE stock_data (
  ticker TEXT NOT NULL,
  date TEXT NOT NULL,
  open REAL,
  high REAL,
  low REAL,
  close REAL
);

--- Optional: You can make ticker, date as a COMPOSITE PRIMARY KEY and even create INDEXES for faster querying.

-- tickers table
CREATE TABLE tickers (
  ticker TEXT PRIMARY KEY
);
```

#### Seed the Tickers Table

Run the provided seed script to populate the `tickers` table:

```bash
node seed.js
```

#### Populate the Stock Data

You can use your own data source (CSV, API, etc.) to fill the `stock_data` table.  
Each row should have: `ticker`, `date`, `open`, `high`, `low`, `close`.

### 4. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to use the app.

## Notes

- The `/api/tickers` endpoint fetches unique tickers from the database for the dropdown.
- The backtester expects data in the `stock_data` table for the selected ticker and date range.

---

**Made with ❤️ by Janav Dua**