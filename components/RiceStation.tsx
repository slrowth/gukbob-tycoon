import React from 'react';
import { RicePot, CookingStatus } from '../types';
import { SotbapAsset } from './GameAssets';

interface RiceStationProps {
  pots: RicePot[];
  onInteract: (id: number) => void;
}

const RiceStation: React.FC<RiceStationProps> = ({ pots, onInteract }) => {
  return (
    <div className="flex flex-col gap-0.5 bg-gray-800 p-1 rounded-lg border-4 border-gray-600 h-full justify-between shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Header Label with Line Break */}
      <div className="text-center text-xs text-white bg-gray-700/80 rounded py-1 mb-0.5 font-bold shadow-sm border border-gray-500 leading-tight">
        솥밥<br/>조리대
      </div>
      
      {/* Pots Container - Tighter gaps */}
      <div className="flex flex-col gap-0.5 flex-1 justify-around min-h-0">
        {pots.map((pot) => {
          const isDone = pot.status === CookingStatus.DONE;
          const isBurnt = pot.status === CookingStatus.BURNT;
          
          return (
            <button
              key={pot.id}
              onClick={() => onInteract(pot.id)}
              className={`
                relative flex-1 w-full rounded-lg flex items-center justify-center p-0.5
                transition-all active:scale-95 overflow-hidden
                ${pot.status === CookingStatus.EMPTY ? 'opacity-50 hover:opacity-70' : 'opacity-100'}
                ${isDone ? 'ring-2 ring-green-400 ring-inset z-10' : ''}
                ${isBurnt ? 'ring-2 ring-red-600 ring-inset z-10' : ''}
              `}
            >
               <div className="w-full h-full">
                 <SotbapAsset status={pot.status} progress={pot.progress} />
               </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RiceStation;