import React from 'react';

interface Logo3DProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo3D: React.FC<Logo3DProps> = ({ size = 'md' }) => {
  const containerClass = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  };

  // Calcul de la translation Z (moitié de la largeur) pour former le cube parfait
  const getTranslateZ = (s: string) => {
    switch(s) {
      case 'sm': return '1rem'; // 16px (32/2)
      case 'md': return '1.5rem'; // 24px (48/2)
      case 'lg': return '2rem'; // 32px (64/2)
      case 'xl': return '3rem'; // 48px (96/2)
      default: return '1.5rem';
    }
  };

  const tz = getTranslateZ(size);

  return (
    <div className={`${containerClass[size]} perspective-1000 select-none`}>
      <div className="w-full h-full relative transform-style-3d animate-spin-3d">
        {/* Front */}
        <div className="absolute inset-0 bg-indigo-600 flex items-center justify-center text-white font-bold border border-indigo-400/30 backface-hidden" 
             style={{ transform: `rotateY(0deg) translateZ(${tz})` }}>
          3D
        </div>
        {/* Back */}
        <div className="absolute inset-0 bg-indigo-700 flex items-center justify-center text-white font-bold border border-indigo-400/30 backface-hidden" 
             style={{ transform: `rotateY(180deg) translateZ(${tz})` }}>
          3D
        </div>
        {/* Right */}
        <div className="absolute inset-0 bg-indigo-500 flex items-center justify-center text-white font-bold border border-indigo-400/30 backface-hidden" 
             style={{ transform: `rotateY(90deg) translateZ(${tz})` }}>
        </div>
        {/* Left */}
        <div className="absolute inset-0 bg-indigo-500 flex items-center justify-center text-white font-bold border border-indigo-400/30 backface-hidden" 
             style={{ transform: `rotateY(-90deg) translateZ(${tz})` }}>
        </div>
        {/* Top */}
        <div className="absolute inset-0 bg-indigo-400 flex items-center justify-center text-white font-bold border border-indigo-400/30 backface-hidden" 
             style={{ transform: `rotateX(90deg) translateZ(${tz})` }}>
        </div>
        {/* Bottom */}
        <div className="absolute inset-0 bg-indigo-800 flex items-center justify-center text-white font-bold border border-indigo-400/30 backface-hidden" 
             style={{ transform: `rotateX(-90deg) translateZ(${tz})` }}>
        </div>
      </div>
    </div>
  );
};