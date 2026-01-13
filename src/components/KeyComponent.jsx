import React from 'react';

// RAINBOW METHOD MAP
const NOTE_CONFIG = {
    'C': { color: '#FF5252', animal: '🐱' }, // Red - Cat
    'D': { color: '#FF9800', animal: '🐶' }, // Orange - Dog
    'E': { color: '#FFEB3B', animal: '🦆' }, // Yellow - Duck
    'F': { color: '#66BB6A', animal: '🐸' }, // Green - Frog
    'G': { color: '#29B6F6', animal: '🐦' }, // Blue - Bird
    'A': { color: '#3F51B5', animal: '🐠' }, // Indigo - Fish
    'B': { color: '#AB47BC', animal: '🐰' }, // Violet - Rabbit
};

const KeyComponent = ({ k, index, isCurrent, isFuture, isPlayed, finger, onPlay, allKeys }) => {
    // 14 White keys total
    const TOTAL_WHITE_KEYS = 14;
    const WHITE_WIDTH_PERCENT = 100 / TOTAL_WHITE_KEYS;

    let whiteCount = 0;
    for (let i = 0; i < index; i++) {
        if (allKeys[i].type === 'white') whiteCount++;
    }

    const leftPosPercent = whiteCount * WHITE_WIDTH_PERCENT;

    // Get Config
    const noteName = k.note.replace(/[0-9]/g, ''); // "C", "D"
    const config = NOTE_CONFIG[noteName] || {};
    const isWhite = k.type === 'white';

    const showDot = isCurrent || isFuture;
    const dotClass = isCurrent ? 'current' : '';
    const keyStateClass = isPlayed ? 'active-pressed' : (isCurrent ? 'active-hint' : '');

    return (
        <button
            className={`key ${k.type} ${keyStateClass}`}
            style={{
                left: isWhite ? `${leftPosPercent}%` : `calc(${leftPosPercent}% - 2%)`,
                width: isWhite ? `${WHITE_WIDTH_PERCENT}%` : '4%',
                // RAINBOW COLOR (Only for bottom border or background hint?)
                // User wants "Rainbow Method". Let's color the bottom 15% of the key.
                background: isWhite
                    ? `linear-gradient(to bottom, white 85%, ${config.color || '#ddd'} 100%)`
                    : '#333',
                borderBottom: isWhite ? `5px solid ${config.color || '#ccc'}` : 'none',
                boxShadow: isWhite ? '0 5px 5px rgba(0,0,0,0.1)' : '0 2px 5px rgba(0,0,0,0.3)'
            }}
            onMouseDown={(e) => { e.preventDefault(); onPlay && onPlay(k.note); }}
            onTouchStart={(e) => { e.stopPropagation(); onPlay && onPlay(k.note); }}
        >
            {/* FALLING NOTE BUBBLE EFFECT (Simple placeholder for local interaction) */}
            {isPlayed && (
                <div className="key-ripple" style={{ borderColor: config.color }}></div>
            )}

            {showDot && (
                <div className={`dot ${dotClass}`}>
                    {finger}
                </div>
            )}

            {/* ANIMAL & NOTE LABEL */}
            {isWhite && (
                <div className="key-label-container" style={{
                    position: 'absolute', bottom: '10px', width: '100%',
                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{config.animal}</span>
                    <span className="note-name" style={{
                        color: config.color, fontWeight: '900', fontSize: '1.2rem',
                        textShadow: '1px 1px 0px rgba(0,0,0,0.1)'
                    }}>
                        {k.label}
                    </span>
                </div>
            )}
        </button>
    );
};

export default KeyComponent;
