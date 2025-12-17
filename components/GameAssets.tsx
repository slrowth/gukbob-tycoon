import React from 'react';
import { BrothType, CookingStatus } from '../types';

// --- Colors & Styles ---
const BROTH_FILLS: Record<BrothType, string> = {
  [BrothType.MILKY]: '#fef3c7', // Creamy
  [BrothType.CLEAR]: '#fbbf24', // Golden
  [BrothType.MALA]: '#ef4444'   // Red
};

const STROKE_WIDTH = 3; // Thicker lines for retro feel

const COOKING_BUBBLES = (color: string) => (
  <g className="animate-pulse">
    <circle cx="30" cy="40" r="4" fill={color} stroke="black" strokeWidth="1" />
    <circle cx="50" cy="35" r="5" fill={color} stroke="black" strokeWidth="1" />
    <circle cx="70" cy="42" r="3" fill={color} stroke="black" strokeWidth="1" />
  </g>
);

const STEAM_EFFECT = (
  <g className="animate-bounce" style={{ animationDuration: '2s' }}>
    <path d="M35 20 Q40 10 35 0" stroke="white" strokeWidth="3" fill="none" opacity="0.8" />
    <path d="M50 25 Q55 15 50 5" stroke="white" strokeWidth="3" fill="none" opacity="0.8" />
    <path d="M65 20 Q70 10 65 0" stroke="white" strokeWidth="3" fill="none" opacity="0.8" />
  </g>
);

// Helper for Gauge
// type 'cook': 0 -> 100 (Filling up)
// type 'burn': 100 -> 0 (Decreasing / Burning down)
const MiniGauge: React.FC<{ progress: number, type: 'cook' | 'burn', x?: number, y?: number }> = ({ progress, type, x = 20, y = 10 }) => {
  const isBurn = type === 'burn';
  const color = isBurn ? '#ef4444' : '#eab308'; 
  
  // Calculate width based on type
  // If Cook: width grows with progress
  // If Burn: width shrinks as progress (damage) increases. 
  // Note: The 'progress' prop passed here is 0->100 accumulation of damage/cooking.
  const percentage = isBurn ? Math.max(0, 100 - progress) : Math.min(100, progress);
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Background Bar */}
      <rect x="0" y="0" width="60" height="8" fill="#1f2937" stroke="white" strokeWidth="2" rx="2" />
      
      {/* Fill */}
      <rect 
        x="2" y="2" 
        width={Math.max(0, 56 * (percentage / 100))} 
        height="4" 
        fill={color} 
        rx="1" 
        className="transition-all duration-100"
      />
      
      {/* Icon/Label */}
      {isBurn && percentage < 30 && (
        <text x="30" y="-3" textAnchor="middle" fontSize="10" fill="#ef4444" fontWeight="bold" stroke="white" strokeWidth="0.5" className="animate-pulse">⚠️ HURRY!</text>
      )}
    </g>
  );
};

// --- 1. Gukbap Pot (Ttukbaegi) ---
interface GukbapAssetProps {
  status: CookingStatus;
  brothType: BrothType | null;
  progress: number;
}

export const GukbapAsset: React.FC<GukbapAssetProps> = ({ status, brothType, progress }) => {
  const isCooking = status === CookingStatus.COOKING;
  const isDone = status === CookingStatus.DONE;
  const isBurnt = status === CookingStatus.BURNT;
  const isEmpty = status === CookingStatus.EMPTY;

  const brothColor = brothType ? BROTH_FILLS[brothType] : '#374151'; 

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg overflow-visible">
      {/* Shadows/Base */}
      <ellipse cx="50" cy="85" rx="35" ry="8" fill="rgba(0,0,0,0.5)" />

      {/* Pot Body (Black Ttukbaegi) */}
      <path d="M20 40 Q20 90 50 90 Q80 90 80 40 L85 35 L15 35 L20 40 Z" fill="#1f2937" stroke="#000" strokeWidth={STROKE_WIDTH} />
      
      {/* Rim */}
      <ellipse cx="50" cy="35" rx="35" ry="8" fill="#374151" stroke="#000" strokeWidth={STROKE_WIDTH} />

      {/* Contents */}
      {!isEmpty && (
        <>
          {/* Liquid surface */}
          <ellipse 
            cx="50" cy="35" rx={isCooking ? 30 * (progress/100) : 32} ry={isCooking ? 6 * (progress/100) : 7} 
            fill={isBurnt ? '#000000' : brothColor} 
            stroke={isBurnt ? 'none' : 'rgba(0,0,0,0.2)'}
            strokeWidth="1"
            className="transition-all duration-300"
          />
          
          {/* Cooking visuals */}
          {isCooking && (
            <g>
              <circle cx="50" cy="35" r="25" fill={brothColor} opacity="0.3" />
              {COOKING_BUBBLES(brothColor === '#fef3c7' ? '#d1d5db' : '#fbbf24')}
              {/* Gauge at top */}
              <MiniGauge progress={progress} type="cook" x={20} y={5} />
            </g>
          )}

          {/* Done visuals */}
          {isDone && (
            <g>
              {STEAM_EFFECT}
              {/* Burn Gauge at top - Decreasing */}
              <MiniGauge progress={progress} type="burn" x={20} y={5} />
            </g>
          )}

          {/* Burnt visuals */}
          {isBurnt && (
            <g>
               <path d="M30 35 L40 25 M60 35 L70 25" stroke="black" strokeWidth="4" />
               <text x="50" y="50" textAnchor="middle" fontSize="30" fill="white">☠️</text>
            </g>
          )}
        </>
      )}
      
      {/* Empty State Hint */}
      {isEmpty && (
        <text x="50" y="60" textAnchor="middle" fontSize="10" fill="#9ca3af" fontWeight="bold">TOUCH</text>
      )}
    </svg>
  );
};

