/**
 * 共用時間軸。
 * 事件時間用 AudioContext.currentTime 表示，所以聲音、角色動作、字幕
 * 全部對同一個基準。暫停時 AudioContext 被 suspend，currentTime 停住，
 * 事件就不會被觸發，回來之後也不會補播堆積的事件。
 */
export class Clock {
  constructor(audio) {
    this.audio = audio;
    this.queue = [];
    this.ticks = new Set();
    this.raf = 0;
    this.loop = this.loop.bind(this);
  }

  /** 在指定時間（AudioContext 時間）執行一次 */
  at(time, fn) {
    this.queue.push({ time, fn, done: false });
    this.start();
    return this;
  }

  /** 每一幀呼叫，參數是目前的 AudioContext 時間 */
  onTick(fn) {
    this.ticks.add(fn);
    this.start();
    return () => this.ticks.delete(fn);
  }

  start() {
    if (!this.raf) this.raf = requestAnimationFrame(this.loop);
  }

  loop() {
    this.raf = 0;
    const now = this.audio.time;
    let pending = false;
    for (const item of this.queue) {
      if (item.done) continue;
      if (now >= item.time) {
        item.done = true;
        try { item.fn(now); } catch (err) { this.report(err); }
      } else {
        pending = true;
      }
    }
    if (!pending && this.queue.length) this.queue.length = 0;
    for (const fn of this.ticks) {
      try { fn(now); } catch (err) { this.report(err); }
    }
    if (pending || this.ticks.size) this.start();
  }

  report(err) {
    // 不讓單一事件的錯誤中斷整個時間軸，但保留在主控台以外的開發通道。
    if (typeof console !== 'undefined' && console.warn) console.warn(err);
  }

  clear() {
    this.queue.length = 0;
    this.ticks.clear();
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
}

/**
 * 不需要音訊同步的動畫序列（開門、團員進場……）。
 * 所有 timeout 都被記錄，重開時一次清掉。
 */
export function createSeq() {
  let timers = [];
  return {
    after(ms, fn) {
      const id = setTimeout(() => {
        timers = timers.filter((t) => t !== id);
        fn();
      }, ms);
      timers.push(id);
      return id;
    },
    clear() {
      timers.forEach(clearTimeout);
      timers = [];
    },
  };
}
