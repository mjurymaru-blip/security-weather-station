'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMockReport } from '@/data/mock-reports';
import { getApiKey, getUserProfile, getSettings } from '@/lib/settings-store';
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

            // 本番モード: APIを呼び出し
            setIsLiveMode(true);

            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey,
                    profile,
                    model: settings.geminiModel,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Analysis failed');
            }

            const data = await response.json();

            // APIレスポンスをWeatherReport形式に変換
            const liveReport: WeatherReport = {
                ...data.report,
                generatedAt: new Date(data.report.generatedAt),
            };

            setReport(liveReport);
        } catch (err) {
            console.error('Failed to fetch report:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
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
