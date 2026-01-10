/**
 * Weather Scorer - 天気判定システム
 * 
 * 思想: AIに全判断を任せない。複合要因でスコアリングし、
 * Geminiは「評価理由の言語化」に専念させる。
 */

import type { WeatherScores, WeatherCondition } from '@/types';

/**
 * スコアの重み設定
 */
const WEIGHTS = {
    volume: 0.2,
    severity: 0.3,
    relevance: 0.35,
    trend: 0.15,
} as const;

/**
 * 天気判定の閾値
 */
const THRESHOLDS = {
    sunny: 0.25,
    cloudy: 0.50,
    rainy: 0.75,
} as const;

/**
 * 複合スコアから天気を判定
 */
export function calcWeather(scores: WeatherScores): WeatherCondition {
    const total =
        scores.volume * WEIGHTS.volume +
        scores.severity * WEIGHTS.severity +
        scores.relevance * WEIGHTS.relevance +
        scores.trend * WEIGHTS.trend;

    if (total < THRESHOLDS.sunny) return 'sunny';
    if (total < THRESHOLDS.cloudy) return 'cloudy';
    if (total < THRESHOLDS.rainy) return 'rainy';
    return 'stormy';
}

/**
 * 天気状態を日本語に変換
 */
export function weatherToJapanese(condition: WeatherCondition): string {
    const map: Record<WeatherCondition, string> = {
        sunny: '晴れ',
        cloudy: '曇り',
        rainy: '雨',
        stormy: '嵐',
    };
    return map[condition];
}

/**
 * 天気状態を絵文字に変換
 */
export function weatherToEmoji(condition: WeatherCondition): string {
    const map: Record<WeatherCondition, string> = {
        sunny: '☀️',
        cloudy: '☁️',
        rainy: '🌧️',
        stormy: '⛈️',
    };
    return map[condition];
}

/**
 * 天気状態を英語のステータスメッセージに変換
 */
export function weatherToStatus(condition: WeatherCondition): string {
    const map: Record<WeatherCondition, string> = {
        sunny: 'Clear skies ahead',
        cloudy: 'Slightly overcast',
        rainy: 'Caution advised',
        stormy: 'Storm warning!',
    };
    return map[condition];
}
