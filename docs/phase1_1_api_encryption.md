# Phase 1.1: APIキー暗号化 - 実装計画

## 概要

Web Crypto APIを使用してAPIキーを暗号化し、localStorageに保存。
マスターパスワードで保護し、XSSリスクを軽減。

---

## フロー

```
設定時:
  ユーザー → パスワード入力 → PBKDF2で鍵生成 → AES-GCMで暗号化 → localStorage保存

使用時:
  アプリ起動 → パスワード入力 → 鍵再生成 → 復号 → SessionStorageにキャッシュ
```

---

## 提案する変更

### [NEW] crypto-store.ts

```typescript
// 暗号化・復号ユーティリティ
encryptApiKey(apiKey: string, password: string): Promise<string>
decryptApiKey(encryptedData: string, password: string): Promise<string>
hasEncryptedKey(): boolean
```

### [MODIFY] settings-store.ts

- 平文保存 → 暗号化保存に変更
- Session Storage に復号済みキーをキャッシュ

### [MODIFY] SettingsPanel.tsx

- パスワード設定UI追加
- 起動時パスワード入力ダイアログ

### [NEW] PasswordDialog.tsx

- 起動時に表示するパスワード入力モーダル

---

## UI設計

**初回設定:**
```
┌─────────────────────────────────────┐
│ 🔐 マスターパスワードを設定        │
│                                     │
│ [      パスワード入力      ]        │
│ [      パスワード確認      ]        │
│                                     │
│ ⚠️ パスワードを忘れると              │
│    APIキーの再登録が必要です        │
│                                     │
│        [設定する]                   │
└─────────────────────────────────────┘
```

**起動時:**
```
┌─────────────────────────────────────┐
│ 🔓 パスワードを入力                 │
│                                     │
│ [      パスワード入力      ]        │
│                                     │
│        [解除]                       │
└─────────────────────────────────────┘
```

---

## セキュリティ注意事項

> [!WARNING]
> **XSSは完全には防げません**
> - 暗号化しても復号後はメモリ上にキーが存在
> - これは「盗まれにくくする」対策

README に Security Considerations セクションを追加

---

## 推定工数

| タスク | 工数 |
|--------|------|
| crypto-store.ts | 1.5h |
| settings-store.ts 修正 | 1h |
| PasswordDialog.tsx | 1.5h |
| SettingsPanel.tsx 修正 | 1h |
| README追記 | 0.5h |
| テスト・調整 | 1h |
| **合計** | **6.5h** |

---

## 確認事項

1. **パスワード入力タイミング**
   - 毎回起動時？（セキュリティ重視）
   - ブラウザ閉じるまでキャッシュ？（Session Storage）

2. **パスワードを忘れた場合の挙動**
   - 暗号化データを削除してやり直し？
