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
import { testApiKey, fetchModels } from '@/lib/gemini-client';
import type { UserProfile } from '@/types';

interface GeminiModel {
    id: string;
    name: string;
}

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

    // Models
    models: GeminiModel[];
    isLoadingModels: boolean;
    fetchModelsForKey: (key: string) => Promise<void>;

    // State
    isLoaded: boolean;
}

/**
 * 設定を管理するカスタムフック
 */
export function useSettings(): UseSettingsReturn {
    const [isLoaded, setIsLoaded] = useState(false);
    const [apiKeyState, setApiKeyState] = useState('');
    const [profile, setProfileState] = useState<UserProfile>({
        techStack: [],
        interests: [],
    });
    const [settingsState, setSettingsState] = useState<AppSettings>({
        useDemoMode: true,
        geminiModel: 'gemini-2.0-flash',
        useEncryption: false,
    });
    const [models, setModels] = useState<GeminiModel[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    // 初期化
    useEffect(() => {
        setApiKeyState(getApiKey() || '');
        setProfileState(getUserProfile());
        setSettingsState(getSettings());
        setIsLoaded(true);
    }, []);

    const fetchModelsForKey = async (key: string) => {
        setIsLoadingModels(true);
        try {
            const result = await testApiKey(key);
            if (result.valid) {
                setModels(result.models);
                if (result.models.length > 0) {
                    const currentModel = getSettings().geminiModel;
                    const modelExists = result.models.some((m) => m.id === currentModel);
                    if (!modelExists) {
                        setSettings({ geminiModel: result.models[0].id });
                        setSettingsState((prev) => ({ ...prev, geminiModel: result.models[0].id }));
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch models:', error);
        } finally {
            setIsLoadingModels(false);
        }
    };

    const setApiKeyValue = (key: string) => {
        setApiKey(key);
        setApiKeyState(key);
        // APIキーが設定されたらデモモードをオフに
        if (key) {
            setSettings({ useDemoMode: false });
            setSettingsState((prev) => ({ ...prev, useDemoMode: false }));
            fetchModelsForKey(key);
        }
    };

    const clearApiKeyValue = () => {
        clearApiKey();
        setApiKeyState('');
        setModels([]);
        // APIキーがクリアされたらデモモードをオンに
        setSettings({ useDemoMode: true });
        setSettingsState((prev) => ({ ...prev, useDemoMode: true }));
    };

    const updateProfile = (newProfile: UserProfile) => {
        setUserProfile(newProfile);
        setProfileState(newProfile);
    };

    const updateSettingsHandler = (newSettings: Partial<AppSettings>) => {
        setSettings(newSettings);
        setSettingsState((prev) => ({ ...prev, ...newSettings }));
    };

    return {
        apiKey: apiKeyState,
        setApiKeyValue,
        clearApiKeyValue,
        hasKey: hasApiKey(),
        profile,
        updateProfile,
        settings: settingsState,
        updateSettings: updateSettingsHandler,
        models,
        isLoadingModels,
        fetchModelsForKey,
        isLoaded,
    };
}
