/**
 * 設定ストア - localStorage管理
 * 
 * camp-checklist方式: APIキーはブラウザのlocalStorageにのみ保存され、
 * 外部サーバーには送信されない。
 */

import type { UserProfile } from '@/types';

const STORAGE_KEYS = {
    API_KEY: 'security-weather-api-key',
    USER_PROFILE: 'security-weather-user-profile',
    SETTINGS: 'security-weather-settings',
} as const;

/**
 * 設定の型定義
 */
export interface AppSettings {
    /** デモモードを使用するか（APIキーがない場合は自動的にtrue） */
    useDemoMode: boolean;
    /** 選択中のGeminiモデル */
    geminiModel: string;
}

const DEFAULT_SETTINGS: AppSettings = {
    useDemoMode: true,
    geminiModel: 'gemini-2.0-flash',
};

const DEFAULT_PROFILE: UserProfile = {
    techStack: ['Linux', 'Docker', 'Next.js', 'PostgreSQL', 'Node.js'],
    interests: ['OSS', 'Web Security', 'Cloud'],
};

// =============================================================================
// API Key
// =============================================================================

export function getApiKey(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.API_KEY);
}

export function setApiKey(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
}

export function clearApiKey(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
}

export function hasApiKey(): boolean {
    const key = getApiKey();
    return !!key && key.length > 0;
}

// =============================================================================
// User Profile
// =============================================================================

export function getUserProfile(): UserProfile {
    if (typeof window === 'undefined') return DEFAULT_PROFILE;

    const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!stored) return DEFAULT_PROFILE;

    try {
        return JSON.parse(stored) as UserProfile;
    } catch {
        return DEFAULT_PROFILE;
    }
}

export function setUserProfile(profile: UserProfile): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
}

// =============================================================================
// App Settings
// =============================================================================

export function getSettings(): AppSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;

    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!stored) return DEFAULT_SETTINGS;

    try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function setSettings(settings: Partial<AppSettings>): void {
    if (typeof window === 'undefined') return;
    const current = getSettings();
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
}

// =============================================================================
// Convenience
// =============================================================================

export function shouldUseDemoMode(): boolean {
    if (!hasApiKey()) return true;
    return getSettings().useDemoMode;
}
