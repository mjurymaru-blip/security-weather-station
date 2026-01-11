'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';

/**
 * 設定パネルコンポーネント
 * 
 * 設計思想:
 * - 単なるフォームではなく「自分の分身を作る感覚」
 * - 技術スタックを設定することで、AIが「あなた向け」の分析をする
 */
export function SettingsPanel() {
    const {
        apiKey,
        setApiKeyValue,
        clearApiKeyValue,
        hasKey,
        profile,
        updateProfile,
        settings,
        updateSettings,
        models,
        isLoadingModels,
        fetchModelsForKey,
        isLoaded,
    } = useSettings();

    const [isOpen, setIsOpen] = useState(false);
    const [tempApiKey, setTempApiKey] = useState('');
    const [newTech, setNewTech] = useState('');
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedModel, setSelectedModel] = useState('');

    // APIキーが設定されている場合、モデル一覧を取得
    useEffect(() => {
        if (hasKey && apiKey && isOpen && models.length === 0) {
            fetchModelsForKey(apiKey);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasKey, apiKey, isOpen]);

    // モデル一覧が更新されたら選択を同期
    useEffect(() => {
        if (models.length > 0) {
            const currentModel = settings.geminiModel;
            const modelExists = models.some((m) => m.id === currentModel);
            setSelectedModel(modelExists ? currentModel : models[0].id);
        }
    }, [models, settings.geminiModel]);

    if (!isLoaded) return null;

    const handleSaveApiKey = async () => {
        if (!tempApiKey.trim()) return;

        setTestStatus('testing');
        setErrorMessage('');

        try {
            // クライアントサイドでAPIキーをテスト
            const { testApiKey } = await import('@/lib/gemini-client');
            const result = await testApiKey(tempApiKey);

            if (result.valid) {
                setApiKeyValue(tempApiKey);
                setTempApiKey('');
                setTestStatus('success');
                setTimeout(() => setTestStatus('idle'), 2000);
            } else {
                setTestStatus('error');
                setErrorMessage('APIキーが無効です');
                setTimeout(() => setTestStatus('idle'), 5000);
            }
        } catch (error) {
            setTestStatus('error');
            const errorMsg = error instanceof Error ? error.message : '接続エラー';
            if (errorMsg.includes('429') || errorMsg.includes('quota')) {
                setErrorMessage('API利用制限に達しました。1〜2分待ってください。');
            } else {
                setErrorMessage(errorMsg);
            }
            setTimeout(() => setTestStatus('idle'), 5000);
        }
    };

    const handleModelChange = (modelId: string) => {
        setSelectedModel(modelId);
        updateSettings({ geminiModel: modelId });
    };

    const handleAddTech = () => {
        if (!newTech.trim()) return;
        if (profile.techStack.includes(newTech.trim())) return;

        updateProfile({
            ...profile,
            techStack: [...profile.techStack, newTech.trim()],
        });
        setNewTech('');
    };

    const handleRemoveTech = (tech: string) => {
        updateProfile({
            ...profile,
            techStack: profile.techStack.filter((t) => t !== tech),
        });
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center hover:bg-white/20 transition"
                aria-label="設定を開く"
            >
                ⚙️
            </button>

            {/* Settings Panel */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-80 max-h-[70vh] overflow-y-auto bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">⚙️ 設定</h3>
                    </div>

                    {/* API Key Section */}
                    <section className="space-y-2">
                        <h4 className="text-sm font-medium opacity-70">🔑 Gemini API Key</h4>

                        {hasKey ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-green-400">✓ 設定済み</span>
                                    <span className="opacity-50">({apiKey.slice(0, 8)}...)</span>
                                </div>
                                <button
                                    onClick={clearApiKeyValue}
                                    className="text-xs text-red-400 hover:text-red-300"
                                >
                                    キーを削除
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <input
                                    type="password"
                                    value={tempApiKey}
                                    onChange={(e) => setTempApiKey(e.target.value)}
                                    placeholder="AIza..."
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30"
                                />
                                <button
                                    onClick={handleSaveApiKey}
                                    disabled={!tempApiKey.trim() || testStatus === 'testing'}
                                    className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition"
                                >
                                    {testStatus === 'testing' ? '確認中...' :
                                        testStatus === 'success' ? '✓ 保存しました' :
                                            testStatus === 'error' ? '✗ エラー' :
                                                '保存'}
                                </button>
                                {testStatus === 'error' && errorMessage && (
                                    <p className="text-xs text-red-400">{errorMessage}</p>
                                )}
                                <p className="text-xs opacity-50">
                                    <a
                                        href="https://aistudio.google.com/app/apikey"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:no-underline"
                                    >
                                        Google AI Studio
                                    </a>
                                    で無料で取得できます
                                </p>
                            </div>
                        )}
                    </section>

                    {/* Model Selection Section */}
                    {hasKey && (
                        <section className="space-y-2">
                            <h4 className="text-sm font-medium opacity-70">🤖 モデル選択</h4>
                            {isLoadingModels ? (
                                <p className="text-xs opacity-50">モデル一覧を取得中...</p>
                            ) : models.length > 0 ? (
                                <select
                                    value={selectedModel}
                                    onChange={(e) => handleModelChange(e.target.value)}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30"
                                >
                                    {models.map((model) => (
                                        <option key={model.id} value={model.id} className="bg-gray-900">
                                            {model.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-xs opacity-50">利用可能なモデルがありません</p>
                            )}
                        </section>
                    )}

                    {/* Tech Stack Section */}
                    <section className="space-y-2">
                        <h4 className="text-sm font-medium opacity-70">🛠️ あなたの技術スタック</h4>
                        <p className="text-xs opacity-50">
                            ここに登録した技術に関連するニュースを優先的に分析します
                        </p>

                        <div className="flex flex-wrap gap-1">
                            {profile.techStack.map((tech) => (
                                <span
                                    key={tech}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded text-xs"
                                >
                                    {tech}
                                    <button
                                        onClick={() => handleRemoveTech(tech)}
                                        className="opacity-60 hover:opacity-100"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newTech}
                                onChange={(e) => setNewTech(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTech()}
                                placeholder="例: Python, AWS, React..."
                                className="flex-1 px-3 py-1 bg-white/5 border border-white/10 rounded text-sm focus:outline-none focus:border-white/30"
                            />
                            <button
                                onClick={handleAddTech}
                                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm"
                            >
                                追加
                            </button>
                        </div>
                    </section>

                    {/* Mode Toggle */}
                    <section className="space-y-2">
                        <h4 className="text-sm font-medium opacity-70">🎮 モード</h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.useDemoMode}
                                onChange={(e) => updateSettings({ useDemoMode: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm">デモモードを使用</span>
                        </label>
                        <p className="text-xs opacity-50">
                            デモモードではモックデータを表示します
                        </p>
                    </section>

                    {/* Security Notice */}
                    <section className="pt-2 border-t border-white/10">
                        <p className="text-xs opacity-40">
                            🔒 APIキーはブラウザのlocalStorageにのみ保存され、外部サーバーには送信されません。
                        </p>
                    </section>

                    {/* OK Button */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition mt-4"
                    >
                        OK
                    </button>
                </div>
            )}
        </div>
    );
}
