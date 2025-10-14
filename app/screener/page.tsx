"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StockDataTable } from "@/app/(components)/screener/stock-data-table";
import { PresetSelector } from "@/app/(components)/screener/preset-selector";
import { StockSearchBar } from "@/app/(components)/screener/stock-search-bar";
import { StockChart } from "@/app/(components)/screener/stock-chart";
import { InvestmentDecisionCard } from "@/app/(components)/screener/investment-decision-card";
import { InvestmentAnalysisReport } from "@/app/(components)/screener/investment-analysis-report";
import {
  StockWithIndicators,
  PresetStrategy,
  ScreeningFilters,
} from "@/lib/definitions";
import { SAMPLE_STOCKS } from "@/lib/sample-data";
import Link from "next/link";
import { Info } from "lucide-react";

export default function ScreenerPage() {
  // タブ制御用state
  const [activeTab, setActiveTab] = useState<string>("search");

  // スクリーニング用state
  const [stocks, setStocks] = useState<StockWithIndicators[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PresetStrategy | null>(null);

  // 個別検索用state
  const [searchedStock, setSearchedStock] = useState<StockWithIndicators | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handlePresetSelect = (preset: PresetStrategy) => {
    setSelectedPreset(preset);
  };

  // 個別銘柄検索ハンドラー
  const handleSearch = async (symbol: string) => {
    setIsSearching(true);
    setSearchError(null);
    setSearchedStock(null);

    try {
      const response = await fetch(`/api/stock-lookup?symbol=${encodeURIComponent(symbol)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSearchedStock(data);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "銘柄データの取得に失敗しました");
      console.error("Stock search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleScreen = async () => {
    if (!selectedPreset) {
      alert("プリセット戦略を選択してください");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/screen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preset_id: selectedPreset.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStocks(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      console.error("Screening error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // スクリーニング結果から銘柄をクリックした際のハンドラー
  const handleSymbolClick = async (symbol: string) => {
    // 個別検索タブに切り替え
    setActiveTab("search");
    // 検索を実行
    await handleSearch(symbol);
  };

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">米国株スクリーニングツール</h1>
            <p className="text-muted-foreground">
              テクニカル分析に基づいた高機能スクリーニング
            </p>
          </div>
          <Link
            href="/about"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md"
          >
            <Info className="h-5 w-5" />
            <span className="font-semibold">このツールについて</span>
          </Link>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="search">個別銘柄検索</TabsTrigger>
          <TabsTrigger value="screening">プリセットスクリーニング</TabsTrigger>
        </TabsList>

        {/* 個別銘柄検索タブ */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>銘柄検索</CardTitle>
              <CardDescription>
                ティッカーシンボルを入力して、個別銘柄の詳細データを取得できます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <StockSearchBar onSearch={handleSearch} isLoading={isSearching} />

              {searchError && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
                  エラー: {searchError}
                </div>
              )}

              {isSearching && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">データ取得中...</p>
                </div>
              )}

              {searchedStock && !isSearching && (
                <div className="space-y-4">
                  {searchedStock.investment_decision && (
                    <InvestmentDecisionCard
                      decision={searchedStock.investment_decision}
                      symbol={searchedStock.symbol}
                    />
                  )}
                  {searchedStock.detailed_analysis && (
                    <InvestmentAnalysisReport
                      analysis={searchedStock.detailed_analysis}
                    />
                  )}
                  <StockDataTable stocks={[searchedStock]} />
                  {searchedStock.historical_data && searchedStock.historical_data.length > 0 && (
                    <StockChart
                      historicalData={searchedStock.historical_data}
                      symbol={searchedStock.symbol}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* プリセットスクリーニングタブ */}
        <TabsContent value="screening">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* サイドバー */}
            <div className="md:col-span-1">
              <div className="sticky top-6 space-y-6">
                <PresetSelector onSelectPreset={handlePresetSelect} />

                {selectedPreset && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">選択中の戦略</h4>
                    <p className="text-sm">{selectedPreset.name}</p>
                  </div>
                )}

                <Button
                  onClick={handleScreen}
                  disabled={isLoading || !selectedPreset}
                  className="w-full"
                >
                  {isLoading ? "スクリーニング中..." : "スクリーニング実行"}
                </Button>
              </div>
            </div>

            {/* メインコンテンツ */}
            <div className="md:col-span-3">
              {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4">
                  エラー: {error}
                </div>
              )}

              {isLoading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">データ取得中...</p>
                </div>
              )}

              {!isLoading && !error && (
                <div className="bg-card rounded-lg border p-6">
                  <StockDataTable stocks={stocks} onSymbolClick={handleSymbolClick} />
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
