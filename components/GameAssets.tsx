import React from 'react';
import { BrothType, CookingStatus } from '../types';

// --- Colors & Styles ---
const BROTH_FILLS: Record<BrothType, string> = {
  [BrothType.MILKY]: '#fef3c7', // Creamy
  [BrothType.CLEAR]: '#fbbf24', // Golden
  [BrothType.MALA]: '#ef4444'   // Red
};

const STROKE_WIDTH = 3; 

const STEAM_EFFECT = (
  <g className="animate-bounce" style={{ animationDuration: '2s' }}>
    <path d="M35 20 Q40 10 35 0" stroke="white" strokeWidth="3" fill="none" opacity="0.8" />
    <path d="M50 25 Q55 15 50 5" stroke="white" strokeWidth="3" fill="none" opacity="0.8" />
    <path d="M65 20 Q70 10 65 0" stroke="white" strokeWidth="3" fill="none" opacity="0.8" />
  </g>
);

const MiniGauge: React.FC<{ progress: number, type: 'cook' | 'burn', x?: number, y?: number }> = ({ progress, type, x = 20, y = 10 }) => {
  const isBurn = type === 'burn';
  const color = isBurn ? '#ef4444' : '#eab308'; 
  const percentage = isBurn ? Math.max(0, 100 - progress) : Math.min(100, progress);
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="0" y="0" width="60" height="8" fill="#1f2937" stroke="white" strokeWidth="2" rx="2" />
      <rect x="2" y="2" width={Math.max(0, 56 * (percentage / 100))} height="4" fill={color} rx="1" className="transition-all duration-100" />
      {isBurn && percentage < 30 && (
        <text x="30" y="-3" textAnchor="middle" fontSize="10" fill="#ef4444" fontWeight="bold" stroke="white" strokeWidth="0.5" className="animate-pulse">⚠️</text>
      )}
    </g>
  );
};

export const GukbapAsset: React.FC<{ status: CookingStatus; brothType: BrothType | null; progress: number; }> = ({ status, brothType, progress }) => {
  const isCooking = status === CookingStatus.COOKING;
  const isDone = status === CookingStatus.DONE;
  const isBurnt = status === CookingStatus.BURNT;
  const isEmpty = status === CookingStatus.EMPTY;
  const brothColor = brothType ? BROTH_FILLS[brothType] : '#374151'; 

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg overflow-visible">
      <ellipse cx="50" cy="85" rx="35" ry="8" fill="rgba(0,0,0,0.5)" />
      <path d="M20 40 Q20 90 50 90 Q80 90 80 40 L85 35 L15 35 L20 40 Z" fill="#1f2937" stroke="#000" strokeWidth={STROKE_WIDTH} />
      <ellipse cx="50" cy="35" rx="35" ry="8" fill="#374151" stroke="#000" strokeWidth={STROKE_WIDTH} />
      {!isEmpty && (
        <>
          <ellipse cx="50" cy="35" rx={isCooking ? 30 * (progress/100) : 32} ry={isCooking ? 6 * (progress/100) : 7} fill={isBurnt ? '#000000' : brothColor} stroke={isBurnt ? 'none' : 'rgba(0,0,0,0.2)'} strokeWidth="1" className="transition-all duration-300" />
          {isCooking && <g><MiniGauge progress={progress} type="cook" x={20} y={5} /></g>}
          {isDone && <g>{STEAM_EFFECT}<MiniGauge progress={progress} type="burn" x={20} y={5} /></g>}
          {isBurnt && <text x="50" y="55" textAnchor="middle" fontSize="30">☠️</text>}
        </>
      )}
    </svg>
  );
};

export const SotbapAsset: React.FC<{ status: CookingStatus; progress: number; }> = ({ status, progress }) => {
  const isCooking = status === CookingStatus.COOKING;
  const isDone = status === CookingStatus.DONE;
  const isBurnt = status === CookingStatus.BURNT;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md overflow-visible">
       <rect x="20" y="72" width="60" height="6" rx="1" fill="#5D4037" stroke="black" strokeWidth="2" />
       <path d="M15 45 Q15 72 50 72 Q85 72 85 45 L15 45 Z" fill="#9ca3af" stroke="#000" strokeWidth={STROKE_WIDTH} />
       {!isDone && !isBurnt ? (
         <g className={isCooking ? "animate-bounce" : ""} style={{ animationDuration: '0.5s' }}>
            <path d="M10 45 L90 45 L80 35 Q50 20 20 35 Z" fill="#5D4037" stroke="#000" strokeWidth={STROKE_WIDTH} />
            <rect x="45" y="25" width="10" height="8" rx="2" fill="#3E2723" stroke="#000" strokeWidth={1} />
         </g>
       ) : (
         <g transform="translate(10, 0) rotate(-20 90 45)">
            <path d="M10 45 L90 45 L80 35 Q50 20 20 35 Z" fill="#5D4037" stroke="#000" strokeWidth={STROKE_WIDTH} />
            <rect x="45" y="25" width="10" height="8" rx="2" fill="#3E2723" stroke="#000" strokeWidth={1} />
         </g>
       )}
       {isDone && <g><ellipse cx="50" cy="45" rx="32" ry="8" fill="#fff" stroke="#ddd" strokeWidth="1" />{STEAM_EFFECT}</g>}
       {isBurnt && <text x="50" y="60" textAnchor="middle" fontSize="24">🔥</text>}
       {isCooking && <MiniGauge progress={progress} type="cook" x={20} y={10} />}
       {isDone && <MiniGauge progress={progress} type="burn" x={20} y={10} />}
    </svg>
  );
};

