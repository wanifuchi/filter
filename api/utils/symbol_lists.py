"""
銘柄リスト取得ユーティリティ
S&P 500, NASDAQ 100, Russell 1000の銘柄リストを取得
"""
import pandas as pd
from typing import List, Set
import requests
from bs4 import BeautifulSoup


class SymbolLists:
    """銘柄リスト管理クラス"""

    @staticmethod
    def get_sp500_symbols() -> List[str]:
        """
        S&P 500構成銘柄のリストを取得

        Returns:
            ティッカーシンボルのリスト（約500銘柄）
        """
        try:
            url = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
            tables = pd.read_html(url)
            df = tables[0]
            symbols = df['Symbol'].tolist()
            # BRK.B などのドット表記をyfinance形式に変換
            symbols = [s.replace('.', '-') for s in symbols]
            print(f"✅ S&P 500: {len(symbols)} 銘柄取得")
            return symbols
        except Exception as e:
            print(f"❌ S&P 500取得エラー: {e}")
            return []

    @staticmethod
    def get_nasdaq100_symbols() -> List[str]:
        """
        NASDAQ 100構成銘柄のリストを取得

        Returns:
            ティッカーシンボルのリスト（約100銘柄）
        """
        try:
            url = 'https://en.wikipedia.org/wiki/NASDAQ-100'
            tables = pd.read_html(url)
            df = tables[4]  # NASDAQ-100のテーブル
            symbols = df['Ticker'].tolist()
            print(f"✅ NASDAQ 100: {len(symbols)} 銘柄取得")
            return symbols
        except Exception as e:
            print(f"❌ NASDAQ 100取得エラー: {e}")
            return []

    @staticmethod
    def get_russell1000_symbols() -> List[str]:
        """
        Russell 1000構成銘柄のリストを取得

        Note: Russell 1000の公式リストは有料のため、
        時価総額上位1000銘柄の代替リストを使用

        Returns:
            ティッカーシンボルのリスト（約1000銘柄）
        """
        try:
            # FTP経由でRussell 1000のリストを取得
            # 代替: iShares Russell 1000 ETF (IWB) の保有銘柄
            url = 'https://www.ishares.com/us/products/239707/ishares-russell-1000-etf'

            # 簡易版: S&P 500以外のNYSE/NASDAQ大型株を追加
            # 本番環境では専用APIまたはFTPからの取得を推奨

            # ここでは簡易的にS&P 500の2倍のリストを返す（実装簡略化）
            # 実際の実装では、iSharesのCSVファイルをダウンロードして解析

            print(f"⚠️ Russell 1000: 簡易リスト使用（実装簡略化）")
            return []  # 実装簡略化のため空リスト

        except Exception as e:
            print(f"❌ Russell 1000取得エラー: {e}")
            return []

    @staticmethod
    def get_all_symbols() -> List[str]:
        """
        全銘柄リストを取得（重複削除）

        Returns:
            ユニークなティッカーシンボルのリスト
        """
        all_symbols: Set[str] = set()

        # S&P 500
        sp500 = SymbolLists.get_sp500_symbols()
        all_symbols.update(sp500)

        # NASDAQ 100
        nasdaq100 = SymbolLists.get_nasdaq100_symbols()
        all_symbols.update(nasdaq100)

        # Russell 1000（実装簡略化のため現時点では除外）
        # russell1000 = SymbolLists.get_russell1000_symbols()
        # all_symbols.update(russell1000)

        # ユニークなリストに変換
        unique_symbols = sorted(list(all_symbols))

        print(f"\n📊 合計: {len(unique_symbols)} 銘柄（重複削除後）")
        print(f"   - S&P 500: {len(sp500)} 銘柄")
        print(f"   - NASDAQ 100: {len(nasdaq100)} 銘柄")

        return unique_symbols

    @staticmethod
    def get_symbols_by_market_cap(min_market_cap: int = 10_000_000_000) -> List[str]:
        """
        時価総額でフィルタリングした銘柄リストを取得

        Args:
            min_market_cap: 最低時価総額（デフォルト: 100億ドル）

        Returns:
            フィルタリングされた銘柄リスト
        """
        # TODO: 実装（時価総額データ取得後）
        return SymbolLists.get_all_symbols()


# テスト用
if __name__ == "__main__":
    symbols = SymbolLists.get_all_symbols()
    print(f"\n🎯 最終銘柄数: {len(symbols)}")
    print(f"サンプル: {symbols[:10]}")
