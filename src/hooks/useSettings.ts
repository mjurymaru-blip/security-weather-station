'use client';

import { useState, useEffect } from 'react';
import {
    getApiKey,
    setApiKey,
    clearApiKey,
    hasApiKey,
    getUserProfile,
    setUserProfile,
    getSettings,
    setSettings,
    type AppSettings,
} from '@/lib/settings-store';
import type { UserProfile } from '@/types';

/**
 * 設定フックの戻り値
 */
interface UseSettingsReturn {
    // API Key
    apiKey: string;
    setApiKeyValue: (key: string) => void;
    clearApiKeyValue: () => void;
    hasKey: boolean;

    // User Profile
    profile: UserProfile;
    updateProfile: (profile: UserProfile) => void;

    // App Settings
    settings: AppSettings;
    updateSettings: (settings: Partial<AppSettings>) => void;

    // State
    isLoaded: boolean;
}

/**
 * 設定を管理するカスタムフック
 */
export function useSettings(): UseSettingsReturn {
    const [isLoaded, setIsLoaded] = useState(false);
    const [apiKey, setApiKeyState] = useState('');
    const [profile, setProfileState] = useState<UserProfile>({
        techStack: [],
        interests: [],
    });
    const [settings, setSettingsState] = useState<AppSettings>({
        useDemoMode: true,
        geminiModel: 'gemini-2.0-flash',
    });

    // 初期化
    useEffect(() => {
        setApiKeyState(getApiKey() || '');
        setProfileState(getUserProfile());
        setSettingsState(getSettings());
        setIsLoaded(true);
    }, []);

    const setApiKeyValue = (key: string) => {
        setApiKey(key);
        setApiKeyState(key);
        // APIキーが設定されたらデモモードをオフに
        if (key) {
            setSettings({ useDemoMode: false });
            setSettingsState((prev) => ({ ...prev, useDemoMode: false }));
        }
    };

    const clearApiKeyValue = () => {
        clearApiKey();
        setApiKeyState('');
        // APIキーがクリアされたらデモモードをオンに
        setSettings({ useDemoMode: true });
        setSettingsState((prev) => ({ ...prev, useDemoMode: true }));
    };

    const updateProfile = (newProfile: UserProfile) => {
        setUserProfile(newProfile);
        setProfileState(newProfile);
    };

    const updateSettings = (newSettings: Partial<AppSettings>) => {
        setSettings(newSettings);
        setSettingsState((prev) => ({ ...prev, ...newSettings }));
    };

    return {
        apiKey,
        setApiKeyValue,
        clearApiKeyValue,
        hasKey: hasApiKey(),
        profile,
        updateProfile,
        settings,
        updateSettings,
        isLoaded,
    };
}
