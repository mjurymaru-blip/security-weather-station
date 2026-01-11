/**
 * Gemini API クライアント（ブラウザ用）
 * 
 * camp-checklist方式: クライアントから直接Gemini APIを呼び出す
 * APIキーはlocalStorageに保存され、ブラウザからのみ送信される
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
    NewsItem,
    OrchestratorOutput,
    AnalystOutput,
    NarratorOutput,
    UserProfile,
    WeatherScores,
} from '@/types';
import { calcWeather } from '@/lib/weather-scorer';
import { getNarratorMode } from '@/lib/time-utils';
import type { WeatherReport } from '@/actions/pipeline';

/**
 * モデル一覧を取得
 */
export async function fetchModels(apiKey: string): Promise<{ id: string; name: string }[]> {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch models');
    }

    const data = await response.json();
    return (data.models || [])
        .filter((m: { supportedGenerationMethods?: string[] }) =>
            m.supportedGenerationMethods?.includes('generateContent')
        )
        .map((m: { name: string; displayName: string }) => ({
            id: m.name.replace('models/', ''),
            name: m.displayName,
        }));
}

/**
 * APIキーをテスト（モデル一覧取得のみ）
 */
export async function testApiKey(apiKey: string): Promise<{ valid: boolean; models: { id: string; name: string }[] }> {
    try {
        const models = await fetchModels(apiKey);
        return { valid: models.length > 0, models };
    } catch {
        return { valid: false, models: [] };
    }
}

/**
 * JSONを生成
 */
async function generateJSON<T>(
    genAI: GoogleGenerativeAI,
    model: string,
    prompt: string
): Promise<T> {
    const genModel = genAI.getGenerativeModel({ model });
    const result = await genModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: 'application/json',
        },
    });
    const text = result.response.text();
    return JSON.parse(text) as T;
}

/**
 * セキュリティ分析を実行（クライアントサイド）
 */
export async function analyzeSecurityNews(
    apiKey: string,
    model: string,
    newsItems: NewsItem[],
    profile: UserProfile
): Promise<WeatherReport> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const mode = getNarratorMode();

    // ニュースがない場合のデフォルト
    if (newsItems.length === 0) {
        return {
            generatedAt: new Date(),
            mode,
            weatherCondition: 'sunny',
            threatLevel: 1,
            headline: '☀️ 今日のインターネットは晴れ',
            body: '本日は特に注目すべきセキュリティニュースはありません。穏やかな一日になりそうです。',
            closingRemark: '引き続き、安全なインターネットライフをお過ごしください。',
            relevanceReason: '特に対応が必要な項目はありません。',
            analyzedItems: [],
            newsItems: [],
            orchestratorOutput: {
                strategy: 'brief',
                tone: 'calm',
                reason: '本日は関連するセキュリティニュースがありません',
                focusItems: [],
            },
        };
    }

    // 1. Orchestrator
    const orchestratorOutput = await runOrchestrator(genAI, model, newsItems, profile);

    // 2. Analyst
    const analystOutput = await runAnalyst(genAI, model, newsItems, orchestratorOutput, profile);

    // 3. Narrator
    const narratorOutput = await runNarrator(genAI, model, analystOutput, mode);

    return {
        generatedAt: new Date(),
        mode,
        weatherCondition: analystOutput.weatherCondition,
        threatLevel: analystOutput.threatLevel,
        headline: narratorOutput.headline,
        body: narratorOutput.body,
        closingRemark: narratorOutput.closingRemark,
        relevanceReason: analystOutput.relevanceReason,
        analyzedItems: analystOutput.analyzedItems,
        newsItems,
        orchestratorOutput,
    };
}

async function runOrchestrator(
    genAI: GoogleGenerativeAI,
    model: string,
    newsItems: NewsItem[],
    profile: UserProfile
): Promise<OrchestratorOutput> {
    const newsListText = newsItems
        .slice(0, 20)
        .map((item, i) => `${i + 1}. [${item.source}] ${item.title}`)
        .join('\n');

    const prompt = `あなたはサイバー気象予報センターの司令塔です。
ユーザーの技術スタック: ${profile.techStack.join(', ')}
本日のニュース一覧（${newsItems.length}件）:
${newsListText}

判断してJSON出力:
{"strategy":"brief|normal|deep","tone":"calm|cautious|alert","reason":"理由","focusItems":["注目ニュース"]}`;

    try {
        return await generateJSON<OrchestratorOutput>(genAI, model, prompt);
    } catch {
        return {
            strategy: 'normal',
            tone: 'cautious',
            reason: 'AI分析に失敗',
            focusItems: newsItems.slice(0, 3).map((item) => item.title),
        };
    }
}

