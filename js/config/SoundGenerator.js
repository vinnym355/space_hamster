const SoundGenerator = {
    _ctx: null,

    getContext() {
        if (!this._ctx) {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Resume if suspended (browser autoplay policy)
        if (this._ctx.state === 'suspended') {
            this._ctx.resume();
        }
        return this._ctx;
    },

    // Play a tone with envelope
    _playTone(freq, duration, type, volume, pitchEnd) {
        const ctx = this.getContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        if (pitchEnd !== undefined) {
            osc.frequency.linearRampToValueAtTime(pitchEnd, ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(volume || 0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    },

    // Play noise burst (for thuds, splats)
    _playNoise(duration, volume) {
        const ctx = this.getContext();
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume || 0.2, ctx.currentTime);
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start();
    },

    // --- Sound Packs ---

    // Silly Sounds
    silly: {
        crouch()  { SoundGenerator._playTone(400, 0.15, 'sine', 0.3, 150); },
        sprint()  { SoundGenerator._playTone(600, 0.08, 'square', 0.15, 800); },
        jump()    { SoundGenerator._playTone(300, 0.25, 'sine', 0.3, 900); },
        land()    { SoundGenerator._playTone(200, 0.15, 'triangle', 0.3, 80); SoundGenerator._playNoise(0.08, 0.15); },
        sneeze()  { SoundGenerator._playTone(800, 0.1, 'sawtooth', 0.2, 200); SoundGenerator._playNoise(0.15, 0.25); }
    },

    // Sci-Fi Sounds
    scifi: {
        crouch()  { SoundGenerator._playTone(1200, 0.12, 'sine', 0.2, 300); },
        sprint()  { SoundGenerator._playTone(200, 0.06, 'sawtooth', 0.1, 600); },
        jump()    { SoundGenerator._playTone(400, 0.2, 'square', 0.2, 1400); },
        land()    { SoundGenerator._playTone(150, 0.2, 'sine', 0.25, 50); },
        sneeze()  { SoundGenerator._playTone(2000, 0.15, 'square', 0.15, 100); SoundGenerator._playTone(100, 0.15, 'sawtooth', 0.1, 800); }
    },

    // Musical Sounds
    musical: {
        crouch()  { SoundGenerator._playTone(523, 0.1, 'sine', 0.25); SoundGenerator._playTone(392, 0.1, 'sine', 0.2); },
        sprint()  { SoundGenerator._playTone(880, 0.05, 'sine', 0.15); },
        jump()    { SoundGenerator._playTone(523, 0.08, 'sine', 0.25); SoundGenerator._playTone(659, 0.08, 'sine', 0.2); SoundGenerator._playTone(784, 0.12, 'sine', 0.2); },
        land()    { SoundGenerator._playTone(262, 0.15, 'sine', 0.25); SoundGenerator._playTone(330, 0.15, 'sine', 0.2); },
        sneeze()  { SoundGenerator._playTone(784, 0.06, 'sine', 0.2); SoundGenerator._playTone(392, 0.15, 'sine', 0.25, 200); }
    },

    // Retro 8-bit Sounds
    retro: {
        crouch()  { SoundGenerator._playTone(250, 0.08, 'square', 0.2, 120); },
        sprint()  { SoundGenerator._playTone(440, 0.04, 'square', 0.12, 550); },
        jump()    { SoundGenerator._playTone(200, 0.18, 'square', 0.2, 700); },
        land()    { SoundGenerator._playTone(120, 0.1, 'square', 0.2, 60); },
        sneeze()  { SoundGenerator._playTone(600, 0.05, 'square', 0.2, 100); SoundGenerator._playTone(100, 0.1, 'square', 0.15, 50); }
    },

    // Get the sound pack for an equipped item ID
    getPack(itemId) {
        const packs = {
            'snd_silly': this.silly,
            'snd_scifi': this.scifi,
            'snd_musical': this.musical,
            'snd_retro': this.retro
        };
        return packs[itemId] || null;
    }
};