export const CustomerAsset: React.FC<{ seed: number; mood: 'happy' | 'angry' | 'normal'; }> = ({ seed, mood }) => {
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
       <rect x="25" y="60" width="50" height="40" rx="4" fill={colors[seed % colors.length]} stroke="black" strokeWidth={STROKE_WIDTH} />
       <rect x="30" y="20" width="40" height="40" rx="4" fill="#fca5a5" stroke="black" strokeWidth={STROKE_WIDTH} />
       <path d="M30 20 L70 20 L70 35 L60 35 L60 25 L40 25 L40 35 L30 35 Z" fill="#1f2937" stroke="black" strokeWidth="1" />
       {mood === 'angry' ? (
         <g><rect x="35" y="35" width="8" height="2" fill="black" transform="rotate(15 39 36)" /><rect x="57" y="35" width="8" height="2" fill="black" transform="rotate(-15 61 36)" /><rect x="42" y="50" width="16" height="4" fill="red" /></g>
       ) : (
         <g><rect x="38" y="38" width="6" height="6" fill="black" /><rect x="56" y="38" width="6" height="6" fill="black" /><rect x="45" y="52" width="10" height="2" fill="black" /></g>
       )}
    </svg>
  );
};

// --- Brother Asset (Exact Pixel Art Style from Screenshot) ---
export const BrotherAsset: React.FC<{ type: 'older' | 'younger' }> = ({ type }) => {
  const isOlder = type === 'older';
  const bodyColor = isOlder ? '#3b82f6' : '#f59e0b'; // Older is Blue, Younger is Yellow/Orange
  
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
       {/* Pixel Head */}
       <rect x="20" y="20" width="60" height="60" fill="#fca5a5" stroke="black" strokeWidth="6" />
       {/* Pixel Eyes */}
       <rect x="32" y="36" width="12" height="12" fill="black" />
       <rect x="56" y="36" width="12" height="12" fill="black" />
       {/* Pixel Mouth */}
       <rect x="36" y="64" width="28" height="4" fill="black" />
       {/* Pixel Body */}
       <rect x="10" y="80" width="80" height="80" fill={bodyColor} stroke="black" strokeWidth="6" />
    </svg>
  );
};

// --- Master Pot Asset (Exact Style from Screenshot) ---
export const MasterPotAsset: React.FC<{ health: number }> = ({ health }) => {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
      {/* Dark Outer Cauldron */}
      <path d="M10 40 L10 50 Q10 95 50 95 Q90 95 90 50 L90 40 Z" fill="#000" />
      {/* Cauldron Inner Top */}
      <ellipse cx="50" cy="40" rx="40" ry="12" fill="#1f2937" stroke="black" strokeWidth="4" />
      {/* Soup Surface */}
      <ellipse cx="50" cy="40" rx="32" ry="8" fill="#fef3c7" />
      {/* Flame below */}
      <path d="M35 95 L40 85 L50 100 L60 85 L65 95 Z" fill="#f97316" stroke="black" strokeWidth="2" className="animate-pulse" />
    </svg>
  );
};

export const SmallIconGukbap: React.FC<{type: BrothType}> = ({ type }) => (
    <svg viewBox="0 0 24 24" className="w-8 h-8 inline-block align-middle drop-shadow">
        <path d="M2 10 Q2 22 12 22 Q22 22 22 10" fill="#1f2937" stroke="black" strokeWidth="2" />
        <ellipse cx="12" cy="10" rx="10" ry="3" fill={BROTH_FILLS[type]} stroke="black" strokeWidth="1" />
    </svg>
);

export const SmallIconRice: React.FC = () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6 inline-block align-middle">
         <path d="M4 10 Q4 20 12 20 Q20 20 20 10" fill="#9ca3af" stroke="black" strokeWidth="1.5" />
         <path d="M4 10 L20 10 L18 6 H6 Z" fill="#78350f" stroke="black" strokeWidth="1.5" />
    </svg>
);