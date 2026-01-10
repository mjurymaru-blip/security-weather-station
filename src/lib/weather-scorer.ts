/**
 * Weather Scorer - 天気判定システム
 * 
 * 思想: AIに全判断を任せない。複合要因でスコアリングし、
 * Geminiは「評価理由の言語化」に専念させる。
 */

import type { WeatherScores, WeatherCondition } from '@/types';

/**
 * スコアの重み設定
 * 
 * 設計思想:
 * - このアプリは「個人開発者向け」であり、組織向けではない
 * - そのため「自分に関係あるか」(Relevance) を最も重視する
 * - 企業向けなら Severity を最重視するが、個人は「自分ごと」が大事
 * 
 * Relevance is weighted highest because this app is for individual developers,
 * not organizations. An individual cares most about "Does this affect MY stack?"
 * rather than abstract severity scores.
 */
const WEIGHTS = {
    /** ニュース量: 多いほど注意が必要だが、ノイズも多い */
    volume: 0.2,
    /** 深刻度: CVSSスコアベース。高いと危険だが、関係なければ意味がない */
    severity: 0.3,
    /** 関連度: 最重要。自分の技術スタックに関係あるかどうか */
    relevance: 0.35,
    /** トレンド: 昨日より増えているか。急増は警戒サイン */
    trend: 0.15,
} as const;

/**
 * 天気判定の閾値
 * 
 * 設計思想:
 * - 「嵐」は滅多に出さない。本当に危険な時だけ
 * - 「晴れ」も厳密に。油断させない程度の閾値
 * - 日常的には「曇り」「雨」が多くなるよう調整
 * 
 * The thresholds are intentionally conservative.
 * "Stormy" should be rare - only for truly critical situations.
 */
const THRESHOLDS = {
    sunny: 0.25,  // 25%未満で晴れ（静穏な日は稀）
    cloudy: 0.50, // 50%未満で曇り（日常的な状態）
    rainy: 0.75,  // 75%未満で雨（注意が必要）
    // 75%以上で嵐（緊急対応が必要）
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
