import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import Confetti from 'react-confetti';
import './TouchGame.css';
import './MainMenu.css';

// --- DATA: SCALES & FINGERING (Expanded for Demo) ---
const SCALES = [
    {
        id: 'C_MAJOR', name: 'Đô Trưởng (C)', root: 'C', color: '#ef5350',
        notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'],
        fingering: {
            RIGHT: [1, 2, 3, 1, 2, 3, 4, 5],
            LEFT: [5, 4, 3, 2, 1, 3, 2, 1]
        }
    },
    {
        id: 'D_MAJOR', name: 'Rê Trưởng (D)', root: 'D', color: '#FFB74D',
        notes: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#', 'D'],
        fingering: {
            RIGHT: [1, 2, 3, 1, 2, 3, 4, 5],
            LEFT: [5, 4, 3, 2, 1, 3, 2, 1]
        }
    },
    {
        id: 'E_MAJOR', name: 'Mi Trưởng (E)', root: 'E', color: '#FFEE58',
        notes: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#', 'E'],
        fingering: {
            RIGHT: [1, 2, 3, 1, 2, 3, 4, 5],
            LEFT: [5, 4, 3, 2, 1, 3, 2, 1]
        }
    },
    {
        id: 'F_MAJOR', name: 'Fa Trưởng (F)', root: 'F', color: '#66BB6A',
        notes: ['F', 'G', 'A', 'A#', 'C', 'D', 'E', 'F'],
        fingering: {
            RIGHT: [1, 2, 3, 4, 1, 2, 3, 4],
            LEFT: [5, 4, 3, 2, 1, 3, 2, 1]
        }
    },
    {
        id: 'G_MAJOR', name: 'Son Trưởng (G)', root: 'G', color: '#42A5F5',
        notes: ['G', 'A', 'B', 'C', 'D', 'E', 'F#', 'G'],
        fingering: {
            RIGHT: [1, 2, 3, 1, 2, 3, 4, 5],
            LEFT: [5, 4, 3, 2, 1, 3, 2, 1]
        }
    },
    {
        id: 'A_MAJOR', name: 'La Trưởng (A)', root: 'A', color: '#AB47BC',
        notes: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#', 'A'],
        fingering: {
            RIGHT: [1, 2, 3, 1, 2, 3, 4, 5],
            LEFT: [5, 4, 3, 2, 1, 3, 2, 1]
        }
    },
    {
        id: 'B_MAJOR', name: 'Si Trưởng (B)', root: 'B', color: '#EC407A',
        notes: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#', 'B'],
        fingering: {
            RIGHT: [1, 2, 3, 1, 2, 3, 4, 5],
            LEFT: [4, 3, 2, 1, 4, 3, 2, 1]
        }
    },
];

