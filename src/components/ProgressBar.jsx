import React from 'react';

const ProgressBar = ({ progress, max }) => {
    const percentage = Math.min((progress / max) * 100, 100);

    return (
        <div style={{
            width: '300px',
            height: '30px',
            background: '#eee',
            borderRadius: '20px',
            border: '4px solid #fff',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            position: 'relative',
            margin: '0 auto'
        }}>
            <div style={{
                width: `${percentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #FF9966, #FF5E62)',
                transition: 'width 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
                borderRadius: '15px',
            }}></div>
            <div style={{
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold', color: '#555',
                textShadow: '0 1px 1px rgba(255,255,255,0.8)'
            }}>
                {progress} / {max} Kẹo 🍬
            </div>
        </div>
    );
};

export default ProgressBar;
