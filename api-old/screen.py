"""
スクリーニングAPIエンドポイント
/api/screen

Vercel Serverless Functionとして動作
"""
from http.server import BaseHTTPRequestHandler
import json
import sys
from pathlib import Path

# パス解決
api_dir = Path(__file__).parent
sys.path.insert(0, str(api_dir))

from utils.yfinance_wrapper import YFinanceWrapper
from utils.technical_indicators import TechnicalIndicators


class handler(BaseHTTPRequestHandler):
    """
    Vercel Serverless Function Handler
    """

    def do_POST(self):
        """POSTリクエスト処理"""
        try:
            # リクエストボディ読み取り
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))

            # フィルター条件取得
            filters = request_data.get('filters', {})
            symbols = request_data.get('symbols', None)

            # デフォルトシンボル（テスト用）
            if symbols is None:
                symbols = self._get_default_symbols()

            # スクリーニング実行
            results = self._screen_stocks(symbols, filters)

            # レスポンス作成
            response = {
                'results': results,
                'total_count': len(results),
                'execution_time_ms': 0,  # TODO: 実測
            }

            # JSONレスポンス返却
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

        except Exception as e:
            self._send_error(500, str(e))

    def do_OPTIONS(self):
        """CORSプリフライトリクエスト処理"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def _get_default_symbols(self) -> list:
        """デフォルトシンボル取得（テスト用）"""
        # 主要銘柄のサンプル
        return [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA',
            'META', 'TSLA', 'BRK-B', 'V', 'JNJ',
            'WMT', 'JPM', 'MA', 'PG', 'UNH',
            'HD', 'DIS', 'BAC', 'ADBE', 'CRM'
        ]

    def _screen_stocks(self, symbols: list, filters: dict) -> list:
        """
        スクリーニング実行

        Args:
            symbols: ティッカーシンボルのリスト
            filters: フィルター条件

        Returns:
            スクリーニング結果のリスト
        """
        yf_wrapper = YFinanceWrapper()
        results = []

        for symbol in symbols:
            try:
                # 過去データ取得
                hist_data = yf_wrapper.get_historical_data(symbol, period='1y')
                if hist_data is None or hist_data.empty:
                    continue

                # テクニカル指標計算
                hist_data = TechnicalIndicators.calculate_all_indicators(hist_data)
                latest_indicators = TechnicalIndicators.get_latest_indicators(hist_data)

                # フィルター適用
                if not self._apply_filters(latest_indicators, filters):
                    continue

                # 銘柄情報取得
                stock_info = yf_wrapper.get_stock_info(symbol)
                if stock_info is None:
                    continue

                # スコア計算
                score = self._calculate_score(latest_indicators, stock_info)

                # 結果追加
                results.append({
                    'symbol': symbol,
                    'name': stock_info['name'],
                    'sector': stock_info['sector'],
                    'price': latest_indicators['price'],
                    'market_cap': stock_info['market_cap'],
                    'technical_indicators': latest_indicators,
                    'score': score,
                })

            except Exception as e:
                print(f"Error processing {symbol}: {e}")
                continue

        # スコア順にソート
        results.sort(key=lambda x: x['score'], reverse=True)

        return results

    def _apply_filters(self, indicators: dict, filters: dict) -> bool:
        """
        フィルター条件を適用

        Args:
            indicators: テクニカル指標
            filters: フィルター条件

        Returns:
            条件を満たす場合True
        """
        technical = filters.get('technical', {})

        # 移動平均線フィルター
        price_above_ma = technical.get('price_above_ma', {})
        if price_above_ma.get('ma_200'):
            if indicators.get('ma_200') is None or indicators['price'] < indicators['ma_200']:
                return False

        if price_above_ma.get('ma_50'):
            if indicators.get('ma_50') is None or indicators['price'] < indicators['ma_50']:
                return False

        # ADRフィルター
        adr_filter = technical.get('adr_20', {})
        if 'min' in adr_filter or 'max' in adr_filter:
            adr = indicators.get('adr_20')
            if adr is None:
                return False
            if 'min' in adr_filter and adr < adr_filter['min']:
                return False
            if 'max' in adr_filter and adr > adr_filter['max']:
                return False

        # RSIフィルター
        rsi_filter = technical.get('rsi_14', {})
        if 'min' in rsi_filter or 'max' in rsi_filter:
            rsi = indicators.get('rsi_14')
            if rsi is None:
                return False
            if 'min' in rsi_filter and rsi < rsi_filter['min']:
                return False
            if 'max' in rsi_filter and rsi > rsi_filter['max']:
                return False

        # パーフェクトオーダー
        ma_alignment = technical.get('ma_alignment', {})
        if ma_alignment.get('enabled') and ma_alignment.get('order') == 'bullish':
            if not indicators.get('perfect_order_bullish', False):
                return False

        return True

    def _calculate_score(self, indicators: dict, stock_info: dict) -> int:
        """
        銘柄スコア計算（0-100点）

        Args:
            indicators: テクニカル指標
            stock_info: 銘柄情報

        Returns:
            スコア
        """
        score = 0

        # 移動平均線の並び（20点）
        if indicators.get('perfect_order_bullish', False):
            score += 20

        # 200MA以上（15点）
        if indicators.get('ma_200') and indicators['price'] > indicators['ma_200']:
            score += 15

        # ADRが6%以上（15点）
        adr = indicators.get('adr_20', 0)
        if adr >= 6:
            score += 15
        elif adr >= 4:
            score += 10

        # 流動性（15点） - TODO: 実装
        # dollar_volume = stock_info.get('dollar_volume', 0)
        # if dollar_volume >= 100_000_000:
        #     score += 15
        # elif dollar_volume >= 60_000_000:
        #     score += 10

        # RSI（10点）
        rsi = indicators.get('rsi_14', 0)
        if 50 <= rsi <= 70:
            score += 10

        # 時価総額（5点）
        market_cap = stock_info.get('market_cap', 0)
        if market_cap >= 10_000_000_000:  # 100億ドル以上
            score += 5

        return score

    def _send_error(self, code: int, message: str):
        """エラーレスポンス送信"""
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        error_response = {'error': message}
        self.wfile.write(json.dumps(error_response).encode('utf-8'))
