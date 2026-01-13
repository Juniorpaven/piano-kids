
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

  if (view === 'FOREST') {
    return <ForestGame onBack={() => setView('MENU')} />;
  }

  return (
    <div className="app-home">
      {/* BACKGROUND ACCENT */}
      <div className="home-bg-glow"></div>

      {/* HEADER */}
      <div className="home-header">
        <button className="icon-btn">🔒</button>
        <button className="icon-btn">🔊</button>
      </div>

      {/* HERO SECTION */}
      <div className="hero-container">
        <h1 className="app-logo-text">Piano Kids!</h1>
        <div className="hero-image-frame">
          <img src="/home-cat.png" alt="Cute Cat Piano" className="hero-img" />
        </div>
      </div>

      {/* JELLY PLAY BUTTON */}
      <div className="play-btn-container">
        <button className="btn-jelly-lg" onClick={() => setView('TOUCH')}>
          ▶ PLAY
        </button>
      </div>

      {/* FOOTER MENU */}
      <div className="footer-menu">
        <button className="menu-item" onClick={() => setView('MIC')}>
          <div className="menu-icon-box" style={{ background: '#4FC3F7', boxShadow: '0 4px 0 #0288D1' }}>🎤</div>
          <span style={{ fontWeight: 'bold', color: 'white' }}>Thám Hiểm</span>
        </button>

        <button className="menu-item active" onClick={() => setView('TOUCH')}>
          <div className="menu-icon-box" style={{ background: '#EC407A', boxShadow: '0 4px 0 #C2185B' }}>🎹</div>
          <span style={{ fontWeight: 'bold', color: 'white' }}>Đảo Kẹo</span>
        </button>

        <button className="menu-item" onClick={() => setView('FOREST')}>
          <div className="menu-icon-box" style={{ background: '#66BB6A', boxShadow: '0 4px 0 #388E3C' }}>🌲</div>
          <span style={{ fontWeight: 'bold', color: 'white' }}>Rừng Xanh</span>
        </button>
      </div>
    </div>
  );
}

export default App;
