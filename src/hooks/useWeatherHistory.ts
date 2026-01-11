'use client';

import { useState, useEffect, useCallback } from 'react';
import { getHistory, saveSnapshot, type DailySnapshot } from '@/lib/history-store';
import type { WeatherReport } from '@/actions/pipeline';
import { getNarratorMode } from '@/lib/time-utils';

interface UseWeatherHistoryReturn {
    /** 履歴データ（新しい順） */
    history: DailySnapshot[];
    /** 読み込み中 */
    isLoading: boolean;
    /** 現在のレポートを履歴に保存 */
    saveCurrentReport: (report: WeatherReport) => Promise<void>;
    /** 履歴を再読み込み */
    refresh: () => Promise<void>;
}

/**
 * 天気履歴を管理するカスタムフック
 */
export function useWeatherHistory(): UseWeatherHistoryReturn {
    const [history, setHistory] = useState<DailySnapshot[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getHistory(14);
            setHistory(data);
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const saveCurrentReport = useCallback(async (report: WeatherReport) => {
        try {
            const topItems = report.analyzedItems.slice(0, 3).map((item) => ({
                title: item.title,
                source: item.id,
            }));

            await saveSnapshot(
                report.weatherCondition,
                report.threatLevel,
                report.analyzedItems.length,
                topItems,
                getNarratorMode()
            );

            // 保存後に履歴を再読み込み
            await loadHistory();
        } catch (error) {
            console.error('Failed to save snapshot:', error);
        }
    }, [loadHistory]);

    return {
        history,
        isLoading,
        saveCurrentReport,
        refresh: loadHistory,
    };
}