const NOTES_CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function TouchGame({ onBack }) {
    const [synth, setSynth] = useState(null);
    const [coins, setCoins] = useState(() => parseInt(localStorage.getItem('pk_coins') || '0'));
    const [isLoaded, setIsLoaded] = useState(false); // Track sampler loading status

    const [view, setView] = useState('SELECTION');
    const [handMode, setHandMode] = useState('RIGHT');
    const [currentScale, setCurrentScale] = useState(null);
    const [stepIndex, setStepIndex] = useState(0);
    const [gameStatus, setGameStatus] = useState('PLAYING'); // PLAYING, WIN, DEMO
    const [showConfetti, setShowConfetti] = useState(false);

    // New State for Demo Visuals
    const [demoIndex, setDemoIndex] = useState(-1);

    // Orientation Logic
    const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
    const [forceRotate, setForceRotate] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            setIsPortrait(window.innerHeight > window.innerWidth);
        };
        window.addEventListener('resize', checkOrientation);
        return () => window.removeEventListener('resize', checkOrientation);
    }, []);

    const gameSequence = useRef([]);

    // FIXED: Generate exactly 2 octaves (C3 to B4)
    // User requested "tu not do den si 2 lan" starting from the first set.
    const pianoKeys = (() => {
        let keys = [];
        const octaves = [3, 4]; // Octaves 3 and 4 -> C3...B3, C4...B4
        octaves.forEach(oct => {
            NOTES_CHROMATIC.forEach(n => {
                const type = n.includes('#') ? 'black' : 'white';
                let label = n;
                if (type === 'white') {
                    if (n === 'C') label = 'Đô';
                    if (n === 'D') label = 'Rê';
                    if (n === 'E') label = 'Mi';
                    if (n === 'F') label = 'Fa';
                    if (n === 'G') label = 'Sol';
                    if (n === 'A') label = 'La';
                    if (n === 'B') label = 'Si';
                }
                keys.push({ note: `${n}${oct}`, label: type === 'white' ? label : null, type });
            });
        });
        return keys;
    })();

    // NEW SOUND ENGINE: Tone.Sampler
    useEffect(() => {
        const sampler = new Tone.Sampler({
            urls: {
                "C4": "C4.mp3",
                "D#4": "Ds4.mp3",
                "F#4": "Fs4.mp3",
                "A4": "A4.mp3",
            },
            release: 1,
            baseUrl: "https://tonejs.github.io/audio/salamander/",
            onload: () => {
                setIsLoaded(true);
            }
        }).toDestination();

        setSynth(sampler);
        return () => sampler.dispose();
    }, []);

    const getGameSequence = () => {
        if (!currentScale) return [];
        // Base Octave 3 to match the C3-B4 keyboard
        const baseOctave = 3;
        const notes = currentScale.notes;
        const fingers = currentScale.fingering[handMode];
        let currentOctave = baseOctave;
        let lastNoteIdx = -1;

        const ascNotes = [];
        notes.forEach((nName, i) => {
            const nIdx = NOTES_CHROMATIC.indexOf(nName.includes('#') ? nName : nName.replace(/[0-9]/g, ''));
            if (lastNoteIdx !== -1 && nIdx < lastNoteIdx) { currentOctave++; }
            lastNoteIdx = nIdx;
            ascNotes.push({ note: `${nName}${currentOctave}`, finger: fingers[i] });
        });

        // 2. DESCENDING (With Top Note Repeat for Rhythm)
        const descNotes = [...ascNotes].reverse();
        return [...ascNotes, ...descNotes];
    };

    useEffect(() => {
        if (currentScale) {
            gameSequence.current = getGameSequence();
            setStepIndex(0);
            setGameStatus('PLAYING');
            setDemoIndex(-1);
        }
    }, [currentScale, handMode]);

    const handleNotePlay = async (playedNote) => {
        // Ignore input during demo
        if (gameStatus === 'DEMO') return;

        if (Tone.context.state !== 'running') await Tone.start();

        // Play sound if loaded, else fallback or silent
        if (synth && isLoaded) {
            synth.triggerAttackRelease(playedNote, "8n");
        }

        if (view === 'PLAY' && gameStatus === 'PLAYING') {
            const target = gameSequence.current[stepIndex];
            if (target && playedNote === target.note) {
                if (stepIndex >= gameSequence.current.length - 1) {
                    setGameStatus('WIN');
                    setShowConfetti(true);
                    updateCoins(5);
                    setTimeout(() => playWinMelody(), 500);
                } else {
                    setStepIndex(prev => prev + 1);
                }
            }
        }
    };

    const playWinMelody = () => {
        if (!synth || !isLoaded) return;
        const now = Tone.now();
        synth.triggerAttackRelease("C5", "8n", now);
        synth.triggerAttackRelease("E5", "8n", now + 0.1);
        synth.triggerAttackRelease("G5", "8n", now + 0.2);
        synth.triggerAttackRelease("C6", "2n", now + 0.3);
    };

    const updateCoins = (val) => {
        const newTotal = coins + val;
        setCoins(newTotal);
        localStorage.setItem('pk_coins', newTotal.toString());
    };

    // NEW: Play Demo with Visuals
    const playDemo = async () => {
        if (Tone.context.state !== 'running') await Tone.start();

        if (gameStatus === 'DEMO') return;

        setGameStatus('DEMO');
        setDemoIndex(-1);
        const now = Tone.now();
        const sequence = gameSequence.current;

        sequence.forEach((item, i) => {
            // Audio
            if (synth && isLoaded) synth.triggerAttackRelease(item.note, "8n", now + i * 0.5);

            // Visual: Update Index
            setTimeout(() => {
                setDemoIndex(i);
            }, i * 500);
        });

        // Reset after done
        setTimeout(() => {
            setDemoIndex(-1);
            setGameStatus('PLAYING');
        }, sequence.length * 500 + 500);
    };

    if (view === 'SELECTION') {
        return (
            <div className="app-main-menu">
                <div className="header-panel">
                    <button className="btn-small" onClick={onBack}>🏠</button>
                    <div className="coin-display">🟡 {coins}</div>
                </div>

                <h1 className="title-lg">Luyện Ngón Piano 🎹</h1>

                <div className="hand-toggle">
                    <button className={`hand-btn ${handMode === 'LEFT' ? 'active' : ''}`} onClick={() => setHandMode('LEFT')}>🤚 Tay Trái</button>
                    <button className={`hand-btn ${handMode === 'RIGHT' ? 'active' : ''}`} onClick={() => setHandMode('RIGHT')}>✋ Tay Phải</button>
                </div>

                <div className="chord-grid">
                    {SCALES.map(s => (
                        <div key={s.id} className="chord-card" onClick={() => { setCurrentScale(s); setView('PLAY'); }}>
                            <div className="chord-title" style={{ background: s.color }}>{s.name}</div>
                            <div className="chord-notes">Luyện: {s.notes.join(' - ')}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const currentTarget = gameSequence.current[stepIndex] || {};
    const progressPercent = Math.min(100, (stepIndex / gameSequence.current.length) * 100);

    return (
        <div className={`touch-game-fullscreen ${forceRotate ? 'forced-landscape' : ''}`}>
            {showConfetti && <Confetti recycle={false} numberOfPieces={300} />}

            {/* Warning Overlay controlled by React */}
            {(isPortrait && !forceRotate) && (
                <div className="portrait-warning" style={{ display: 'flex' }}>
                    <div className="rotate-icon">📱➡️</div>
                    <h2>Vui lòng xoay ngang điện thoại!</h2>
                    <p>Hoặc ấn nút dưới để xoay ép buộc.</p>
                    <button className="btn-force-rotate" onClick={() => setForceRotate(true)}>
                        🔄 Xoay Ngang Ngay
                    </button>
                </div>
            )}

            <div className="glass-panel">
                <button className="btn-menu-back" onClick={() => setView('SELECTION')}>
                    <span style={{ fontSize: '1.5rem' }}>🏠</span>
                    <span>Menu</span>
                </button>
                <div className="status-bar">
                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '5px' }}>
                        {gameStatus === 'WIN' ? '🎉' : `Bài: ${currentScale?.name}`}
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>
                <button className={`btn-demo ${gameStatus === 'DEMO' ? 'active' : ''}`} disabled={gameStatus === 'DEMO'} onClick={playDemo}>
                    {gameStatus === 'DEMO' ? '⏹ Đang chạy' : '▶ Nghe Mẫu'}
                </button>
            </div>

            <div className="prompt-area">
                {gameStatus === 'WIN' ? (
                    <button className="btn-challenge" onClick={() => { setStepIndex(0); setGameStatus('PLAYING'); setShowConfetti(false); }}>Chơi Lại 🔄</button>
                ) : (
                    <div className="next-note-bubble" style={{ borderColor: gameStatus === 'DEMO' ? '#FFEB3B' : '#4D96FF' }}>
                        {gameStatus === 'DEMO' ? (
                            <>
                                Đang chạy mẫu...
                                <div className="finger-hint">Chú ý nút nhé!</div>
                            </>
                        ) : (
                            <>
                                Tiếp theo: <span className="next-note-target">{currentTarget.note?.replace(/[0-9]/, '')}</span>
                                <div className="finger-hint">Ngón số: <strong>{currentTarget.finger}</strong></div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="piano-scroll-container">
                <div className="piano-keyboard extended">
                    {/* Render Loading State if samples aren't ready? Optional, but good UX. For now, keys appear but maybe no sound immediately */}
                    {pianoKeys.map((k, i) => {
                        let fingerToDisplay = null;
                        let isCurrent = false;
                        let isFuture = false;

                        // LOGIC: DEMO MODE (Use demoIndex)
                        if (gameStatus === 'DEMO') {
                            const target = gameSequence.current[demoIndex];
                            // 1. Current Note
                            if (target && k.note === target.note) {
                                isCurrent = true;
                                fingerToDisplay = target.finger;
                            }
                            // 2. Future Notes (Roadmap) - RESTORED
                            else {
                                const futureStep = gameSequence.current.slice(demoIndex + 1).find(item => item.note === k.note);
                                if (futureStep) {
                                    isFuture = true;
                                    fingerToDisplay = futureStep.finger;
                                }
                            }
                        }
                        // LOGIC: PLAYING MODE (Use stepIndex)
                        else if (gameStatus === 'PLAYING') {
                            const target = gameSequence.current[stepIndex];
                            if (target && k.note === target.note) {
                                isCurrent = true;
                                fingerToDisplay = target.finger;
                            }
                            else {
                                const futureStep = gameSequence.current.slice(stepIndex + 1).find(item => item.note === k.note);
                                if (futureStep) {
                                    isFuture = true;
                                    fingerToDisplay = futureStep.finger;
                                }
                            }
                        }

                        return (
                            <KeyComponent
                                key={`${k.note}-${i}`}
                                k={k}
                                index={i}
                                isCurrent={isCurrent}
                                isFuture={isFuture}
                                finger={fingerToDisplay}
                                onPlay={handleNotePlay}
                                allKeys={pianoKeys}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

const KeyComponent = ({ k, index, isCurrent, isFuture, finger, onPlay, allKeys }) => {
    // REFACTOR: No absolute pixels for positions. We use Flexbox in parent, 
    // so keys just need relative width or flex-grow.
    // However, for correct piano spacing (black keys between white), we probably stick to absolute OR
    // use a grid system. 
    // Given the constraints, let's stick to the previous absolute logic BUT adapted to percentages or 
    // simply let the CSS handle the layout if rewritten.

    // BUT, the CSS for "extended" still expects absolute positioning for keys? 
    // We need to change the CSS method if we want perfect "fit to screen" without horizontal scroll.
    // The Quickest fix for "fit to screen" with 14 white keys is to use percentage based left positions.

    // 14 White keys total (C4...B4, C5...B5) -> 7 * 2 = 14 keys.
    const TOTAL_WHITE_KEYS = 14;
    const WHITE_WIDTH_PERCENT = 100 / TOTAL_WHITE_KEYS; // ~7.14%

    let whiteCount = 0;
    for (let i = 0; i < index; i++) {
        if (allKeys[i].type === 'white') whiteCount++;
    }

    const leftPosPercent = whiteCount * WHITE_WIDTH_PERCENT;

    // For Black Key: It sits on the border of (N) and (N+1) white key.
    // usually shifted roughly 2/3 of a white key width.
    // Width of black key is usually 2/3 of white key.
    // Let's approximate: Left = (whiteCount * W) - (BlackW / 2). 
    // But white keys are continuous. 
    // Correct visual logic: C# is between C and D. 
    // C is at index 0 (white). D is at index 1 (white).
    // so C# starts at approx (1 * W) - (BlackW/2).

    // Let's refine:
    // If Key is White: Left = whiteCount * WIDTH.
    // If Key is Black: It comes AFTER the white key 'whiteCount'. 
    // Wait, 'whiteCount' calculated above includes ALL previous keys.
    // If current is Black, it corresponds to the gap after the PREVIOUS white key.
    // So 'whiteCount' is exactly the number of white keys before this black key.
    // Position should be: (whiteCount * W) - (BlackW / 2).

    const showDot = isCurrent || isFuture;
    const dotClass = isCurrent ? 'current' : '';

    return (
        <button
            className={`key ${k.type} ${isCurrent ? 'active-hint' : ''}`}
            // Use inline style for position to support variable width
            style={{
                left: k.type === 'white' ? `${leftPosPercent}%` : `calc(${leftPosPercent}% - 2%)`,
                width: k.type === 'white' ? `${WHITE_WIDTH_PERCENT}%` : '4%', // Black key approx 4%
            }}
            // REMOVED onTouchStart default behavior that might slide. 
            // We keep onTouchStart but typically we want to prevent default if it causes scrolling.
            // "gạt tay" issue: if they drag across keys, we might WANT it to NOT play 
            // if the user says "tự chạy". Or maybe they mean it plays MULTIPLE times?
            // "Disabled glissando" usually means we strictly listen to DOWN events on specific keys.
            onMouseDown={(e) => { e.preventDefault(); onPlay(k.note); }}
            onTouchStart={(e) => { e.stopPropagation(); onPlay(k.note); }} // Stop propagation might help
        // No onTouchMove or onMouseEnter to prevent "swipe" playing
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

export default TouchGame;
