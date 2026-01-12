import React, { useState, useEffect, useRef, useMemo } from 'react';
import Confetti from 'react-confetti';
import * as Tone from 'tone';
import './ForestGame.css';
import { playSound } from './utils/sound';

// --- DATA: SEQUENCES ---
// Definng the "C Major" parallel and contrary sequences
const SEQUENCES = {
    C_MAJOR: [
        // PHASE 1: PARALLEL (C D E F G A B C -> C B A G F E D C)
        // We only track the Note Names. We expect inputs to match these.
        // ASCENDING
        { note: 'C', label: 'Đô' }, { note: 'D', label: 'Rê' }, { note: 'E', label: 'Mi' }, { note: 'F', label: 'Fa' },
        { note: 'G', label: 'Sol' }, { note: 'A', label: 'La' }, { note: 'B', label: 'Si' }, { note: 'C', label: 'Đô' },
        // DESCENDING
        { note: 'B', label: 'Si' }, { note: 'A', label: 'La' }, { note: 'G', label: 'Sol' }, { note: 'F', label: 'Fa' },
        { note: 'E', label: 'Mi' }, { note: 'D', label: 'Rê' }, { note: 'C', label: 'Đô' },

        // PHASE 2: CONTRARY MOTION (Center C Outwards)
        // Left: B A G F E D C | Right: D E F G A B C
        // We check PAIRS. If microphone hears EITHER, we count as pass for simpler logic, 
        // OR we ideally want to switch detection target rapidly.
        // For kids, let's just create a linear sequence that represents the "Flow".
        // "Dual Hand" check via single mic is hard. 
        // Strategy: We will list the dominant note of the pair or accept both.

        // STARTING FROM CENTER DO (C) -> ALREADY AT C from Phase 1.
        // Step 1: L(Si) + R(Rê)
        { note: ['B', 'D'], label: 'Si + Rê' },
        // Step 2: L(La) + R(Mi)
        { note: ['A', 'E'], label: 'La + Mi' },
        // Step 3: L(Sol) + R(Fa)
        { note: ['G', 'F'], label: 'Sol + Fa' },
        // Step 4: L(Fa) + R(Sol) (Cross) - Actually in C Major contrary:
        // C(C) -> B/D -> A/E -> G/F -> F/G -> E/A -> D/B -> C/C
        { note: ['F', 'G'], label: 'Pha + Sol' },
        { note: ['E', 'A'], label: 'Mi + La' },
        { note: ['D', 'B'], label: 'Rê + Si' },
        { note: 'C', label: 'Đô (Về đích!)' },
    ]
};

// ML5 Model URL
const MODEL_URL = 'https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/models/pitch-detection/crepe/';

