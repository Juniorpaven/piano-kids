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
                width: isWhite ? `${WHITE_WIDTH_PERCENT}%` : '5.5%', // Slightly wider black keys for 'fat' look
                // JELLY STYLING: Creamy white for white keys, Dark Graphite for black
                background: isWhite ? '#FFF3E0' : 'linear-gradient(180deg, #424242 0%, #212121 100%)',
                // Rainbow color only on bottom border for white keys
                borderBottom: isWhite ? `6px solid ${config.color || '#ccc'}` : 'none',
                borderRadius: isWhite ? '0 0 15px 15px' : '0 0 10px 10px',
                // Jelly Shadows
                boxShadow: isWhite
                    ? 'inset 0 -10px 0 rgba(0,0,0,0.05), 0 5px 0 rgba(0,0,0,0.1)'
                    : 'inset 0 -5px 0 rgba(255,255,255,0.1), 2px 2px 4px rgba(0,0,0,0.4)',
                transform: isPlayed ? 'scale(0.95) translateY(2px)' : 'none',
                zIndex: isWhite ? 1 : 10
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

            {/* ANIMAL & NOTE LABEL (Only for White Keys) */}
            {isWhite && (
                <div className="key-label-container" style={{
                    position: 'absolute', bottom: '15px', width: '100%',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none'
                }}>
                    <span style={{ fontSize: '2rem', marginBottom: '-5px', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }}>
                        {config.animal}
                    </span>
                    <span className="note-name" style={{
                        color: '#6D4C41', // Brown/Graphite text instead of rainbow hard to read
                        fontWeight: '900', fontSize: '1.4rem',
                        fontFamily: '"Comic Sans MS", cursive, sans-serif'
                    }}>
                        {k.label}
                    </span>
                </div>
            )}
        </button>
    );
};

export default KeyComponent;
