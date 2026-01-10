# タスク: Security Weather Station (セキュリティ気象予報AI)

## Phase 1: プロジェクト基盤
- [x] プロジェクト初期化 (テンプレート利用)
    - [x] テンプレートリポジトリのクローン
    - [x] Git履歴のリセットと初期化
    - [x] Giteaリモートの設定
    - [x] Next.js アプリケーションのセットアップ
    - [x] `@google/generative-ai` インストール

---

## Phase 2: Intelligence Layer（バックエンド）

### 2.1 Collector
- [x] `NewsItem` 型定義 (`src/types/index.ts`)
- [x] RSS/Atomフィード取得ユーティリティ (`src/lib/collector.ts`)
- [x] 初期ソース: JPCERT, IPA, JVN

### 2.2 Orchestrator Agent（司令塔）
- [x] `OrchestratorOutput` 型定義
- [x] 戦略判定プロンプト作成
- [x] Server Action 実装 (`src/actions/orchestrate.ts`)

### 2.3 Weather Scorer
- [x] `WeatherScores` 型定義 (`src/types/index.ts`)
- [x] `calcWeather()` 関数実装 (`src/lib/weather-scorer.ts`)
- [ ] スコア重み調整ロジック

### 2.4 Analyst Agent
- [x] 分析プロンプト作成（strategy/tone対応）
- [x] JSON Schema 出力定義
- [x] Server Action 実装 (`src/actions/analyze.ts`)

### 2.5 Narrator Agent
- [x] Forecastモード（朝）プロンプト
- [x] Reviewモード（夜）プロンプト
- [x] Server Action 実装 (`src/actions/narrate.ts`)
- [x] Pipeline 統合 (`src/actions/pipeline.ts`)

---

## Phase 3: UI実装（フロントエンド）

### 3.1 Design System
- [x] 天気テーマのTailwind設定 (`globals.css`)
    - [x] 晴れ: 青空グラデーション
    - [x] 曇り: グレー
    - [x] 雨: 濃紺
    - [x] 嵐: ダークレッド/パープル

### 3.2 Components
- [x] `WeatherIcon` コンポーネント
- [x] `ThreatGauge` コンポーネント（危険度可視化）
- [x] `ModeBadge` コンポーネント
- [x] `BroadcastCard` コンポーネント（3行要約）
- [x] `RelevanceCard` コンポーネント
- [x] `NewsList` コンポーネント

### 3.3 Pages
- [x] メインダッシュボード (`/`)
- [x] 時間帯判定（朝/夜モード切替）

---

## Phase 4: 仕上げ

- [x] README.md に Philosophy セクション追加
- [x] 環境変数テンプレート (`.env.example`)
- [x] Giteaへの初回バックアップ

---

## Phase 5: 追加機能（進行中）

### 5.1 デモモード
- [x] モックデータ作成 (`src/data/mock-reports.ts`)
- [x] URLパラメータで天気切替 (`?weather=stormy`)
- [x] デモモードバナー UI

### 5.2 データ管理
- [x] RSSソースをJSON化 (`src/data/feed-sources.json`)
- [x] 有効/無効フラグ対応

### 5.3 クライアント設定
- [x] 設定ストア (`src/lib/settings-store.ts`)
- [x] React Hook (`src/hooks/useSettings.ts`)
- [x] 設定パネルUI (`src/components/SettingsPanel.tsx`)
- [x] APIキーテストAPI (`/api/test-key`)
- [x] 本番分析API (`/api/analyze`)
- [x] localStorage保存
- [x] ユーザープロファイル設定

### 5.4 PWA対応（未着手）
- [ ] Service Worker
- [ ] manifest.json
- [ ] オフライン対応

---

## 📊 進捗サマリー

| Phase | 状態 |
|-------|------|
| 1. 基盤 | ✅ 完了 |
| 2. Intelligence | ✅ 完了 |
| 3. UI | ✅ 完了 |
| 4. 仕上げ | ✅ 完了 |
| 5. 追加機能 | 🔄 進行中 |