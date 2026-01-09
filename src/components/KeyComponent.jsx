import React from 'react';

const KeyComponent = ({ k, index, isCurrent, isFuture, isPlayed, finger, onPlay, allKeys }) => {
    // 14 White keys total (C3...B3, C4...B4) -> 7 * 2 = 14 keys.
    const TOTAL_WHITE_KEYS = 14;
    const WHITE_WIDTH_PERCENT = 100 / TOTAL_WHITE_KEYS; // ~7.14%

    let whiteCount = 0;
    for (let i = 0; i < index; i++) {
        if (allKeys[i].type === 'white') whiteCount++;
    }

    const leftPosPercent = whiteCount * WHITE_WIDTH_PERCENT;

    const showDot = isCurrent || isFuture;
    const dotClass = isCurrent ? 'current' : '';
    // If isPlayed is true, use a distinct active class (e.g. 'active-hint' usually is green, let's reuse or make new one)
    // Let's use 'active-played' if isPlayed
    const keyStateClass = isPlayed ? 'active-pressed' : (isCurrent ? 'active-hint' : '');

    return (
        <button
            className={`key ${k.type} ${keyStateClass}`}
            // Use inline style for position to support variable width
            style={{
                left: k.type === 'white' ? `${leftPosPercent}%` : `calc(${leftPosPercent}% - 2%)`,
                width: k.type === 'white' ? `${WHITE_WIDTH_PERCENT}%` : '4%', // Black key approx 4%
            }}
            onMouseDown={(e) => { e.preventDefault(); onPlay && onPlay(k.note); }}
            onTouchStart={(e) => { e.stopPropagation(); onPlay && onPlay(k.note); }}
        >
            {showDot && (
                <div className={`dot ${dotClass}`}>
                    {finger}
                </div>
            )}
            {k.type === 'white' && <span className="note-name">{k.label}</span>}
        </button>
    );
};

export default KeyComponent;
