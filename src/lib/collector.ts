/**
 * RSS/Atom Feed Collector
 * 
 * セキュリティ情報ソースからニュースを収集し、
 * 標準フォーマット（NewsItem）に正規化する。
 */

import type { NewsItem, NewsSource } from '@/types';
import feedSourcesData from '@/data/feed-sources.json';
import { XMLParser } from 'fast-xml-parser';

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
 * XMLパーサーインスタンス
 */
const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
});

/**
 * RSS/RDFフィードをパースしてNewsItemに変換
 */
function parseRSSItems(data: Record<string, unknown>, source: FeedSource): NewsItem[] {
    const items: NewsItem[] = [];

    try {
        // RSS 2.0 形式
        let rawItems = (data?.rss as Record<string, unknown>)?.channel as Record<string, unknown>;
        if (rawItems?.item) {
            const itemList = Array.isArray(rawItems.item) ? rawItems.item : [rawItems.item];
            for (const item of itemList as Record<string, unknown>[]) {
                const title = item.title as string;
                const link = item.link as string;
                const description = item.description as string;
                const pubDate = (item.pubDate || item['dc:date']) as string;

                if (title && link) {
                    items.push({
                        id: `${source.type}-${Buffer.from(link).toString('base64').slice(0, 16)}`,
                        title: String(title).trim(),
                        source: source.type,
                        sourceUrl: String(link).trim(),
                        publishedAt: pubDate ? new Date(pubDate) : new Date(),
                        rawContent: description ? String(description).trim() : '',
                    });
                }
            }
        }

        // RDF 形式 (JPCERT, IPA)
        const rdf = data?.['rdf:RDF'] as Record<string, unknown>;
        if (rdf?.item) {
            const itemList = Array.isArray(rdf.item) ? rdf.item : [rdf.item];
            for (const item of itemList as Record<string, unknown>[]) {
                const title = item.title as string;
                const link = item.link as string;
                const description = item.description as string;
                const pubDate = item['dc:date'] as string;

                if (title && link) {
                    items.push({
                        id: `${source.type}-${Buffer.from(link).toString('base64').slice(0, 16)}`,
                        title: String(title).trim(),
                        source: source.type,
                        sourceUrl: String(link).trim(),
                        publishedAt: pubDate ? new Date(pubDate) : new Date(),
                        rawContent: description ? String(description).trim() : '',
                    });
                }
            }
        }

        // Atom 形式
        const feed = data?.feed as Record<string, unknown>;
        if (feed?.entry) {
            const entryList = Array.isArray(feed.entry) ? feed.entry : [feed.entry];
            for (const entry of entryList as Record<string, unknown>[]) {
                const title = entry.title as string | { '#text': string };
                const link = entry.link as { '@_href': string } | { '@_href': string }[];
                const summary = entry.summary as string;
                const updated = entry.updated as string;

                const titleText = typeof title === 'string' ? title : title?.['#text'];
                const linkHref = Array.isArray(link) ? link[0]?.['@_href'] : link?.['@_href'];

                if (titleText && linkHref) {
                    items.push({
                        id: `${source.type}-${Buffer.from(linkHref).toString('base64').slice(0, 16)}`,
                        title: String(titleText).trim(),
                        source: source.type,
                        sourceUrl: String(linkHref).trim(),
                        publishedAt: updated ? new Date(updated) : new Date(),
                        rawContent: summary ? String(summary).trim() : '',
                    });
                }
            }
        }
    } catch (error) {
        console.error(`Error parsing ${source.name}:`, error);
    }

    return items;
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
        const data = xmlParser.parse(text) as Record<string, unknown>;

        return parseRSSItems(data, source);
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

    // フラット化
    const allNews = results.flat();

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

    console.log(`Collected ${allNews.length} news items, ${deduplicated.length} after dedup, from ${enabledSources.length} sources`);

    return deduplicated;
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
