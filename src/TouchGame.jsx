import React, { useState, useEffect } from 'react';
import * as Tone from 'tone';
import './App.css';

// Constants
const NOTES = [
    { note: 'C4', label: 'C', color: '#FF5E5B', name: 'Đô' },
    { note: 'D4', label: 'D', color: '#FFB347', name: 'Rê' },
    { note: 'E4', label: 'E', color: '#FFD93D', name: 'Mi' },
    { note: 'F4', label: 'F', color: '#6BCB77', name: 'Pha' },
    { note: 'G4', label: 'G', color: '#4D96FF', name: 'Son' },
    { note: 'A4', label: 'A', color: '#845EC2', name: 'La' },
    { note: 'B4', label: 'B', color: '#FF96BE', name: 'Si' },
];

function TouchGame({ onBack }) {
    const [synth, setSynth] = useState(null);
    const [coins, setCoins] = useState(() => parseInt(localStorage.getItem('pk_coins') || '0'));
    const [activeKey, setActiveKey] = useState(null);

    // Initialize Audio
    useEffect(() => {
        const newSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: {
                attack: 0.005,
                decay: 0.1,
                sustain: 0.3,
                release: 1
            }
        }).toDestination();
        setSynth(newSynth);

        return () => {
            newSynth.dispose();
        };
    }, []);

    const playNote = async (note) => {
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }

        if (synth) {
            synth.triggerAttackRelease(note, '8n');
            setActiveKey(note);
            setTimeout(() => setActiveKey(null), 200);

            // Earn coin logic (simplified for now)
            const newCoins = coins + 1;
            setCoins(newCoins);
            localStorage.setItem('pk_coins', newCoins);
        }
    };

    return (
        <div className="app-container" style={{ backgroundColor: '#FFF5E1' }}>
            <div className="header-panel">
                <button className="btn-small" onClick={onBack}>🏠</button>
                <div className="coin-display">
                    🟡 {coins} Xu Nhạc
                </div>
            </div>

            <div className="game-area" style={{ display: 'flex', flexDirection: 'column', height: '80vh', justifyContent: 'space-around' }}>

                <div className="stage-area">
                    <h2 style={{ color: '#555', marginTop: 0 }}>Đảo Kẹo Ngọt 🏝️</h2>
                    {/* Future: Pet Animation Here */}
                    <div style={{ fontSize: '5rem', animation: activeKey ? 'bounce 0.5s' : 'none' }}>
                        {activeKey ? '🎵' : '🦗'}
                    </div>
                </div>

                {/* Virtual Piano */}
                <div className="piano-container">
                    {NOTES.map((n) => (
                        <button
                            key={n.note}
                            className="piano-key"
                            onMouseDown={() => playNote(n.note)}
                            onTouchStart={(e) => { e.preventDefault(); playNote(n.note); }}
                            style={{
                                backgroundColor: n.color,
                                transform: activeKey === n.note ? 'scale(0.9) translateY(5px)' : 'scale(1)',
                                boxShadow: activeKey === n.note ? 'none' : `0 8px 0 rgba(0,0,0,0.2)`
                            }}
                        >
                            <div className="key-label">{n.name}</div>
                            <div className="key-sub">{n.label}</div>
                        </button>
                    ))}
                </div>

            </div>
        </div>
    );
}

export default TouchGame;
