'use client';

import type { WeatherCondition } from '@/types';

interface WeatherIconProps {
    condition: WeatherCondition;
    size?: 'sm' | 'md' | 'lg';
}

const WEATHER_EMOJIS: Record<WeatherCondition, string> = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    stormy: '⛈️',
};

const SIZE_CLASSES = {
    sm: 'text-4xl',
    md: 'text-6xl',
    lg: 'text-8xl',
};

export function WeatherIcon({ condition, size = 'lg' }: WeatherIconProps) {
    return (
        <div className={`weather-icon ${SIZE_CLASSES[size]}`} role="img" aria-label={condition}>
            {WEATHER_EMOJIS[condition]}
        </div>
    );
}
