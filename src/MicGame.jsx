import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Character from './components/Character';
import ProgressBar from './components/ProgressBar';
import { playSound } from './utils/sound';

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/models/pitch-detection/crepe/';

const CHARACTERS = [
  { id: 'C', name: 'Rùa Đô', note: 'C', emoji: '🐢', color: '#FF5E5B', freqRange: [250, 275] },
  { id: 'D', name: 'Nai Rê', note: 'D', emoji: '🦌', color: '#FFB347', freqRange: [280, 310] },
  { id: 'E', name: 'Mèo Mi', note: 'E', emoji: '🐱', color: '#FFD93D', freqRange: [320, 340] },
  { id: 'F', name: 'Ếch Pha', note: 'F', emoji: '🐸', color: '#6BCB77', freqRange: [340, 360] },
  { id: 'G', name: 'Gấu Son', note: 'G', emoji: '🐻', color: '#4D96FF', freqRange: [380, 410] },
];

function MicGame({ onBack }) {
  const [gameState, setGameState] = useState('MENU'); // MENU, PLAY, WIN
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // Game Logic
  const [currentNote, setCurrentNote] = useState('-');
  const [targetCharId, setTargetCharId] = useState(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);

  // Audio Refs
  const audioContextRef = useRef(null);
  const pitchRef = useRef(null);
  const isRunningRef = useRef(false);

  // Helper to get note from freq
  const getNote = (frequency) => {
    if (!frequency) return null;
    return CHARACTERS.find(char =>
      frequency >= char.freqRange[0] && frequency <= char.freqRange[1]
    );
  };

  // -------------------------
  // 1. Audio Engine Initialization
  // -------------------------
  const startAudioEngine = async () => {
    if (isRunningRef.current) return;
    setLoading(true);
    setStatus('Đang khởi động tai nghe...');

    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

      setStatus('Đang tải mô hình Brain (AI)...');

      if (!window.ml5) {
        throw new Error('ml5 not loaded');
      }

      pitchRef.current = window.ml5.pitchDetection(
        MODEL_URL,
        audioContextRef.current,
        stream,
        () => {
          setStatus('Sẵn sàng!');
          setLoading(false);
          isRunningRef.current = true;
          detectPitch();
          startGameLoop();
        }
      );
    } catch (err) {
      console.error(err);
      setStatus('Lỗi: Cần cho phép dùng Micro để chơi!');
      setLoading(false);
    }
  };

  // -------------------------
  // 2. Pitch Detection Loop
  // -------------------------
  const detectPitch = () => {
    if (!pitchRef.current) return;

    pitchRef.current.getPitch((err, frequency) => {
      if (frequency) {
        const char = getNote(frequency);
        if (char) {
          setCurrentNote(char.id);
          checkAnswer(char.id);
        } else {
          // Optional: Debounce clearing note to avoid flickering
          // setCurrentNote('-'); 
        }
      }
      if (gameState !== 'WIN') {
        pitchRef.current.getPitch(detectPitch); // Recursion style for ml5
      }
    });
  };

  // -------------------------
  // 3. Game Logic (Practice Mode)
  // -------------------------
  const [lastAnswerTime, setLastAnswerTime] = useState(0);

  const startGameLoop = () => {
    setGameState('PLAY');
    setScore(0);
    pickNewTarget();
  };

  const pickNewTarget = () => {
    const randomChar = CHARACTERS[Math.floor(Math.random() * 3)]; // Start with C, D, E only first
    setTargetCharId(randomChar.id);
    // Play sound prompt?
  };

  const checkAnswer = (detectedNoteId) => {
    // Debounce: prevent rapid firing
    const now = Date.now();
    if (now - lastAnswerTime < 1000) return;

    if (detectedNoteId === targetCharId) {
      // Correct!
      setLastAnswerTime(now);
      handleCorrectAnswer();
    }
  };

  const handleCorrectAnswer = () => {
    playSound('correct');
    setScore(prev => prev + 1);
    setCombo(prev => prev + 1);

    // Slight delay before next target so they can see the animation
    setTimeout(() => {
      if (score + 1 >= 10) {
        setGameState('WIN');
        playSound('win');
      } else {
        pickNewTarget();
      }
    }, 1500);
  };

  // -------------------------
  // UI Rendering
  // -------------------------
  return (
    <div className="app-container">
      {gameState === 'MENU' && (
        <div className="intro fade-in">
          <h1 className="title">Piano Kids 🎹</h1>
          <p className="subtitle">Giúp các bạn thú tìm kẹo bằng tiếng đàn nhé!</p>

          <div className="preview-chars">
            <span style={{ fontSize: '3rem' }}>🐢 🦌 🐱</span>
          </div>

          <button
            className="button-primary"
            onClick={startAudioEngine}
            disabled={loading}
          >
            {loading ? 'Đang tải...' : 'Bắt đầu chơi ▶'}
          </button>

          <p className="status-text">{status}</p>

          <button className="btn-back-main" onClick={onBack} style={{ marginTop: '20px', background: 'transparent', border: 'none', color: '#666', textDecoration: 'underline', cursor: 'pointer' }}>
            ⬅ Quay lại chọn chế độ
          </button>
        </div>
      )}

      {gameState === 'PLAY' && (
        <div className="game-area fade-in">
          <div className="header-panel">
            <button className="btn-small" onClick={() => {
              setGameState('MENU');
              if (onBack) onBack();
            }}>🏠</button>
            <ProgressBar progress={score} max={10} />
          </div>

          <div className="main-stage">
            <h2 className="instruction">
              Hãy đánh nốt: <span style={{ color: CHARACTERS.find(c => c.id === targetCharId)?.color, fontSize: '2.5rem' }}>
                {CHARACTERS.find(c => c.id === targetCharId)?.name}
              </span>
            </h2>

            <div className="characters-row">
              {CHARACTERS.slice(0, 3).map(char => (
                <Character
                  key={char.id}
                  {...char}
                  isActive={currentNote === char.id}
                  isTarget={targetCharId === char.id}
                />
              ))}
            </div>
          </div>

          <div className="feedback-area">
            Bạn đang chơi: <b>{currentNote === '-' ? '...' : currentNote}</b>
          </div>
        </div>
      )}

      {gameState === 'WIN' && (
        <div className="intro fade-in">
          <h1>🎉 CHÚC MỪNG! 🎉</h1>
          <p style={{ fontSize: '5rem' }}>🏆</p>
          <p>Bé đã giải cứu được tất cả các bạn!</p>
          <button className="button-primary" onClick={() => startGameLoop()}>
            Chơi lại 🔄
          </button>
        </div>
      )}
    </div>
  );
}

export default MicGame;
