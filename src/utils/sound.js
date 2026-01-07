// Sound synthesis using Web Audio API to avoid external asset dependencies
export const playSound = (type) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    const playTone = (freq, duration, type = 'sine', startTime = 0) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

        gain.gain.setValueAtTime(0.1, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
    };

    switch (type) {
        case 'correct':
            // Major triad arpeggio (C-E-G) meaning success/happy
            playTone(523.25, 0.3, 'sine', 0);     // C5
            playTone(659.25, 0.3, 'sine', 0.1);   // E5
            playTone(783.99, 0.6, 'sine', 0.2);   // G5
            break;

        case 'wrong':
            // Low dissonant sound
            playTone(150, 0.4, 'sawtooth', 0);
            break;

        case 'click':
            playTone(800, 0.1, 'triangle', 0);
            break;

        case 'win':
            // Victory fanfare
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                playTone(freq, 0.4, 'square', i * 0.15);
            });
            break;

        default:
            break;
    }
};