async function runAnalyst(
    genAI: GoogleGenerativeAI,
    model: string,
    newsItems: NewsItem[],
    orchestratorOutput: OrchestratorOutput,
    profile: UserProfile
): Promise<AnalystOutput> {
    const newsListText = newsItems
        .slice(0, 30)
        .map((item, i) => `${i + 1}. [${item.source}] ${item.title}: ${item.rawContent.slice(0, 100)}`)
        .join('\n');

    const prompt = `あなたはサイバーセキュリティアナリストです。
戦略: ${orchestratorOutput.strategy}, トーン: ${orchestratorOutput.tone}
ユーザーの技術スタック: ${profile.techStack.join(', ')}

【重要な指示】
- 同じソフトウェア/製品に関する複数の脆弱性は、1つの項目にまとめてください
- 例: 「Chrome の脆弱性が3件」→ 1つの項目として「Google Chrome セキュリティアップデート（3件の脆弱性修正）」
- ユーザーの技術スタックに関連するものを優先してください
- 最大5項目までに絞ってください

ニュース:
${newsListText}

JSON出力:
{"summary":"全体の3行要約","relevanceReason":"ユーザーへの関連理由","analyzedItems":[{"id":"software-name","title":"ソフトウェア名とアップデート内容","threatLevel":1-5,"summary":"脆弱性の概要（複数あれば件数も）","relevanceScore":0-1}]}`;

    try {
        const result = await generateJSON<{
            summary: string;
            relevanceReason: string;
            analyzedItems: AnalystOutput['analyzedItems'];
        }>(genAI, model, prompt);

        const scores: WeatherScores = {
            volume: Math.min(newsItems.length / 10, 1),
            severity: result.analyzedItems.length > 0
                ? Math.max(...result.analyzedItems.map((item) => item.threatLevel)) / 5
                : 0,
            relevance: result.analyzedItems.length > 0
                ? result.analyzedItems.reduce((sum, item) => sum + item.relevanceScore, 0) / result.analyzedItems.length
                : 0,
            trend: 0.5,
        };

        return {
            weatherCondition: calcWeather(scores),
            threatLevel: result.analyzedItems.length > 0
                ? Math.max(...result.analyzedItems.map((item) => item.threatLevel))
                : 1,
            summary: result.summary,
            relevanceReason: result.relevanceReason,
            analyzedItems: result.analyzedItems,
        };
    } catch {
        return {
            weatherCondition: 'cloudy',
            threatLevel: 2,
            summary: 'AI分析に失敗しました。',
            relevanceReason: '分析結果を取得できませんでした。',
            analyzedItems: [],
        };
    }
}

async function runNarrator(
    genAI: GoogleGenerativeAI,
    model: string,
    analystOutput: AnalystOutput,
    mode: 'forecast' | 'review'
): Promise<NarratorOutput> {
    const modeText = mode === 'forecast' ? '朝の予報' : '夜の振り返り';

    const prompt = `あなたはサイバー気象予報士です。${modeText}モードで話してください。
天気: ${analystOutput.weatherCondition}
脅威レベル: ${analystOutput.threatLevel}/5
要約: ${analystOutput.summary}

JSON出力:
{"headline":"見出し","body":"本文2-3文","closingRemark":"締めの一言"}`;

    try {
        const result = await generateJSON<{
            headline: string;
            body: string;
            closingRemark: string;
        }>(genAI, model, prompt);

        return { mode, ...result };
    } catch {
        return {
            mode,
            headline: `今日のインターネットは${analystOutput.weatherCondition === 'sunny' ? '晴れ' : '曇り'}`,
            body: analystOutput.summary,
            closingRemark: '詳細は下記のニュースをご確認ください。',
        };
    }
}
