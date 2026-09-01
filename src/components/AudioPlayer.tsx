"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export interface AudioPlayerHandle {
  playFromStart: (seconds: number) => void;
  continueTo: (seconds: number) => void;
  stop: () => void;
}

interface AudioPlayerProps {
  src: string | null;
  volume: number;
  onProgress?: (seconds: number) => void;
}

export const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(
  function AudioPlayer({ src, volume, onProgress }, ref) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const capListenerRef = useRef<(() => void) | null>(null);

    useEffect(() => {
      if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    useEffect(() => {
      const audio = audioRef.current;
      if (!audio || !onProgress) return;

      const handleProgress = () => onProgress(audio.currentTime);
      audio.addEventListener("timeupdate", handleProgress);
      return () => audio.removeEventListener("timeupdate", handleProgress);
    }, [onProgress]);

    const capAt = (audio: HTMLAudioElement, seconds: number) => {
      if (capListenerRef.current) {
        audio.removeEventListener("timeupdate", capListenerRef.current);
      }

      const onTimeUpdate = () => {
        if (audio.currentTime >= seconds) {
          audio.pause();
          audio.removeEventListener("timeupdate", onTimeUpdate);
        }
      };

      capListenerRef.current = onTimeUpdate;
      audio.addEventListener("timeupdate", onTimeUpdate);
    };

    useImperativeHandle(ref, () => ({
      playFromStart(seconds: number) {
        const audio = audioRef.current;
        if (!audio) return;

        audio.currentTime = 0;
        onProgress?.(0);
        capAt(audio, seconds);
        void audio.play();
      },
      continueTo(seconds: number) {
        const audio = audioRef.current;
        if (!audio) return;

        capAt(audio, seconds);
        void audio.play();
      },
      stop() {
        audioRef.current?.pause();
      },
    }));

    return <audio ref={audioRef} src={src ?? undefined} preload="auto" />;
  }
);
