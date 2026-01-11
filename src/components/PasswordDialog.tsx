'use client';

import { useState } from 'react';
import {
    encryptApiKey,
    decryptApiKey,
    validatePassword,
    clearEncryptedData,
    hasEncryptedKey,
} from '@/lib/crypto-store';

interface PasswordDialogProps {
    mode: 'setup' | 'unlock';
    onSuccess: (apiKey: string) => void;
    onCancel?: () => void;
}

/**
 * パスワード入力ダイアログ
 * 
 * setup: 初回設定時（APIキー + パスワード設定）
 * unlock: 起動時（パスワード入力で復号）
 */
export function PasswordDialog({ mode, onSuccess, onCancel }: PasswordDialogProps) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSetup = async () => {
        setError('');

        // APIキー検証
        if (!apiKey.trim()) {
            setError('APIキーを入力してください');
            return;
        }

        // パスワード検証
        const validation = validatePassword(password);
        if (!validation.valid) {
            setError(validation.error || 'パスワードが無効です');
            return;
        }

        if (password !== confirmPassword) {
            setError('パスワードが一致しません');
            return;
        }

        setIsLoading(true);
        try {
            await encryptApiKey(apiKey, password);
            onSuccess(apiKey);
        } catch (err) {
            setError(err instanceof Error ? err.message : '暗号化に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnlock = async () => {
        setError('');

        if (!password) {
            setError('パスワードを入力してください');
            return;
        }

        setIsLoading(true);
        try {
            const decrypted = await decryptApiKey(password);
            onSuccess(decrypted);
        } catch (err) {
            setError(err instanceof Error ? err.message : '復号に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        if (confirm('暗号化されたAPIキーを削除しますか？\n削除後は再設定が必要です。')) {
            clearEncryptedData();
            window.location.reload();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm mx-4 bg-gray-900 rounded-xl border border-white/10 p-6 space-y-4">
                {mode === 'setup' ? (
                    <>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <span>🔐</span>
                            <span>マスターパスワードを設定</span>
                        </h2>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm opacity-70 mb-1">
                                    Gemini APIキー
                                </label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="AIza..."
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30"
                                    autoComplete="off"
                                />
                            </div>

                            <div>
                                <label className="block text-sm opacity-70 mb-1">
                                    マスターパスワード（8文字以上）
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30"
                                    autoComplete="new-password"
                                />
                            </div>

                            <div>
                                <label className="block text-sm opacity-70 mb-1">
                                    パスワード確認
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30"
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <div className="p-3 bg-yellow-900/30 rounded-lg text-xs">
                            <p className="text-yellow-400">⚠️ 重要</p>
                            <p className="text-yellow-300/70 mt-1">
                                パスワードを忘れるとAPIキーの復旧はできません。<br />
                                忘れた場合は再登録が必要です。
                            </p>
                        </div>

                        {error && (
                            <p className="text-sm text-red-400">{error}</p>
                        )}

                        <div className="flex gap-2">
                            {onCancel && (
                                <button
                                    onClick={onCancel}
                                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition"
                                >
                                    キャンセル
                                </button>
                            )}
                            <button
                                onClick={handleSetup}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition"
                            >
                                {isLoading ? '暗号化中...' : '設定する'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <span>🔓</span>
                            <span>パスワードを入力</span>
                        </h2>

                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                                placeholder="マスターパスワード"
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30"
                                autoFocus
                                autoComplete="current-password"
                            />
                        </div>

                        {error && (
                            <div className="space-y-2">
                                <p className="text-sm text-red-400">{error}</p>
                                {hasEncryptedKey() && (
                                    <button
                                        onClick={handleReset}
                                        className="text-xs text-red-400/70 hover:text-red-400 underline"
                                    >
                                        パスワードを忘れた場合（データを削除して再設定）
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="flex gap-2">
                            {onCancel && (
                                <button
                                    onClick={onCancel}
                                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition"
                                >
                                    デモモードで使用
                                </button>
                            )}
                            <button
                                onClick={handleUnlock}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition"
                            >
                                {isLoading ? '復号中...' : '解除'}
                            </button>
                        </div>
                    </>
                )}

                <p className="text-xs opacity-40 text-center pt-2">
                    🔒 暗号化にはWeb Crypto API（PBKDF2 + AES-GCM）を使用
                </p>
            </div>
        </div>
    );
}
