-- 主要米国株銘柄の初期データ投入
-- S&P 500の主要銘柄を中心に、時価総額上位100銘柄を登録

-- 既存データをクリア（オプション）
-- DELETE FROM stocks;

-- 主要銘柄を投入
INSERT INTO stocks (symbol, name, sector, industry, exchange, country, is_active) VALUES
-- Technology (テクノロジー)
('AAPL', 'Apple Inc.', 'Technology', 'Consumer Electronics', 'NASDAQ', 'US', true),
('MSFT', 'Microsoft Corporation', 'Technology', 'Software', 'NASDAQ', 'US', true),
('GOOGL', 'Alphabet Inc. Class A', 'Technology', 'Internet Content & Information', 'NASDAQ', 'US', true),
('GOOG', 'Alphabet Inc. Class C', 'Technology', 'Internet Content & Information', 'NASDAQ', 'US', true),
('NVDA', 'NVIDIA Corporation', 'Technology', 'Semiconductors', 'NASDAQ', 'US', true),
('META', 'Meta Platforms Inc.', 'Technology', 'Social Media', 'NASDAQ', 'US', true),
('TSLA', 'Tesla Inc.', 'Technology', 'Electric Vehicles', 'NASDAQ', 'US', true),
('AVGO', 'Broadcom Inc.', 'Technology', 'Semiconductors', 'NASDAQ', 'US', true),
('ORCL', 'Oracle Corporation', 'Technology', 'Software', 'NYSE', 'US', true),
('ADBE', 'Adobe Inc.', 'Technology', 'Software', 'NASDAQ', 'US', true),
('CRM', 'Salesforce Inc.', 'Technology', 'Software', 'NYSE', 'US', true),
('INTC', 'Intel Corporation', 'Technology', 'Semiconductors', 'NASDAQ', 'US', true),
('AMD', 'Advanced Micro Devices', 'Technology', 'Semiconductors', 'NASDAQ', 'US', true),
('QCOM', 'QUALCOMM Inc.', 'Technology', 'Semiconductors', 'NASDAQ', 'US', true),
('TXN', 'Texas Instruments', 'Technology', 'Semiconductors', 'NASDAQ', 'US', true),
('CSCO', 'Cisco Systems Inc.', 'Technology', 'Networking Equipment', 'NASDAQ', 'US', true),
('NFLX', 'Netflix Inc.', 'Technology', 'Entertainment', 'NASDAQ', 'US', true),
('IBM', 'International Business Machines', 'Technology', 'IT Services', 'NYSE', 'US', true),

-- Consumer Discretionary (一般消費財)
('AMZN', 'Amazon.com Inc.', 'Consumer Discretionary', 'Internet Retail', 'NASDAQ', 'US', true),
('HD', 'The Home Depot Inc.', 'Consumer Discretionary', 'Home Improvement Retail', 'NYSE', 'US', true),
('MCD', 'McDonald''s Corporation', 'Consumer Discretionary', 'Restaurants', 'NYSE', 'US', true),
('NKE', 'NIKE Inc.', 'Consumer Discretionary', 'Footwear', 'NYSE', 'US', true),
('SBUX', 'Starbucks Corporation', 'Consumer Discretionary', 'Restaurants', 'NASDAQ', 'US', true),
('TM', 'Toyota Motor Corporation', 'Consumer Discretionary', 'Auto Manufacturers', 'NYSE', 'US', true),

-- Healthcare (ヘルスケア)
('UNH', 'UnitedHealth Group Inc.', 'Healthcare', 'Healthcare Plans', 'NYSE', 'US', true),
('JNJ', 'Johnson & Johnson', 'Healthcare', 'Drug Manufacturers', 'NYSE', 'US', true),
('LLY', 'Eli Lilly and Company', 'Healthcare', 'Drug Manufacturers', 'NYSE', 'US', true),
('ABBV', 'AbbVie Inc.', 'Healthcare', 'Drug Manufacturers', 'NYSE', 'US', true),
('MRK', 'Merck & Co. Inc.', 'Healthcare', 'Drug Manufacturers', 'NYSE', 'US', true),
('PFE', 'Pfizer Inc.', 'Healthcare', 'Drug Manufacturers', 'NYSE', 'US', true),
('TMO', 'Thermo Fisher Scientific', 'Healthcare', 'Medical Instruments', 'NYSE', 'US', true),
('ABT', 'Abbott Laboratories', 'Healthcare', 'Medical Devices', 'NYSE', 'US', true),

