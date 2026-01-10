'use server';

/**
 * Narrator Agent - 文章整形
 * 
 * 分析結果を「人が読みたい文章」に整形。
 * 朝は予報（Forecast）、夜は振り返り（Review）モードで出力。
 */

import { generateJSON } from '@/lib/gemini';
import { getNarratorMode } from '@/lib/time-utils';
import type { AnalystOutput, NarratorMode, NarratorOutput } from '@/types';
import { weatherToJapanese, weatherToEmoji } from '@/lib/weather-scorer';

/**
 * Narratorプロンプトを生成
 */
function buildNarratorPrompt(
    analystOutput: AnalystOutput,
    mode: NarratorMode
): string {
    const weatherJp = weatherToJapanese(analystOutput.weatherCondition);
    const weatherEmoji = weatherToEmoji(analystOutput.weatherCondition);

    const modeInstruction = mode === 'forecast'
        ? `## モード: 朝の予報（Forecast）
あなたは朝の天気予報を伝えるキャスターです。
今日一日の見通しを伝え、必要な備えを促してください。
「今日のインターネットは○○です」という形式で始めてください。`
        : `## モード: 夜の振り返り（Review）
あなたは夜のニュース番組のキャスターです。
今日一日を振り返り、明日への備えを伝えてください。
「本日のインターネットは○○でした」という形式で始めてください。`;

    return `あなたはサイバー気象予報士「Weather Caster AI」です。

${modeInstruction}

## 分析結果
- 天気: ${weatherEmoji} ${weatherJp}
- 脅威レベル: ${analystOutput.threatLevel}/5
- 要約: ${analystOutput.summary}
- 関連理由: ${analystOutput.relevanceReason}

## 注目ニュース
${analystOutput.analyzedItems.slice(0, 3).map((item) => `- ${item.title}: ${item.summary}`).join('\n')}

## 出力形式（JSON）
{
  "headline": "見出し（1行、インパクトのある表現で）",
  "body": "本文（2-3文。親しみやすく、でも専門性を感じる文体で）",
  "closingRemark": "締めの一言（明日への備えや励ましなど）"
}

JSONのみを出力してください。`;
}

/**
 * Narrator Agent を実行
 */
export async function runNarrator(
    analystOutput: AnalystOutput,
    mode?: NarratorMode
): Promise<NarratorOutput> {
    const actualMode = mode ?? getNarratorMode();

    // 分析結果が空の場合のデフォルト応答
    if (analystOutput.analyzedItems.length === 0) {
        const weatherJp = weatherToJapanese(analystOutput.weatherCondition);
        const weatherEmoji = weatherToEmoji(analystOutput.weatherCondition);

        return {
            mode: actualMode,
            headline: `${weatherEmoji} 今日のインターネットは${weatherJp}`,
            body: actualMode === 'forecast'
                ? '本日は特に注目すべきセキュリティニュースはありません。穏やかな一日になりそうです。'
                : '本日は特に大きな動きはありませんでした。静かな一日でした。',
            closingRemark: '引き続き、安全なインターネットライフをお過ごしください。',
        };
    }

    const prompt = buildNarratorPrompt(analystOutput, actualMode);

    try {
        const result = await generateJSON<{
            headline: string;
            body: string;
            closingRemark: string;
        }>(prompt);

        return {
            mode: actualMode,
            ...result,
        };
    } catch (error) {
        console.error('Narrator error:', error);
        const weatherJp = weatherToJapanese(analystOutput.weatherCondition);
        const weatherEmoji = weatherToEmoji(analystOutput.weatherCondition);

        return {
            mode: actualMode,
            headline: `${weatherEmoji} 今日のインターネットは${weatherJp}`,
            body: analystOutput.summary,
            closingRemark: '詳細は下記のニュースをご確認ください。',
        };
    }
}
