import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import './MainMenu.css'; // Re-use main menu styles
import './TouchGame.css'; // Ensure glass-panel style is loaded for MicGame header
import ProgressBar from './components/ProgressBar';
import { playSound } from './utils/sound';
import Confetti from 'react-confetti';

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/models/pitch-detection/crepe/';

// DUPLICATE DATA for robust standalone component (or ideally move to shared file)
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
  const targetNote = currentScale.notes[stepIndex];
  const progress = (stepIndex / currentScale.notes.length) * 100;

  // PLAYING STATE RENDER
  return (
    <div className="app-main-menu" style={{ background: '#2E7D32', height: '100dvh', justifyContent: 'center' }}>
      {showConfetti && <Confetti recycle={false} numberOfPieces={300} />}

      <div className="glass-panel" style={{ width: '95%', margin: '0 auto', top: '10px', position: 'absolute', borderRadius: '15px' }}>
        <button className="btn-menu-back" onClick={() => setGameState('MENU')}>
          <span style={{ fontSize: '1.5rem' }}>🔙</span>
          <span>Chọn Bài</span>
        </button>
        <div style={{ flex: 1, textAlign: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
          Bài: {currentScale.name}
        </div>
        {/* Placeholder for symmetry or future button */}
        <div style={{ width: '60px' }}></div>
      </div>

      {/* Add padding-top to body container so content below doesn't hide behind glass panel */}
      <div style={{ marginTop: '80px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {gameState === 'WIN' ? (
          <div className="intro fade-in" style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '20px', padding: '20px', margin: '20px' }}>
            <h1 style={{ color: '#4CAF50' }}>🎉 THÀNH CÔNG! 🎉</h1>
            <p>Bé đã đánh tuyệt vời!</p>
            <button className="button-primary" onClick={() => setGameState('MENU')}>Chọn Bài Khác ➡️</button>
            <button className="button-primary" style={{ marginTop: '10px', background: '#2196F3' }} onClick={() => { setStepIndex(0); setGameState('LISTENING'); setShowConfetti(false); }}>Chơi Lại 🔄</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px', width: '100%' }}>

            {/* BIG TARGET DISPLAY */}
            <div style={{
              width: '200px', height: '200px', background: 'white', borderRadius: '50%',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: '8px solid #FFEB3B',
              animation: 'popIn 0.5s'
            }}>
              <span style={{ fontSize: '1.5rem', color: '#888' }}>Hãy đánh nốt:</span>
              <span style={{ fontSize: '5rem', fontWeight: 'bold', color: '#333' }}>{targetNote}</span>
            </div>

            {/* Detected Feedback */}
            <div style={{
              marginTop: '30px', padding: '10px 30px', background: 'rgba(0,0,0,0.5)',
              borderRadius: '30px', color: 'white', fontSize: '1.2rem'
            }}>
              Đàn của bé đang kêu: <strong style={{ color: '#4CAF50', fontSize: '1.5rem' }}>{detectedNote}</strong>
            </div>

            <div style={{ width: '80%', height: '20px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', marginTop: '30px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#8BC34A', transition: 'width 0.3s' }}></div>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '10px' }}>Dùng đàn Organ hoặc Piano thật bên ngoài nhé!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MicGame;
