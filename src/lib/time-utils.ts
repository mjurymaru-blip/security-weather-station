/**
 * 時間帯ユーティリティ
 */

import type { NarratorMode } from '@/types';

/**
 * 現在の時間帯からNarratorモードを判定
 */
export function getNarratorMode(): NarratorMode {
    const hour = new Date().getHours();
    // 18時以降は振り返りモード
    return hour >= 18 ? 'review' : 'forecast';
}
