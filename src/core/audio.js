/**
 * 音訊引擎。
 * - 由「開始」按鈕解鎖（使用者手勢）。
 * - 所有聲音與畫面共用 AudioContext.currentTime 這一個時間基準。
 * - 三種音色：rehearsal（排練短音）、solo（逐音接唱）、chorus（最後一句合唱）。
 * - 預設全部合成音；設定檔把 useSamples 改成 true 之後會改用人聲錄音。
 */

export class AudioEngine {
  constructor(config) {
    this.config = config;
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.active = new Set();
    this.buffers = new Map();
    this.samplesReady = false;
  }

  get unlocked() {
    return Boolean(this.ctx);
  }

  get time() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  get suspended() {
    return Boolean(this.ctx) && this.ctx.state !== 'running';
  }

  async unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return false;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.config.masterVolume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state !== 'running') {
      try { await this.ctx.resume(); } catch { /* 使用者稍後可再按 */ }
    }
    if (this.config.useSamples && !this.samplesReady) await this.loadSamples();
    return this.ctx.state === 'running';
  }

  /** 只有在設定開啟時才嘗試載入人聲檔，缺檔時安靜退回合成音 */
  async loadSamples() {
    this.samplesReady = true;
    const base = this.config.sampleBasePath;
    const jobs = Object.entries(this.config.samples).map(async ([key, file]) => {
      try {
        const res = await fetch(base + file);
        if (!res.ok) return;
        const data = await res.arrayBuffer();
        this.buffers.set(key, await this.ctx.decodeAudioData(data));
      } catch { /* 缺檔或解碼失敗：使用合成音 */ }
    });
    await Promise.all(jobs);
  }

  setMuted(muted) {
    this.muted = muted;
    if (!this.master) return;
    const t = this.time;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(muted ? 0 : this.config.masterVolume, t, 0.03);
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') return this.ctx.suspend();
    return Promise.resolve();
  }

  resume() {
    if (this.ctx && this.ctx.state !== 'running') return this.ctx.resume();
    return Promise.resolve();
  }

  /**
   * 排一個音。start 必須是 AudioContext 時間。
   * @returns {{endTime:number, stop:(t:number)=>void}|null}
   */
  note({ freq, noteName, start, dur, kind = 'solo', gain = 1 }) {
    if (!this.ctx) return null;
    this.prune();
    const sample = this.buffers.get(`${kind}.${noteName}`);
    const rec = sample
      ? this.playSample(sample, start, dur, gain)
      : this.playSynth(freq, start, dur, kind, gain);
    if (rec) this.active.add(rec);
    return rec;
  }

  playSample(buffer, start, dur, gain) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    const release = 0.35;
    const tail = Math.min(dur, buffer.duration);
    g.gain.setValueAtTime(gain, start);
    g.gain.setValueAtTime(gain, start + Math.max(0.05, tail - release));
    g.gain.exponentialRampToValueAtTime(0.0001, start + tail + release);
    src.connect(g);
    g.connect(this.master);
    src.start(start);
    src.stop(start + tail + release + 0.05);
    const endTime = start + tail + release + 0.1;
    return {
      endTime,
      stop: (t) => {
        try {
          g.gain.cancelScheduledValues(t);
          g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
          src.stop(t + 0.08);
        } catch { /* 已經停了 */ }
      },
    };
  }

  playSynth(freq, start, dur, kind, gain) {
    const ctx = this.ctx;
    const spread = kind === 'chorus'
      ? [-12, -5, 0, 6, 13]
      : (kind === 'rehearsal' ? [0] : [-3, 3]);
    const attack = kind === 'rehearsal' ? 0.03 : 0.055;
    const release = kind === 'chorus' ? 1.1 : (kind === 'rehearsal' ? 0.18 : 0.32);
    const peak = (kind === 'chorus' ? 0.52 : 0.6) * gain / Math.sqrt(spread.length);

    const bus = ctx.createGain();
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = kind === 'rehearsal' ? 1900 : 1550;
    low.Q.value = 0.7;
    const formant = ctx.createBiquadFilter();
    formant.type = 'peaking';
    formant.frequency.value = 760;
    formant.Q.value = 1.3;
    formant.gain.value = 6;

    bus.connect(low);
    low.connect(formant);
    formant.connect(this.master);

    const g = bus.gain;
    const hold = Math.max(attack + 0.02, dur);
    g.setValueAtTime(0.0001, start);
    g.exponentialRampToValueAtTime(peak, start + attack);
    g.exponentialRampToValueAtTime(peak * 0.74, start + Math.min(hold, attack + 0.3));
    g.setValueAtTime(peak * 0.74, start + hold);
    g.exponentialRampToValueAtTime(0.0001, start + hold + release);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = kind === 'chorus' ? 4.5 : 5.3;
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0, start);
    lfoGain.gain.linearRampToValueAtTime(
      kind === 'chorus' ? 11 : 7,
      start + Math.min(0.5, hold * 0.6),
    );
    lfo.connect(lfoGain);

    const stopAt = start + hold + release + 0.1;
    const oscs = spread.map((cents) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.detune.value = cents;
      lfoGain.connect(o.detune);
      o.connect(bus);
      o.start(start);
      o.stop(stopAt);
      return o;
    });
    lfo.start(start);
    lfo.stop(stopAt);

    return {
      endTime: stopAt,
      stop: (t) => {
        try {
          g.cancelScheduledValues(t);
          g.setValueAtTime(Math.max(g.value, 0.0001), t);
          g.exponentialRampToValueAtTime(0.0001, t + 0.06);
        } catch { /* 忽略 */ }
        for (const o of oscs) { try { o.stop(t + 0.08); } catch { /* 忽略 */ } }
        try { lfo.stop(t + 0.08); } catch { /* 忽略 */ }
      },
    };
  }

  prune() {
    const now = this.time;
    for (const rec of this.active) if (rec.endTime < now) this.active.delete(rec);
  }

  /** 重播、跳關、重開時清掉所有排好的聲音 */
  stopAll() {
    if (!this.ctx) return;
    const t = this.time;
    for (const rec of this.active) rec.stop(t);
    this.active.clear();
  }
}
