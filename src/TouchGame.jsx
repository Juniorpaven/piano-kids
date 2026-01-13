import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import Confetti from 'react-confetti';
import './TouchGame.css';
import './MainMenu.css';
import KeyComponent from './components/KeyComponent';

// --- DATA: SCALES & FINGERING (Verified) ---
// --- SONGS DATA (From Hotfix) ---
const SONGS = [
    { name: "Đàn Gà Con", notes: ["C4", "C4", "G4", "G4", "A4", "A4", "G4", "F4", "F4", "E4", "E4", "D4", "D4", "C4"] },
    { name: "Kìa Con Bướm Vàng", notes: ["C4", "D4", "E4", "C4", "C4", "D4", "E4", "C4", "E4", "F4", "G4", "E4", "F4", "G4"] },
    { name: "Happy Birthday", notes: ["C4", "C4", "D4", "C4", "F4", "E4", "C4", "C4", "D4", "C4", "G4", "F4"] },
    { name: "Twinkle Star", notes: ["C4", "C4", "G4", "G4", "A4", "A4", "G4", "F4", "F4", "E4", "E4", "D4", "D4", "C4"] },
    { name: "Jingle Bells", notes: ["E4", "E4", "E4", "E4", "E4", "E4", "E4", "G4", "C4", "D4", "E4"] }
];

