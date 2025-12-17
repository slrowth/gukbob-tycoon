import React, { useState } from 'react';
import { GukbapPot, BrothType, CookingStatus } from '../types';
import { BROTH_COLORS, BROTH_LABELS } from '../constants';
import { GukbapAsset, SmallIconGukbap } from './GameAssets';

interface StoveProps {
  pots: GukbapPot[];
  onInteract: (potId: number, selectedBroth?: BrothType) => void;
}

const Stove: React.FC<StoveProps> = ({ pots, onInteract }) => {
  const [selectedPotId, setSelectedPotId] = useState<number | null>(null);

  const handlePotClick = (pot: GukbapPot) => {
    if (pot.status === CookingStatus.EMPTY) {
      setSelectedPotId(pot.id);
    } else {
      // If cooked or burnt, interact immediately (collect or clean)
      onInteract(pot.id);
    }
  };

  const handleBrothSelect = (broth: BrothType) => {
    if (selectedPotId !== null) {
      onInteract(selectedPotId, broth);
      setSelectedPotId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 p-2 rounded-lg border-4 border-gray-600 relative shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
      {/* Header Label - Compact */}
      <div className="text-center text-[10px] text-white bg-gray-700/80 rounded py-0.5 mb-1 font-bold shadow-sm border border-gray-500">
        국밥 조리대
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-3 gap-1 flex-1 relative content-start overflow-y-auto no-scrollbar">
        {/* Broth Selection Modal Overlay */}
        {selectedPotId !== null && (
          <div className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center p-2 rounded backdrop-blur-sm border-2 border-white/20">
            <p className="text-white text-sm mb-2 font-bold animate-pulse">육수 선택</p>
            <div className="flex flex-col gap-2 w-full px-2">
              {(Object.values(BrothType) as BrothType[]).map((broth) => (
                <button
                  key={broth}
                  onClick={() => handleBrothSelect(broth)}
                  className={`w-full py-2 px-2 text-sm font-bold rounded-lg border-2 border-white/50 shadow-lg transform transition-transform hover:scale-105 active:scale-95 ${BROTH_COLORS[broth]} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2">
                     <SmallIconGukbap type={broth} />
                     <span>{BROTH_LABELS[broth]}</span>
                  </div>
                  <span className="text-[10px] opacity-70">COOK</span>
                </button>
              ))}
              <button 
                onClick={() => setSelectedPotId(null)}
                className="mt-2 py-1 text-xs text-white bg-gray-700 w-full rounded hover:bg-gray-600"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {pots.map((pot) => {
          const isDone = pot.status === CookingStatus.DONE;
          const isBurnt = pot.status === CookingStatus.BURNT;
          
          return (
            <button
              key={pot.id}
              onClick={() => handlePotClick(pot)}
              disabled={selectedPotId !== null}
              className={`
                relative w-full aspect-square rounded-xl flex items-center justify-center
                transition-transform active:scale-95
                bg-gray-700/50 border-2 border-gray-600 overflow-visible
                ${isDone ? 'ring-4 ring-red-500 ring-inset animate-[pulse_0.5s_infinite]' : ''}
                ${isBurnt ? 'ring-4 ring-gray-900 ring-inset' : ''}
              `}
              style={{ minHeight: '44px' }}
            >
               <div className="w-full h-full p-1">
                 <GukbapAsset 
                   status={pot.status} 
                   brothType={pot.brothType} 
                   progress={pot.progress} 
                 />
               </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Stove;