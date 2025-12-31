"use client";

import { useCallback, useRef } from "react";

export function useNotificationSound(soundUrl: string = "/sounds/notification.mp3") {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback(() => {
    try {
      // Create audio element if it doesn't exist
      if (!audioRef.current) {
        audioRef.current = new Audio(soundUrl);
      }

      // Reset to start and play
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.warn("Could not play notification sound:", error);
      });
    } catch (error) {
      console.warn("Audio playback error:", error);
    }
  }, [soundUrl]);

  return { playSound };
}
