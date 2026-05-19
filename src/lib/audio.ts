
const SOUNDS = {
  place: 'https://www.soundjay.com/buttons/sounds/button-20.mp3',
  explode: 'https://www.soundjay.com/buttons/sounds/button-10.mp3',
  gameOver: 'https://www.soundjay.com/buttons/sounds/button-30.mp3',
};

class AudioController {
  private muted: boolean = false;
  private audios: Partial<Record<keyof typeof SOUNDS, HTMLAudioElement>> = {};

  constructor() {
    // Preload
    if (typeof window !== 'undefined') {
      Object.entries(SOUNDS).forEach(([key, url]) => {
        const audio = new Audio(url);
        audio.preload = 'auto';
        this.audios[key as keyof typeof SOUNDS] = audio;
      });
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  play(key: keyof typeof SOUNDS) {
    if (this.muted) return;
    
    const audio = this.audios[key];
    if (audio) {
      // Clone to allow overlapping sounds
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = key === 'explode' ? 0.2 : 0.4;
      clone.play().catch(() => {
        // Autoplay restrictions usually block the first sound unless user interacted.
      });
    }
  }
}

export const audioController = new AudioController();
