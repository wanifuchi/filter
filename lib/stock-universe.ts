/**
 * スクリーニング対象の主要銘柄リスト
 * セクター別に分類された約100銘柄
 */

export interface StockInfo {
  symbol: string;
  name: string;
  sector: string;
}

export const STOCK_UNIVERSE: StockInfo[] = [
  // Tech Giants (FAANG+)
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Technology' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive' },

  // Semiconductors
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology' },
  { symbol: 'INTC', name: 'Intel Corporation', sector: 'Technology' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology' },
  { symbol: 'QCOM', name: 'QUALCOMM Inc.', sector: 'Technology' },
  { symbol: 'MU', name: 'Micron Technology', sector: 'Technology' },
  { symbol: 'TSM', name: 'Taiwan Semiconductor', sector: 'Technology' },
  { symbol: 'ASML', name: 'ASML Holding', sector: 'Technology' },
  { symbol: 'KLAC', name: 'KLA Corporation', sector: 'Technology' },
  { symbol: 'LRCX', name: 'Lam Research', sector: 'Technology' },
  { symbol: 'AMAT', name: 'Applied Materials', sector: 'Technology' },

  // AI & Cloud
  { symbol: 'PLTR', name: 'Palantir Technologies', sector: 'Technology' },
  { symbol: 'SNOW', name: 'Snowflake Inc.', sector: 'Technology' },
  { symbol: 'CRWD', name: 'CrowdStrike Holdings', sector: 'Technology' },
  { symbol: 'NET', name: 'Cloudflare Inc.', sector: 'Technology' },
  { symbol: 'DDOG', name: 'Datadog Inc.', sector: 'Technology' },
  { symbol: 'PANW', name: 'Palo Alto Networks', sector: 'Technology' },
  { symbol: 'NOW', name: 'ServiceNow Inc.', sector: 'Technology' },
  { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology' },

  // Software
  { symbol: 'ORCL', name: 'Oracle Corporation', sector: 'Technology' },
  { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology' },
  { symbol: 'CSCO', name: 'Cisco Systems', sector: 'Technology' },
  { symbol: 'IBM', name: 'IBM Corporation', sector: 'Technology' },

  // Financials
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financials' },
  { symbol: 'BAC', name: 'Bank of America', sector: 'Financials' },
  { symbol: 'GS', name: 'Goldman Sachs', sector: 'Financials' },
  { symbol: 'MS', name: 'Morgan Stanley', sector: 'Financials' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financials' },
  { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financials' },
  { symbol: 'AXP', name: 'American Express', sector: 'Financials' },
  { symbol: 'WFC', name: 'Wells Fargo', sector: 'Financials' },
  { symbol: 'C', name: 'Citigroup Inc.', sector: 'Financials' },

  // Healthcare
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare' },
  { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific', sector: 'Healthcare' },
  { symbol: 'LLY', name: 'Eli Lilly and Company', sector: 'Healthcare' },
  { symbol: 'MRK', name: 'Merck & Co.', sector: 'Healthcare' },
  { symbol: 'ABT', name: 'Abbott Laboratories', sector: 'Healthcare' },

  // Energy
  { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy' },
  { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Energy' },
  { symbol: 'COP', name: 'ConocoPhillips', sector: 'Energy' },
  { symbol: 'SLB', name: 'Schlumberger', sector: 'Energy' },
  { symbol: 'EOG', name: 'EOG Resources', sector: 'Energy' },

  // Consumer
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer' },
  { symbol: 'COST', name: 'Costco Wholesale', sector: 'Consumer' },
  { symbol: 'HD', name: 'Home Depot', sector: 'Consumer' },
  { symbol: 'NKE', name: 'Nike Inc.', sector: 'Consumer' },
  { symbol: 'SBUX', name: 'Starbucks Corporation', sector: 'Consumer' },
  { symbol: 'MCD', name: 'McDonald\'s Corporation', sector: 'Consumer' },
  { symbol: 'DIS', name: 'Walt Disney Company', sector: 'Consumer' },
  { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer' },
  { symbol: 'KO', name: 'Coca-Cola Company', sector: 'Consumer' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer' },

  // Communications
  { symbol: 'T', name: 'AT&T Inc.', sector: 'Communications' },
  { symbol: 'VZ', name: 'Verizon Communications', sector: 'Communications' },
  { symbol: 'TMUS', name: 'T-Mobile US', sector: 'Communications' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communications' },

  // Industrials
  { symbol: 'BA', name: 'Boeing Company', sector: 'Industrials' },
  { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials' },
  { symbol: 'GE', name: 'General Electric', sector: 'Industrials' },
  { symbol: 'UPS', name: 'United Parcel Service', sector: 'Industrials' },
  { symbol: 'HON', name: 'Honeywell International', sector: 'Industrials' },
  { symbol: 'RTX', name: 'Raytheon Technologies', sector: 'Industrials' },

  // Materials & Chemicals
  { symbol: 'LIN', name: 'Linde plc', sector: 'Materials' },
  { symbol: 'APD', name: 'Air Products and Chemicals', sector: 'Materials' },

  // Real Estate
  { symbol: 'AMT', name: 'American Tower', sector: 'Real Estate' },
  { symbol: 'PLD', name: 'Prologis Inc.', sector: 'Real Estate' },

  // Utilities
  { symbol: 'NEE', name: 'NextEra Energy', sector: 'Utilities' },
  { symbol: 'DUK', name: 'Duke Energy', sector: 'Utilities' },

  // ETFs (Popular)
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', sector: 'ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'ETF' },
  { symbol: 'IWM', name: 'iShares Russell 2000', sector: 'ETF' },
  { symbol: 'SOXL', name: 'Direxion Semiconductor Bull 3X', sector: 'ETF' },
  { symbol: 'TQQQ', name: 'ProShares UltraPro QQQ', sector: 'ETF' },
  { symbol: 'SOXX', name: 'iShares Semiconductor ETF', sector: 'ETF' },
];

/**
 * セクター別に銘柄を取得
 */
export function getStocksBySector(sector: string): StockInfo[] {
  return STOCK_UNIVERSE.filter(stock => stock.sector === sector);
}

/**
 * 全セクターのリストを取得
 */
export function getAllSectors(): string[] {
  const sectors = new Set(STOCK_UNIVERSE.map(stock => stock.sector));
  return Array.from(sectors).sort();
}

/**
 * 銘柄シンボルのリストを取得
 */
export function getAllSymbols(): string[] {
  return STOCK_UNIVERSE.map(stock => stock.symbol);
}
