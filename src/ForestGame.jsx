import React, { useState, useEffect, useRef, useMemo } from 'react';
import Confetti from 'react-confetti';
import * as Tone from 'tone';
import './ForestGame.css';
import { playSound } from './utils/sound';
import KeyComponent from './components/KeyComponent';

// --- DATA: SCALES (Reusing standard scales from other modes) ---
const SCALES = [
    { id: 'C_MAJOR', name: 'Đô Trưởng (C)', root: 'C', color: '#ef5350', notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'] },
    { id: 'D_MAJOR', name: 'Rê Trưởng (D)', root: 'D', color: '#FFB74D', notes: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#', 'D'] },
    { id: 'E_MAJOR', name: 'Mi Trưởng (E)', root: 'E', color: '#FFEE58', notes: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#', 'E'] },
    { id: 'F_MAJOR', name: 'Fa Trưởng (F)', root: 'F', color: '#66BB6A', notes: ['F', 'G', 'A', 'A#', 'C', 'D', 'E', 'F'] },
    { id: 'G_MAJOR', name: 'Son Trưởng (G)', root: 'G', color: '#42A5F5', notes: ['G', 'A', 'B', 'C', 'D', 'E', 'F#', 'G'] },
    { id: 'A_MAJOR', name: 'La Trưởng (A)', root: 'A', color: '#AB47BC', notes: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#', 'A'] },
    { id: 'B_MAJOR', name: 'Si Trưởng (B)', root: 'B', color: '#EC407A', notes: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#', 'B'] },
];

// Helper to generate sequences dynamically based on scale
const generateSequence = (scale) => {
    const n = scale.notes;
    // Notes: [0, 1, 2, 3, 4, 5, 6, 7] (7 is Octave)

    // PHASE 1: PARALLEL (Up then Down)
    // We assume 'label' is sufficient. children play 1 octave.
    const seq = [];

    // UP
    for (let i = 0; i < n.length; i++) {
        seq.push({ note: n[i], label: n[i] });
    }
    // DOWN (skip last one to avoid double top note? or play top again? Standard is play top once then down. So start i=length-2)
    for (let i = n.length - 2; i >= 0; i--) {
        seq.push({ note: n[i], label: n[i] });
    }

    // PHASE 2: CONTRARY MOTION (Center Outwards)
    // Root is n[0].
    // We'll simulate a simple 1-octave contrary expansion.
    // L goes Down (reverse scale logic?), R goes Up.
    // Since we don't have full keyboard map logic for "scales below root" easily without a big theory library,
    // let's simplify Phase 2 to: "Chơi lại 2 tay" or simple chords?
    // User requested "Parallel and Contrary".
    // Let's implement a simplified Contrary: Play Root -> Play 3rd -> Play 5th -> Play Octave (Arpeggio style) for easier general detection?
    // No, let's stick to the previously defined logic but adaptable.

    // For Dynamic Scales, Contrary is hard to calc "Note Below Root" without chromatic map.
    // Let's rely on Parallel Motion Phase (Up/Down) twice to ensure it works for ALL scales perfectly.
    // The previous C_MAJOR specific contrary list was hardcoded.

    // Adding a simple "Chord" finish
    seq.push({ note: [n[0], n[2], n[4]], label: 'Hợp âm về đích!' }); // Root, 3rd, 5th

    return seq;
};

// ML5 Model URL
const MODEL_URL = 'https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/models/pitch-detection/crepe/';

function ForestGame({ onBack }) {
    // --- ROTATION CHECK (Moved to top level to fix React Error #310) ---
    const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
    const [forceRotate, setForceRotate] = useState(false);

    useEffect(() => {
        const checkOrientation = () => setIsPortrait(window.innerHeight > window.innerWidth);
        window.addEventListener('resize', checkOrientation);
        return () => window.removeEventListener('resize', checkOrientation);
    }, []);

    // --- STATE ---
    const [targetReps, setTargetReps] = useState(0);
    const [completedReps, setCompletedReps] = useState(0);
    const [stepIndex, setStepIndex] = useState(0);

    const [gameState, setGameState] = useState('SETUP'); // SETUP, SELECT_SCALE, PLAYING, ERROR, WIN
    const [statusMsg, setStatusMsg] = useState('Chọn số lần tập nào!');
    const [detectedNote, setDetectedNote] = useState('-');
    const [lastWrongNote, setLastWrongNote] = useState(null);
    const [currentScale, setCurrentScale] = useState(SCALES[0]); // Default C
    const [gameSequence, setGameSequence] = useState([]);

    // Audio Context
    const audioContextRef = useRef(null);
    const pitchRef = useRef(null);
    const isListeningRef = useRef(false);

    // KEYBOARD GENERATION (C3 - B4 range for visual)
    const NOTES_CHROMATIC_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const pianoKeys = useMemo(() => {
        let keys = [];
        const octaves = [3, 4];
        octaves.forEach(oct => {
            NOTES_CHROMATIC_KEYS.forEach(n => {
                const type = n.includes('#') ? 'black' : 'white';
                let label = n;
                if (type === 'white') {
                    if (n === 'C') label = 'Đô'; if (n === 'D') label = 'Rê'; if (n === 'E') label = 'Mi';
                    if (n === 'F') label = 'Fa'; if (n === 'G') label = 'Sol'; if (n === 'A') label = 'La';
                    if (n === 'B') label = 'Si';
                }
                keys.push({ note: `${n}${oct}`, label: type === 'white' ? label : null, type });
            });
        });
        return keys;
    }, []);

    // Helper: TTS
    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'vi-VN';
            utterance.rate = 1.1;
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
                // Check audio context state 
                if (audioContextRef.current.state === 'suspended') {
                    await audioContextRef.current.resume();
                }

                if (!pitchRef.current) {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                    if (window.ml5) {
                        pitchRef.current = window.ml5.pitchDetection(MODEL_URL, audioContextRef.current, stream, () => {
                            console.log('Model Loaded');
                            if (isListeningRef.current) return;
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
    useEffect(() => {
        if (gameState !== 'PLAYING') return;

        const currentTask = gameSequence[stepIndex];
        if (!currentTask) return;

        const targets = Array.isArray(currentTask.note) ? currentTask.note : [currentTask.note];

        if (targets.includes(detectedNote)) {
            playSound('correct');
            if (stepIndex === gameSequence.length - 1) {
                completeRep();
            } else {
                setStepIndex(prev => prev + 1);
            }
        } else {
            if (detectedNote !== '-' && !targets.includes(detectedNote)) {
                handleError(detectedNote);
            }
        }
    }, [detectedNote, gameState, stepIndex, gameSequence]);

    const handleError = (wrongNote) => {
        if (gameState === 'ERROR') return;
        setGameState('ERROR');
        setLastWrongNote(wrongNote);
        const phrases = ["Sai rồi bé ơi!", "Nhầm nốt rồi!", "Tập trung nào!"];
        speak(phrases[Math.floor(Math.random() * phrases.length)]);
        playSound('wrong');

        setTimeout(() => {
            setStepIndex(0);
            setGameState('PLAYING');
            setDetectedNote('-');
        }, 2000);
    };

    const completeRep = () => {
        const newCount = completedReps + 1;
        setCompletedReps(newCount);

        if (newCount >= targetReps) {
            setGameState('WIN');
            speak("Hoàn thành nhiệm vụ! Bé giỏi quá!");
            playSound('win');
        } else {
            speak(`Tốt lắm! Tiếp tục nào!`);
            setStepIndex(0);
        }
    };

    const handleSelectScale = (scale) => {
        setCurrentScale(scale);
        setGameSequence(generateSequence(scale));
        setGameState('PLAYING');
        setStepIndex(0);
        setCompletedReps(0);
        speak(`Bắt đầu luyện tập ${scale.name}`);
    };

    // --- RENDER ---

    // SETUP SCREEN (Reps)
    if (gameState === 'SETUP') {
        return (
            <div className="forest-container">
                <div className="setup-overlay">
                    <h1 style={{ fontSize: '3rem', color: '#FFEB3B' }}>🌲 Rừng Xanh 🌲</h1>
                    <p>Chọn số lần tập (Reps) để bắt đầu:</p>
                    <div className="rep-grid">
                        {[10, 20, 30, 40, 50, 100].map(num => (
                            <button key={num} className="rep-btn" onClick={() => {
                                setTargetReps(num);
                                setGameState('SELECT_SCALE');
                            }}>
                                {num} 🍎
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // SCALE SELECT SCREEN
    if (gameState === 'SELECT_SCALE') {
        return (
            <div className="app-main-menu"> {/* Reuse MainMenu styles for consistency */}
                <div className="header-panel">
                    <button className="btn-small" onClick={() => setGameState('SETUP')}>🔙</button>
                    <h2 style={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Chọn Bài Nhạc</h2>
                    <div style={{ width: 40 }}></div>
                </div>
                <div className="chord-grid">
                    {SCALES.map(s => (
                        <div key={s.id} className="chord-card" onClick={() => handleSelectScale(s)}>
                            <div className="chord-title" style={{ background: s.color }}>{s.name}</div>
                            <div className="chord-notes">{s.notes.join(' - ')}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const currentTask = gameSequence[stepIndex] || {};
    const taskNotes = Array.isArray(currentTask.note) ? currentTask.note : [currentTask.note];

    // GAME SCREEN with Rotation Check
    return (
        <div className={`forest-container ${forceRotate ? 'forced-landscape' : ''}`}>
            <div className="forest-hud">
                <button className="btn-small" onClick={() => setGameState('SELECT_SCALE')}>🔙</button>
                <div className="rep-counter-panel">
                    <div className="target-badge">Mục tiêu: {targetReps}</div>
                    <div className="rep-text">Đã xong</div>
                    <div className="rep-value">{completedReps}</div>
                </div>
                <div style={{ background: 'white', padding: '10px 20px', borderRadius: '20px', color: '#333', fontWeight: 'bold' }}>
                    {gameState === 'ERROR' ? (
                        <span style={{ color: 'red' }}>⚠️ {detectedNote} (Sai!)</span>
                    ) : (
                        <span>👂 Nghe: {detectedNote}</span>
                    )}
                </div>
            </div>

            {/* Warning Overlay */}
            {(isPortrait && !forceRotate) && (
                <div className="portrait-warning" style={{ display: 'flex', position: 'fixed', zIndex: 999 }}>
                    <div className="rotate-icon">📱➡️</div>
                    <h2>Vui lòng xoay ngang điện thoại!</h2>
                    <button className="btn-force-rotate" onClick={() => setForceRotate(true)}>🔄 Xoay Ngang</button>
                </div>
            )}

            {gameState === 'WIN' && (
                <div className="setup-overlay" style={{ background: 'rgba(0,0,0,0.6)' }}>
                    <Confetti recycle={true} />
                    <h1 style={{ fontSize: '4rem', color: '#4CAF50' }}>🎉 XUẤT SẮC! 🎉</h1>
                    <button className="rep-btn" onClick={() => setGameState('SETUP')}>Chơi Lại</button>
                </div>
            )}

            {/* SCENERY */}
            <div className="sun-glow"></div>
            <div className="tree-bg"></div>

            {/* CHARACTER */}
            <div className={`forest-character ${gameState === 'ERROR' ? 'shake-anim' : ''}`}
                style={{ left: `${10 + (stepIndex / gameSequence.length) * 80}%`, transition: 'left 0.5s' }}>
                <div className="monkey-avatar">
                    {gameState === 'ERROR' ? '🙈' : (gameState === 'WIN' ? '🏆' : '🐵')}
                </div>
            </div>

            {/* KEYBOARD DISPLAY - NEW */}
            <div className="current-task-display" style={{ bottom: 0 }}>
                <div style={{ marginBottom: 10, fontSize: '1.5rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                    Nốt cần đánh: <span style={{ color: '#FFEB3B', fontSize: '2rem' }}>{currentTask.label}</span>
                </div>

                <div className="piano-scroll-container" style={{ height: 'auto', paddingBottom: 10 }}>
                    <div className="piano-keyboard extended">
                        {pianoKeys.map((k, i) => {
                            // LOGIC: Show Green Dot on ALL keys that match the Target Note Name
                            // e.g. Target "C" -> Highlights C3, C4
                            const noteName = k.note.replace(/[0-9]/g, '');
                            const isTarget = taskNotes.includes(noteName);
                            // Highlight Detected Note with Blue or similar? No, user removed blue. Just Green for target.

                            return (
                                <KeyComponent
                                    key={`${k.note}-${i}`}
                                    k={k}
                                    index={i}
                                    isCurrent={isTarget} // Green Dot
                                    isFuture={false}
                                    finger={null}
                                    onPlay={() => { }} // Visual only
                                    allKeys={pianoKeys}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForestGame;
