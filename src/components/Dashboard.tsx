'use client';

import { useWeatherReport } from '@/hooks/useWeatherReport';
import {
    WeatherIcon,
    ThreatGauge,
    ModeBadge,
    BroadcastCard,
    RelevanceCard,
    NewsList,
} from '@/components';
import type { WeatherCondition } from '@/types';

function getWeatherClass(condition: WeatherCondition): string {
    const classes: Record<WeatherCondition, string> = {
        sunny: 'weather-sunny',
        cloudy: 'weather-cloudy',
        rainy: 'weather-rainy',
        stormy: 'weather-stormy',
    };
    return classes[condition];
}

function LoadingState() {
    return (
        <div className="min-h-screen weather-cloudy flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="text-6xl animate-pulse">🔍</div>
                <p className="opacity-70">セキュリティニュースを分析中...</p>
            </div>
        </div>
    );
}

export function Dashboard() {
    const { report, isLoading, error, isLiveMode, refresh } = useWeatherReport();

    if (isLoading) {
        return <LoadingState />;
    }

    if (!report) {
        return (
            <div className="min-h-screen weather-cloudy flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="text-6xl">⚠️</div>
                    <p>データを取得できませんでした</p>
                    <button
                        onClick={refresh}
                        className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20"
                    >
                        再試行
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${getWeatherClass(report.weatherCondition)}`}>
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Mode Banner */}
                <div className="mb-6 p-3 rounded-lg bg-black/20 backdrop-blur text-center text-sm">
                    <div className="flex items-center justify-center gap-2">
                        {isLiveMode ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="opacity-70">🔴 ライブモード</span>
                            </>
                        ) : (
                            <>
                                <span className="opacity-70">🎮 デモモード</span>
                            </>
                        )}
                        <button
                            onClick={refresh}
                            className="ml-2 px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition text-xs"
                        >
                            🔄 更新
                        </button>
                    </div>
                    {error && (
                        <p className="text-xs text-yellow-400 mt-1">⚠️ {error}（フォールバックデータを表示中）</p>
                    )}
                </div>

                {/* Header */}
                <header className="text-center mb-8">
                    <div className="flex justify-center items-center gap-3 mb-4">
                        <ModeBadge mode={report.mode} />
                        <span className="timestamp">
                            {new Date(report.generatedAt).toLocaleString('ja-JP', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    </div>
                    <WeatherIcon condition={report.weatherCondition} size="lg" />
                </header>

                {/* Main Content */}
                <main className="space-y-6">
                    {/* Threat Gauge */}
                    <div className="card">
                        <ThreatGauge level={report.threatLevel} />
                    </div>

                    {/* Broadcast */}
                    <BroadcastCard
                        headline={report.headline}
                        body={report.body}
                        closingRemark={report.closingRemark}
                    />

                    {/* Relevance */}
                    <RelevanceCard reason={report.relevanceReason} />

                    {/* News List */}
                    <NewsList items={report.analyzedItems} />
                </main>

                {/* Footer */}
                <footer className="mt-12 text-center">
                    <p className="text-xs opacity-50">
                        Security Weather Station
                        <br />
                        Powered by Gemini AI
                    </p>
                </footer>
            </div>
        </div>
    );
}
