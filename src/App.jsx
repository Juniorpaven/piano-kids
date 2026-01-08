import React, { useState } from 'react';
import './App.css';
import MicGame from './MicGame';
import TouchGame from './TouchGame';
import './TouchGame.css';
import './MainMenu.css';

function App() {
  const [mode, setMode] = useState('HOME'); // HOME, MIC, TOUCH

  if (mode === 'MIC') {
    return <MicGame onBack={() => setMode('HOME')} />;
  }

  if (mode === 'TOUCH') {
    return <TouchGame onBack={() => setMode('HOME')} />;
  }

  return (
    <div className="app-main-menu">
      <h1 className="title-lg">Piano Kids 🎹</h1>
      <p className="subtitle-main">Chọn chế độ chơi nhé bé ơi!</p>

      <div className="mode-selection">
        <div className="mode-card" onClick={() => setMode('MIC')}>
          <div className="icon">🎤</div>
          <h2>Rừng Xanh</h2>
          <p>Dùng đàn thật hoặc hát</p>
        </div>

        <div className="mode-card" onClick={() => setMode('TOUCH')}>
          <div className="icon">📱</div>
          <h2>Đảo Kẹo Ngọt</h2>
          <p>Chơi trên màn hình</p>
        </div>
      </div>

      <div className="footer-deco">
        🐢 🦌 🐱 🐻 🐸
      </div>
    </div>
  );
}

export default App;
