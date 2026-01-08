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

    const [view, setView] = useState('SELECTION');
    const [handMode, setHandMode] = useState('RIGHT');
    const [currentScale, setCurrentScale] = useState(null);
    const [stepIndex, setStepIndex] = useState(0);
    const [gameStatus, setGameStatus] = useState('PLAYING'); // PLAYING, WIN, DEMO
    const [showConfetti, setShowConfetti] = useState(false);

    // New State for Demo Visuals
    const [demoIndex, setDemoIndex] = useState(-1);

    const gameSequence = useRef([]);

    // Generate EXTRA WIDE KEYS to fill all screens (C3 to C8)
    const pianoKeys = (() => {
        let keys = [];
        const octaves = [3, 4, 5, 6, 7]; // 5 Octaves!
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
        // Top C8
        keys.push({ note: 'C8', type: 'white', label: 'Đô' });
        return keys;
    })();

    useEffect(() => {
        const reliableSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 1 }
        }).toDestination();
        setSynth(reliableSynth);
        return () => reliableSynth.dispose();
    }, []);

    const getGameSequence = () => {
        if (!currentScale) return [];
        const baseOctave = handMode === 'RIGHT' ? 4 : 3;
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
        if (synth) synth.triggerAttackRelease(playedNote, "8n");

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
        if (!synth) return;
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
            synth.triggerAttackRelease(item.note, "8n", now + i * 0.5);

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
        <div className="touch-game-fullscreen">
            {showConfetti && <Confetti recycle={false} numberOfPieces={300} />}

            <div className="portrait-warning">
                <div className="rotate-icon">📱➡️</div>
                <h2>Vui lòng xoay ngang điện thoại!</h2>
                <p>Ứng dụng hoạt động tốt nhất ở chế độ ngang.</p>
            </div>

            <div className="glass-panel">
                <button className="btn-small" onClick={() => setView('SELECTION')}>🔙 Menu</button>
                <div className="status-bar">
                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                        {gameStatus === 'WIN' ? '🎉 HOÀN THÀNH XUẤT SẮC! +5 SAO' : `Bài: ${currentScale?.name} (${handMode === 'RIGHT' ? 'Tay Phải' : 'Tay Trái'})`}
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>
                <button className="btn-demo" disabled={gameStatus === 'DEMO'} onClick={playDemo}>
                    {gameStatus === 'DEMO' ? '▶ Đang chạy...' : '▶ Nghe Mẫu'}
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
                                Tiếp theo: <span style={{ color: '#4CAF50', fontSize: '1.5rem' }}>{currentTarget.note?.replace(/[0-9]/, '')}</span>
                                <div className="finger-hint">Ngón số: <strong>{currentTarget.finger}</strong></div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="piano-scroll-container">
                <div className="piano-keyboard extended">
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
    let whiteCount = 0;
    for (let i = 0; i < index; i++) {
        if (allKeys[i].type === 'white') whiteCount++;
    }
    const WHITE_W = 60; // Match CSS
    let leftPos = k.type === 'white' ? whiteCount * WHITE_W : (whiteCount * WHITE_W) - 20;

    const showDot = isCurrent || isFuture;
    const dotClass = isCurrent ? 'current' : '';

    return (
        <button
            className={`key ${k.type} ${isCurrent ? 'active-hint' : ''}`}
            style={{ left: `${leftPos}px` }}
            onMouseDown={() => onPlay(k.note)}
            onTouchStart={(e) => { e.preventDefault(); onPlay(k.note); }}
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
