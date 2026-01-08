import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import Confetti from 'react-confetti';
import './TouchGame.css';

// Cập nhật danh sách nốt đầy đủ cho 1 quãng 8 (Octave 4)
// type: 'white' | 'black'
const PIANO_KEYS = [
    { note: 'C4', label: 'C', type: 'white', name: 'Đô' },
    { note: 'C#4', label: 'C#', type: 'black', name: '' },
    { note: 'D4', label: 'D', type: 'white', name: 'Rê' },
    { note: 'D#4', label: 'D#', type: 'black', name: '' },
    { note: 'E4', label: 'E', type: 'white', name: 'Mi' },
    { note: 'F4', label: 'F', type: 'white', name: 'Pha' },
    { note: 'F#4', label: 'F#', type: 'black', name: '' },
    { note: 'G4', label: 'G', type: 'white', name: 'Son' },
    { note: 'G#4', label: 'G#', type: 'black', name: '' },
    { note: 'A4', label: 'A', type: 'white', name: 'La' },
    { note: 'A#4', label: 'A#', type: 'black', name: '' },
    { note: 'B4', label: 'B', type: 'white', name: 'Si' },
];

const CHORDS = [
    { id: 'C_MAJOR', name: 'Sức Mạnh Lửa 🔥', root: 'Đô Trưởng', notes: ['C4', 'E4', 'G4'], color: '#FF5E5B' },
    { id: 'D_MAJOR', name: 'Rừng Xanh 🌲', root: 'Rê Trưởng', notes: ['D4', 'F#4', 'A4'], color: '#4D96FF' }, // Sửa màu sau
    { id: 'E_MAJOR', name: 'Ánh Sáng ☀️', root: 'Mi Trưởng', notes: ['E4', 'G#4', 'B4'], color: '#FFD93D' },
];

function TouchGame({ onBack }) {
    const [synth, setSynth] = useState(null);
    const [coins, setCoins] = useState(() => parseInt(localStorage.getItem('pk_coins') || '0'));

    // Chord Game State
    const [gameMode, setGameMode] = useState('FREE'); // FREE, CHORD_CHALLENGE
    const [targetChord, setTargetChord] = useState(null);
    const [activeKeys, setActiveKeys] = useState(new Set());
    const [showConfetti, setShowConfetti] = useState(false);
    const [feedback, setFeedback] = useState('');

    // Refs for tracking multi-touch logic
    const activeKeysRef = useRef(new Set());

    // Initialize Audio
    useEffect(() => {
        const newSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 1 },
            maxPolyphony: 6
        }).toDestination();
        setSynth(newSynth);

        return () => {
            newSynth.dispose();
        };
    }, []);

    // ---------------
    // GAME LOGIC
    // ---------------
    const startChordChallenge = () => {
        setGameMode('CHORD_CHALLENGE');
        nextChord();
    };

    const nextChord = () => {
        const randomChord = CHORDS[Math.floor(Math.random() * CHORDS.length)];
        setTargetChord(randomChord);
        setFeedback('Hãy triệu hồi: ' + randomChord.name);
        setShowConfetti(false);
    };

    const checkChord = (currentKeys) => {
        if (gameMode !== 'CHORD_CHALLENGE' || !targetChord) return;

        // Check if all target notes are being held
        const allNotesPressed = targetChord.notes.every(note => currentKeys.has(note));

        if (allNotesPressed) {
            handleSuccess();
        }
    };

    const handleSuccess = () => {
        setFeedback('TUYỆT VỜI! SIÊU NĂNG LƯỢNG KÍCH HOẠT! ⚡');
        setShowConfetti(true);
        playSound('win');

        const bonus = 10;
        updateCoins(bonus);

        setTimeout(() => {
            nextChord();
        }, 3000);
    };

    const updateCoins = (amount) => {
        const newCoins = coins + amount;
        setCoins(newCoins);
        localStorage.setItem('pk_coins', newCoins);
    };

    const playSound = (type) => { // Simple SFX helper placeholder
        // Implementation can reuse Tone.js or separate buffer
    };

    // ---------------
    // INTERACTION HANDLERS
    // ---------------
    const handleNoteStart = async (note) => {
        if (Tone.context.state !== 'running') await Tone.start();

        if (synth) synth.triggerAttack(note);

        // Update Active Keys
        const newSet = new Set(activeKeysRef.current);
        newSet.add(note);
        activeKeysRef.current = newSet;
        setActiveKeys(new Set(newSet)); // Trigger render

        // Check Logic
        checkChord(newSet);

        // Coin for free play
        if (gameMode === 'FREE') updateCoins(1);
    };

    const handleNoteStop = (note) => {
        if (synth) synth.triggerRelease(note);

        const newSet = new Set(activeKeysRef.current);
        newSet.delete(note);
        activeKeysRef.current = newSet;
        setActiveKeys(new Set(newSet));
    };


    return (
        <div className="app-container" style={{ backgroundColor: '#E0F7FA' }}>
            {/* Top Bar */}
            <div className="header-panel">
                <button className="btn-small" onClick={onBack}>🏠</button>
                <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', color: '#555', fontSize: '1.2rem' }}>
                    {gameMode === 'CHORD_CHALLENGE' ? feedback : 'Chế độ Tự Do'}
                </div>
                <div className="coin-display">🟡 {coins}</div>
            </div>

            {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

            {/* Main Stats / Challenge Info */}
            <div className="stage-area">
                {gameMode === 'FREE' ? (
                    <div style={{ textAlign: 'center' }}>
                        <button className="btn-challenge" onClick={startChordChallenge}>
                            BẮT ĐẦU THỬ THÁCH TRIỆU HỒI 🔥
                        </button>
                    </div>
                ) : (
                    targetChord && (
                        <div className="chord-target">
                            <div className="chord-icon" style={{ backgroundColor: targetChord.color }}>
                                {targetChord.notes.join(' + ')}
                            </div>
                            <p>Nhấn giữ 3 phím cùng lúc!</p>
                        </div>
                    )
                )}
            </div>

            {/* PIANO KEYBOARD */}
            <div className="piano-scroll-container">
                <div className="piano-keyboard">
                    {PIANO_KEYS.map((k) => {
                        const isActive = activeKeys.has(k.note);
                        const isHint = targetChord?.notes.includes(k.note);

                        return (
                            <button
                                key={k.note}
                                className={`key ${k.type} ${isActive ? 'active' : ''} ${isHint ? 'hint blob' : ''}`}
                                onMouseDown={() => handleNoteStart(k.note)}
                                onMouseUp={() => handleNoteStop(k.note)}
                                onMouseLeave={() => handleNoteStop(k.note)}
                                onTouchStart={(e) => { e.preventDefault(); handleNoteStart(k.note); }}
                                onTouchEnd={(e) => { e.preventDefault(); handleNoteStop(k.note); }}
                            >
                                {k.type === 'white' && <span className="note-name">{k.name}</span>}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default TouchGame;