// --- 2. Rice Pot (Sotbap) ---
interface SotbapAssetProps {
  status: CookingStatus;
  progress: number;
}

export const SotbapAsset: React.FC<SotbapAssetProps> = ({ status, progress }) => {
  const isCooking = status === CookingStatus.COOKING;
  const isDone = status === CookingStatus.DONE;
  const isBurnt = status === CookingStatus.BURNT;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md overflow-visible">
       {/* Wood Base / Trivet */}
       <rect x="20" y="72" width="60" height="6" rx="1" fill="#5D4037" stroke="black" strokeWidth="2" />

       {/* Pot Body (Silver/Stone) - Much Flatter & Wider */}
       <path d="M15 45 Q15 72 50 72 Q85 72 85 45 L15 45 Z" fill="#9ca3af" stroke="#000" strokeWidth={STROKE_WIDTH} />
       
       {/* Fire under pot */}
       {(isCooking || isBurnt) && (
         <path d="M30 85 L35 78 L40 85 L50 75 L60 85 L65 78 L70 85 Z" fill="#ea580c" stroke="black" strokeWidth="1" className="animate-pulse" />
       )}

       {/* Lid - Adjusted to match new width */}
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

       {/* Rice Mound */}
       {isDone && (
         <g>
           <ellipse cx="50" cy="45" rx="32" ry="8" fill="#ffffff" stroke="#ddd" strokeWidth="1" />
           <circle cx="35" cy="43" r="3" fill="#e5e7eb" />
           <circle cx="50" cy="46" r="3" fill="#e5e7eb" />
           <circle cx="65" cy="44" r="3" fill="#e5e7eb" />
           {STEAM_EFFECT}
         </g>
       )}
       
       {isBurnt && <text x="50" y="60" textAnchor="middle" fontSize="24">🔥</text>}

       {/* Gauges - Positioned at Top */}
       {isCooking && <MiniGauge progress={progress} type="cook" x={20} y={10} />}
       {isDone && <MiniGauge progress={progress} type="burn" x={20} y={10} />}
    </svg>
  );
};

// --- 3. Customer (Retro Pixel Style) ---
interface CustomerAssetProps {
  seed: number; 
  mood: 'happy' | 'angry' | 'normal';
}

export const CustomerAsset: React.FC<CustomerAssetProps> = ({ seed, mood }) => {
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  const shirtColor = colors[seed % colors.length];
  const skinColor = '#fca5a5';

  const isAngry = mood === 'angry';

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
       {/* Body */}
       <rect x="25" y="60" width="50" height="40" rx="4" fill={shirtColor} stroke="black" strokeWidth={STROKE_WIDTH} />
       
       {/* Head */}
       <rect x="30" y="20" width="40" height="40" rx="4" fill={skinColor} stroke="black" strokeWidth={STROKE_WIDTH} />
       
       {/* Hair */}
       <path d="M30 20 L70 20 L70 35 L60 35 L60 25 L40 25 L40 35 L30 35 Z" fill="#1f2937" stroke="black" strokeWidth="1" />

       {/* Face */}
       {isAngry ? (
         <g>
           <rect x="35" y="35" width="8" height="2" fill="black" transform="rotate(15 39 36)" />
           <rect x="57" y="35" width="8" height="2" fill="black" transform="rotate(-15 61 36)" />
           <rect x="42" y="50" width="16" height="4" fill="red" />
           {/* Angry steam */}
           <path d="M80 30 L90 20 M85 35 L95 25" stroke="red" strokeWidth="3" />
         </g>
       ) : (
         <g>
           <rect x="38" y="38" width="6" height="6" fill="black" />
           <rect x="56" y="38" width="6" height="6" fill="black" />
           <rect x="45" y="52" width="10" height="2" fill="black" />
         </g>
       )}
    </svg>
  );
};

// --- 4. Master Pot ---
export const MasterPotAsset: React.FC<{ health: number }> = ({ health }) => {
  const isCritical = health < 30;
  
  return (
    <svg viewBox="0 0 100 105" className="w-full h-full">
      {/* Legs */}
      <rect x="20" y="80" width="10" height="20" fill="#374151" stroke="black" strokeWidth="2" />
      <rect x="70" y="80" width="10" height="20" fill="#374151" stroke="black" strokeWidth="2" />
      
      {/* Cauldron Body */}
      <path d="M10 30 Q10 90 50 90 Q90 90 90 30 Z" fill="#111827" stroke="#000" strokeWidth={4} />
      
      {/* Rim */}
      <ellipse cx="50" cy="30" rx="40" ry="10" fill="#1f2937" stroke="#4b5563" strokeWidth="2" />
      
      {/* Liquid */}
      <ellipse cx="50" cy="30" rx={35 * (health/100)} ry={8 * (health/100)} 
        fill={isCritical ? '#7f1d1d' : '#fef3c7'} 
        className="transition-all duration-500"
      />
      
      {/* Fire */}
      <path d="M20 100 L30 85 L40 100 L50 80 L60 100 L70 85 L80 100 Z" fill="#ea580c" stroke="black" strokeWidth="1" className="animate-pulse" />
      
      {isCritical && (
         <text x="50" y="60" textAnchor="middle" fontSize="30" className="animate-bounce">⚠️</text>
      )}
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