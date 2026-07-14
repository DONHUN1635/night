'use client';

import { useEffect, useState } from 'react';

interface Star {
  id: number;
  top: string;
  left: string;
  size: number;
  delay: string;
}

// Halvány, lassan pulzáló csillagok a háttérben. A felhasználó a beállításokban
// kikapcsolhatja (lásd useAnimationsEnabled localStorage-alapú lehetőség helyett
// itt kliens state-tel egyszerűsítve).
export function StarField({ enabled = true }: { enabled?: boolean }) {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const generated: Star[] = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      delay: `${Math.random() * 4}s`,
    }));
    setStars(generated);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="star-field" aria-hidden="true">
      {stars.map((star) => (
        <span
          key={star.id}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
          }}
        />
      ))}
    </div>
  );
}
