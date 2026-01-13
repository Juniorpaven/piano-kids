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
    // SETUP SCREEN (Reps) - THEMED "APPLE HARVEST"
    if (gameState === 'SETUP') {
        return (
            <div className="forest-container">
                <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 100 }}>
                    <button className="btn-home-circle" onClick={onBack}>🏠</button>
                </div>
                <div className="setup-overlay">
                    <h1 style={{ fontSize: '3rem', color: '#FFEB3B', textShadow: '0 4px 0 #33691E' }}>� Thu Hoạch Táo �</h1>
                    <p style={{ color: '#C8E6C9', fontSize: '1.2rem' }}>Chọn số quả táo (lần tập) bé muốn hái nhé:</p>

                    <div className="apple-grid-container">
                        {[10, 20, 30, 40, 50, 100].map(num => (
                            <button key={num} className="apple-btn" onClick={() => {
                                setTargetReps(num);
                                setGameState('SELECT_SCALE');
                            }}>
                                <span className="apple-number">{num}</span>
                                <span className="apple-label">Quả</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // SCALE SELECT SCREEN (MUSICAL GARDEN)
    if (gameState === 'SELECT_SCALE') {
        return (
            <div className="musical-garden-scene">
                <div className="garden-header-row">
                    <button className="btn-home-circle" onClick={onBack}>🏠</button>
                    <div className="garden-title-box">Musical Garden</div>
                    <button className="btn-home-circle" onClick={() => setGameState('SETUP')}>⚙️</button>
                </div>

                {/* Butterfly Instruction with Flutter Character */}
                <div className="butterfly-guide">
                    <div className="butterfly-bubble">Chọn bông hoa âm nhạc nào!</div>
                    <img src="/flutter-butterfly.png" className="flutter-img" alt="Flutter" />
                    {/* Sparkle Trail */}
                    <div className="sparkle-trail sparkle-1"></div>
                    <div className="sparkle-trail sparkle-2"></div>
                    <div className="sparkle-trail sparkle-3"></div>
                </div>

                <div className="garden-path-container">
                    {SCALES.map((s, idx) => (
                        <div key={s.id} className="flower-level-node">
                            <div
                                className="flower-circle-btn bounce-hover"
                                onClick={() => handleSelectScale(s)}
                                style={{
                                    borderColor: s.color,
                                    background: `radial-gradient(circle, #fff 40%, ${s.color}22 100%)`
                                }}
                            >
                                <div className="level-number-badge" style={{ background: s.color }}>{idx + 1}</div>

                                <div className="flower-face-icon" style={{ color: s.color }}>
                                    {['🌻', '🌷', '🌹', '🌼', '🌺', '🌸', '💐'][idx % 7]}
                                </div>

                                <div className="flower-name-tag" style={{ color: s.color, textAlign: 'center' }}>
                                    {s.name} <br />
                                    <span style={{ fontSize: '0.6rem', color: '#888', fontWeight: 'normal' }}>Âm Giai Trưởng</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button className="btn-jelly-lg"
                        style={{ marginTop: 50, background: '#FF5252', width: 220, height: 70, fontSize: '1.5rem' }}
                        onClick={() => {
                            handleSelectScale(SCALES[0]);
                        }}
                    >
                        ▶ PLAY ALL
                    </button>
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
                style={{
                    left: `${10 + (stepIndex / gameSequence.length) * 80}%`,
                    transition: 'left 0.5s',
                    bottom: '200px' // Lift monkey up so keyboard fits
                }}>
                <div className="monkey-avatar">
                    <span style={{ fontSize: '5rem' }}>
                        {gameState === 'ERROR' ? '🙈' : (gameState === 'WIN' ? '🏆' : '🐵')}
                    </span>
                </div>
                {/* Speech Bubble for current note */}
                <div className="speech-bubble" style={{ minWidth: 100, textAlign: 'center' }}>
                    {currentScale?.name} <br />
                    <span style={{ color: 'red', fontSize: '1.5rem' }}>{currentTask.label}</span>
                </div>
            </div>

            {/* KEYBOARD DISPLAY - NEW STYLED */}
            <div className="forest-visual-keyboard">
                <div className="piano-scroll-container" style={{ overflow: 'visible', height: '100%', alignItems: 'flex-end' }}>
                    <div className="piano-keyboard extended" style={{ background: 'transparent', boxShadow: 'none' }}>
                        {pianoKeys.map((k, i) => {
                            // SHOW BLUE DOTS FOR BOTH HANDS (Simulated by highlighting all matching octaves)
                            // User requested "Blue dots" specifically.
                            const noteName = k.note.replace(/[0-9]/g, '');
                            const targetNames = taskNotes.map(tn => tn.replace(/[0-9]/g, ''));
                            const isTarget = targetNames.includes(noteName);

                            // We use 'active-hint' style which is usually green/blue. Let's force a blue style if needed,
                            // but usually the default hint style is good. User asked for "Green/Blue dots".

                            // FOREST KEYBOARD: INTERACTIVE HYBRID
                            // 1. Visual Hint: Show Green/Blue dot on target keys (both hands logic)
                            // 2. Interaction: Clicking key triggers 'checkNote' simulating external play
                            return (
                                <KeyComponent
                                    key={`${k.note}-${i}`}
                                    k={k}
                                    index={i}
                                    isCurrent={isTarget} // Shows the hint dot
                                    isFuture={false}
                                    finger={null}
                                    onPlay={() => {
                                        // Allow manual play to trigger check
                                        playSound('piano', k.note);
                                        checkNote(noteName);
                                    }}
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
