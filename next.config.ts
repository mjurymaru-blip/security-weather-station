import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静的HTMLを出力（GitHub Pages用）
  output: 'export',

  // GitHub Pagesのリポジトリ名をベースパスに設定
  basePath: process.env.NODE_ENV === 'production' ? '/security-weather-station' : '',

  // 画像最適化を無効化（静的エクスポート用）
  images: {
    unoptimized: true,
  },

  // trailing slashを追加（GitHub Pages用）
  trailingSlash: true,
};

export default nextConfig;
