'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMockReport } from '@/data/mock-reports';
import { getApiKey, getUserProfile, getSettings } from '@/lib/settings-store';
import { collectNewsClient, filterRecentNews } from '@/lib/collector-client';
import { analyzeSecurityNews } from '@/lib/gemini-client';
import type { WeatherReport } from '@/actions/pipeline';

interface UseWeatherReportReturn {
    report: WeatherReport | null;
    isLoading: boolean;
    error: string | null;
    isLiveMode: boolean;
    refresh: () => void;
}

/**
 * 天気レポートを取得するカスタムフック
 * 設定に応じてデモモードまたは本番モードを切り替え
 * 
 * クライアントサイドで直接API呼び出しを行う（GitHub Pages対応）
 */
export function useWeatherReport(): UseWeatherReportReturn {
    const [report, setReport] = useState<WeatherReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLiveMode, setIsLiveMode] = useState(false);

    const fetchReport = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const apiKey = getApiKey();
            const settings = getSettings();
            const profile = getUserProfile();

            // デモモードまたはAPIキーがない場合はモックデータ
            if (settings.useDemoMode || !apiKey) {
                const mockReport = getMockReport();
                setReport(mockReport);
                setIsLiveMode(false);
                setIsLoading(false);
                return;
            }

            // 本番モード: クライアントサイドで直接API呼び出し
            setIsLiveMode(true);

            // 1. ニュース収集（CORSプロキシ経由）
            const allNews = await collectNewsClient();
            const recentNews = filterRecentNews(allNews, 3);

            // 2. AI分析（直接Gemini API呼び出し）
            const liveReport = await analyzeSecurityNews(
                apiKey,
                settings.geminiModel,
                recentNews,
                profile
            );

            setReport(liveReport);
        } catch (err) {
            console.error('Failed to fetch report:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';

            // レート制限エラーの検出
            if (errorMessage.includes('429') || errorMessage.includes('quota')) {
                setError('API利用制限に達しました。1〜2分待ってから再試行してください。');
            } else if (errorMessage.includes('API')) {
                setError('API呼び出しに失敗しました。別のモデルを試すか、しばらく待ってください。');
            } else {
                setError(errorMessage);
            }

            // エラー時はフォールバックでモックデータを表示
            const mockReport = getMockReport();
            setReport(mockReport);
            setIsLiveMode(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    // 設定変更を監視
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key?.includes('security-weather')) {
                fetchReport();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [fetchReport]);

    return {
        report,
        isLoading,
        error,
        isLiveMode,
        refresh: fetchReport,
    };
}
