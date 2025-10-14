from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import sys
import os

# apiディレクトリをパスに追加
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from utils.yfinance_wrapper import YFinanceWrapper
from utils.technical_indicators import TechnicalIndicators

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # クエリパラメータを解析
        parsed_url = urlparse(self.path)
        query_params = parse_qs(parsed_url.query)

        symbol = query_params.get('symbol', [None])[0]

        if not symbol:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': 'ティッカーシンボルを指定してください'
            }).encode())
            return

        try:
            # Yahoo Financeからデータ取得
            yf_wrapper = YFinanceWrapper()

            # 基本情報取得
            stock_info = yf_wrapper.get_stock_info(symbol)

            # 過去200日分のデータ取得（MA200計算のため）
            historical_data = yf_wrapper.get_historical_data(
                symbol,
                period='1y'  # 1年分のデータ
            )

            if historical_data.empty:
                raise ValueError(f'銘柄 {symbol} のデータが見つかりません')

            # テクニカル指標を計算
            df_with_indicators = TechnicalIndicators.calculate_all_indicators(historical_data)

            # 最新のデータ行を取得
            latest = df_with_indicators.iloc[-1]

            # レスポンスデータを構築
            stock_data = {
                'symbol': symbol.upper(),
                'name': stock_info.get('shortName', stock_info.get('longName', symbol)),
                'sector': stock_info.get('sector', None),
                'current_price': float(latest['Close']),
                'previous_close': float(stock_info.get('previousClose', latest['Close'])),
                'market_cap': stock_info.get('marketCap', None),
                'volume': int(latest['Volume']),
                'technical_indicators': {
                    'ma_10': float(latest['ma_10']) if 'ma_10' in latest and not pd.isna(latest['ma_10']) else None,
                    'ma_20': float(latest['ma_20']) if 'ma_20' in latest and not pd.isna(latest['ma_20']) else None,
                    'ma_50': float(latest['ma_50']) if 'ma_50' in latest and not pd.isna(latest['ma_50']) else None,
                    'ma_150': float(latest['ma_150']) if 'ma_150' in latest and not pd.isna(latest['ma_150']) else None,
                    'ma_200': float(latest['ma_200']) if 'ma_200' in latest and not pd.isna(latest['ma_200']) else None,
                    'rsi_14': float(latest['rsi_14']) if 'rsi_14' in latest and not pd.isna(latest['rsi_14']) else None,
                    'adr_20': float(latest['adr_20']) if 'adr_20' in latest and not pd.isna(latest['adr_20']) else None,
                    'vwap': float(latest['vwap']) if 'vwap' in latest and not pd.isna(latest['vwap']) else None,
                    'bollinger_upper': float(latest['bb_upper']) if 'bb_upper' in latest and not pd.isna(latest['bb_upper']) else None,
                    'bollinger_lower': float(latest['bb_lower']) if 'bb_lower' in latest and not pd.isna(latest['bb_lower']) else None,
                    'perfect_order_bullish': bool(check_perfect_order(latest, 'bullish')),
                    'perfect_order_bearish': bool(check_perfect_order(latest, 'bearish')),
                },
                'historical_data': [
                    {
                        'date': str(row.Index.date()),
                        'open': float(row['Open']),
                        'high': float(row['High']),
                        'low': float(row['Low']),
                        'close': float(row['Close']),
                        'volume': int(row['Volume']),
                        'ma_10': float(row['ma_10']) if 'ma_10' in row and not pd.isna(row['ma_10']) else None,
                        'ma_20': float(row['ma_20']) if 'ma_20' in row and not pd.isna(row['ma_20']) else None,
                        'ma_50': float(row['ma_50']) if 'ma_50' in row and not pd.isna(row['ma_50']) else None,
                        'ma_200': float(row['ma_200']) if 'ma_200' in row and not pd.isna(row['ma_200']) else None,
                    }
                    for row in df_with_indicators.iloc[-90:].itertuples()  # 直近90日分
                ],
                'score': calculate_score(latest, stock_info)
            }

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(stock_data).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': '銘柄データの取得に失敗しました',
                'details': str(e)
            }).encode())

def check_perfect_order(row, order_type='bullish'):
    """パーフェクトオーダーをチェック"""
    import pandas as pd

    mas = ['ma_10', 'ma_20', 'ma_50', 'ma_150', 'ma_200']
    values = []

    for ma in mas:
        if ma in row and not pd.isna(row[ma]):
            values.append(float(row[ma]))
        else:
            return False

    if order_type == 'bullish':
        # 短期 > 中期 > 長期
        return all(values[i] > values[i+1] for i in range(len(values)-1))
    else:
        # 短期 < 中期 < 長期
        return all(values[i] < values[i+1] for i in range(len(values)-1))

def calculate_score(latest, stock_info):
    """すなっちゃん手法に基づくスコアリング（0-100点）"""
    import pandas as pd

    score = 0

    # 1. 200MA以上（20点）
    if 'ma_200' in latest and not pd.isna(latest['ma_200']):
        if latest['Close'] > latest['ma_200']:
            score += 20

    # 2. パーフェクトオーダー（強気）（30点）
    if check_perfect_order(latest, 'bullish'):
        score += 30

    # 3. ADR（20日平均値動き率）が適切な範囲（5-15%）（20点）
    if 'adr_20' in latest and not pd.isna(latest['adr_20']):
        adr = float(latest['adr_20'])
        if 5.0 <= adr <= 15.0:
            score += 20
        elif 3.0 <= adr < 5.0 or 15.0 < adr <= 20.0:
            score += 10  # 部分点

    # 4. RSIが適切な範囲（30-70）（15点）
    if 'rsi_14' in latest and not pd.isna(latest['rsi_14']):
        rsi = float(latest['rsi_14'])
        if 30 <= rsi <= 70:
            score += 15
        elif 20 <= rsi < 30 or 70 < rsi <= 80:
            score += 8  # 部分点

    # 5. 出来高が十分（平均以上）（15点）
    avg_volume = stock_info.get('averageVolume', 0)
    if avg_volume > 0 and latest['Volume'] >= avg_volume:
        score += 15

    return score

import pandas as pd
