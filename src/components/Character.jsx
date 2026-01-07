import React from 'react';
import './Character.css';

const Character = ({ name, note, emoji, color, isActive, isTarget, onClick }) => {
    let animationClass = '';

    if (isActive) {
        animationClass = 'anim-dance status-active';
    } else if (isTarget) {
        animationClass = 'anim-bounce';
    }

    return (
        <div className={`character-container ${animationClass}`} onClick={onClick}>
            <div
                className="character-avatar"
                style={{
                    transform: isActive ? 'scale(1.3)' : 'scale(1)'
                }}
            >
                {emoji}
            </div>
            <div className="char-name" style={{
                color: color,
                border: `3px solid ${color}`,
                backgroundColor: isActive ? color : 'white',
                color: isActive ? 'white' : color
            }}>
                {name} ({note})
            </div>
        </div>
    );
};

export default Character;
