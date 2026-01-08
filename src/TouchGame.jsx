import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import Confetti from 'react-confetti';
import './TouchGame.css';

// Full Chromatic Data for generation
const NOTES_CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// All 7 Major Chords
const CHORDS_FULL = [
    { id: 'C_MAJOR', name: 'Đô Trưởng (C)', root: 'C', notes: ['C', 'E', 'G'], color: '#ef5350' },
    { id: 'D_MAJOR', name: 'Rê Trưởng (D)', root: 'D', notes: ['D', 'F#', 'A'], color: '#FFB74D' },
    { id: 'E_MAJOR', name: 'Mi Trưởng (E)', root: 'E', notes: ['E', 'G#', 'B'], color: '#FFEE58' },
    { id: 'F_MAJOR', name: 'Pha Trưởng (F)', root: 'F', notes: ['F', 'A', 'C'], color: '#66BB6A' },
    { id: 'G_MAJOR', name: 'Son Trưởng (G)', root: 'G', notes: ['G', 'B', 'D'], color: '#42A5F5' },
    { id: 'A_MAJOR', name: 'La Trưởng (A)', root: 'A', notes: ['A', 'C#', 'E'], color: '#AB47BC' },
    { id: 'B_MAJOR', name: 'Si Trưởng (B)', root: 'B', notes: ['B', 'D#', 'F#'], color: '#EC407A' },
];

