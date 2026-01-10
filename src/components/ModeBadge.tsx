'use client';

import type { NarratorMode } from '@/types';

interface ModeBadgeProps {
    mode: NarratorMode;
}

export function ModeBadge({ mode }: ModeBadgeProps) {
    const isForecast = mode === 'forecast';

    return (
        <span className={`mode-badge ${isForecast ? 'mode-forecast' : 'mode-review'}`}>
            {isForecast ? '🌅' : '🌙'}
            {isForecast ? '朝の予報' : '夜の振り返り'}
        </span>
    );
}
