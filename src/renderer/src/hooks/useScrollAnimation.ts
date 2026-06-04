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

  useEffect(() => {
    if (!trackRef.current || !groupRef.current || wordsLength === 0 || copies < 2) return;

    if (tlRef.current) tlRef.current.kill();
    
    const track = trackRef.current;
    const group = groupRef.current;
    const isHorizontal = orientation === 'horizontal';
    
    // Get exact fractional size of ONE group
    // This is crucial for perfect seamless looping without 1px jitters
    const rect = group.getBoundingClientRect();
    const contentSize = isHorizontal ? rect.width : rect.height;
    
    if (contentSize === 0) return;

    const axis = isHorizontal ? 'x' : 'y';
    const moveDistance = -contentSize;

    gsap.set(track, { x: 0, y: 0 });

    const tl = gsap.timeline({ repeat: -1 });
    
    // Base speed: 50px per second when speed multiplier is 1.0
    const baseDuration = contentSize / 50;

    if (direction === 'forward') {
      tl.to(track, {
        [axis]: moveDistance,
        duration: baseDuration,
        ease: 'none',
      });
    } else {
      // Set to the end position first, then animate back to 0
      gsap.set(track, { [axis]: moveDistance });
      tl.to(track, {
        [axis]: 0,
        duration: baseDuration,
        ease: 'none',
      });
    }

    if (isPaused) {
      tl.pause();
    }

    tlRef.current = tl;

    return () => { tl.kill(); };
  }, [wordsLength, copies, orientation, direction]);

  useEffect(() => {
    if (tlRef.current) {
      tlRef.current.timeScale(speed);
    }
  }, [speed]);

  useEffect(() => {
    if (tlRef.current) {
      if (isPaused) tlRef.current.pause();
      else tlRef.current.resume();
    }
  }, [isPaused]);

  return {};
}
