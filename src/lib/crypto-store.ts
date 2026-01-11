/**
 * 暗号化ストア（Web Crypto API）
 * 
 * APIキーをマスターパスワードで暗号化してlocalStorageに保存
 * 復号後はSessionStorageにキャッシュ
 * 
 * 参考: PBKDF2 + AES-GCM（認証付き暗号）
 */

// 設定
const STORAGE_KEY = 'security-weather-encrypted-key';
const SESSION_KEY = 'security-weather-decrypted-key';
const PBKDF2_ITERATIONS = 600000; // 2026年推奨値
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * 暗号化データの構造
 */
interface EncryptedData {
    ciphertext: string; // Base64
    salt: string;       // Base64
    iv: string;         // Base64
}

/**
 * ArrayBuffer を Base64 に変換
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Base64 を ArrayBuffer に変換
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * パスワードから暗号化キーを導出（PBKDF2）
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt.buffer as ArrayBuffer,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256',
        },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * APIキーを暗号化
 */
export async function encryptApiKey(apiKey: string, password: string): Promise<void> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    const key = await deriveKey(password, salt);

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(apiKey)
    );

    const data: EncryptedData = {
        ciphertext: arrayBufferToBase64(ciphertext),
        salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
        iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    // 復号済みキーをSessionStorageにキャッシュ
    sessionStorage.setItem(SESSION_KEY, apiKey);
}

/**
 * 暗号化されたAPIキーを復号
 */
export async function decryptApiKey(password: string): Promise<string> {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        throw new Error('暗号化されたキーが見つかりません');
    }

    const data: EncryptedData = JSON.parse(stored);
    const salt = new Uint8Array(base64ToArrayBuffer(data.salt));
    const iv = new Uint8Array(base64ToArrayBuffer(data.iv));
    const ciphertext = base64ToArrayBuffer(data.ciphertext);

    const key = await deriveKey(password, salt);

    try {
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );

        const decoder = new TextDecoder();
        const apiKey = decoder.decode(decrypted);

        // 復号済みキーをSessionStorageにキャッシュ
        sessionStorage.setItem(SESSION_KEY, apiKey);

        return apiKey;
    } catch {
        throw new Error('パスワードが間違っています');
    }
}

/**
 * 暗号化されたキーが存在するか
 */
export function hasEncryptedKey(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * SessionStorageにキャッシュされた復号済みキーを取得
 */
export function getCachedApiKey(): string | null {
    return sessionStorage.getItem(SESSION_KEY);
}

/**
 * 暗号化データを削除（パスワードを忘れた場合）
 */
export function clearEncryptedData(): void {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
}

/**
 * SessionStorageのキャッシュをクリア
 */
export function clearCache(): void {
    sessionStorage.removeItem(SESSION_KEY);
}

/**
 * パスワード強度チェック
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password || password.trim().length === 0) {
        return { valid: false, error: 'パスワードを入力してください' };
    }
    if (password.length < 8) {
        return { valid: false, error: 'パスワードは8文字以上で入力してください' };
    }
    return { valid: true };
}
