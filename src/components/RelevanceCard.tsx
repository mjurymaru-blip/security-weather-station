'use client';

interface RelevanceCardProps {
    reason: string;
}

export function RelevanceCard({ reason }: RelevanceCardProps) {
    return (
        <div className="card">
            <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                    <h3 className="font-semibold mb-1">なぜあなたに関係あるか</h3>
                    <p className="text-sm opacity-80">{reason}</p>
                </div>
            </div>
        </div>
    );
}
