'use server';

/**
 * Weather Pipeline - 全Agentを統合したパイプライン
 * 
 * Collector → Orchestrator → Analyst → Narrator
 * の一連の処理を実行し、最終的なダッシュボードデータを生成。
 */

import { collectAllNews, filterRecentNews } from '@/lib/collector';
import { getNarratorMode } from '@/lib/time-utils';
import { runOrchestrator } from '@/actions/orchestrate';
import { runAnalyst } from '@/actions/analyze';
import { runNarrator } from '@/actions/narrate';
import type {
    NewsItem,
    OrchestratorOutput,
    AnalystOutput,
    NarratorOutput,
    NarratorMode,
    UserProfile,
    WeatherCondition,
} from '@/types';

/**
 * パイプライン全体の出力
 */
export interface WeatherReport {
    // メタ情報
    generatedAt: Date;
    mode: NarratorMode;

    // 天気情報
    weatherCondition: WeatherCondition;
    threatLevel: number;

    // Narrator出力（表示用）
    headline: string;
    body: string;
    closingRemark: string;
    relevanceReason: string;

    // 詳細情報
    analyzedItems: AnalystOutput['analyzedItems'];
    newsItems: NewsItem[];

    // デバッグ用
    orchestratorOutput: OrchestratorOutput;
}

/**
 * 天気予報パイプラインを実行
 */
export async function runWeatherPipeline(
    profile?: UserProfile
): Promise<WeatherReport> {
    const mode = getNarratorMode();

    // 1. Collector: ニュース収集
    const allNews = await collectAllNews();
    const recentNews = filterRecentNews(allNews, 3); // 直近3日間

    // 2. Orchestrator: 戦略決定
    const orchestratorOutput = await runOrchestrator(recentNews, profile);

    // 3. Analyst: 技術分析
    const analystOutput = await runAnalyst(recentNews, orchestratorOutput, profile);

    // 4. Narrator: 文章整形
    const narratorOutput = await runNarrator(analystOutput, mode);

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
        newsItems: recentNews,
        orchestratorOutput,
    };
}
