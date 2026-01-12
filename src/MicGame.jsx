import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import './MainMenu.css'; // Re-use main menu styles
import './TouchGame.css'; // Ensure glass-panel style is loaded for MicGame header
import KeyComponent from './components/KeyComponent';
import ProgressBar from './components/ProgressBar';
import { playSound } from './utils/sound';
import Confetti from 'react-confetti';
import * as Tone from 'tone'; // Re-add Tone just in case
// Note: Removed MusicStaff import as requested to remove it

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/models/pitch-detection/crepe/';

// DUPLICATE DATA for robust standalone component (or ideally move to shared file)
// DUPLICATE DATA for robust standalone component (Verified correct order)
const SCALES = [
  {
    id: 'C_MAJOR', name: 'Đô Trưởng (C)', root: 'C', color: '#ef5350',
    notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']
  },
  {
    id: 'D_MAJOR', name: 'Rê Trưởng (D)', root: 'D', color: '#FFB74D',
    notes: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#', 'D']
  },
  {
    id: 'E_MAJOR', name: 'Mi Trưởng (E)', root: 'E', color: '#FFEE58',
    notes: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#', 'E']
  },
  {
    id: 'F_MAJOR', name: 'Fa Trưởng (F)', root: 'F', color: '#66BB6A',
    notes: ['F', 'G', 'A', 'A#', 'C', 'D', 'E', 'F']
  },
  {
    id: 'G_MAJOR', name: 'Son Trưởng (G)', root: 'G', color: '#42A5F5',
    notes: ['G', 'A', 'B', 'C', 'D', 'E', 'F#', 'G']
  },
  {
    id: 'A_MAJOR', name: 'La Trưởng (A)', root: 'A', color: '#AB47BC',
    notes: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#', 'A']
  },
  {
    id: 'B_MAJOR', name: 'Si Trưởng (B)', root: 'B', color: '#EC407A',
    notes: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#', 'B']
  },
];

const NOTES_FREQ = {
  'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 'E': 329.63, 'F': 349.23,
  'F#': 369.99, 'G': 392.00, 'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
  // We will check octaves roughly by modulo or range if needed, 
  // but for simple kid app, mapping nearest note name is enough.
};

