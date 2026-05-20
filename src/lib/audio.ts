
const SOUNDS = {
  place: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Snappy blip
  explode: 'https://assets.mixkit.co/active_storage/sfx/2593/2593-preview.mp3', // Thud/Explosion
  gameOver: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Game Over chime
  win: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3', // Victory fanfare
  turnChange: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Subtle whoosh
  clock: 'https://assets.mixkit.co/active_storage/sfx/2539/2539-preview.mp3', // Ticking
  undo: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3', // Rewind sound
  message: 'https://assets.mixkit.co/active_storage/sfx/2584/2584-preview.mp3', // Notification
  join: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Entry blip
};

const MUSIC_URL = 'https://assets.mixkit.co/active_storage/video_items/101/default_video.mp3'; // Chill synthwave loop

class AudioController {
  private muted: boolean = false;
  private audios: Partial<Record<keyof typeof SOUNDS, HTMLAudioElement>> = {};
  private music: HTMLAudioElement | null = null;
  private musicStarted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Preload effects
      Object.entries(SOUNDS).forEach(([key, url]) => {
        const audio = new Audio(url);
        audio.preload = 'auto';
        this.audios[key as keyof typeof SOUNDS] = audio;
      });

      // Prepare music
      this.music = new Audio(MUSIC_URL);
      this.music.loop = true;
      this.music.volume = 0.15; // Low background volume
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.music) {
      this.music.muted = muted;
    }
  }

  startMusic() {
    if (this.music && !this.musicStarted && !this.muted) {
      this.music.play().then(() => {
        this.musicStarted = true;
      }).catch(() => {
        // Handle autoplay block
      });
    }
  }

  private lastPlayTime: Partial<Record<keyof typeof SOUNDS, number>> = {};

  play(key: keyof typeof SOUNDS) {
    if (this.muted) return;
    
    // Throttle certain sounds to prevent audio lag and "static" during chain reactions
    const now = Date.now();
    const lastTime = this.lastPlayTime[key] || 0;
    const cooldown = key === 'explode' ? 80 : 50; 

    if (now - lastTime < cooldown) return;
    
    const audio = this.audios[key];
    if (audio) {
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = key === 'explode' ? 0.2 : 0.4;
      clone.play().catch(() => {});
      this.lastPlayTime[key] = now;
    }
  }
}

export const audioController = new AudioController();
