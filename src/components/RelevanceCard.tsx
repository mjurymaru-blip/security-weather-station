'use client';

interface RelevanceCardProps {
    reason: string;
    isSunny?: boolean;
}

export function RelevanceCard({ reason, isSunny }: RelevanceCardProps) {
    return (
        <div className="card">
            <div className="flex items-start gap-3">
                <span className="text-2xl">{isSunny ? '🌈' : '🎯'}</span>
                <div>
                    <h3 className="font-semibold mb-1">
                        {isSunny ? 'なぜあなたに関係あるか' : 'なぜあなたに関係あるか'}
                    </h3>
                    <p className="text-sm opacity-80">{reason}</p>
                    {isSunny && (
                        <p className="text-sm mt-2 text-green-400">
                            ✨ 現在は観測範囲内に重大な脅威は確認されていません。良い一日を！
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