function TouchGame({ onBack }) {
    const [synth, setSynth] = useState(null);
    const [coins, setCoins] = useState(() => parseInt(localStorage.getItem('pk_coins') || '0'));

    // Navigation State
    const [view, setView] = useState('SELECTION'); // SELECTION, PLAY
    const [handMode, setHandMode] = useState('RIGHT'); // RIGHT (Octave 4), LEFT (Octave 3)
    const [selectedChord, setSelectedChord] = useState(null);

    // Gameplay State
    const [activeKeys, setActiveKeys] = useState(new Set());
    const [showConfetti, setShowConfetti] = useState(false);
    const activeKeysRef = useRef(new Set());

    // Generate Keys based on Hand Mode (Octave 3 or 4)
    // We desire a range that covers the chord. C-Major is easy (C4-E4-G4). 
    // But B-Major (B-D#-F#) crosses octave if we start at C.
    // Ideally, display 1.5 Octaves or 14 keys starting from C. 
    const startOctave = handMode === 'RIGHT' ? 4 : 3;

    // Allow C to next E (approx 17 keys to cover most chords comfortably without horizontal scroll)
    // Or just typical C to C (13 keys).
    // Let's generate 14 key sequence (C to D next octave) to be safe for B major chords usually.
    const generateKeys = (octave) => {
        let keys = [];
        // First Octave
        NOTES_CHROMATIC.forEach(n => {
            const type = n.includes('#') ? 'black' : 'white';
            const name = type === 'white' ? n.replace(/[0-9]/g, '') : '';
            // VN names
            let vnName = name;
            if (name === 'C') vnName = 'Đô';
            if (name === 'D') vnName = 'Rê';
            if (name === 'E') vnName = 'Mi';
            if (name === 'F') vnName = 'Fa';
            if (name === 'G') vnName = 'Sol';
            if (name === 'A') vnName = 'La';
            if (name === 'B') vnName = 'Si';

            keys.push({ note: `${n}${octave}`, label: name, type, name: vnName });
        });
        // Add High C, C#, D, D# (next octave) to handle crossover chords or just high notes
        ['C', 'C#', 'D', 'D#', 'E'].forEach(n => {
            const type = n.includes('#') ? 'black' : 'white';
            keys.push({ note: `${n}${octave + 1}`, label: n, type, name: n.indexOf('#') < 0 ? n : '' });
        });
        return keys;
    };

    const pianoKeys = generateKeys(startOctave);

    // Initialize Audio
    useEffect(() => {
        const newSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 1 },
            maxPolyphony: 6
        }).toDestination();
        setSynth(newSynth);
        return () => newSynth.dispose();
    }, []);

    // ---------------
    // ACTIONS
    // ---------------
    const selectChord = (chord) => {
        // Map generic chord notes to specific octave
        // Example C Major: C, E, G -> C4, E4, G4.
        // B Major: B, D#, F# -> B4, D#5, F#5.
        // Logic: If note index < root index, it bumps to next octave? 
        // Simplified: Just mapped to the keys we generated.

        const rootIndex = NOTES_CHROMATIC.indexOf(chord.root); // e.g. B is 11

        const specificNotes = chord.notes.map(nName => {
            // Detect if this note is "lower" in chromatic scale than root, implying next octave?
            // Actually basic triad definition: Root, 3rd, 5th.
            // Is D# higher than B? No, D# is index 3, B is index 11. So D# is in next octave.
            const noteIndex = NOTES_CHROMATIC.indexOf(nName.replace('#', ''));
            const octaveOffset = noteIndex < rootIndex ? 1 : 0;
            return `${nName}${startOctave + octaveOffset}`;
        });

        setSelectedChord({ ...chord, targetNotes: specificNotes });
        setView('PLAY');
        setShowConfetti(false);
    };

    const playDemo = async () => {
        if (!selectedChord || Tone.context.state !== 'running') await Tone.start();
        const now = Tone.now();
        selectedChord.targetNotes.forEach((note, i) => {
            synth.triggerAttackRelease(note, "8n", now + i * 0.3);
        });
        synth.triggerAttackRelease(selectedChord.targetNotes, "2n", now + 1.2);
    };

    const checkChord = (currentKeys) => {
        if (!selectedChord) return;
        const allPressed = selectedChord.targetNotes.every(n => currentKeys.has(n));
        if (allPressed && !showConfetti) {
            setShowConfetti(true);
            // Play Win Sound
            if (synth) {
                const now = Tone.now();
                synth.triggerAttackRelease(selectedChord.targetNotes, "1n", now);
            }
        }
    };

    const handleNoteStart = async (note) => {
        if (Tone.context.state !== 'running') await Tone.start();
        if (synth) synth.triggerAttack(note);

        const newSet = new Set(activeKeysRef.current);
        newSet.add(note);
        activeKeysRef.current = newSet;
        setActiveKeys(new Set(newSet));
        checkChord(newSet);
    };

    const handleNoteStop = (note) => {
        if (synth) synth.triggerRelease(note);
        const newSet = new Set(activeKeysRef.current);
        newSet.delete(note);
        activeKeysRef.current = newSet;
        setActiveKeys(new Set(newSet));
    };

    // ---------------
    // RENDER
    // ---------------
    if (view === 'SELECTION') {
        return (
            <div className="app-container selection-screen" style={{ backgroundColor: '#E0F7FA', overflowY: 'auto' }}>
                <div className="header-panel">
                    <button className="btn-small" onClick={onBack}>🏠</button>
                    <h2>Chọn Bài Học</h2>
                    <div className="coin-display">🟡 {coins}</div>
                </div>

                {/* Hand Toggle */}
                <div className="hand-toggle">
                    <button
                        className={`hand-btn ${handMode === 'LEFT' ? 'active' : ''}`}
                        onClick={() => setHandMode('LEFT')}
                    >
                        🤚 Tay Trái
                    </button>
                    <button
                        className={`hand-btn ${handMode === 'RIGHT' ? 'active' : ''}`}
                        onClick={() => setHandMode('RIGHT')}
                    >
                        ✋ Tay Phải
                    </button>
                </div>

                <div className="chord-grid">
                    {CHORDS_FULL.map(chord => (
                        <div
                            key={chord.id}
                            className="chord-card"
                            style={{ borderColor: chord.color }}
                            onClick={() => selectChord(chord)}
                        >
                            <div className="chord-title" style={{ background: chord.color }}>{chord.name}</div>
                            <div className="chord-notes">{chord.notes.join(' - ')}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="app-container game-screen" style={{ backgroundColor: '#EFFFEE' }}>
            {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

            {/* Landscape Warning Overlay (CSS will handle visibility) */}
            <div className="landscape-warning">
                <h3>🔄 Xoay ngang điện thoại để chơi nhé!</h3>
            </div>

            <div className="header-panel">
                <button className="btn-small" onClick={() => setView('SELECTION')}>🔙 Chọn bài</button>
                <div className="target-badge" style={{ background: selectedChord.color }}>
                    {selectedChord.name} ({handMode === 'RIGHT' ? 'Phải' : 'Trái'})
                </div>
                <button className="btn-demo" onClick={playDemo}>▶ Nghe thử</button>
            </div>

            <div className="piano-scroll-container">
                <div className="piano-keyboard extended">
                    {pianoKeys.map((k, index) => {
                        const isActive = activeKeys.has(k.note);
                        const isHint = selectedChord?.targetNotes.includes(k.note);

                        // Calculate explicit CSS left position for perfect alignment
                        // White key width ~60px.
                        // We need to count how many white keys came strictly before this key
                        // To place it correctly. 
                        // This logic inside map is easier if we just pre-calced it, but dynamic is fine.

                        // Simple Logic: 
                        // If White: Position = (Count of Whites before) * WIDTH
                        // If Black: Position = (Count of Whites before) * WIDTH - (WIDTH/2) + Adjustment?
                        // Actually we can just rely on the 'left' style if we calculate it.

                        // Let's use a simpler "Render by Index" style or smart flex.
                        // But to match previous "Absolute" fix, we need precise Left props.

                        return (
                            <KeyComponent
                                key={k.note}
                                k={k}
                                index={index}
                                isActive={isActive}
                                isHint={isHint}
                                onDown={handleNoteStart}
                                onUp={handleNoteStop}
                                allKeys={pianoKeys}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Helper Subcomponent to handle positioning logic cleaner
const KeyComponent = ({ k, index, isActive, isHint, onDown, onUp, allKeys }) => {
    // Calculate Left Position
    // Count white keys before this one
    let whiteCount = 0;
    for (let i = 0; i < index; i++) {
        if (allKeys[i].type === 'white') whiteCount++;
    }

    // Base unit
    const WHITE_W = 60; // Slightly narrower to fit 17 keys

    let leftPos = 0;
    if (k.type === 'white') {
        leftPos = whiteCount * WHITE_W;
    } else {
        // Black key sits between prev white and next white
        // It shares the slot boundary.
        // Left = (whiteCount * WHITE_W) - (BLACK_W / 2)
        leftPos = (whiteCount * WHITE_W) - 18; // approx half of 36
    }

    return (
        <button
            className={`key ${k.type} ${isActive ? 'active' : ''} ${isHint ? 'hint blob' : ''}`}
            style={{ left: `${leftPos}px` }}
            onMouseDown={() => onDown(k.note)}
            onMouseUp={() => onUp(k.note)}
            onMouseLeave={() => onUp(k.note)}
            onTouchStart={(e) => { e.preventDefault(); onDown(k.note); }}
            onTouchEnd={(e) => { e.preventDefault(); onUp(k.note); }}
        >
            {isHint && <div className="dot"></div>}
            {k.type === 'white' && <span className="note-name">{k.name}</span>}
        </button>
    );
};

export default TouchGame;
