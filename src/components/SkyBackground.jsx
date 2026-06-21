import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';

const stars = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 60,
  size: Math.random() * 3 + 1,
  delay: Math.random() * 3,
  duration: 2 + Math.random() * 3
}));

export default function SkyBackground() {
  const { theme } = useTheme();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const sky = theme.sky;

  return (
    <div className="sky-container" style={{ background: theme.bg }}>
      {/* Morning sun */}
      {sky === 'morning' && (
        <div className="sky-scene morning-scene">
          <div className="sun">
            <div className="sun-core" />
            {[...Array(8)].map((_, i) => (
              <div key={i} className="sun-ray" style={{ transform: `rotate(${i * 45}deg)` }} />
            ))}
          </div>
          <div className="cloud cloud-1" />
          <div className="cloud cloud-2" />
        </div>
      )}

      {/* Afternoon */}
      {sky === 'afternoon' && (
        <div className="sky-scene afternoon-scene">
          <div className="sun sun-afternoon">
            <div className="sun-core" />
          </div>
          <div className="cloud cloud-1" />
          <div className="cloud cloud-2" />
          <div className="cloud cloud-3" />
        </div>
      )}

      {/* Evening / Night */}
      {(sky === 'evening' || sky === 'dark') && (
        <div className="sky-scene night-scene">
          <div className="moon">
            <div className="moon-crater" style={{ top: '20%', left: '30%', width: 8, height: 8 }} />
            <div className="moon-crater" style={{ top: '55%', left: '60%', width: 5, height: 5 }} />
            <div className="moon-crater" style={{ top: '35%', left: '50%', width: 6, height: 6 }} />
          </div>
          {stars.map(star => (
            <div
              key={star.id}
              className="star"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                animationDelay: `${star.delay}s`,
                animationDuration: `${star.duration}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Classic green */}
      {sky === 'classic' && (
        <div className="sky-scene classic-scene">
          <div className="mosque-silhouette">🕌</div>
        </div>
      )}
    </div>
  );
}
