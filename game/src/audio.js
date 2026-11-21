// All sound is synthesised with WebAudio — no audio files. Guard footsteps get
// quieter and pan away with distance, which is how the thief hears a patrol
// coming around a corner. The context only starts after the first click or
// key press, as browsers require.

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  let alarmNodes = null;

  function ensureContext() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return false;
      ctx = new AudioCtor();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone({ type = 'sine', from = 440, to = null, seconds = 0.15, gain = 0.2, pan = 0, delay = 0 }) {
    if (!ensureContext()) return;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    if (to !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + seconds);
    amp.gain.setValueAtTime(gain, start);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    let node = amp;
    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      amp.connect(panner);
      node = panner;
    }
    osc.connect(amp);
    node.connect(master);
    osc.start(start);
    osc.stop(start + seconds + 0.02);
  }

  function noiseBurst({ seconds = 0.07, gain = 0.15, pan = 0, filterHz = 900 }) {
    if (!ensureContext()) return;
    const frames = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterHz;
    const amp = ctx.createGain();
    amp.gain.value = gain;
    source.connect(filter);
    filter.connect(amp);
    let node = amp;
    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      amp.connect(panner);
      node = panner;
    }
    node.connect(master);
    source.start();
  }

  return {
    unlock() {
      ensureContext();
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    isMuted() {
      return muted;
    },
    /** A guard's boot on marble: louder and centred as he nears the thief. */
    playGuardFootstep(distance, pan) {
      const closeness = Math.max(0, 1 - distance / 520);
      if (closeness <= 0.02) return;
      noiseBurst({ seconds: 0.06, gain: 0.05 + closeness * 0.22, pan, filterHz: 700 });
    },
    playPlayerFootstep() {
      noiseBurst({ seconds: 0.05, gain: 0.05, filterHz: 600 });
    },
    playPebbleClink() {
      tone({ type: 'sine', from: 2600, to: 1800, seconds: 0.12, gain: 0.22 });
      tone({ type: 'sine', from: 3400, to: 2400, seconds: 0.08, gain: 0.1, delay: 0.03 });
    },
    playSuspicionSting() {
      tone({ type: 'sawtooth', from: 392, seconds: 0.16, gain: 0.1 });
      tone({ type: 'sawtooth', from: 415, seconds: 0.16, gain: 0.1 });
    },
    playPearlChime() {
      [880, 1174, 1568].forEach((freq, i) => tone({ from: freq, seconds: 0.3, gain: 0.16, delay: i * 0.09 }));
    },
    playWinJingle() {
      [523, 659, 784, 1046].forEach((freq, i) => tone({ type: 'triangle', from: freq, seconds: 0.35, gain: 0.18, delay: i * 0.12 }));
    },
    playCaughtThud() {
      tone({ type: 'sine', from: 160, to: 45, seconds: 0.4, gain: 0.35 });
      noiseBurst({ seconds: 0.15, gain: 0.2, filterHz: 300 });
    },
    /** A low pulsing alarm while any guard is in full chase. */
    setAlarm(on) {
      if (on && !alarmNodes && ensureContext()) {
        const osc = ctx.createOscillator();
        const amp = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 196;
        amp.gain.value = 0.045;
        lfo.frequency.value = 2.2;
        lfoGain.gain.value = 0.03;
        lfo.connect(lfoGain);
        lfoGain.connect(amp.gain);
        osc.connect(amp);
        amp.connect(master);
        osc.start();
        lfo.start();
        alarmNodes = { osc, lfo };
      } else if (!on && alarmNodes) {
        alarmNodes.osc.stop();
        alarmNodes.lfo.stop();
        alarmNodes = null;
      }
    },
  };
}
