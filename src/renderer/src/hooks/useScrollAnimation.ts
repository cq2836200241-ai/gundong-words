import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollOrientation, ScrollDirection } from '@shared/types';

export function useScrollAnimation(
  trackRef: React.RefObject<HTMLDivElement>,
  groupRef: React.RefObject<HTMLDivElement>,
  wordsLength: number,
  copies: number,
  orientation: ScrollOrientation,
  direction: ScrollDirection,
  speed: number,
  isPaused: boolean = false
) {
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  // Use refs to track current speed and pause state so the main effect
  // can apply them when it (re)creates the timeline, WITHOUT including
  // them in its dependency array (which would cause expensive rebuilds).
  const speedRef = useRef(speed);
  const pausedRef = useRef(isPaused);
  speedRef.current = speed;
  pausedRef.current = isPaused;

  // Main effect: create or re-create the GSAP timeline only when
  // structural properties change (word count, copies, orientation, direction).
  // Speed and pause state are applied via refs to avoid unnecessary rebuilds.
  useEffect(() => {
    if (!trackRef.current || !groupRef.current || wordsLength === 0 || copies < 2) return;

    if (tlRef.current) tlRef.current.kill();
    
    const track = trackRef.current;
    const group = groupRef.current;
    const isHorizontal = orientation === 'horizontal';
    
    const rect = group.getBoundingClientRect();
    const contentSize = isHorizontal ? rect.width : rect.height;
    
    if (contentSize === 0) return;

    const axis = isHorizontal ? 'x' : 'y';
    const moveDistance = -contentSize;

    gsap.set(track, { x: 0, y: 0 });

    const tl = gsap.timeline({ 
      repeat: -1,
      onUpdate: function() {
        if (!window.electronAPI?.sendPlaybackProgress) return;
        const p = this.time() / this.duration();
        const currentPercent = Math.floor(p * 100);
        const lastPercent = (this as any)._lastPercent || -1;
        if (currentPercent !== lastPercent) {
          (this as any)._lastPercent = currentPercent;
          window.electronAPI.sendPlaybackProgress(currentPercent);
        }
      }
    });
    
    // Base speed: 50px per second when speed multiplier is 1.0
    const baseDuration = contentSize / 50;

    if (direction === 'forward') {
      tl.to(track, {
        [axis]: moveDistance,
        duration: baseDuration,
        ease: 'none',
      });
    } else {
      gsap.set(track, { [axis]: moveDistance });
      tl.to(track, {
        [axis]: 0,
        duration: baseDuration,
        ease: 'none',
      });
    }

    // Apply current speed and pause state from refs
    tl.timeScale(speedRef.current);
    if (pausedRef.current) {
      tl.pause();
    }

    tlRef.current = tl;

    return () => { tl.kill(); };
  }, [wordsLength, copies, orientation, direction]);

  // Lightweight reactive effect for speed changes — no timeline rebuild
  useEffect(() => {
    if (tlRef.current) {
      tlRef.current.timeScale(speed);
    }
  }, [speed]);

  // Lightweight reactive effect for pause/resume — no timeline rebuild
  useEffect(() => {
    if (tlRef.current) {
      if (isPaused) tlRef.current.pause();
      else tlRef.current.resume();
    }
  }, [isPaused]);

  return {};
}
