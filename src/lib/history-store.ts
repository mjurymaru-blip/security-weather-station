/**
 * 履歴ストア（IndexedDB）
 * 
 * 日次レポートを保存し、過去14日間の天気推移を管理
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { WeatherCondition } from '@/types';

// データベース設定
const DB_NAME = 'security-weather-db';
const DB_VERSION = 1;
const STORE_NAME = 'history';
const MAX_DAYS = 14;

/**
 * 日次スナップショット
 */
export interface DailySnapshot {
    /** 日付キー (YYYY-MM-DD) */
    date: string;
    /** 天気状態 */
    weatherCondition: WeatherCondition;
    /** 脅威レベル (1-5) */
    threatLevel: number;
    /** 分析されたアイテム数 */
    analyzedItemsCount: number;
    /** 上位ニュース（最大3件） */
    topItems: { title: string; source: string }[];
    /** 生成日時 */
    generatedAt: Date;
    /** モード（朝/夜） */
    mode: 'forecast' | 'review';
}

/**
 * データベースを開く
 */
async function getDB(): Promise<IDBPDatabase> {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'date' });
            }
        },
    });
}

/**
 * 今日の日付キーを取得
 */
function getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * スナップショットを保存（upsert）
 * 同じ日付があれば上書き
 */
export async function saveSnapshot(
    weatherCondition: WeatherCondition,
    threatLevel: number,
    analyzedItemsCount: number,
    topItems: { title: string; source: string }[],
    mode: 'forecast' | 'review'
): Promise<void> {
    const db = await getDB();

    const snapshot: DailySnapshot = {
        date: getTodayKey(),
        weatherCondition,
        threatLevel,
        analyzedItemsCount,
        topItems: topItems.slice(0, 3),
        generatedAt: new Date(),
        mode,
    };

    // put = upsert（同じキーがあれば上書き）
    await db.put(STORE_NAME, snapshot);

    // 古いデータを削除
    await cleanupOldData();
}

/**
 * 過去N日分の履歴を取得
 */
export async function getHistory(days: number = MAX_DAYS): Promise<DailySnapshot[]> {
    const db = await getDB();
    const all = await db.getAll(STORE_NAME);

    // 日付でソート（新しい順）
    all.sort((a, b) => b.date.localeCompare(a.date));

    // 指定日数分だけ返す
    return all.slice(0, days);
}

/**
 * 14日より古いデータを削除
 */
async function cleanupOldData(): Promise<void> {
    const db = await getDB();
    const all = await db.getAll(STORE_NAME);

    // 14日前の日付を計算
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_DAYS);
    const cutoffKey = cutoffDate.toISOString().split('T')[0];

    // 古いデータを削除
    const tx = db.transaction(STORE_NAME, 'readwrite');
    for (const item of all) {
        if (item.date < cutoffKey) {
            await tx.store.delete(item.date);
        }
    }
    await tx.done;
}

/**
 * 履歴をすべてクリア（デバッグ用）
 */
export async function clearHistory(): Promise<void> {
    const db = await getDB();
    await db.clear(STORE_NAME);
}