function ForestGame({ onBack }) {
    // --- STATE ---
    const [targetReps, setTargetReps] = useState(0); // 0 means In Setup
    const [completedReps, setCompletedReps] = useState(0);
    const [stepIndex, setStepIndex] = useState(0);

    const [gameState, setGameState] = useState('SETUP'); // SETUP, PLAYING, ERROR, WIN
    const [statusMsg, setStatusMsg] = useState('Chọn số lần tập nào!');
    const [detectedNote, setDetectedNote] = useState('-');
    const [lastWrongNote, setLastWrongNote] = useState(null);

    // Audio Context
    const audioContextRef = useRef(null);
    const pitchRef = useRef(null);
    const isListeningRef = useRef(false);

    // Helper: TTS
    const speak = (text) => {
        if ('speechSynthesis' in window) {
            // Cancel previous
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'vi-VN';
            utterance.rate = 1.1;
            // Try to find a vietnamese voice
            const voices = window.speechSynthesis.getVoices();
            const viVoice = voices.find(v => v.lang.includes('vi'));
            if (viVoice) utterance.voice = viVoice;

            window.speechSynthesis.speak(utterance);
        }
    };

    // --- AUDIO INIT ---
    useEffect(() => {
        async function startMic() {
            try {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                }

                // Only request mic if not already set up (avoids multiple streams)
                if (!pitchRef.current) {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                    if (window.ml5) {
                        pitchRef.current = window.ml5.pitchDetection(MODEL_URL, audioContextRef.current, stream, () => {
                            console.log('Model Loaded');
                            isListeningRef.current = true;
                            detectPitchLoop();
                        });
                    }
                }
            } catch (e) {
                console.error("Mic Error:", e);
                setStatusMsg("Không tìm thấy Micro! Kiểm tra quyền truy cập.");
            }
        }
        startMic();

        return () => {
            isListeningRef.current = false;
            window.speechSynthesis.cancel();
        };
    }, []);

    // --- PITCH DETECTION LOOP ---
    const getNoteFromFreq = (frequency) => {
        if (!frequency) return null;
        const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
        const midi = Math.round(noteNum) + 69;
        const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        return noteNames[midi % 12];
    };

    const detectPitchLoop = () => {
        if (!pitchRef.current) return;
        pitchRef.current.getPitch((err, frequency) => {
            if (frequency) {
                const note = getNoteFromFreq(frequency);
                setDetectedNote(note);
            }
            if (isListeningRef.current) {
                pitchRef.current.getPitch(detectPitchLoop);
            }
        });
    };

    // --- GAMEPLAY LOGIC ---

    // Debounce logic for note detection to avoid flickering
    useEffect(() => {
        if (gameState !== 'PLAYING') return;

        const currentTask = SEQUENCES.C_MAJOR[stepIndex];
        if (!currentTask) return;

        // Normalize target: logic to handle array (Dual notes) or single string
        const targets = Array.isArray(currentTask.note) ? currentTask.note : [currentTask.note];

        // Check if detected matches ANY valid target
        // We ignore octaves, just check Note Name (C, D, E...)
        if (targets.includes(detectedNote)) {
            // CORRECT!
            playSound('correct'); // Short ping

            // Special Visual Checkpoint
            if (stepIndex === SEQUENCES.C_MAJOR.length - 1) {
                // END OF REP
                completeRep();
            } else {
                setStepIndex(prev => prev + 1);
            }
        } else {
            // WRONG NOTE CHECK
            // If detection is stable on a WRONG note (not noise), trigger error
            // To be safe for kids, we only punish if the note is "far" or clearly wrong and sustained?
            // Actually simplest is: If note is valid musical note but NOT target.
            if (detectedNote !== '-' && !targets.includes(detectedNote)) {
                // debounce error? strictly instant?
                // Let's rely on a small timeout logic or just instant "Wrong" is too harsh?
                // User wanted "Strict". Let's do instant but maybe with a 200ms verify?
                // For now, implementing instant feedback for "Strict".
                handleError(detectedNote);
            }
        }

    }, [detectedNote, gameState, stepIndex]);

    const handleError = (wrongNote) => {
        if (gameState === 'ERROR') return; // Already handling

        // Avoid noise triggering (maybe check if wrongNote persists?)
        // For this MVP, we assume clear input.

        // Don't error immediately on transitory notes, but user asked for strict.
        // Let's throttle: Only error if we haven't errored in last 2 seconds? No, that breaks flow.
        // We'll set state to ERROR temp.

        setGameState('ERROR');
        setLastWrongNote(wrongNote);

        // Random Voice Pack
        const phrases = [
            "Sai rồi bé ơi!",
            "Nhầm nốt rồi, đánh lại nhé!",
            "Ôi không, tập trung nào!",
            "Chưa đúng, thử lại đi!"
        ];
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        speak(randomPhrase);
        playSound('wrong');

        // Reset Rep Logic
        setTimeout(() => {
            setStepIndex(0); // Back to start of logic
            setGameState('PLAYING');
            setDetectedNote('-'); // Reset detected to avoid instant re-trigger
        }, 2500); // Wait for speech
    };

    const completeRep = () => {
        const newCount = completedReps + 1;
        setCompletedReps(newCount);

        if (newCount >= targetReps) {
            setGameState('WIN');
            speak("Hoàn thành nhiệm vụ! Bé giỏi quá!");
            playSound('win');
        } else {
            // Continue to next rep
            speak(`Tốt lắm! Lần thứ ${newCount}. Tiếp tục nào!`);
            setStepIndex(0);
            // Visual flare?
        }
    };

    // --- RENDER ---

    const currentTask = SEQUENCES.C_MAJOR[stepIndex] || {};

    // SETUP SCREEN
    if (targetReps === 0) {
        return (
            <div className="forest-container">
                <div className="setup-overlay">
                    <h1 style={{ fontSize: '3rem', color: '#FFEB3B' }}>🌲 Rừng Xanh 🌲</h1>
                    <p>Chọn số lần tập (Reps) để bắt đầu:</p>

                    <div className="rep-grid">
                        {[10, 20, 30, 40, 50, 100].map(num => (
                            <button key={num} className="rep-btn" onClick={() => {
                                speak("Bắt đầu thôi!");
                                setTargetReps(num);
                                setGameState('PLAYING');
                            }}>
                                {num} 🍎
                            </button>
                        ))}
                    </div>
                    <button className="btn-small" style={{ marginTop: '50px' }} onClick={onBack}>🏠 Quay Về</button>
                </div>
            </div>
        );
    }

    // GAME SCREEN
    return (
        <div className="forest-container">
            {gameState === 'WIN' && <Confetti recycle={true} />}

            {/* BACKGROUND LAYERS */}
            <div className="sun-glow"></div>
            <div className="tree-bg"></div>

            {/* HUD */}
            <div className="forest-hud">
                <button className="btn-small" onClick={onBack}>🏠</button>

                <div className="rep-counter-panel">
                    <div className="target-badge">Mục tiêu: {targetReps}</div>
                    <div className="rep-text">Đã xong</div>
                    <div className="rep-value">{completedReps}</div>
                </div>

                {/* Status Message */}
                <div style={{ background: 'white', padding: '10px 20px', borderRadius: '20px', color: '#333', fontWeight: 'bold' }}>
                    {gameState === 'ERROR' ? (
                        <span style={{ color: 'red' }}>⚠️ {detectedNote} (Sai rồi!)</span>
                    ) : (
                        <span>👂 Đang nghe: {detectedNote}</span>
                    )}
                </div>
            </div>

            {/* VISUALS */}
            <div className="banana-trail">
                {/* Show progress within the current REP (Step / Total Steps) */}
                {/* Or show Total Progress (Reps / Target)? Use Reps/Target for trail */}
                {Array.from({ length: Math.min(10, targetReps) }).map((_, i) => {
                    // Normalize if target > 10
                    const visualIdx = i; // simple mapping
                    const isDone = (i < completedReps / (targetReps / 10)); // Approximate scaling
                    // Actually let's just show up to 10 stars representing progress %
                    const percent = completedReps / targetReps;
                    const active = i / 10 < percent;

                    return (
                        <div key={i} className={`banana-item ${active ? 'collected' : ''}`}>
                            {active ? '🌟' : '⚪'}
                        </div>
                    );
                })}
            </div>

            <div className={`forest-character ${gameState === 'ERROR' ? 'shake-anim' : ''}`}
                style={{ left: `${10 + (stepIndex / SEQUENCES.C_MAJOR.length) * 80}%` }}>

                <div className={`character-speech-bubble ${gameState === 'ERROR' || gameState === 'WIN' ? 'visible' : ''}`}>
                    {gameState === 'ERROR' ? 'A á! Sai rồi!' : 'Yeah!'}
                </div>

                <div className="monkey-avatar">
                    {gameState === 'ERROR' ? '🙈' : (gameState === 'WIN' ? '🏆' : '🐵')}
                </div>
            </div>

            {/* NOTE DISPLAY */}
            <div className="current-task-display">
                <h2 style={{ fontSize: '2rem', marginBottom: '10px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    Mục tiêu: <span style={{ color: '#FFEB3B' }}>{currentTask.label}</span>
                </h2>
                <div className="note-bubbles-container">
                    {/* Show prev, current, next */}
                    {stepIndex > 0 && (
                        <div className="note-bubble" style={{ opacity: 0.5 }}>
                            {SEQUENCES.C_MAJOR[stepIndex - 1].note[0]}
                        </div>
                    )}

                    <div className="note-bubble active">
                        {Array.isArray(currentTask.note) ? currentTask.note.join('+') : currentTask.note}
                    </div>

                    {stepIndex < SEQUENCES.C_MAJOR.length - 1 && (
                        <div className="note-bubble" style={{ opacity: 0.5 }}>
                            {SEQUENCES.C_MAJOR[stepIndex + 1].note[0]}
                        </div>
                    )}
                </div>
                <p style={{ opacity: 0.8 }}>(Hãy đánh trên đàn thật)</p>
            </div>

            {gameState === 'WIN' && (
                <div className="setup-overlay" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <h1>🎉 CHÚC MỪNG! 🎉</h1>
                    <button className="rep-btn" onClick={() => {
                        setCompletedReps(0);
                        setGameState('SETUP');
                        setTargetReps(0);
                    }}>Chơi Lại</button>
                </div>
            )}
        </div>
    );
}

export default ForestGame;
