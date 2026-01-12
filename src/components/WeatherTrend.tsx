'use client';

import type { DailySnapshot } from '@/lib/history-store';
import type { WeatherCondition } from '@/types';

interface WeatherTrendProps {
    history: DailySnapshot[];
    isLoading: boolean;
}

/**
 * 天気アイコンを取得
 */
function getWeatherIcon(condition: WeatherCondition): string {
    const icons: Record<WeatherCondition, string> = {
        sunny: '☀️',
        cloudy: '⛅',
        rainy: '🌧️',
        stormy: '⛈️',
    };
    return icons[condition] || '❓';
}

/**
 * 天気状態の高さレベルを取得（1-4）
 */
function getWeatherLevel(condition: WeatherCondition): number {
    const levels: Record<WeatherCondition, number> = {
        sunny: 1,
        cloudy: 2,
        rainy: 3,
        stormy: 4,
    };
    return levels[condition] || 1;
}

/**
 * 曜日を取得
 */
function getDayOfWeek(dateStr: string): string {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const date = new Date(dateStr + 'T00:00:00');
    return days[date.getDay()];
}

/**
 * 天気推移グラフコンポーネント
 * 
 * 過去14日間の天気をアイコンで可視化
 * アクセシビリティのためaria-labelを設定
 */
export function WeatherTrend({ history, isLoading }: WeatherTrendProps) {
    if (isLoading) {
        return (
            <div className="card opacity-60">
                <p className="text-sm">履歴を読み込み中...</p>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="card text-center py-6 opacity-60">
                <p className="text-sm">📊 履歴データがありません</p>
                <p className="text-xs mt-1">毎日アクセスすると天気の推移が記録されます</p>
            </div>
        );
    }

    // 表示用に古い順にソート（左が過去、右が現在）
    const displayHistory = [...history].reverse().slice(-7);

    return (
        <div className="card">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
                <span>📈</span>
                <span>週間天気推移</span>
            </h3>

            {/* グラフ本体 */}
            <div
                className="relative"
                role="img"
                aria-label={`過去${displayHistory.length}日間の天気推移`}
            >
                {/* グリッド背景 */}
                <div className="absolute inset-0 grid grid-rows-4 gap-0 pointer-events-none opacity-10">
                    <div className="border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div />
                </div>

                {/* アイコン配置 */}
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${displayHistory.length}, 1fr)` }}>
                    {displayHistory.map((snapshot, index) => {
                        const level = getWeatherLevel(snapshot.weatherCondition);
                        const icon = getWeatherIcon(snapshot.weatherCondition);
                        const isToday = index === displayHistory.length - 1;

                        return (
                            <div key={snapshot.date} className="flex flex-col items-center">
                                {/* アイコン（高さで脅威レベルを表現） */}
                                <div
                                    className="flex flex-col justify-end h-24"
                                    style={{ paddingBottom: `${(level - 1) * 20}px` }}
                                >
                                    <div
                                        className={`text-2xl transition-transform hover:scale-125 cursor-default ${isToday ? 'animate-pulse' : ''}`}
                                        title={`${snapshot.date}: ${snapshot.weatherCondition} (Lv.${snapshot.threatLevel})`}
                                        aria-label={`${snapshot.date}: ${snapshot.weatherCondition === 'sunny' ? '晴れ' : snapshot.weatherCondition === 'cloudy' ? '曇り' : snapshot.weatherCondition === 'rainy' ? '雨' : '嵐'} 脅威レベル${snapshot.threatLevel}`}
                                    >
                                        {icon}
                                    </div>
                                </div>

                                {/* 日付ラベル */}
                                <div className={`text-xs mt-1 ${isToday ? 'font-bold text-blue-400' : 'opacity-60'}`}>
                                    {getDayOfWeek(snapshot.date)}
                                </div>

                                {/* モードインジケーター */}
                                <div className="text-[10px] opacity-40">
                                    {snapshot.mode === 'forecast' ? '🌅' : '🌙'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 凡例 */}
            <div className="mt-4 pt-3 border-t border-white/10">
                <div className="flex justify-center gap-4 text-xs opacity-60">
                    <span>☀️ 晴れ</span>
                    <span>⛅ 曇り</span>
                    <span>🌧️ 雨</span>
                    <span>⛈️ 嵐</span>
                </div>
            </div>

            {/* スクリーンリーダー用テーブル（非表示） */}
            <table className="sr-only">
                <caption>過去の天気履歴</caption>
                <thead>
                    <tr>
                        <th>日付</th>
                        <th>天気</th>
                        <th>脅威レベル</th>
                        <th>件数</th>
                    </tr>
                </thead>
                <tbody>
                    {displayHistory.map((snapshot) => (
                        <tr key={snapshot.date}>
                            <td>{snapshot.date}</td>
                            <td>{snapshot.weatherCondition}</td>
                            <td>{snapshot.threatLevel}</td>
                            <td>{snapshot.analyzedItemsCount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
