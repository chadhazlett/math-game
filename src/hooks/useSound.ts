import { useCallback, useRef } from 'react';

// Web Audio API synth sounds — no files needed

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playCorrect() {
  playTone(523, 0.1, 'sine', 0.25);  // C5
  setTimeout(() => playTone(659, 0.1, 'sine', 0.25), 80);  // E5
  setTimeout(() => playTone(784, 0.15, 'sine', 0.25), 160); // G5
}

function playWrong() {
  playTone(200, 0.3, 'sawtooth', 0.15);
  setTimeout(() => playTone(180, 0.3, 'sawtooth', 0.12), 150);
}

function playStreak() {
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, 'sine', 0.2), i * 100);
  });
}

function playPersonalBest() {
  const notes = [523, 659, 784, 1047, 1319, 1568]; // ascending scale
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'triangle', 0.2), i * 120);
  });
}

export function useSound(enabled: boolean) {
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const play = useCallback((sound: 'correct' | 'wrong' | 'streak' | 'personalBest') => {
    if (!enabledRef.current) return;
    // Ensure audio context is resumed (Chrome autoplay policy)
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    switch (sound) {
      case 'correct': playCorrect(); break;
      case 'wrong': playWrong(); break;
      case 'streak': playStreak(); break;
      case 'personalBest': playPersonalBest(); break;
    }
  }, []);

  return play;
}
