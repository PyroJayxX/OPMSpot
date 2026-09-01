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
}

export const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(
  function AudioPlayer({ src, volume }, ref) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const listenerRef = useRef<(() => void) | null>(null);

    useEffect(() => {
      if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    const capAt = (audio: HTMLAudioElement, seconds: number) => {
      if (listenerRef.current) {
        audio.removeEventListener("timeupdate", listenerRef.current);
      }

      const onTimeUpdate = () => {
        if (audio.currentTime >= seconds) {
          audio.pause();
          audio.removeEventListener("timeupdate", onTimeUpdate);
        }
      };

      listenerRef.current = onTimeUpdate;
      audio.addEventListener("timeupdate", onTimeUpdate);
    };

    useImperativeHandle(ref, () => ({
      playFromStart(seconds: number) {
        const audio = audioRef.current;
        if (!audio) return;

        audio.currentTime = 0;
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
