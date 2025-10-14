/**
 * 米国株式市場の全銘柄リストを取得
 *
 * このファイルでは、NYSE + NASDAQ の約8000銘柄を取得します。
 *
 * 実装方法:
 * 1. Yahoo Finance Screener APIを使用（推奨）
 * 2. または静的ファイルから読み込み
 *
 * 現在は、主要な米国株式の静的リストを使用しています。
 * 本番環境では、動的に取得するAPIに置き換えることができます。
 */

export interface StockSymbol {
  symbol: string;
  name: string;
  exchange: 'NYSE' | 'NASDAQ' | 'AMEX';
  sector?: string;
  industry?: string;
  marketCap?: number;
}

/**
 * 全米国株式銘柄を取得
 *
 * 注意: 現在は主要銘柄のみを含む静的リストです。
 * 将来的には、Yahoo Finance Screener APIまたは他のデータソースから
 * 動的に8000+銘柄を取得するように拡張できます。
 */
export async function getAllUSStockSymbols(): Promise<StockSymbol[]> {
  // Phase 1: 静的リストから取得（開発用）
  // 主要な米国株式銘柄リスト
  const staticSymbols: StockSymbol[] = [
    // Technology - FAANG+
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical' },
    { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical' },

    // Technology - Other Major
    { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ', sector: 'Communication Services' },
    { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'CRM', name: 'Salesforce Inc.', exchange: 'NYSE', sector: 'Technology' },
    { symbol: 'ORCL', name: 'Oracle Corporation', exchange: 'NYSE', sector: 'Technology' },
    { symbol: 'ADBE', name: 'Adobe Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'CSCO', name: 'Cisco Systems Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'AVGO', name: 'Broadcom Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'QCOM', name: 'QUALCOMM Incorporated', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'TXN', name: 'Texas Instruments Incorporated', exchange: 'NASDAQ', sector: 'Technology' },

    // Finance
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', sector: 'Financial Services' },
    { symbol: 'BAC', name: 'Bank of America Corporation', exchange: 'NYSE', sector: 'Financial Services' },
    { symbol: 'WFC', name: 'Wells Fargo & Company', exchange: 'NYSE', sector: 'Financial Services' },
    { symbol: 'GS', name: 'The Goldman Sachs Group Inc.', exchange: 'NYSE', sector: 'Financial Services' },
    { symbol: 'MS', name: 'Morgan Stanley', exchange: 'NYSE', sector: 'Financial Services' },
    { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE', sector: 'Financial Services' },
    { symbol: 'MA', name: 'Mastercard Incorporated', exchange: 'NYSE', sector: 'Financial Services' },
    { symbol: 'AXP', name: 'American Express Company', exchange: 'NYSE', sector: 'Financial Services' },

    // Healthcare
    { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE', sector: 'Healthcare' },
    { symbol: 'UNH', name: 'UnitedHealth Group Incorporated', exchange: 'NYSE', sector: 'Healthcare' },
    { symbol: 'PFE', name: 'Pfizer Inc.', exchange: 'NYSE', sector: 'Healthcare' },
    { symbol: 'ABBV', name: 'AbbVie Inc.', exchange: 'NYSE', sector: 'Healthcare' },
    { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.', exchange: 'NYSE', sector: 'Healthcare' },
    { symbol: 'MRK', name: 'Merck & Co. Inc.', exchange: 'NYSE', sector: 'Healthcare' },
    { symbol: 'ABT', name: 'Abbott Laboratories', exchange: 'NYSE', sector: 'Healthcare' },
    { symbol: 'LLY', name: 'Eli Lilly and Company', exchange: 'NYSE', sector: 'Healthcare' },

    // Consumer Goods
    { symbol: 'PG', name: 'The Procter & Gamble Company', exchange: 'NYSE', sector: 'Consumer Defensive' },
    { symbol: 'KO', name: 'The Coca-Cola Company', exchange: 'NYSE', sector: 'Consumer Defensive' },
    { symbol: 'PEP', name: 'PepsiCo Inc.', exchange: 'NASDAQ', sector: 'Consumer Defensive' },
    { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE', sector: 'Consumer Defensive' },
    { symbol: 'COST', name: 'Costco Wholesale Corporation', exchange: 'NASDAQ', sector: 'Consumer Defensive' },
    { symbol: 'NKE', name: 'NIKE Inc.', exchange: 'NYSE', sector: 'Consumer Cyclical' },
    { symbol: 'MCD', name: 'McDonald\'s Corporation', exchange: 'NYSE', sector: 'Consumer Cyclical' },
    { symbol: 'SBUX', name: 'Starbucks Corporation', exchange: 'NASDAQ', sector: 'Consumer Cyclical' },

    // Energy
    { symbol: 'XOM', name: 'Exxon Mobil Corporation', exchange: 'NYSE', sector: 'Energy' },
    { symbol: 'CVX', name: 'Chevron Corporation', exchange: 'NYSE', sector: 'Energy' },
    { symbol: 'COP', name: 'ConocoPhillips', exchange: 'NYSE', sector: 'Energy' },
    { symbol: 'SLB', name: 'Schlumberger Limited', exchange: 'NYSE', sector: 'Energy' },

    // Industrial
    { symbol: 'BA', name: 'The Boeing Company', exchange: 'NYSE', sector: 'Industrials' },
    { symbol: 'CAT', name: 'Caterpillar Inc.', exchange: 'NYSE', sector: 'Industrials' },
    { symbol: 'GE', name: 'General Electric Company', exchange: 'NYSE', sector: 'Industrials' },
    { symbol: 'HON', name: 'Honeywell International Inc.', exchange: 'NASDAQ', sector: 'Industrials' },
    { symbol: 'UPS', name: 'United Parcel Service Inc.', exchange: 'NYSE', sector: 'Industrials' },

    // Communication
    { symbol: 'T', name: 'AT&T Inc.', exchange: 'NYSE', sector: 'Communication Services' },
    { symbol: 'VZ', name: 'Verizon Communications Inc.', exchange: 'NYSE', sector: 'Communication Services' },
    { symbol: 'DIS', name: 'The Walt Disney Company', exchange: 'NYSE', sector: 'Communication Services' },
    { symbol: 'CMCSA', name: 'Comcast Corporation', exchange: 'NASDAQ', sector: 'Communication Services' },

    // Real Estate
    { symbol: 'AMT', name: 'American Tower Corporation', exchange: 'NYSE', sector: 'Real Estate' },
    { symbol: 'PLD', name: 'Prologis Inc.', exchange: 'NYSE', sector: 'Real Estate' },
    { symbol: 'CCI', name: 'Crown Castle Inc.', exchange: 'NYSE', sector: 'Real Estate' },

    // Materials
    { symbol: 'LIN', name: 'Linde plc', exchange: 'NYSE', sector: 'Basic Materials' },
    { symbol: 'APD', name: 'Air Products and Chemicals Inc.', exchange: 'NYSE', sector: 'Basic Materials' },
    { symbol: 'DD', name: 'DuPont de Nemours Inc.', exchange: 'NYSE', sector: 'Basic Materials' },

    // Utilities
    { symbol: 'NEE', name: 'NextEra Energy Inc.', exchange: 'NYSE', sector: 'Utilities' },
    { symbol: 'DUK', name: 'Duke Energy Corporation', exchange: 'NYSE', sector: 'Utilities' },
    { symbol: 'SO', name: 'The Southern Company', exchange: 'NYSE', sector: 'Utilities' },

    // Crypto-related (ユーザーが興味を持っていた$WULF等)
    { symbol: 'MARA', name: 'Marathon Digital Holdings Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'RIOT', name: 'Riot Platforms Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'COIN', name: 'Coinbase Global Inc.', exchange: 'NASDAQ', sector: 'Financial Services' },
    { symbol: 'WULF', name: 'TeraWulf Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'CLSK', name: 'CleanSpark Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'CIFR', name: 'Cipher Mining Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'BTBT', name: 'Bit Digital Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'HUT', name: 'Hut 8 Mining Corp.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'BITF', name: 'Bitfarms Ltd.', exchange: 'NASDAQ', sector: 'Technology' },
  ];

  return staticSymbols;
}

/**
 * Phase 2実装案: 動的に全銘柄を取得
 *
 * この関数は将来的に実装予定です。
 * Yahoo Finance Screener APIまたは他のデータソースから
 * 全8000+銘柄を取得します。
 *
 * 例:
 * - FMP (Financial Modeling Prep) API
 * - Polygon.io API
 * - IEX Cloud API
 * - または独自のWebスクレイピング
 */
export async function getAllUSStockSymbolsDynamic(): Promise<StockSymbol[]> {
  // TODO: 本番環境ではこの関数を使用
  // 現在は未実装
  throw new Error('動的取得は未実装です。静的リストを使用してください。');
}

/**
 * 銘柄リストをSupabaseに保存
 */
export async function saveSymbolsToSupabase(symbols: StockSymbol[]): Promise<void> {
  const { getSupabaseAdminClient } = await import('./supabase');
  const supabase = getSupabaseAdminClient();

  // バッチで挿入（1000件ずつ）
  const batchSize = 1000;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);

    const { error } = await supabase.from('stocks').upsert(
      batch.map(s => ({
        symbol: s.symbol,
        name: s.name,
        sector: s.sector,
        exchange: s.exchange,
        market_cap: s.marketCap,
        last_updated: new Date().toISOString(),
      })),
      { onConflict: 'symbol' }
    );

    if (error) {
      console.error(`バッチ ${i / batchSize + 1} の保存エラー:`, error);
      throw error;
    }
  }

  console.log(`${symbols.length}銘柄をSupabaseに保存しました`);
}
