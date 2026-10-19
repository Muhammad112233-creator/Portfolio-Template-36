/**
 * audio.js — 100% procedural sound design with the Web Audio API.
 * No audio files at all: a synth pad for ambience, filtered
 * noise for wind during the dive, and a two-oscillator engine
 * that follows the scooter's speed. Toggle in the header.
 */

export function createAudio() {
  let ctx = null;
  let master = null;
  let engine, engineFilter, engineGain;
  let wind, windFilter, windGain;
  let padGain;
  let enabled = true;
  let started = false;

  function buildGraph() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0; // faded in after start
    master.connect(ctx.destination);

    /* ---- engine: detuned saws through a lowpass ---- */
    engineGain = ctx.createGain();
    engineGain.gain.value = 0;
    engineFilter = ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 320;
    engineGain.connect(engineFilter).connect(master);
    engine = [0, 7].map((detune) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = 55;
      o.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = 0.5;
      o.connect(g).connect(engineGain);
      o.start();
      return o;
    });

    /* ---- wind: looped noise through a bandpass ---- */
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    wind = ctx.createBufferSource();
    wind.buffer = buf;
    wind.loop = true;
    windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 480;
    windFilter.Q.value = 0.6;
    windGain = ctx.createGain();
    windGain.gain.value = 0;
    wind.connect(windFilter).connect(windGain).connect(master);
    wind.start();

    /* ---- ambient pad: slow warm chord, gently beating ---- */
    padGain = ctx.createGain();
    padGain.gain.value = 0.05;
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 900;
    padGain.connect(padFilter).connect(master);
    [[110, 0.5], [164.81, 0.34], [220, 0.28], [277.18, 0.2], [110.9, 0.3]].forEach(([f, v], i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 ? 'triangle' : 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = v;
      // slow LFO on each voice for movement
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.017;
      const lg = ctx.createGain();
      lg.gain.value = v * 0.4;
      lfo.connect(lg).connect(g.gain);
      lfo.start();
      o.connect(g).connect(padGain);
      o.start();
    });
  }

  return {
    /** must be called from a user gesture (the START button) */
    start() {
      if (!ctx) buildGraph();
      if (ctx.state === 'suspended') ctx.resume();
      started = true;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(enabled ? 0.9 : 0, ctx.currentTime + 1.6);
    },
    setEnabled(on) {
      enabled = on;
      if (!ctx || !started) return;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(on ? 0.9 : 0, ctx.currentTime + 0.4);
    },
    isEnabled: () => enabled,
    /**
     * p: scroll progress · vel: smoothed scroll velocity 0..1
     */
    update(p, vel) {
      if (!ctx || !started || !enabled) return;
      const t = ctx.currentTime;
      const riding = p > 0.215 && p < 0.965;
      const diving = p > 0.01 && p < 0.245;

      // engine follows speed, with a soft idle
      const target = riding ? 0.05 + vel * 0.12 : 0;
      engineGain.gain.setTargetAtTime(target, t, 0.15);
      const rpm = 42 + vel * 130 + (riding ? 18 : 0);
      engine.forEach((o, i) => o.frequency.setTargetAtTime(rpm * (i ? 1.5 : 1), t, 0.1));
      engineFilter.frequency.setTargetAtTime(240 + vel * 900, t, 0.2);

      // wind rushes during the dive, whispers while riding fast
      const windTarget = diving
        ? 0.02 + (p / 0.245) * vel * 0.5 + (p / 0.245) * 0.04
        : riding ? vel * 0.08 : 0;
      windGain.gain.setTargetAtTime(windTarget, t, 0.25);
      windFilter.frequency.setTargetAtTime(380 + vel * 2400, t, 0.3);

      // pad: fuller at the emotional golden hour, hushed at night
      const pad = 0.55 + Math.sin(p * Math.PI) * 0.3;
      padGain.gain.setTargetAtTime(0.038 * pad + (p > 0.76 && p < 0.9 ? 0.02 : 0), t, 0.5);
    },
  };
}