function MicGame({ onBack }) {
  const [gameState, setGameState] = useState('MENU'); // MENU, LISTENING, WIN
  const [currentScale, setCurrentScale] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);

  const [status, setStatus] = useState('');
  const [detectedNote, setDetectedNote] = useState('-');
  const [showConfetti, setShowConfetti] = useState(false);

  // ORTENTATION LOGIC (Moved to top level to fix React Error #310)
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  const [forceRotate, setForceRotate] = useState(false);

  useEffect(() => {
    const checkOrientation = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // GENERATE KEYS (Copy from TouchGame for consistency C3-B4)
  const NOTES_CHROMATIC_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const pianoKeys = React.useMemo(() => {
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

  // Audio Refs
  const audioContextRef = useRef(null);
  const pitchRef = useRef(null);
  const isRunningRef = useRef(false);

  // Helpers
  const getNoteFromFreq = (frequency) => {
    if (!frequency) return null;
    // Simple finding nearest note
    // 1. Convert freq to MIDI note number: n = 69 + 12 * log2(f / 440)
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    const midi = Math.round(noteNum) + 69;

    // 2. Map MIDI to Note Name
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const noteIndex = midi % 12;
    const noteName = noteNames[noteIndex];
    return noteName; // Returns "C", "D#", etc. (ignores octave for simpler matching)
  };

  const startMic = async () => {
    if (isRunningRef.current) return;
    setStatus('Đang khởi động micro...');
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

      if (!window.ml5) throw new Error('ML5 not found');

      pitchRef.current = window.ml5.pitchDetection(MODEL_URL, audioContextRef.current, stream, () => {
        setStatus('Đã kết nối! Hãy chọn bài để chơi.');
        isRunningRef.current = true;
        detectLoop();
      });
    } catch (e) {
      console.error(e);
      setStatus('Lỗi: Cần Micro để chơi mode này!');
    }
  };

  const detectLoop = () => {
    if (!pitchRef.current) return;
    pitchRef.current.getPitch((err, frequency) => {
      if (frequency) {
        const note = getNoteFromFreq(frequency);
        setDetectedNote(note);
        // Check Logic handled in useEffect or here? 
        // Let's do it in a ref-based check to avoid closure staleness or use useEffect on detectedNote
      }
      if (isRunningRef.current) {
        pitchRef.current.getPitch(detectLoop);
      }
    });
  };

  useEffect(() => {
    startMic(); // Auto start mic on enter
    return () => { isRunningRef.current = false; };
  }, []);

  // Game Logic Checker
  useEffect(() => {
    if (gameState !== 'LISTENING' || !currentScale) return;

    const targetNote = currentScale.notes[stepIndex]; // e.g., "C"
    // Target might be "C", detected is "C". 
    // Ignore octave for kids ease (Organ might be C3, C4, C5...)

    if (detectedNote === targetNote) {
      // Correct!
      // Add small debounce or direct success? Direct is snappier for kids.
      handleCorrect();
    }
  }, [detectedNote, gameState, currentScale, stepIndex]);

  const handleCorrect = () => {
    // Prevent double trigger if react updates slow
    if (gameState !== 'LISTENING') return;

    playSound('correct');

    if (stepIndex >= currentScale.notes.length - 1) {
      setGameState('WIN');
      setShowConfetti(true);
      playSound('win');
    } else {
      setStepIndex(prev => prev + 1);
    }
  };

  const handleSelectScale = (scale) => {
    setCurrentScale(scale);
    setStepIndex(0);
    setGameState('LISTENING');
    setShowConfetti(false);
  };

  // RENDER
  if (gameState === 'MENU') {
    return (
      <div className="app-main-menu" style={{ height: '100dvh', justifyContent: 'flex-start' }}>
        <div className="header-panel">
          <button className="btn-small" onClick={onBack}>🏠</button>
          <div style={{ color: 'white' }}>{status}</div>
        </div>

        <h1 className="title-lg" style={{ fontSize: '2rem' }}>Thám Hiểm Rừng Xanh 🌳</h1>
        <p className="subtitle-main">Dùng đàn thật (Organ/Piano) của bạn để mở khóa các bài hát!</p>

        <div className="chord-grid">
          {SCALES.map(s => (
            <div key={s.id} className="chord-card" onClick={() => handleSelectScale(s)}>
              <div className="chord-title" style={{ background: s.color }}>{s.name}</div>
              <div className="chord-notes">Nhiệm vụ: {s.notes.join(' - ')}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // PLAYING STATE
  const targetNote = currentScale.notes[stepIndex];  // e.g. "C"

  // We need to map targetNote to a specific key? 
  // For simplicitly, let's say "C" maps to "C3" or "C4" based on the step logic?
  // Current Scale defines Notes like ["C", "D"...]. It doesn't define Octave strictly in the array for MicGame yet.
  // But visually, we should highlight ALL "C" keys or just one?
  // Let's highlight ALL matching notes for simplicity so kid can play any octave.

  // PLAYING STATE RENDER
  return (
    <div className={`touch-game-fullscreen ${forceRotate ? 'forced-landscape' : ''}`} style={{ background: '#2E7D32' }}>
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

      <div className="glass-panel" style={{
        top: 'max(20px, env(safe-area-inset-top))',
        paddingLeft: 'max(15px, env(safe-area-inset-left))',
        paddingRight: 'max(15px, env(safe-area-inset-right))'
      }}>
        <button className="btn-menu-back" onClick={() => setGameState('MENU')}>
          <span style={{ fontSize: '1.5rem' }}>🔙</span>
        </button>

        <div className="status-bar compacted">
          <div className="info-grid">
            <div className="info-row title-row">
              <span>Bài: {currentScale.name}</span>
            </div>
            <div className="info-row prompt-row">
              <span>Hãy đánh nốt:</span>
              <strong style={{ fontSize: '1.5rem', color: '#FFEB3B', marginLeft: '10px' }}>{targetNote}</strong>
              <span style={{ marginLeft: 'auto', fontSize: '0.9rem', color: '#aaa' }}>
                Nghe thấy: <span style={{ color: 'white', fontWeight: 'bold' }}>{detectedNote}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {gameState === 'WIN' ? (
        <div className="intro fade-in" style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '30px',
          textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 100
        }}>
          <h1 style={{ color: '#4CAF50', margin: '0 0 10px 0' }}>🎉 THÀNH CÔNG! 🎉</h1>
          <p style={{ fontSize: '1.2rem' }}>Bé đã hoàn thành bài nhạc!</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
            <button className="button-primary" onClick={() => setGameState('MENU')}>Chọn Bài Khác</button>
            <button className="button-primary" style={{ background: '#2196F3' }} onClick={() => { setStepIndex(0); setGameState('LISTENING'); setShowConfetti(false); }}>Chơi Lại</button>
          </div>
        </div>
      ) : (
        <div className="piano-scroll-container">
          <div className="piano-keyboard extended">
            {pianoKeys.map((k, i) => {
              // Highlight logic
              // 1. Is Limit Hint? (Target Note)
              // k.note is "C3". targetNote is "C". 
              // Check if k.note starts with targetNote and is followed by number
              // But beware C# matching C.
              const keyNoteName = k.note.replace(/[0-9]/g, '');
              const isTarget = keyNoteName === targetNote;

              // 2. Is Played/Detected?
              const isDetected = keyNoteName === detectedNote;

              return (
                <KeyComponent
                  key={`${k.note}-${i}`}
                  k={k}
                  index={i}
                  isCurrent={isTarget} // Show green dot on target
                  // Removed isPlayed blue highlight to reduce confusion
                  isFuture={false}
                  finger={isTarget ? '?' : null}
                  onPlay={() => { }}
                  allKeys={pianoKeys}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default MicGame;
