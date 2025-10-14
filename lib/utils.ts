import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * クラス名を結合するユーティリティ関数
 * shadcn/uiのcn関数として使用
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
