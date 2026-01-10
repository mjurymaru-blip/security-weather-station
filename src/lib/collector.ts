/**
 * RSS/Atom Feed Collector
 * 
 * セキュリティ情報ソースからニュースを収集し、
 * 標準フォーマット（NewsItem）に正規化する。
 */

import type { NewsItem, NewsSource } from '@/types';
import feedSourcesData from '@/data/feed-sources.json';

/**
 * フィードソースの設定
 */
export interface FeedSource {
    id: string;
    name: string;
    url: string;
    type: NewsSource;
    language: string;
    description: string;
    enabled: boolean;
    note?: string;
}

/**
 * フィードソース設定を読み込み
 */
export function getFeedSources(): FeedSource[] {
    return feedSourcesData.sources as FeedSource[];
}

/**
 * 有効なフィードソースのみ取得
 */
export function getEnabledFeedSources(): FeedSource[] {
    return getFeedSources().filter((source) => source.enabled);
}

/**
 * RSS/RDFフィードをパースしてNewsItemに変換
 */
function parseRSSItem(item: Element, source: FeedSource): NewsItem | null {
    try {
        const title = item.querySelector('title')?.textContent?.trim();
        const link = item.querySelector('link')?.textContent?.trim();
        const description = item.querySelector('description')?.textContent?.trim();
        const pubDate = item.querySelector('pubDate, dc\\:date, date')?.textContent?.trim();

        if (!title || !link) {
            return null;
        }

        return {
            id: `${source.type}-${Buffer.from(link).toString('base64').slice(0, 16)}`,
            title,
            source: source.type,
            sourceUrl: link,
            publishedAt: pubDate ? new Date(pubDate) : new Date(),
            rawContent: description || '',
        };
    } catch {
        return null;
    }
}

/**
 * 単一フィードからニュースを取得
 */
export async function fetchFeed(source: FeedSource): Promise<NewsItem[]> {
    try {
        const response = await fetch(source.url, {
            headers: {
                'User-Agent': 'SecurityWeatherStation/1.0',
            },
            next: { revalidate: 3600 }, // 1時間キャッシュ
        });

        if (!response.ok) {
            console.error(`Failed to fetch ${source.name}: ${response.status}`);
            return [];
        }

        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'application/xml');

        // RSS 2.0 の item または RDF の item を取得
        const items = doc.querySelectorAll('item');
        const newsItems: NewsItem[] = [];

        items.forEach((item) => {
            const parsed = parseRSSItem(item, source);
            if (parsed) {
                newsItems.push(parsed);
            }
        });

        return newsItems;
    } catch (error) {
        console.error(`Error fetching ${source.name}:`, error);
        return [];
    }
}

/**
 * 全フィードソースからニュースを収集
 */
export async function collectAllNews(): Promise<NewsItem[]> {
    const enabledSources = getEnabledFeedSources();

    const results = await Promise.all(
        enabledSources.map((source) => fetchFeed(source))
    );

    // フラット化して日付順にソート（新しい順）
    const allNews = results.flat();
    allNews.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

    return allNews;
}

/**
 * 今日のニュースのみをフィルタリング
 */
export function filterTodayNews(items: NewsItem[]): NewsItem[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return items.filter((item) => {
        const itemDate = new Date(item.publishedAt);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() >= today.getTime();
    });
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
