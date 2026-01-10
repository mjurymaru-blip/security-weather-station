'use client';

interface BroadcastCardProps {
    headline: string;
    body: string;
    closingRemark: string;
}

export function BroadcastCard({ headline, body, closingRemark }: BroadcastCardProps) {
    return (
        <div className="card space-y-4">
            <h2 className="headline">{headline}</h2>
            <p className="subheadline">{body}</p>
            <p className="text-sm opacity-70 italic">{closingRemark}</p>
        </div>
    );
}