-- Financials (金融)
('BRK.B', 'Berkshire Hathaway Inc. Class B', 'Financials', 'Insurance', 'NYSE', 'US', true),
('JPM', 'JPMorgan Chase & Co.', 'Financials', 'Banks', 'NYSE', 'US', true),
('V', 'Visa Inc.', 'Financials', 'Credit Services', 'NYSE', 'US', true),
('MA', 'Mastercard Inc.', 'Financials', 'Credit Services', 'NYSE', 'US', true),
('BAC', 'Bank of America Corp', 'Financials', 'Banks', 'NYSE', 'US', true),
('WFC', 'Wells Fargo & Company', 'Financials', 'Banks', 'NYSE', 'US', true),
('GS', 'The Goldman Sachs Group', 'Financials', 'Investment Banking', 'NYSE', 'US', true),
('MS', 'Morgan Stanley', 'Financials', 'Investment Banking', 'NYSE', 'US', true),

-- Communication Services (通信サービス)
('DIS', 'The Walt Disney Company', 'Communication Services', 'Entertainment', 'NYSE', 'US', true),
('T', 'AT&T Inc.', 'Communication Services', 'Telecom Services', 'NYSE', 'US', true),
('VZ', 'Verizon Communications', 'Communication Services', 'Telecom Services', 'NYSE', 'US', true),
('CMCSA', 'Comcast Corporation', 'Communication Services', 'Media', 'NASDAQ', 'US', true),

-- Consumer Staples (生活必需品)
('WMT', 'Walmart Inc.', 'Consumer Staples', 'Discount Stores', 'NYSE', 'US', true),
('PG', 'Procter & Gamble Co', 'Consumer Staples', 'Household Products', 'NYSE', 'US', true),
('KO', 'The Coca-Cola Company', 'Consumer Staples', 'Beverages', 'NYSE', 'US', true),
('PEP', 'PepsiCo Inc.', 'Consumer Staples', 'Beverages', 'NASDAQ', 'US', true),
('COST', 'Costco Wholesale Corp', 'Consumer Staples', 'Discount Stores', 'NASDAQ', 'US', true),

-- Energy (エネルギー)
('XOM', 'Exxon Mobil Corporation', 'Energy', 'Oil & Gas', 'NYSE', 'US', true),
('CVX', 'Chevron Corporation', 'Energy', 'Oil & Gas', 'NYSE', 'US', true),

-- Industrials (資本財)
('BA', 'The Boeing Company', 'Industrials', 'Aerospace & Defense', 'NYSE', 'US', true),
('CAT', 'Caterpillar Inc.', 'Industrials', 'Construction Machinery', 'NYSE', 'US', true),
('GE', 'General Electric Company', 'Industrials', 'Conglomerate', 'NYSE', 'US', true),
('UPS', 'United Parcel Service', 'Industrials', 'Logistics', 'NYSE', 'US', true),
('HON', 'Honeywell International', 'Industrials', 'Conglomerate', 'NASDAQ', 'US', true),

-- Materials (素材)
('LIN', 'Linde plc', 'Materials', 'Chemicals', 'NYSE', 'US', true),
('DD', 'DuPont de Nemours Inc.', 'Materials', 'Chemicals', 'NYSE', 'US', true),

-- Real Estate (不動産)
('AMT', 'American Tower Corporation', 'Real Estate', 'REIT', 'NYSE', 'US', true),
('PLD', 'Prologis Inc.', 'Real Estate', 'REIT', 'NYSE', 'US', true),

-- Utilities (公益事業)
('NEE', 'NextEra Energy Inc.', 'Utilities', 'Electric Utilities', 'NYSE', 'US', true),
('DUK', 'Duke Energy Corporation', 'Utilities', 'Electric Utilities', 'NYSE', 'US', true)

ON CONFLICT (symbol) DO UPDATE SET
  name = EXCLUDED.name,
  sector = EXCLUDED.sector,
  industry = EXCLUDED.industry,
  exchange = EXCLUDED.exchange,
  country = EXCLUDED.country,
  is_active = EXCLUDED.is_active;

-- 登録結果を確認
SELECT
  COUNT(*) as total_stocks,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_stocks,
  sector,
  COUNT(*) as count_per_sector
FROM stocks
GROUP BY sector
ORDER BY count_per_sector DESC;

-- 全銘柄リスト表示
SELECT symbol, name, sector, industry, is_active
FROM stocks
ORDER BY sector, symbol;
