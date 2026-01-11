/**
 * RSS/Atom Feed Collector（クライアントサイド用）
 * 
 * CORSの制限があるため、公開CORSプロキシを使用
 * または、事前に収集したニュースをJSONとして配信
 */

import type { NewsItem, NewsSource } from '@/types';

// 公開CORSプロキシ（本番環境では独自プロキシを用意するのが望ましい）
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

/**
 * フィードソースの定義
 */
const FEED_SOURCES: {
    id: string;
    name: string;
    url: string;
    type: NewsSource;
    enabled: boolean;
}[] = [
        {
            id: 'jpcert',
            name: 'JPCERT/CC',
            url: 'https://www.jpcert.or.jp/rss/jpcert.rdf',
            type: 'jpcert',
            enabled: true,
        },
        {
            id: 'ipa',
            name: 'IPA 重要なセキュリティ情報',
            url: 'https://www.ipa.go.jp/security/security-alert/rss/alert.rdf',
            type: 'ipa',
            enabled: true,
        },
        {
            id: 'jvn',
            name: 'JVN',
            url: 'https://jvndb.jvn.jp/ja/rss/jvndb_new.rdf',
            type: 'jvn',
            enabled: true,
        },
    ];

/**
 * XMLをパース（DOMParser使用 - ブラウザ用）
 */
function parseRSSItems(xmlText: string, source: typeof FEED_SOURCES[0]): NewsItem[] {
    const items: NewsItem[] = [];

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'application/xml');

        // RSS 2.0 / RDF の item を取得
        const itemElements = doc.querySelectorAll('item');

        itemElements.forEach((item) => {
            const title = item.querySelector('title')?.textContent;
            const link = item.querySelector('link')?.textContent;
            const description = item.querySelector('description')?.textContent;
            const pubDate = item.querySelector('pubDate, date, dc\\:date')?.textContent;

            if (title && link) {
                items.push({
                    id: `${source.type}-${btoa(link).slice(0, 16)}`,
                    title: title.trim(),
                    source: source.type,
                    sourceUrl: link.trim(),
                    publishedAt: pubDate ? new Date(pubDate) : new Date(),
                    rawContent: description?.trim() || '',
                });
            }
        });

        // Atom の entry を取得
        const entryElements = doc.querySelectorAll('entry');

        entryElements.forEach((entry) => {
            const title = entry.querySelector('title')?.textContent;
            const link = entry.querySelector('link')?.getAttribute('href');
            const summary = entry.querySelector('summary')?.textContent;
            const updated = entry.querySelector('updated')?.textContent;

            if (title && link) {
                items.push({
                    id: `${source.type}-${btoa(link).slice(0, 16)}`,
                    title: title.trim(),
                    source: source.type,
                    sourceUrl: link.trim(),
                    publishedAt: updated ? new Date(updated) : new Date(),
                    rawContent: summary?.trim() || '',
                });
            }
        });
    } catch (error) {
        console.error(`Error parsing ${source.name}:`, error);
    }

    return items;
}

/**
 * 単一フィードからニュースを取得（CORSプロキシ経由）
 */
async function fetchFeed(source: typeof FEED_SOURCES[0]): Promise<NewsItem[]> {
    try {
        const response = await fetch(CORS_PROXY + encodeURIComponent(source.url));

        if (!response.ok) {
            console.error(`Failed to fetch ${source.name}: ${response.status}`);
            return [];
        }

        const text = await response.text();
        return parseRSSItems(text, source);
    } catch (error) {
        console.error(`Error fetching ${source.name}:`, error);
        return [];
    }
}

/**
 * 全フィードソースからニュースを収集（クライアントサイド）
 */
export async function collectNewsClient(): Promise<NewsItem[]> {
    const enabledSources = FEED_SOURCES.filter((s) => s.enabled);

    const results = await Promise.allSettled(
        enabledSources.map((source) => fetchFeed(source))
    );

    // フラット化
    const allNews: NewsItem[] = [];
    results.forEach((result) => {
        if (result.status === 'fulfilled') {
            allNews.push(...result.value);
        }
    });

    // 重複排除（タイトルベース）
    const seen = new Set<string>();
    const deduplicated = allNews.filter((item) => {
        const key = item.title.toLowerCase().trim();
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });

    // 日付順にソート（新しい順）
    deduplicated.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

    console.log(`Collected ${allNews.length} news items, ${deduplicated.length} after dedup`);

    return deduplicated;
}

/**
 * 直近N日間のニュースをフィルタリング
 */
export function filterRecentNews(items: NewsItem[], days: number = 7): NewsItem[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);

    return items.filter((item) => {
        return new Date(item.publishedAt).getTime() >= cutoff.getTime();
    });
}
