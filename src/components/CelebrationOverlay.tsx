import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Award } from 'lucide-react';

interface ConfettiItem {
  id: number;
  left: number; // percentage (0 - 100)
  size: number; // size in px
  color: string;
  shape: 'circle' | 'square' | 'triangle' | 'flower' | 'star';
  delay: number; // seconds
  duration: number; // seconds
  spinSpeed: number; // seconds
}

export default function CelebrationOverlay({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) {
  const [particles, setParticles] = useState<ConfettiItem[]>([]);

  useEffect(() => {
    if (isVisible) {
      // Generate 80 randomized particles (confetti + flowers/stars)
      const colors = [
        '#F472B6', // pink
        '#60A5FA', // blue
        '#34D399', // emerald
        '#FBBF24', // amber
        '#A78BFA', // violet
        '#F87171', // red
        '#FB7185', // rose
        '#FCD34D', // gold
      ];
      const shapes: Array<'circle' | 'square' | 'triangle' | 'flower' | 'star'> = [
        'circle', 'square', 'triangle', 'flower', 'star'
      ];

      const items: ConfettiItem[] = Array.from({ length: 80 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: Math.random() * 14 + 8, // 8px to 22px
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        delay: Math.random() * 2, // staggered delay up to 2s
        duration: Math.random() * 3 + 2.5, // fall duration 2.5s to 5.5s
        spinSpeed: Math.random() * 2 + 1, // rotation duration 1s to 3s
      }));

      setParticles(items);
    } else {
      setParticles([]);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden select-none">
          {/* Custom CSS for falling particles */}
          <style>{`
            @keyframes fall {
              0% {
                transform: translateY(-5vh) translateX(0px);
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              90% {
                opacity: 1;
              }
              100% {
                transform: translateY(105vh) translateX(50px);
                opacity: 0;
              }
            }
            @keyframes sway {
              0% {
                transform: rotate(0deg) translateX(0px);
              }
              50% {
                transform: rotate(180deg) translateX(25px);
              }
              100% {
                transform: rotate(360deg) translateX(0px);
              }
            }
            .confetti-particle {
              position: absolute;
              top: -20px;
              animation-name: fall;
              animation-iteration-count: infinite;
              animation-timing-function: linear;
            }
          `}</style>

          {/* Falling Confetti Layer */}
          {particles.map((p) => {
            const isFlower = p.shape === 'flower';
            const isStar = p.shape === 'star';
            const isTriangle = p.shape === 'triangle';
            const isCircle = p.shape === 'circle';

            return (
              <div
                key={p.id}
                className="confetti-particle"
                style={{
                  left: `${p.left}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                }}
              >
                <div
                  className="w-full h-full"
                  style={{
                    backgroundColor: isFlower || isStar || isTriangle ? 'transparent' : p.color,
                    borderRadius: isCircle ? '50%' : p.shape === 'square' ? '2px' : '0',
                    animation: `sway ${p.spinSpeed}s infinite ease-in-out`,
                  }}
                >
                  {isFlower && (
                    <svg viewBox="0 0 24 24" fill={p.color} className="w-full h-full">
                      <path d="M12,1c-0.6,0-1,0.4-1,1c0,1.3-0.7,2.5-1.8,3.2C8.3,5.8,7.3,6,6.3,5.8C5.7,5.7,5.2,6.1,5.1,6.7s0.4,1.1,1,1.2c1.3,0.2,2.3,1,2.8,2.2c0.2,0.4,0.2,0.8,0.2,1.2c0,0.6,0.4,1,1,1c0.6,0,1-0.4,1-1c0-0.3,0-0.6-0.1-0.8c-0.3-1.1-1.2-1.9-2.3-2.2c1-0.5,1.7-1.4,1.9-2.5c0.4,0.7,1.1,1.2,1.9,1.4c0.1,0,0.2,0,0.3,0c0.5,0,1-0.3,1.2-0.8C16,7.5,15.6,6.9,15,6.8c-1-0.2-1.7-1-1.9-2C12.9,2.8,12.5,2.1,12,1z" />
                      <circle cx="12" cy="12" r="4" fill="#FCD34D" />
                      <path d="M12,8.5c-1.9,0-3.5,1.6-3.5,3.5s1.6,3.5,3.5,3.5s3.5-1.6,3.5-3.5S13.9,8.5,12,8.5z" />
                    </svg>
                  )}
                  {isStar && (
                    <svg viewBox="0 0 24 24" fill={p.color} className="w-full h-full">
                      <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
                    </svg>
                  )}
                  {isTriangle && (
                    <div
                      className="w-0 h-0"
                      style={{
                        borderLeft: `${p.size / 2}px solid transparent`,
                        borderRight: `${p.size / 2}px solid transparent`,
                        borderBottom: `${p.size}px solid ${p.color}`,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* Central Animated Popup Announcement */}
          <div onClick={onClose} className="absolute inset-0 flex items-center justify-center bg-slate-950/20 backdrop-blur-xs pointer-events-auto cursor-pointer">
            <motion.div
              initial={{ scale: 0.3, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: -50 }}
              transition={{ type: 'spring', damping: 15, stiffness: 120 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 border-2 border-indigo-200 shadow-2xl p-8 rounded-3xl max-w-sm text-center mx-4 relative overflow-hidden cursor-default"
            >
              {/* Outer light glow effects */}
              <div className="absolute -top-10 -left-10 w-24 h-24 bg-pink-100 rounded-full blur-xl opacity-70 animate-pulse" />
              <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-indigo-100 rounded-full blur-xl opacity-70 animate-pulse" />

              <div className="relative space-y-4">
                <div className="relative inline-block">
                  <div className="bg-indigo-50 p-4 rounded-full border border-indigo-100">
                    <Trophy className="text-amber-500 animate-bounce" size={44} />
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                    className="absolute -top-1 -right-1 text-yellow-400"
                  >
                    <Sparkles size={20} />
                  </motion.div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-black tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase">
                    Perfect Homework!
                  </span>
                  <h3 className="text-xl font-black text-slate-800">
                    축하합니다! 과제 완성 🎉
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    이번 주에 지정된 모든 예습 및 복습 과제를<br />
                    훌륭하게 완료하셨습니다. 정말 자랑스러워요! 🌟
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 px-6 rounded-2xl shadow-md transition-all active:scale-[0.97]"
                  >
                    확인했어요! 👍
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
