'use server';

/**
 * Analyst Agent - 技術分析
 * 
 * Orchestratorの戦略に従い、ニュースの技術的分析を実行。
 * 天気判定の根拠となる詳細情報を生成。
 */

import { generateJSON } from '@/lib/gemini';
import type {
    NewsItem,
    OrchestratorOutput,
    AnalystOutput,
    UserProfile,
    WeatherScores,
} from '@/types';
import { calcWeather } from '@/lib/weather-scorer';

/**
 * Analystプロンプトを生成
 */
function buildAnalystPrompt(
    newsItems: NewsItem[],
    orchestratorOutput: OrchestratorOutput,
    profile: UserProfile
): string {
    const newsListText = newsItems
        .slice(0, 15)
        .map((item, i) => {
            const isFocus = orchestratorOutput.focusItems.includes(item.title);
            return `${i + 1}. ${isFocus ? '⚠️ ' : ''}[${item.source}] ${item.title}\n   ${item.rawContent.slice(0, 200)}...`;
        })
        .join('\n\n');

    const strategyGuide = {
        brief: '簡潔に要点のみ。詳細は省略。',
        normal: '標準的な分析。重要点を押さえつつ説明。',
        deep: '詳細な分析。技術的背景や影響範囲を深掘り。',
    };

    const toneGuide = {
        calm: '落ち着いたトーン。過度な警告は不要。',
        cautious: '注意喚起。確認を促す。',
        alert: '緊急性を伝える。具体的な対応を示唆。',
    };

    return `あなたはサイバーセキュリティアナリストです。

## 分析戦略（Orchestratorからの指示）
- 戦略: ${orchestratorOutput.strategy} - ${strategyGuide[orchestratorOutput.strategy]}
- トーン: ${orchestratorOutput.tone} - ${toneGuide[orchestratorOutput.tone]}
- 理由: ${orchestratorOutput.reason}

## ユーザーの技術スタック
${profile.techStack.join(', ')}

## 分析対象ニュース
${newsListText || '（ニュースなし）'}

## あなたのタスク
1. 各ニュースの脅威レベル（1-5）を評価
2. ユーザーへの関連度を判定
3. 3行以内で要約を作成
4. なぜユーザーに関係があるか説明

## 出力形式（JSON）
{
  "summary": "今日の状況を3行以内で要約",
  "relevanceReason": "なぜユーザーに関係があるか",
  "analyzedItems": [
    {
      "id": "ニュースID",
      "title": "タイトル",
      "threatLevel": 1-5,
      "summary": "1行要約",
      "relevanceScore": 0.0-1.0
    }
  ]
}

JSONのみを出力してください。`;
}

/**
 * ニュースからWeatherScoresを計算
 */
function calculateScores(
    newsItems: NewsItem[],
    analyzedItems: { threatLevel: number; relevanceScore: number }[]
): WeatherScores {
    const volume = Math.min(newsItems.length / 10, 1); // 10件で1.0

    const maxThreat = analyzedItems.length > 0
        ? Math.max(...analyzedItems.map((item) => item.threatLevel))
        : 0;
    const severity = maxThreat / 5; // 5段階を0-1に正規化

    const avgRelevance = analyzedItems.length > 0
        ? analyzedItems.reduce((sum, item) => sum + item.relevanceScore, 0) / analyzedItems.length
        : 0;

    // TODO: 昨日のデータと比較してtrend計算
    const trend = 0.5; // 暫定: 変化なし

    return { volume, severity, relevance: avgRelevance, trend };
}

/**
 * Analyst Agent を実行
 */
export async function runAnalyst(
    newsItems: NewsItem[],
    orchestratorOutput: OrchestratorOutput,
    profile: UserProfile = {
        techStack: ['Linux', 'Docker', 'Next.js', 'PostgreSQL', 'Node.js'],
        interests: ['OSS', 'Web Security', 'Cloud'],
    }
): Promise<AnalystOutput> {
    // ニュースがない場合のデフォルト応答
    if (newsItems.length === 0) {
        return {
            weatherCondition: 'sunny',
            threatLevel: 1,
            summary: '本日は関連するセキュリティニュースがありません。穏やかな一日です。',
            relevanceReason: '特に対応が必要な項目はありません。',
            analyzedItems: [],
        };
    }

    const prompt = buildAnalystPrompt(newsItems, orchestratorOutput, profile);

    try {
        const result = await generateJSON<{
            summary: string;
            relevanceReason: string;
            analyzedItems: {
                id: string;
                title: string;
                threatLevel: number;
                summary: string;
                relevanceScore: number;
            }[];
        }>(prompt);

        // スコア計算と天気判定
        const scores = calculateScores(newsItems, result.analyzedItems);
        const weatherCondition = calcWeather(scores);

        const maxThreat = result.analyzedItems.length > 0
            ? Math.max(...result.analyzedItems.map((item) => item.threatLevel))
            : 1;

        return {
            weatherCondition,
            threatLevel: maxThreat,
            summary: result.summary,
            relevanceReason: result.relevanceReason,
            analyzedItems: result.analyzedItems,
        };
    } catch (error) {
        console.error('Analyst error:', error);
        // フォールバック
        return {
            weatherCondition: 'cloudy',
            threatLevel: 2,
            summary: 'AI分析に失敗しました。手動での確認を推奨します。',
            relevanceReason: '分析結果を取得できませんでした。',
            analyzedItems: [],
        };
    }
}
