import React from 'react';
import { RotateCw, AlertTriangle } from 'lucide-react';
import { MasterPotAsset } from './GameAssets';
import { MASTER_POT_WARNING_THRESHOLD } from '../constants';

interface MasterPotProps {
  health: number; // 0 to 100
  onStir: () => void;
}

const MasterPot: React.FC<MasterPotProps> = ({ health, onStir }) => {
  const needsStirring = health < MASTER_POT_WARNING_THRESHOLD;

  return (
    <div className="relative flex flex-col items-center justify-end w-32 h-40 shrink-0">
      {/* Label */}
      <div className="absolute top-0 text-xs text-yellow-100 bg-red-900 px-2 py-1 rounded border border-yellow-600 z-10 shadow-md whitespace-nowrap">
        진한 사골육수
      </div>

      <div className="w-full h-full px-2 pt-2 pb-0">
         <MasterPotAsset health={health} />
      </div>

      {/* Stir Button - Only shows when attention is needed */}
      {needsStirring ? (
        <button 
          onClick={onStir}
          className="absolute -right-4 bottom-8 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white p-3 rounded-full border-2 border-white shadow-[0_0_15px_rgba(239,68,68,0.8)] z-20 pixel-btn active:scale-90 transition-transform animate-bounce"
          aria-label="육수 젓기"
        >
          <RotateCw size={24} className="animate-[spin_3s_linear_infinite]" />
          <div className="absolute -top-2 -right-2 bg-yellow-400 text-red-900 rounded-full p-1 border border-black">
            <AlertTriangle size={12} />
          </div>
        </button>
      ) : (
        // Optional visual indicator that it's okay (or just nothing)
        <div className="absolute -right-2 bottom-10 opacity-50">
           <span className="text-xs text-green-400 font-mono">OK...</span>
        </div>
      )}
    </div>
  );
};

export default MasterPot;