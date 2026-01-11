/**
 * 設定ストア - localStorage管理
 * 
 * camp-checklist方式: APIキーはブラウザのlocalStorageにのみ保存され、
 * 外部サーバーには送信されない。
 * 
 * 暗号化モード: マスターパスワードでAPIキーを暗号化して保存
 */

import type { UserProfile } from '@/types';
import { getCachedApiKey, hasEncryptedKey } from '@/lib/crypto-store';

const STORAGE_KEYS = {
    API_KEY: 'security-weather-api-key', // 平文（後方互換性）
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
    /** 暗号化モードを使用するか */
    useEncryption: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
    useDemoMode: true,
    geminiModel: 'gemini-2.0-flash',
    useEncryption: false,
};

const DEFAULT_PROFILE: UserProfile = {
    techStack: ['Linux', 'Docker', 'Next.js', 'PostgreSQL', 'Node.js'],
    interests: ['OSS', 'Web Security', 'Cloud'],
};

// =============================================================================
// API Key
// =============================================================================

/**
 * APIキーを取得（暗号化/非暗号化両対応）
 * 
 * 優先順位:
 * 1. SessionStorageにキャッシュされた復号済みキー
 * 2. localStorage の平文キー（後方互換性）
 */
export function getApiKey(): string | null {
    if (typeof window === 'undefined') return null;

    // 暗号化モード: SessionStorageから取得
    const cached = getCachedApiKey();
    if (cached) return cached;

    // 平文モード（後方互換性）
    return localStorage.getItem(STORAGE_KEYS.API_KEY);
}

/**
 * APIキーを平文で保存（後方互換性用）
 * 新規ユーザーは暗号化モードを推奨
 */
export function setApiKey(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
}

export function clearApiKey(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
}

/**
 * APIキーが存在するか（暗号化/非暗号化両方をチェック）
 */
export function hasApiKey(): boolean {
    if (typeof window === 'undefined') return false;

    // 暗号化されたキーがあるか
    if (hasEncryptedKey()) return true;

    // 平文キーがあるか
    const key = localStorage.getItem(STORAGE_KEYS.API_KEY);
    return !!key && key.length > 0;
}

/**
 * ライブモードが使用可能か（復号済みキーまたは平文キーがあるか）
 */
export function isLiveModeAvailable(): boolean {
    return getApiKey() !== null;
}

/**
 * 暗号化モードで保護されているか
 */
export function isEncryptionEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    return hasEncryptedKey();
}

/**
 * パスワード入力が必要か（暗号化されているがキャッシュがない）
 */
export function needsPasswordUnlock(): boolean {
    if (typeof window === 'undefined') return false;
    return hasEncryptedKey() && !getCachedApiKey();
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
    if (!isLiveModeAvailable()) return true;
    return getSettings().useDemoMode;
}
