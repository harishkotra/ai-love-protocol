import React from 'react';

export default function AgentAvatar({ name }: { name: string; mood?: string }) {
    let borderColor = 'rgba(96, 165, 250, 0.5)';
    let icon = '🤖';
    let glow = 'rgba(96, 165, 250, 0.3)';

    if (name.toLowerCase().includes('romantic')) {
        borderColor = 'rgba(255, 107, 157, 0.5)';
        icon = '❤️';
        glow = 'rgba(255, 107, 157, 0.3)';
    } else if (name.toLowerCase().includes('skeptic')) {
        borderColor = 'rgba(168, 85, 247, 0.5)';
        icon = '🧐';
        glow = 'rgba(168, 85, 247, 0.3)';
    } else if (name.toLowerCase().includes('matchmaker')) {
        borderColor = 'rgba(250, 204, 21, 0.5)';
        icon = '🎭';
        glow = 'rgba(250, 204, 21, 0.3)';
    }

    return (
        <div className="avatar-box" style={{
            borderColor,
            boxShadow: `0 0 12px ${glow}`,
        }}>
            <span role="img" aria-label={name}>{icon}</span>
        </div>
    );
}