const NOTES_CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function TouchGame({ onBack }) {
    const [synth, setSynth] = useState(null);
    const [coins, setCoins] = useState(() => parseInt(localStorage.getItem('pk_coins') || '0'));
    const [isLoaded, setIsLoaded] = useState(false);

    // View State
    const [view, setView] = useState('PLAY'); // Direct to play mode
    const [showMenu, setShowMenu] = useState(false);

    // Game State
    const [currentSong, setCurrentSong] = useState(null); // If null, "Free Play"
    const [stepIndex, setStepIndex] = useState(0);
    const [gameStatus, setGameStatus] = useState('PLAYING'); // PLAYING, WIN, DEMO
    const [showConfetti, setShowConfetti] = useState(false);
    const [demoIndex, setDemoIndex] = useState(-1);

    // Orientation
    const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
    useEffect(() => {
        const checkOrientation = () => setIsPortrait(window.innerHeight > window.innerWidth);
        window.addEventListener('resize', checkOrientation);
        return () => window.removeEventListener('resize', checkOrientation);
    }, []);

    // Generate Key Sequence for current song
    const gameSequence = React.useMemo(() => {
        if (!currentSong) return [];
        return currentSong.notes.map(n => ({ note: n, finger: '☝️' })); // Simplified finger for songs
    }, [currentSong]);

    // Reset when song changes
    useEffect(() => {
        setStepIndex(0);
        setGameStatus('PLAYING');
        setDemoIndex(-1);
    }, [currentSong]);

    // KEYBOARD GENERATION (C4 - B5 : 14 Keys)
    const pianoKeys = (() => {
        let keys = [];
        const octaves = [4, 5];
        octaves.forEach(oct => {
            NOTES_CHROMATIC.forEach(n => {
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
    })();

    // AUDIO INIT
    useEffect(() => {
        const sampler = new Tone.Sampler({
            urls: {
                "A0": "A0.mp3", "C1": "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3", "A1": "A1.mp3",
                "C2": "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3", "A2": "A2.mp3", "C3": "C3.mp3",
                "D#3": "Ds3.mp3", "F#3": "Fs3.mp3", "A3": "A3.mp3", "C4": "C4.mp3", "D#4": "Ds4.mp3",
                "F#4": "Fs4.mp3", "A4": "A4.mp3", "C5": "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3",
                "A5": "A5.mp3", "C6": "C6.mp3", "D#6": "Ds6.mp3", "F#6": "Fs6.mp3", "A6": "A6.mp3",
                "C7": "C7.mp3", "D#7": "Ds7.mp3", "F#7": "Fs7.mp3", "A7": "A7.mp3", "C8": "C8.mp3"
            },
            release: 1,
            baseUrl: "https://tonejs.github.io/audio/salamander/",
            onload: () => setIsLoaded(true)
        }).toDestination();
        setSynth(sampler);
        return () => sampler.dispose();
    }, []);

    const handleNotePlay = async (playedNote) => {
        if (gameStatus === 'DEMO') return;
        if (Tone.context.state !== 'running') await Tone.start();
        if (synth && isLoaded) synth.triggerAttackRelease(playedNote, "8n");

        if (currentSong && gameStatus === 'PLAYING') {
            const target = gameSequence[stepIndex];
            if (target && playedNote === target.note) {
                // Correct Note Logic
                updateCoins(1); // Standard point
                if (stepIndex >= gameSequence.length - 1) {
                    setGameStatus('WIN');
                    setShowConfetti(true);
                    updateCoins(10); // Bonus
                    setTimeout(() => playWinMelody(), 500);
                } else {
                    setStepIndex(prev => prev + 1);
                }
            }
        } else {
            // Free play points
            updateCoins(1);
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

    const playDemo = async () => {
        if (Tone.context.state !== 'running') await Tone.start();

        // Toggle Stop
        if (gameStatus === 'DEMO') {
            setGameStatus('PLAYING');
            setDemoIndex(-1);
            return;
        }

        // Pick Random Song if Free Mode
        let sequenceToPlay = gameSequence;
        let songName = currentSong?.name;

        if (!currentSong) {
            const rSong = SONGS[Math.floor(Math.random() * SONGS.length)];
            songName = rSong.name;
            sequenceToPlay = rSong.notes.map(n => ({ note: n }));
            // Just visual demo for random song in free mode? 
            // Logic complexity: Set Temp Song?
            // Let's just play sound.
        }

        setGameStatus('DEMO');
        setDemoIndex(-1);
        await new Promise(r => setTimeout(r, 100));

        const now = Tone.now();
        sequenceToPlay.forEach((item, i) => {
            const time = now + (i * 0.5);
            if (synth && isLoaded) synth.triggerAttackRelease(item.note, "8n", time);
            setTimeout(() => setDemoIndex(i), i * 500);
        });

        setTimeout(() => {
            setDemoIndex(-1);
            setGameStatus('PLAYING');
        }, sequenceToPlay.length * 500 + 500);
    };

    const handleSelectSong = (song) => {
        setCurrentSong(song);
        setShowMenu(false);
    };

    return (
        <div className="touch-game-fullscreen">
            {gameStatus === 'WIN' && <Confetti recycle={false} numberOfPieces={500} gravity={0.1} />}

            {/* Song Menu Overlay */}
            {showMenu && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ background: 'white', padding: 20, borderRadius: 20, width: '80%', maxWidth: 400 }}>
                        <h2 style={{ textAlign: 'center', color: '#E91E63' }}>🎵 Chọn Bài Hát</h2>
                        <ul style={{ listStyle: 'none', padding: 0, maxHeight: '50vh', overflowY: 'auto' }}>
                            <li style={{ padding: 15, background: '#eee', margin: 5, borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}
                                onClick={() => handleSelectSong(null)}>
                                🎹 Tự Do (Free Play)
                            </li>
                            {SONGS.map((s, i) => (
                                <li key={i}
                                    style={{ padding: 15, background: '#E3F2FD', margin: 5, borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}
                                    onClick={() => handleSelectSong(s)}>
                                    {i + 1}. {s.name}
                                </li>
                            ))}
                        </ul>
                        <button style={{ width: '100%', padding: 15, background: '#FF5252', color: 'white', border: 'none', borderRadius: 10, fontSize: '1.2rem' }}
                            onClick={() => setShowMenu(false)}>Đóng</button>
                    </div>
                </div>
            )}

            {/* Warning Overlay */}
            <div className="portrait-warning">
                <div className="rotate-icon">📱➡️</div>
                <h2>Vui lòng xoay ngang điện thoại!</h2>
            </div>

            {/* Main Game Container */}
            <div className="touch-game-container">
                {/* REWARD OVERLAY (Simple Win) */}
                {gameStatus === 'WIN' && (
                    <div className="sticker-popup-overlay">
                        <div className="popup-content-box">
                            <h2>Xuất sắc! 🎉</h2>
                            <p>Bé đã hoàn thành bài: {currentSong?.name}</p>
                            <button className="btn-collect-reward" onClick={() => { setStepIndex(0); setGameStatus('PLAYING'); setShowConfetti(false); }}>
                                Chơi Lại
                            </button>
                        </div>
                    </div>
                )}

                {/* HUD / Toolbar */}
                <div className="glass-panel">
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn-menu-back" onClick={onBack}>🏠</button>
                        <div style={{ background: 'white', padding: '5px 15px', borderRadius: 15, fontWeight: 'bold', color: '#E91E63', display: 'flex', alignItems: 'center' }}>
                            🍬 {coins}
                        </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', color: 'white', fontSize: '1.2rem' }}>
                        {currentSong ? `Đang tập: ${currentSong.name}` : "Chế độ: Tự Do"}
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn-demo" style={{ background: '#29B6F6' }} onClick={() => setShowMenu(true)}>
                            🎵 Chọn Bài
                        </button>
                        <button className={`btn-demo ${gameStatus === 'DEMO' ? 'active' : ''}`} onClick={playDemo}>
                            {gameStatus === 'DEMO' ? '⏹' : '▶ Nghe Thử'}
                        </button>
                    </div>
                </div>

                <div className="piano-scroll-container">
                    <div className="piano-keyboard extended" style={{ background: 'transparent' }}>
                        {pianoKeys.map((k, i) => {
                            let fingerToDisplay = null;
                            let isCurrent = false;

                            // Logic for Hints
                            if (gameStatus === 'DEMO') {
                                // In Demo, highlight based on demoIndex
                                // Complex: The demo logic above runs on gameSequence (if Song selected) or temp sequence.
                                // Simplification: Just highlight if note matches?
                                // For robust UI: Check if note matches active demo note.
                                // We need a way to track accurate active note in Demo.
                                // Let's simplify: If currentSong exists, demoIndex tracks it.
                                if (currentSong && demoIndex !== -1 && gameSequence[demoIndex].note === k.note) {
                                    isCurrent = true;
                                }
                            } else if (currentSong) {
                                // In Guide Mode
                                if (gameSequence[stepIndex] && gameSequence[stepIndex].note === k.note) {
                                    isCurrent = true;
                                }
                            }

                            return (
                                <KeyComponent
                                    key={`${k.note}-${i}`}
                                    k={k}
                                    index={i}
                                    isCurrent={isCurrent}
                                    isFuture={false}
                                    finger={null}
                                    onPlay={handleNotePlay}
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

export default TouchGame;
