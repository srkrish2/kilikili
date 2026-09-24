// Tiny synthesized sound effects, so there are no audio files to ship.

let ctx: AudioContext | null = null;

function tone(freqs: number[], { dur = 0.12, type = 'sine' as OscillatorType, gain = 0.15 } = {}) {
  try {
    ctx ??= new AudioContext();
    const t0 = ctx.currentTime;
    freqs.forEach((f, i) => {
      const osc = ctx!.createOscillator();
      const g = ctx!.createGain();
      osc.type = type;
      osc.frequency.value = f;
      const start = t0 + i * dur;
      g.gain.setValueAtTime(gain, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + dur * 1.6);
      osc.connect(g).connect(ctx!.destination);
      osc.start(start);
      osc.stop(start + dur * 1.7);
    });
  } catch {
    // No audio available; effects are optional.
  }
}

export const sfx = {
  correct: () => tone([660, 880]),
  wrong: () => tone([220, 180], { type: 'triangle', dur: 0.14 }),
  pop: () => tone([520 + Math.random() * 200], { dur: 0.06, type: 'square', gain: 0.06 }),
  tap: () => tone([440], { dur: 0.05, gain: 0.05 }),
  win: () => tone([523, 659, 784, 1047], { dur: 0.13 }),
};
