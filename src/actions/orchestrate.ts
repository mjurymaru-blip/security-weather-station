'use server';

/**
 * Orchestrator Agent - 司令塔
 * 
 * AntiGravityの核心: AIがAIを使い分ける構造
 * 
 * 役割:
 * - 今日のニュース量・深刻度を評価
 * - 深掘り or 簡略化を判断
 * - Analystへ渡すPromptのトーンを制御
 */

import { generateJSON } from '@/lib/gemini';
import type { NewsItem, OrchestratorOutput, UserProfile, DEFAULT_USER_PROFILE } from '@/types';

/**
 * Orchestratorプロンプトを生成
 */
function buildOrchestratorPrompt(
    newsItems: NewsItem[],
    profile: UserProfile
): string {
    const newsListText = newsItems
        .slice(0, 20) // 最大20件
        .map((item, i) => `${i + 1}. [${item.source}] ${item.title}`)
        .join('\n');

    return `あなたはサイバー気象予報センターの司令塔（Orchestrator）です。

## あなたの役割
本日のセキュリティニュース一覧を確認し、分析戦略を決定してください。

## ユーザーの技術スタック
${profile.techStack.join(', ')}

## ユーザーの関心領域
${profile.interests.join(', ')}

## 本日のニュース一覧（${newsItems.length}件）
${newsListText || '（ニュースなし）'}

## 判断基準
- **strategy**: 
  - "brief": ニュースが少ない、または重大なものがない場合
  - "normal": 通常の日
  - "deep": 重大な脆弱性や、ユーザーに特に関連する情報がある場合
- **tone**:
  - "calm": 静穏。特に心配なし
  - "cautious": 注意。いくつか確認すべき項目あり
  - "alert": 警戒。即座の対応を検討すべき項目あり
- **focusItems**: 特に注目すべきニュースのタイトル（最大3件）

## 出力形式（JSON）
{
  "strategy": "brief" | "normal" | "deep",
  "tone": "calm" | "cautious" | "alert",
  "reason": "判断理由を簡潔に",
  "focusItems": ["注目ニュース1", "注目ニュース2"]
}

JSONのみを出力してください。`;
}

/**
 * Orchestrator Agent を実行
 */
export async function runOrchestrator(
    newsItems: NewsItem[],
    profile: UserProfile = {
        techStack: ['Linux', 'Docker', 'Next.js', 'PostgreSQL', 'Node.js'],
        interests: ['OSS', 'Web Security', 'Cloud'],
    }
): Promise<OrchestratorOutput> {
    // ニュースがない場合のデフォルト応答
    if (newsItems.length === 0) {
        return {
            strategy: 'brief',
            tone: 'calm',
            reason: '本日は関連するセキュリティニュースがありません',
            focusItems: [],
        };
    }

    const prompt = buildOrchestratorPrompt(newsItems, profile);

    try {
        const result = await generateJSON<OrchestratorOutput>(prompt);
        return result;
    } catch (error) {
        console.error('Orchestrator error:', error);
        // フォールバック
        return {
            strategy: 'normal',
            tone: 'cautious',
            reason: 'AI分析に失敗しました。手動での確認を推奨します。',
            focusItems: newsItems.slice(0, 3).map((item) => item.title),
        };
    }
}
