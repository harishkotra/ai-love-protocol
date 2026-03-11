import React from 'react';
import AgentAvatar from './AgentAvatar';

interface Message {
    sender: string;
    text: string;
}

export default function PixelInbox({ messages }: { messages: Message[] }) {
    const getBubbleClass = (sender: string) => {
        const s = sender.toLowerCase();
        if (s.includes('romantic')) return 'romantic';
        if (s.includes('matchmaker')) return 'matchmaker';
        return '';
    };

    return (
        <div className="pixel-card">
            <h2 className="section-title">📨 Email Thread</h2>
            <div className="inbox-wrapper">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {messages.length === 0 && (
                        <p className="fade-in" style={{
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            padding: '3rem 0',
                            fontSize: '0.75rem',
                        }}>
                            Press START DRAMA to begin the love story...
                        </p>
                    )}
                    {messages.map((msg, i) => {
                        const isRomantic = msg.sender.toLowerCase().includes('romantic');
                        return (
                            <div key={i} className="fade-in" style={{
                                display: 'flex',
                                gap: '0.75rem',
                                alignItems: 'flex-start',
                                flexDirection: isRomantic ? 'row' : 'row-reverse',
                            }}>
                                <AgentAvatar name={msg.sender} />
                                <div className={`chat-bubble ${getBubbleClass(msg.sender)}`}>
                                    <div style={{
                                        fontSize: '0.55rem',
                                        letterSpacing: '1px',
                                        textTransform: 'uppercase',
                                        marginBottom: '0.5rem',
                                        color: 'var(--text-muted)',
                                    }}>
                                        {msg.sender}
                                    </div>
                                    <div style={{
                                        fontSize: '0.7rem',
                                        lineHeight: 2,
                                        whiteSpace: 'pre-wrap',
                                        color: 'var(--text-primary)',
                                    }}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
