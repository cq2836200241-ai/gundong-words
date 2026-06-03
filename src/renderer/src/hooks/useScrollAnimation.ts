import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollOrientation, ScrollDirection } from '@shared/types';

export function useScrollAnimation(
  trackRef: React.RefObject<HTMLDivElement>,
  wordsLength: number,
  orientation: ScrollOrientation,
  direction: ScrollDirection,
  speed: number
) {
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!trackRef.current || wordsLength === 0) return;

    if (tlRef.current) tlRef.current.kill();
    
    const track = trackRef.current;
    const isHorizontal = orientation === 'horizontal';
    
    // Size of exactly one copy of the words (we rendered two copies)
    const contentSize = isHorizontal ? track.scrollWidth / 2 : track.scrollHeight / 2;
    const axis = isHorizontal ? 'x' : 'y';
    const moveDistance = -contentSize;

    gsap.set(track, { [axis]: 0 });

    const tl = gsap.timeline({ repeat: -1 });
    
    // Base speed: 50px per second when speed multiplier is 1.0
    const baseDuration = contentSize / 50;

    tl.to(track, {
      [axis]: moveDistance,
      duration: baseDuration,
      ease: 'none',
    });

    if (direction === 'reverse') {
      tl.reversed(true);
    }

    tlRef.current = tl;

    return () => { tl.kill(); };
  }, [wordsLength, orientation, direction]);

  useEffect(() => {
    if (tlRef.current) {
      tlRef.current.timeScale(speed);
    }
  }, [speed]);

  return {
    pause: () => tlRef.current?.pause(),
    resume: () => tlRef.current?.resume(),
  };
}
