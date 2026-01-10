# Security Weather Station 🌦️

> **"今日のインターネットは荒れ模様です"**

セキュリティニュースを「天気予報」として可視化する、個人向けAIダッシュボード。

---

## Philosophy

Security Weather Station does not aim to provide complete or authoritative security analysis.

Instead, it answers a simpler question:

> **"Do I need to care about this today?"**

This app is intentionally opinionated toward individual developers.

---

## Features

- 🌤️ **天気メタファー** - CVSSスコアを直接見せず、直感的な天気表現で危険度を可視化
- 🧭 **Orchestrator Agent** - AIがAIを制御。ニュース量に応じて分析戦略を動的に決定
- 🎯 **個人向けフィルタリング** - あなたの技術スタック（Linux, Docker, Next.js等）に基づく関連度判定
- 🌅 **時間軸** - 朝は予報、夜は振り返り

---

## Architecture

```
Collector → Orchestrator → Analyst → Narrator → Dashboard
   🛰️           🧭           🔬         📝          🖥️
```

| Agent | Role |
|-------|------|
| 🛰️ Collector | RSS/NVD/JPCERT からニュース収集 |
| 🧭 Orchestrator | 戦略決定（brief/normal/deep）とトーン制御 |
| 📊 Weather Scorer | Volume/Severity/Relevance/Trend の複合スコアで天気判定 |
| 🔬 Analyst | 技術的分析と脅威レベル評価 |
| 📝 Narrator | 人が読みたい文章に整形 |

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **AI**: Google Gemini Pro (`@google/generative-ai`)

---

## License

MIT
