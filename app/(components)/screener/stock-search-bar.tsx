"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface StockSearchBarProps {
  onSearch: (symbol: string) => void;
  isLoading: boolean;
}

export function StockSearchBar({ onSearch, isLoading }: StockSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim().toUpperCase());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ティッカーシンボルを入力（例: AAPL, TSLA, MSFT）"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading || !searchTerm.trim()}>
          {isLoading ? "検索中..." : "検索"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        米国市場の全銘柄を検索できます（約8,000銘柄対応）
      </p>
    </form>
  );
}
