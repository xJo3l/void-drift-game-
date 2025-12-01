class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  
  private bgmSource: AudioBufferSourceNode | null = null;
  private bgmGain: GainNode | null = null;
  
  private gameBuffer: AudioBuffer | null = null;
  private menuBuffer: AudioBuffer | null = null;
  
  private currentTheme: 'game' | 'menu' | null = null;
  private initialized: boolean = false;

  private init() {
    if (this.initialized) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    if (!this.ctx) return;

    // Master Chain: Reverb -> Compressor -> MasterGain -> Dest
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -10;
    this.compressor.knee.value = 40;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0;
    this.compressor.release.value = 0.25;

    // Generate Reverb Impulse
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.createReverbImpulse(2.0); // 2 second tail

    this.compressor.connect(this.masterGain);
    this.reverbNode.connect(this.compressor); // Wet
    this.masterGain.connect(this.ctx.destination);

    this.initialized = true;
  }

  // Create a synthetic impulse response for the reverb
  private createReverbImpulse(duration: number): AudioBuffer {
    if (!this.ctx) return new AudioBuffer({length: 1, sampleRate: 44100});
    
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
        const data = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            // Decaying white noise
            const decay = Math.pow(1 - i / length, 2); 
            data[i] = (Math.random() * 2 - 1) * decay;
        }
    }
    return impulse;
  }

  // Called on first user interaction to resume context
  ready() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  async playTheme(theme: 'game' | 'menu') {
    this.init();
    if (!this.ctx) return;

    if (this.currentTheme === theme && this.bgmSource) {
        // Already playing this theme
        return;
    }
    this.currentTheme = theme;

    // Fade out current
    if (this.bgmSource && this.bgmGain) {
        const t = this.ctx.currentTime;
        try {
            this.bgmGain.gain.cancelScheduledValues(t);
            this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, t);
            this.bgmGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
            this.bgmSource.stop(t + 1.5);
        } catch(e) {}
    }

    // Generate buffer if missing
    try {
        let bufferToPlay: AudioBuffer | null = null;
        if (theme === 'game') {
            if (!this.gameBuffer) await this.generateGameMusic();
            bufferToPlay = this.gameBuffer;
        } else {
            if (!this.menuBuffer) await this.generateMenuMusic();
            bufferToPlay = this.menuBuffer;
        }

        if (bufferToPlay) {
            this.playBuffer(bufferToPlay, theme);
        }
    } catch (e) {
        console.warn("Audio generation failed", e);
    }
  }

  private playBuffer(buffer: AudioBuffer, theme: 'game' | 'menu') {
    if (!this.ctx || !this.compressor) return;
    
    // Check if theme changed while generating
    if (this.currentTheme !== theme) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    const gain = this.ctx.createGain();
    // Menu is quieter
    const volume = theme === 'menu' ? 0.6 : 0.8;
    
    gain.gain.value = 0; // Start silent for fade in

    source.connect(gain);
    gain.connect(this.compressor);
    
    const t = this.ctx.currentTime;
    source.start(t);
    gain.gain.linearRampToValueAtTime(volume, t + 2.0); // 2s fade in

    this.bgmSource = source;
    this.bgmGain = gain;
  }

  // --- Music Generation ---

  // Generates calm, ambient menu music
  private async generateMenuMusic() {
     if (!this.ctx) return;
     const sr = this.ctx.sampleRate;
     const duration = 12.0; // 12s loop
     const offline = new OfflineAudioContext(2, sr * duration, sr);
     const out = offline.destination;

     // Reverb for menu
     const rev = offline.createConvolver();
     rev.buffer = this.createReverbImpulse(3.0);
     const revGain = offline.createGain();
     revGain.gain.value = 0.5; // Very wet
     rev.connect(out);

     // 1. Drone Pad (FM Synthesis)
     // Chord: Ab Major 7 (Ab, C, Eb, G) -> floating feeling
     const chord = [207.65, 261.63, 311.13, 392.00]; 
     
     chord.forEach((freq, i) => {
        const osc = offline.createOscillator();
        const mod = offline.createOscillator();
        const modGain = offline.createGain();
        const gain = offline.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;
        
        mod.type = 'sine';
        mod.frequency.value = freq * 0.5; // Sub-octave modulator
        modGain.gain.value = 5; // Subtle modulation
        
        mod.connect(modGain);
        modGain.connect(osc.frequency);

        // Slow swell
        gain.gain.setValueAtTime(0, 0);
        gain.gain.linearRampToValueAtTime(0.05, duration * 0.5);
        gain.gain.linearRampToValueAtTime(0, duration);

        osc.connect(gain);
        gain.connect(rev); // All wet
        gain.connect(out); // Some dry

        osc.start(0);
        osc.stop(duration);
     });

     // 2. Wind / Space Dust
     const noise = offline.createBufferSource();
     const nBuf = offline.createBuffer(1, sr * duration, sr);
     const nd = nBuf.getChannelData(0);
     for(let i=0; i<nd.length; i++) nd[i] = (Math.random() * 2 - 1) * 0.1;
     noise.buffer = nBuf;
     
     const nFilter = offline.createBiquadFilter();
     nFilter.type = 'bandpass';
     nFilter.frequency.setValueAtTime(400, 0);
     nFilter.frequency.linearRampToValueAtTime(800, duration/2);
     nFilter.frequency.linearRampToValueAtTime(400, duration);
     nFilter.Q.value = 1;

     noise.connect(nFilter);
     nFilter.connect(rev); // Wind is background
     
     noise.start(0);

     // 3. Random Pings (Stars)
     const scale = [523.25, 622.25, 783.99, 1046.50]; // Pentatonicish
     for(let i=0; i<8; i++) {
        const t = Math.random() * (duration - 1);
        const osc = offline.createOscillator();
        const gain = offline.createGain();
        osc.type = 'sine';
        osc.frequency.value = scale[Math.floor(Math.random()*scale.length)] * 2; // High pitch
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.05, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

        osc.connect(gain);
        gain.connect(rev);
        osc.start(t);
        osc.stop(t+2);
     }

     this.menuBuffer = await offline.startRendering();
  }

  // Generates high-energy combat music
  private async generateGameMusic() {
    if (!this.ctx) return;

    const tempo = 90;
    const bars = 4;
    const beatsPerBar = 4;
    const secondsPerBeat = 60 / tempo;
    const totalDuration = bars * beatsPerBar * secondsPerBeat; // ~10.6s
    
    const sr = this.ctx.sampleRate;
    const offline = new OfflineAudioContext(2, sr * totalDuration, sr);
    const out = offline.destination;
    
    // Add Reverb to offline context
    const rev = offline.createConvolver();
    rev.buffer = this.createReverbImpulse(2.5);
    const revGain = offline.createGain();
    revGain.gain.value = 0.3; // 30% Wet
    rev.connect(revGain);
    revGain.connect(out);

    // Helper to play a note in offline context
    const playNote = (freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol: number = 0.1, mixReverb: boolean = true) => {
        const osc = offline.createOscillator();
        const gain = offline.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        
        // Envelope
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(vol, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(out); // Dry
        if (mixReverb) gain.connect(rev); // Wet

        osc.start(start);
        osc.stop(start + dur);
    };

    // --- 1. Deep Bass (Sidechained rhythm) ---
    // C Minor: C2 (65.4), Eb2 (77.78), G2 (98.0)
    const bassSeq = [65.41, 65.41, 77.78, 65.41, 65.41, 65.41, 98.00, 77.78]; // 8th notes
    
    for (let b = 0; b < bars; b++) {
        for (let i = 0; i < 8; i++) {
            const time = b * (beatsPerBar * secondsPerBeat) + i * (secondsPerBeat / 2);
            // FM Synthesis for Bass
            const osc = offline.createOscillator();
            const mod = offline.createOscillator();
            const modGain = offline.createGain();
            const vol = offline.createGain();
            const filter = offline.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.value = bassSeq[i];
            
            mod.type = 'sine';
            mod.frequency.value = bassSeq[i] * 2;
            modGain.gain.value = 50;

            mod.connect(modGain);
            modGain.connect(osc.frequency);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(200, time);
            filter.frequency.exponentialRampToValueAtTime(100, time + 0.3);

            vol.gain.setValueAtTime(0, time);
            vol.gain.linearRampToValueAtTime(0.25, time + 0.05);
            vol.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

            osc.connect(filter);
            filter.connect(vol);
            vol.connect(out);

            osc.start(time);
            osc.stop(time + 0.5);
            mod.start(time);
            mod.stop(time + 0.5);
        }
    }

    // --- 2. Ambient Pad (Evolving Chord) ---
    // C Minor Add9
    const padNotes = [130.81, 155.56, 196.00, 293.66]; // C3, Eb3, G3, D4
    const padOscs = padNotes.map(f => {
        const osc = offline.createOscillator();
        const gain = offline.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = f;
        
        // Detune slightly for thickness
        osc.detune.value = (Math.random() - 0.5) * 20;

        gain.gain.setValueAtTime(0, 0);
        gain.gain.linearRampToValueAtTime(0.03, 1);
        gain.gain.linearRampToValueAtTime(0.03, totalDuration - 1);
        gain.gain.linearRampToValueAtTime(0, totalDuration);

        // Lowpass filter LFO
        const filter = offline.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(rev); // All wet for pad
        gain.connect(out); // Some dry

        osc.start(0);
        osc.stop(totalDuration);
        return osc;
    });

    // --- 3. Arpeggio Droplets (Pentatonic) ---
    // C Minor Pentatonic: C, Eb, F, G, Bb
    const scale = [523.25, 622.25, 698.46, 783.99, 932.33, 1046.50]; // C5...
    const sixteenth = secondsPerBeat / 4;
    const totalSixteenths = bars * beatsPerBar * 4;

    for (let i = 0; i < totalSixteenths; i++) {
        if (Math.random() > 0.7) { // Sparse
            const note = scale[Math.floor(Math.random() * scale.length)];
            const time = i * sixteenth;
            playNote(note, time, 0.3, 'sine', 0.05, true);
        }
    }

    // --- 4. Kick Drum (Heartbeat) ---
    for (let b = 0; b < bars; b++) {
        const time = b * (beatsPerBar * secondsPerBeat);
        // Kick on beat 1
        const osc = offline.createOscillator();
        const gain = offline.createGain();
        osc.frequency.setValueAtTime(120, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        osc.connect(gain);
        gain.connect(out);
        osc.start(time);
        osc.stop(time + 0.2);
    }

    this.gameBuffer = await offline.startRendering();
  }

  stopMusic() {
    if (this.bgmSource) {
        try { this.bgmSource.stop(); } catch(e) {}
        this.bgmSource = null;
    }
    this.currentTheme = null;
  }

  // --- Better SFX ---

  playPowerUp() {
    this.init();
    if (!this.ctx || !this.compressor) return;
    const t = this.ctx.currentTime;
    
    // Major Triad Arp (C Major: C, E, G) rapidly
    const notes = [523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        osc.type = i === 3 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        
        const startTime = t + i * 0.05;
        const duration = 0.4;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.detune.value = (Math.random() - 0.5) * 15;

        osc.connect(gain);
        gain.connect(this.compressor!);
        
        if (this.reverbNode) {
            const revGain = this.ctx!.createGain();
            revGain.gain.value = 0.4;
            gain.connect(revGain);
            revGain.connect(this.reverbNode);
        }

        osc.start(startTime);
        osc.stop(startTime + duration);
    });
  }

  playExplosion() {
    this.init();
    if (!this.ctx || !this.compressor) return;
    const t = this.ctx.currentTime;

    // 1. Sub-bass Impact
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.frequency.setValueAtTime(100, t);
    subOsc.frequency.exponentialRampToValueAtTime(20, t + 0.4);
    subGain.gain.setValueAtTime(0.8, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    subOsc.connect(subGain);
    subGain.connect(this.compressor);
    subOsc.start(t);
    subOsc.stop(t + 0.5);

    // 2. Crunch (Distorted Noise)
    const noiseBufferSize = this.ctx.sampleRate * 0.5;
    const noiseBuffer = this.ctx.createBuffer(1, noiseBufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1000, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, t + 0.3);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    const shaper = this.ctx.createWaveShaper();
    shaper.curve = this.makeDistortionCurve(100);

    noise.connect(noiseFilter);
    noiseFilter.connect(shaper);
    shaper.connect(noiseGain);
    noiseGain.connect(this.compressor);
    
    noise.start(t);
  }

  playGameOver() {
    this.init();
    if (!this.ctx || !this.compressor) return;
    const t = this.ctx.currentTime;

    // "Tape Stop" Effect + Dissonant Swell
    const freqs = [100, 144, 211]; // Dissonant cluster
    freqs.forEach(f => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(10, t + 1.5);
        
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.5); 
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.compressor!);
        
        if (this.reverbNode) {
            gain.connect(this.reverbNode);
        }

        osc.start(t);
        osc.stop(t + 1.5);
    });
  }

  private makeDistortionCurve(amount: number) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < n_samples; ++i ) {
      const x = i * 2 / n_samples - 1;
      curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
    }
    return curve;
  }
}

export const audio = new SoundManager();