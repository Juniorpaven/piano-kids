
import React, { useState } from 'react';
import './App.css';
import MicGame from './MicGame';
import TouchGame from './TouchGame';
import ForestGame from './ForestGame';
import './TouchGame.css';
import './MainMenu.css';

function App() {
  const [view, setView] = useState('MENU'); // Changed state variable name from 'mode' to 'view' and initial state to 'MENU'

  if (view === 'MIC') {
    return <MicGame onBack={() => setView('MENU')} />;
  }

  if (view === 'TOUCH') {
    return <TouchGame onBack={() => setView('MENU')} />;
  }

  if (view === 'FOREST') { // Added ForestGame rendering condition
    return <ForestGame onBack={() => setView('MENU')} />;
  }

  return (
    <div className="app-main-menu">
      {/* LOGO */}
      <div className="logo-container">
        <h1 className="title-main">🎹 PIANO KIDS 🎵</h1>
        <p className="subtitle-main">Học mà chơi - Chơi mà học</p>
      </div>

      <div className="menu-grid">
        <div className="menu-card card-touch" onClick={() => setView('TOUCH')}>
          <div className="card-icon">👆</div>
          <h2>Đảo Kẹo Ngọt</h2>
          <p>Luyện ngón trên màn hình</p>
        </div>

        <div className="menu-card card-mic" onClick={() => setView('MIC')}>
          <div className="card-icon">🎤</div>
          <h2>Thám Hiểm (Mic)</h2>
          <p>Dùng đàn thật - Cơ bản</p>
        </div>

        <div className="menu-card card-forest" onClick={() => setView('FOREST')} style={{ background: 'linear-gradient(135deg, #66BB6A 0%, #33691E 100%)' }}>
          <div className="card-icon">🌲</div>
          <h2>Rừng Xanh</h2>
          <p>Luyện 2 tay (Nâng cao)</p>
        </div>
      </div>

      <div className="footer-info">
        <p>Phiên bản 3.0 - Hỗ trợ bởi Gemini</p>
      </div>
    </div>
  );
}

export default App;
