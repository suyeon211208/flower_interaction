import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import bgmAudioUrl from '../assets/bgm_wind.mp3';

interface AudioBGMProps {
  stampTrigger?: number;
}

export const AudioBGM: React.FC<AudioBGMProps> = ({ stampTrigger }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize BGM audio element and Web Audio for sound effects
  useEffect(() => {
    const audio = new Audio(bgmAudioUrl);
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Handle autoplay policy block
      });
    }

    // Initialize audio context for touch chime effects
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    } else if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, [isPlaying]);

  // Also auto-start BGM on first user interaction with document
  useEffect(() => {
    const handleFirstUserInteraction = () => {
      const audio = audioRef.current;
      if (audio && audio.paused) {
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {});
      }
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };

    window.addEventListener('pointerdown', handleFirstUserInteraction, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstUserInteraction);
    };
  }, []);

  // Play subtle, warm acoustic chime on flower touch stamp
  const playStampSound = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    try {
      // Warm pentatonic kalimba/marimba tones matching acoustic ambient BGM
      const freqs = [523.25, 587.33, 659.25, 783.99, 880.0]; // C5, D5, E5, G5, A5
      const randomFreq = freqs[Math.floor(Math.random() * freqs.length)];

      const osc = ctx.createOscillator();
      const oscHarmonic = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Soft lowpass filter to remove harsh high frequencies
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(randomFreq, ctx.currentTime);

      // Subtle second overtone for rich warm acoustic bell sound
      oscHarmonic.type = 'sine';
      oscHarmonic.frequency.setValueAtTime(randomFreq * 2, ctx.currentTime);

      // Gentle volume (reduced from 0.12 to 0.035)
      const volume = 0.015;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.03); // gentle attack
      gain.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + 0.8); // smooth decay

      osc.connect(filter);
      oscHarmonic.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      oscHarmonic.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
      oscHarmonic.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio playback failed silently
    }
  }, []);

  useEffect(() => {
    if (stampTrigger && stampTrigger > 0) {
      playStampSound();
    }
  }, [stampTrigger, playStampSound]);

  return (
    <button
      onClick={toggleAudio}
      aria-label="Sound Toggle"
      className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white/90 hover:bg-black/50 transition-all cursor-pointer shadow-md"
    >
      {isPlaying ? <Volume2 className="w-5 h-5 text-amber-300" /> : <VolumeX className="w-5 h-5 text-white/70" />}
    </button>
  );
};
