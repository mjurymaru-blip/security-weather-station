'use client';

import type { AnalyzedItem } from '@/types';

interface NewsListProps {
    items: AnalyzedItem[];
}

function ThreatBadge({ level }: { level: number }) {
    const colors = {
        1: 'bg-green-500/20 text-green-400',
        2: 'bg-lime-500/20 text-lime-400',
        3: 'bg-yellow-500/20 text-yellow-400',
        4: 'bg-orange-500/20 text-orange-400',
        5: 'bg-red-500/20 text-red-400',
    };

    const colorClass = colors[level as keyof typeof colors] || colors[1];

    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
            Lv.{level}
        </span>
    );
}

export function NewsList({ items }: NewsListProps) {
    if (items.length === 0) {
        return (
            <div className="card text-center py-8 opacity-60">
                <p>📭 本日の関連ニュースはありません</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
                <span>📰</span>
                <span>注目ニュース</span>
                <span className="text-sm font-normal opacity-60">({items.length}件)</span>
            </h3>
            <div className="space-y-2">
                {items.map((item, index) => (
                    <div key={item.id || index} className="news-item">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm leading-snug mb-1 truncate">
                                    {item.title}
                                </h4>
                                <p className="text-xs opacity-70 line-clamp-2">{item.summary}</p>
                                <div className="mt-1 flex items-center gap-2 text-xs opacity-50">
                                    <span>関連度: {Math.round(item.relevanceScore * 100)}%</span>
                                </div>
                            </div>
                            <ThreatBadge level={item.threatLevel} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
