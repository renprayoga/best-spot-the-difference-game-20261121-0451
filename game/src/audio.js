// audio.js — every sound is synthesised with WebAudio: no audio files,
// no network, nothing to load. Sounds are short by design so they never
// overlap into noise. Muted state survives a page reload.
const MUTE_KEY = 'twilight-market-muted-v1';

function tone(ctx, { freq, at, dur, type, vol, slideTo }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + at);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + at + dur);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
  gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + at);
  osc.stop(ctx.currentTime + at + dur + 0.05);
}

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    try { this.muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { /* private mode */ }
  }

  // Browsers only let audio start after a user gesture; call this from
  // the first click/keypress and every sound after it just works.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    } catch { this.ctx = null; }
  }

  toggleMute() {
    this.muted = !this.muted;
    try { localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0'); } catch { /* ignore */ }
    return this.muted;
  }

  play(name) {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const t = (o) => tone(this.ctx, o);
    switch (name) {
      case 'find': // bright two-note chime, the reward for a find
        t({ freq: 659.25, at: 0, dur: 0.16, type: 'sine', vol: 0.22 });
        t({ freq: 987.77, at: 0.09, dur: 0.28, type: 'sine', vol: 0.22 });
        break;
      case 'wrong': // low dull buzz, clearly different from a find
        t({ freq: 130, at: 0, dur: 0.18, type: 'sawtooth', vol: 0.10, slideTo: 90 });
        break;
      case 'hint': // soft rising blip
        t({ freq: 440, at: 0, dur: 0.12, type: 'triangle', vol: 0.14, slideTo: 660 });
        break;
      case 'click': // tiny tick for buttons
        t({ freq: 880, at: 0, dur: 0.05, type: 'square', vol: 0.05 });
        break;
      case 'tick': // last-ten-seconds heartbeat
        t({ freq: 1046.5, at: 0, dur: 0.06, type: 'sine', vol: 0.12 });
        break;
      case 'levelWin': // little fanfare
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
          t({ freq: f, at: i * 0.11, dur: 0.22, type: 'triangle', vol: 0.18 }));
        break;
      case 'gameWin': // longer fanfare for finishing all three scenes
        [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) =>
          t({ freq: f, at: i * 0.12, dur: 0.26, type: 'triangle', vol: 0.18 }));
        break;
      case 'gameOver': // falling notes
        [392, 329.63, 261.63].forEach((f, i) =>
          t({ freq: f, at: i * 0.16, dur: 0.3, type: 'sine', vol: 0.16 }));
        break;
      default: break;
    }
  }
}
