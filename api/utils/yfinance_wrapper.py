"""
Yahoo Finance API ラッパークラス
レート制限管理とエラーハンドリングを実装
"""
import yfinance as yf
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import time


class YFinanceWrapper:
    """
    Yahoo Finance API のラッパークラス
    - レート制限: 2,000 calls/hour (推定)
    - リトライロジック実装
    - エラーハンドリング
    """

    def __init__(self):
        self.last_call_time = None
        self.min_interval = 0.5  # 最小呼び出し間隔（秒）

    def _rate_limit(self):
        """レート制限を適用"""
        if self.last_call_time:
            elapsed = time.time() - self.last_call_time
            if elapsed < self.min_interval:
                time.sleep(self.min_interval - elapsed)
        self.last_call_time = time.time()

    def get_stock_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        銘柄の基本情報を取得

        Args:
            symbol: ティッカーシンボル

        Returns:
            銘柄情報の辞書、エラー時はNone
        """
        try:
            self._rate_limit()
            ticker = yf.Ticker(symbol)
            info = ticker.info

            return {
                'symbol': symbol,
                'name': info.get('longName', ''),
                'sector': info.get('sector', ''),
                'industry': info.get('industry', ''),
                'market_cap': info.get('marketCap', 0),
                'current_price': info.get('currentPrice', 0),
                'exchange': info.get('exchange', ''),
                'country': info.get('country', 'US'),
            }
        except Exception as e:
            print(f"Error fetching info for {symbol}: {e}")
            return None

    def get_historical_data(
        self,
        symbol: str,
        period: str = "6mo",
        interval: str = "1d"
    ) -> Optional[pd.DataFrame]:
        """
        過去の株価データを取得

        Args:
            symbol: ティッカーシンボル
            period: 期間 (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
            interval: 間隔 (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)

        Returns:
            DataFrameまたはNone
        """
        try:
            self._rate_limit()
            ticker = yf.Ticker(symbol)
            df = ticker.history(period=period, interval=interval)

            if df.empty:
                return None

            # カラム名を小文字に統一
            df.columns = [col.lower() for col in df.columns]
            df.reset_index(inplace=True)

            return df
        except Exception as e:
            print(f"Error fetching historical data for {symbol}: {e}")
            return None

    def get_multiple_quotes(self, symbols: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        複数銘柄の最新クオートを一括取得

        Args:
            symbols: ティッカーシンボルのリスト

        Returns:
            シンボルをキーとした辞書
        """
        results = {}

        # yfin download を使用した一括取得
        try:
            self._rate_limit()
            data = yf.download(
                tickers=symbols,
                period="1d",
                interval="1d",
                group_by='ticker',
                auto_adjust=True,
                prepost=False,
                threads=True,
                proxy=None
            )

            for symbol in symbols:
                try:
                    if len(symbols) > 1:
                        symbol_data = data[symbol]
                    else:
                        symbol_data = data

                    if not symbol_data.empty:
                        latest = symbol_data.iloc[-1]
                        results[symbol] = {
                            'symbol': symbol,
                            'open': float(latest['Open']),
                            'high': float(latest['High']),
                            'low': float(latest['Low']),
                            'close': float(latest['Close']),
                            'volume': int(latest['Volume']),
                        }
                except Exception as e:
                    print(f"Error processing {symbol}: {e}")
                    continue

        except Exception as e:
            print(f"Error in bulk download: {e}")

        return results

    def get_sp500_symbols(self) -> List[str]:
        """
        S&P 500構成銘柄のリストを取得

        Returns:
            ティッカーシンボルのリスト
        """
        try:
            # WikipediaからS&P 500のリストを取得
            url = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
            tables = pd.read_html(url)
            df = tables[0]
            symbols = df['Symbol'].tolist()
            # BRK.B などのドット表記をyfinance形式に変換
            symbols = [s.replace('.', '-') for s in symbols]
            return symbols
        except Exception as e:
            print(f"Error fetching S&P 500 symbols: {e}")
            return []

    def get_nasdaq100_symbols(self) -> List[str]:
        """
        NASDAQ 100構成銘柄のリストを取得

        Returns:
            ティッカーシンボルのリスト
        """
        try:
            # WikipediaからNASDAQ 100のリストを取得
            url = 'https://en.wikipedia.org/wiki/NASDAQ-100'
            tables = pd.read_html(url)
            df = tables[4]  # NASDAQ-100のテーブル
            symbols = df['Ticker'].tolist()
            return symbols
        except Exception as e:
            print(f"Error fetching NASDAQ 100 symbols: {e}")
            return []
