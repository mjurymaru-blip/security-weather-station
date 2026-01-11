# Phase 2.1: 履歴/Trend表示 - 実装計画

## 概要

過去14日間の天気推移を保存・表示する機能を実装。
IndexedDBを使用し、完全クライアントサイドで動作。

---

## 提案する変更

### データ層

#### [NEW] [history-store.ts](file:///home/gemini1/workspace3/security-weather-station/src/lib/history-store.ts)

IndexedDBを使用した履歴保存ストア

```typescript
interface DailySnapshot {
  date: string;                    // "2026-01-12"
  weatherCondition: WeatherCondition;
  threatLevel: number;
  analyzedItemsCount: number;
  topItems: { title: string; source: string }[];
  generatedAt: Date;
}
```

**機能:**
- `saveSnapshot(report)` - 日次レポートを保存
- `getHistory(days)` - 過去N日分を取得
- `cleanupOldData()` - 14日より古いデータを削除

---

### フック層

#### [NEW] [useWeatherHistory.ts](file:///home/gemini1/workspace3/security-weather-station/src/hooks/useWeatherHistory.ts)

履歴データを取得するReactフック

```typescript
function useWeatherHistory(): {
  history: DailySnapshot[];
  isLoading: boolean;
  saveCurrentReport: (report: WeatherReport) => Promise<void>;
}
```

---

### UI層

#### [NEW] [WeatherTrend.tsx](file:///home/gemini1/workspace3/security-weather-station/src/components/WeatherTrend.tsx)

天気推移グラフコンポーネント

```
     ⛈️
  🌧️    🌧️
⛅         ⛅  ⛅
☀️               ☀️  ← 今日
─┼──┼──┼──┼──┼──┼──┼─
 月  火  水  木  金  土  日
```

**実装方式:**
- CSS Gridでシンプルに実装（ライブラリ不要）
- 各天気アイコンの高さで脅威レベルを表現

---

#### [MODIFY] [Dashboard.tsx](file:///home/gemini1/workspace3/security-weather-station/src/components/Dashboard.tsx)

- WeatherTrendコンポーネントを追加
- レポート取得後に履歴を保存

---

## 技術的考慮事項

### IndexedDB vs localStorage

| 項目 | localStorage | IndexedDB |
|------|--------------|-----------|
| 容量 | 5MB | 無制限 |
| 構造化データ | ✗ | ✓ |
| 非同期 | ✗ | ✓ |
| 採用 | - | **✓** |

### idb ライブラリ

IndexedDBのPromise wrapper。軽量で使いやすい。

```bash
npm install idb
```

---

## 検証計画

1. 履歴保存の確認（DevTools → Application → IndexedDB）
2. 14日以上経過後の自動削除
3. グラフ表示の確認

---

## 推定工数

| タスク | 工数 |
|--------|------|
| history-store.ts | 1.5h |
| useWeatherHistory.ts | 1h |
| WeatherTrend.tsx | 2h |
| Dashboard統合 | 1h |
| テスト・調整 | 1.5h |
| **合計** | **7h** |

---

## 確認事項

1. **idb ライブラリを使用してよいか？**
   - 軽量（4KB gzipped）
   - IndexedDBを使いやすくするPromise wrapper

2. **グラフの表示形式**
   - 上記の絵文字ベースでよいか？
   - 棒グラフ形式の方がよいか？

3. **保存タイミング**
   - レポート取得成功時に自動保存でよいか？
