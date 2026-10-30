type SoundEffect = 'confirm' | 'launch' | 'impact' | 'miss' | 'victory';

const typePitch: Record<string, number> = {
  normal: 390,
  fire: 560,
  water: 440,
  electric: 720,
  grass: 480,
  ice: 610,
  fighting: 350,
  poison: 510,
  ground: 300,
  flying: 640,
  psychic: 680,
  bug: 430,
  rock: 330,
  ghost: 570,
  dragon: 750,
};

const musicMelody = [
  659, 784, 988, 784, 659, 523, 587, 659,
  784, 880, 988, 880, 784, 659, 587, 523,
];
const musicBass = [131, 147, 165, 147];
const musicBeatSeconds = 0.19;
const musicLoopMs = musicMelody.length * musicBeatSeconds * 1000;

class RetroAudio {
  private context: AudioContext | null = null;
  private enabled = true;
  private musicTimer: number | null = null;
  private musicOscillators = new Set<OscillatorNode>();

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.stopMusic();
  }

  startMusic(): void {
    if (!this.enabled || this.musicTimer !== null) return;
    const context = this.getContext();
    if (!context) return;

    this.scheduleMusicLoop(context);
    this.musicTimer = window.setInterval(() => {
      if (this.enabled && this.context) this.scheduleMusicLoop(this.context);
    }, musicLoopMs);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }

    for (const oscillator of this.musicOscillators) {
      try {
        oscillator.stop();
      } catch {
        // The oscillator may have already finished.
      }
    }
    this.musicOscillators.clear();
  }

  play(effect: SoundEffect, type = 'normal', critical = false): void {
    if (!this.enabled) return;
    const context = this.getContext();
    if (!context) return;

    const now = context.currentTime + 0.01;
    const pitch = typePitch[type] ?? typePitch.normal;

    switch (effect) {
      case 'confirm':
        this.playTone(context, 520, 790, 0.08, now, 0.05);
        break;
      case 'launch':
        this.playLaunch(context, type, pitch, now);
        break;
      case 'impact':
        this.playImpact(context, type, pitch, now, critical);
        break;
      case 'miss':
        this.playTone(context, 310, 125, 0.2, now, 0.055);
        break;
      case 'victory':
        [523, 659, 784, 1047].forEach((note, index) => {
          this.playTone(context, note, note * 1.08, 0.13, now + index * 0.12, 0.05);
        });
        break;
    }
  }

  private playLaunch(
    context: AudioContext,
    type: string,
    pitch: number,
    startTime: number,
  ): void {
    if (type === 'electric') {
      [1, 0.68, 1.25, 0.82].forEach((scale, index) => {
        this.playTone(
          context,
          pitch * scale,
          pitch * (index % 2 === 0 ? 1.55 : 0.55),
          0.055,
          startTime + index * 0.055,
          0.05,
        );
      });
      return;
    }

    if (type === 'fire' || type === 'dragon') {
      this.playTone(context, pitch * 0.62, pitch * 1.75, 0.22, startTime, 0.055, 'sawtooth');
      return;
    }

    if (type === 'water' || type === 'ice') {
      this.playTone(context, pitch * 1.5, pitch * 0.55, 0.24, startTime, 0.06, 'triangle');
      this.playTone(context, pitch * 0.8, pitch * 1.12, 0.16, startTime + 0.1, 0.035, 'triangle');
      return;
    }

    if (type === 'grass' || type === 'bug' || type === 'psychic' || type === 'ghost') {
      this.playTone(context, pitch * 0.78, pitch * 1.28, 0.2, startTime, 0.045, 'triangle');
      this.playTone(context, pitch * 1.4, pitch * 0.9, 0.14, startTime + 0.08, 0.025);
      return;
    }

    this.playTone(context, pitch * 0.72, pitch * 1.6, 0.18, startTime, 0.06);
    this.playTone(context, pitch * 0.55, pitch, 0.12, startTime + 0.05, 0.035, 'triangle');
  }

  private playImpact(
    context: AudioContext,
    type: string,
    pitch: number,
    startTime: number,
    critical: boolean,
  ): void {
    const waveform: OscillatorType =
      type === 'fire' || type === 'dragon'
        ? 'sawtooth'
        : type === 'water' || type === 'ice' || type === 'grass' || type === 'psychic'
          ? 'triangle'
          : 'square';

    this.playTone(
      context,
      critical ? pitch * 1.8 : pitch * 1.2,
      type === 'electric' ? pitch * 0.45 : 145,
      critical ? 0.2 : 0.15,
      startTime,
      critical ? 0.085 : 0.07,
      waveform,
    );

    if (critical || type === 'electric') {
      this.playTone(context, pitch * 1.45, 180, 0.11, startTime + 0.075, 0.045);
    }
  }

  private scheduleMusicLoop(context: AudioContext): void {
    const startTime = context.currentTime + 0.04;

    musicMelody.forEach((note, index) => {
      this.playTone(
        context,
        note,
        note * 1.025,
        musicBeatSeconds * 0.72,
        startTime + index * musicBeatSeconds,
        0.022,
        'square',
        true,
      );
    });

    musicBass.forEach((note, index) => {
      this.playTone(
        context,
        note,
        note * 0.96,
        musicBeatSeconds * 3.2,
        startTime + index * musicBeatSeconds * 4,
        0.026,
        'triangle',
        true,
      );
    });
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
      return null;
    }

    if (!this.context) {
      try {
        this.context = new window.AudioContext();
      } catch {
        return null;
      }
    }

    if (this.context.state === 'suspended') {
      void this.context.resume().catch(() => undefined);
    }
    return this.context;
  }

  private playTone(
    context: AudioContext,
    startFrequency: number,
    endFrequency: number,
    duration: number,
    startTime: number,
    volume: number,
    waveform: OscillatorType = 'square',
    trackForMusic = false,
  ): void {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const finishTime = startTime + duration;

    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(startFrequency, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), finishTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, finishTime);
    oscillator.connect(gain);
    gain.connect(context.destination);

    if (trackForMusic) {
      this.musicOscillators.add(oscillator);
      oscillator.onended = () => this.musicOscillators.delete(oscillator);
    }

    oscillator.start(startTime);
    oscillator.stop(finishTime);
  }
}

export default new RetroAudio();
