import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { collectAllNews, filterRecentNews } from '@/lib/collector';
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

/**
 * セキュリティ分析APIエンドポイント
 * 
 * POST /api/analyze
 * Body: { 
 *   apiKey: string,
 *   profile: UserProfile,
 *   model?: string
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const { apiKey, profile, model = 'gemini-2.0-flash' } = await request.json();

        if (!apiKey) {
            return NextResponse.json(
                { error: 'API key is required' },
                { status: 400 }
            );
        }

        const userProfile: UserProfile = profile || {
            techStack: ['Linux', 'Docker', 'Next.js', 'PostgreSQL', 'Node.js'],
            interests: ['OSS', 'Web Security', 'Cloud'],
        };

        // 1. Collector: ニュース収集
        const allNews = await collectAllNews();
        const recentNews = filterRecentNews(allNews, 3);

        // Gemini クライアント初期化
        const genAI = new GoogleGenerativeAI(apiKey);
        const genModel = genAI.getGenerativeModel({ model });

        // 2. Orchestrator: 戦略決定
        const orchestratorOutput = await runOrchestratorWithKey(genModel, recentNews, userProfile);

        // 3. Analyst: 技術分析
        const analystOutput = await runAnalystWithKey(genModel, recentNews, orchestratorOutput, userProfile);

        // 4. Narrator: 文章整形
        const mode = getNarratorMode();
        const narratorOutput = await runNarratorWithKey(genModel, analystOutput, mode);

        return NextResponse.json({
            success: true,
            report: {
                generatedAt: new Date().toISOString(),
                mode,
                weatherCondition: analystOutput.weatherCondition,
                threatLevel: analystOutput.threatLevel,
                headline: narratorOutput.headline,
                body: narratorOutput.body,
                closingRemark: narratorOutput.closingRemark,
                relevanceReason: analystOutput.relevanceReason,
                analyzedItems: analystOutput.analyzedItems,
                newsItems: recentNews,
                orchestratorOutput,
            },
        });
    } catch (error) {
        console.error('Analysis error:', error);
        return NextResponse.json(
            { error: 'Analysis failed', details: String(error) },
            { status: 500 }
        );
    }
}

// =============================================================================
// Helper Functions
// =============================================================================

async function generateJSON<T>(model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>, prompt: string): Promise<T> {
    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: 'application/json',
        },
    });
    const text = result.response.text();
    return JSON.parse(text) as T;
}

async function runOrchestratorWithKey(
    model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
    newsItems: NewsItem[],
    profile: UserProfile
): Promise<OrchestratorOutput> {
    if (newsItems.length === 0) {
        return {
            strategy: 'brief',
            tone: 'calm',
            reason: '本日は関連するセキュリティニュースがありません',
            focusItems: [],
        };
    }

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
        return await generateJSON<OrchestratorOutput>(model, prompt);
    } catch {
        return {
            strategy: 'normal',
            tone: 'cautious',
            reason: 'AI分析に失敗',
            focusItems: newsItems.slice(0, 3).map((item) => item.title),
        };
    }
}

async function runAnalystWithKey(
    model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
    newsItems: NewsItem[],
    orchestratorOutput: OrchestratorOutput,
    profile: UserProfile
): Promise<AnalystOutput> {
    if (newsItems.length === 0) {
        return {
            weatherCondition: 'sunny',
            threatLevel: 1,
            summary: '本日は関連するセキュリティニュースがありません。',
            relevanceReason: '特に対応が必要な項目はありません。',
            analyzedItems: [],
        };
    }

    const newsListText = newsItems
        .slice(0, 15)
        .map((item, i) => `${i + 1}. [${item.source}] ${item.title}: ${item.rawContent.slice(0, 150)}...`)
        .join('\n');

    const prompt = `あなたはサイバーセキュリティアナリストです。
戦略: ${orchestratorOutput.strategy}, トーン: ${orchestratorOutput.tone}
ユーザーの技術スタック: ${profile.techStack.join(', ')}

ニュース:
${newsListText}

JSON出力:
{"summary":"3行要約","relevanceReason":"関連理由","analyzedItems":[{"id":"ID","title":"タイトル","threatLevel":1-5,"summary":"要約","relevanceScore":0-1}]}`;

    try {
        const result = await generateJSON<{
            summary: string;
            relevanceReason: string;
            analyzedItems: AnalystOutput['analyzedItems'];
        }>(model, prompt);

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

async function runNarratorWithKey(
    model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
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
        }>(model, prompt);

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
