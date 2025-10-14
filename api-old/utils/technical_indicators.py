"""
テクニカル指標計算エンジン
移動平均線、RSI、ADR、VWAPなどを計算
"""
import pandas as pd
import numpy as np
from typing import Dict, Any


class TechnicalIndicators:
    """テクニカル指標計算クラス"""

    @staticmethod
    def calculate_sma(df: pd.DataFrame, period: int, column: str = 'close') -> pd.Series:
        """
        単純移動平均線 (SMA) を計算

        Args:
            df: 株価データフレーム
            period: 期間
            column: 計算対象のカラム

        Returns:
            SMAのSeries
        """
        return df[column].rolling(window=period).mean()

    @staticmethod
    def calculate_ema(df: pd.DataFrame, period: int, column: str = 'close') -> pd.Series:
        """
        指数移動平均線 (EMA) を計算

        Args:
            df: 株価データフレーム
            period: 期間
            column: 計算対象のカラム

        Returns:
            EMAのSeries
        """
        return df[column].ewm(span=period, adjust=False).mean()

    @staticmethod
    def calculate_rsi(df: pd.DataFrame, period: int = 14, column: str = 'close') -> pd.Series:
        """
        RSI (Relative Strength Index) を計算

        Args:
            df: 株価データフレーム
            period: 期間 (デフォルト: 14)
            column: 計算対象のカラム

        Returns:
            RSIのSeries
        """
        delta = df[column].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()

        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))

        return rsi

    @staticmethod
    def calculate_adr(df: pd.DataFrame, period: int = 20) -> pd.Series:
        """
        ADR (Average Daily Range) を計算
        (高値 - 安値) / 終値 * 100 の移動平均

        Args:
            df: 株価データフレーム
            period: 期間 (デフォルト: 20)

        Returns:
            ADRのSeries (%)
        """
        daily_range = ((df['high'] - df['low']) / df['close']) * 100
        adr = daily_range.rolling(window=period).mean()

        return adr

    @staticmethod
    def calculate_vwap(df: pd.DataFrame) -> pd.Series:
        """
        VWAP (Volume Weighted Average Price) を計算

        Args:
            df: 株価データフレーム

        Returns:
            VWAPのSeries
        """
        typical_price = (df['high'] + df['low'] + df['close']) / 3
        vwap = (typical_price * df['volume']).cumsum() / df['volume'].cumsum()

        return vwap

    @staticmethod
    def calculate_bollinger_bands(
        df: pd.DataFrame,
        period: int = 20,
        std_dev: float = 2.0,
        column: str = 'close'
    ) -> Dict[str, pd.Series]:
        """
        ボリンジャーバンドを計算

        Args:
            df: 株価データフレーム
            period: 期間 (デフォルト: 20)
            std_dev: 標準偏差の倍数 (デフォルト: 2.0)
            column: 計算対象のカラム

        Returns:
            upper, middle, lowerのバンド
        """
        middle = df[column].rolling(window=period).mean()
        std = df[column].rolling(window=period).std()

        upper = middle + (std * std_dev)
        lower = middle - (std * std_dev)

        return {
            'upper': upper,
            'middle': middle,
            'lower': lower
        }

    @staticmethod
    def calculate_all_indicators(df: pd.DataFrame) -> pd.DataFrame:
        """
        すべてのテクニカル指標を一括計算

        Args:
            df: 株価データフレーム (date, open, high, low, close, volume)

        Returns:
            指標を追加したDataFrame
        """
        result = df.copy()

        # 移動平均線
        result['ma_10'] = TechnicalIndicators.calculate_sma(result, 10)
        result['ma_20'] = TechnicalIndicators.calculate_sma(result, 20)
        result['ma_50'] = TechnicalIndicators.calculate_sma(result, 50)
        result['ma_150'] = TechnicalIndicators.calculate_sma(result, 150)
        result['ma_200'] = TechnicalIndicators.calculate_sma(result, 200)

        # EMA
        result['ema_10'] = TechnicalIndicators.calculate_ema(result, 10)
        result['ema_21'] = TechnicalIndicators.calculate_ema(result, 21)

        # RSI
        result['rsi_14'] = TechnicalIndicators.calculate_rsi(result, 14)

        # ADR
        result['adr_20'] = TechnicalIndicators.calculate_adr(result, 20)

        # VWAP
        result['vwap'] = TechnicalIndicators.calculate_vwap(result)

        # ボリンジャーバンド
        bb = TechnicalIndicators.calculate_bollinger_bands(result, 20)
        result['bb_upper'] = bb['upper']
        result['bb_middle'] = bb['middle']
        result['bb_lower'] = bb['lower']

        # 出来高平均
        result['volume_avg_20'] = result['volume'].rolling(window=20).mean()

        # 52週高値・安値
        result['week_52_high'] = result['high'].rolling(window=252).max()
        result['week_52_low'] = result['low'].rolling(window=252).min()

        # MA乖離率
        result['distance_ma_10'] = ((result['close'] - result['ma_10']) / result['ma_10'] * 100)
        result['distance_ma_20'] = ((result['close'] - result['ma_20']) / result['ma_20'] * 100)
        result['distance_ma_50'] = ((result['close'] - result['ma_50']) / result['ma_50'] * 100)
        result['distance_ma_200'] = ((result['close'] - result['ma_200']) / result['ma_200'] * 100)

        # 移動平均線のパーフェクトオーダーチェック
        result['perfect_order_bullish'] = (
            (result['ma_10'] > result['ma_20']) &
            (result['ma_20'] > result['ma_50']) &
            (result['ma_50'] > result['ma_150']) &
            (result['ma_150'] > result['ma_200'])
        )

        return result

    @staticmethod
    def get_latest_indicators(df: pd.DataFrame) -> Dict[str, Any]:
        """
        最新の指標値を辞書形式で取得

        Args:
            df: 指標計算済みのDataFrame

        Returns:
            最新指標の辞書
        """
        if df.empty:
            return {}

        latest = df.iloc[-1]

        return {
            'price': float(latest['close']),
            'ma_10': float(latest['ma_10']) if not pd.isna(latest['ma_10']) else None,
            'ma_20': float(latest['ma_20']) if not pd.isna(latest['ma_20']) else None,
            'ma_50': float(latest['ma_50']) if not pd.isna(latest['ma_50']) else None,
            'ma_150': float(latest['ma_150']) if not pd.isna(latest['ma_150']) else None,
            'ma_200': float(latest['ma_200']) if not pd.isna(latest['ma_200']) else None,
            'rsi_14': float(latest['rsi_14']) if not pd.isna(latest['rsi_14']) else None,
            'adr_20': float(latest['adr_20']) if not pd.isna(latest['adr_20']) else None,
            'vwap': float(latest['vwap']) if not pd.isna(latest['vwap']) else None,
            'volume_avg_20': int(latest['volume_avg_20']) if not pd.isna(latest['volume_avg_20']) else None,
            'week_52_high': float(latest['week_52_high']) if not pd.isna(latest['week_52_high']) else None,
            'week_52_low': float(latest['week_52_low']) if not pd.isna(latest['week_52_low']) else None,
            'distance_ma_10': float(latest['distance_ma_10']) if not pd.isna(latest['distance_ma_10']) else None,
            'distance_ma_200': float(latest['distance_ma_200']) if not pd.isna(latest['distance_ma_200']) else None,
            'perfect_order_bullish': bool(latest['perfect_order_bullish']),
        }
