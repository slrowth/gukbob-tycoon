import React from 'react';
import { Inventory, BrothType } from '../types';
import { BROTH_COLORS, BROTH_LABELS } from '../constants';
import { SmallIconGukbap, SmallIconRice } from './GameAssets';

interface InventoryDisplayProps {
  inventory: Inventory;
}

const InventoryDisplay: React.FC<InventoryDisplayProps> = ({ inventory }) => {
  return (
    <div className="flex justify-between items-center bg-gray-900 p-3 rounded-lg border-2 border-gray-600 mt-2 shadow-lg">
      <div className="text-xs text-gray-400 font-bold mr-2">준비된<br/>음식</div>
      <div className="flex flex-1 justify-around items-center">
        {(Object.values(BrothType) as BrothType[]).map(broth => (
           <div key={broth} className="flex flex-col items-center">
             <div className="relative">
                <div className="scale-150 mb-1">
                  <SmallIconGukbap type={broth} />
                </div>
                {inventory[broth] > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold px-1 rounded-full min-w-[16px] text-center border border-white">
                    {inventory[broth]}
                  </span>
                )}
             </div>
             <span className={`text-[10px] px-1 rounded mt-1 opacity-80 ${BROTH_COLORS[broth]}`}>
               {BROTH_LABELS[broth]}
             </span>
           </div>
        ))}
        
        <div className="w-px h-8 bg-gray-700 mx-1"></div>

        <div className="flex flex-col items-center">
           <div className="relative">
             <div className="scale-150 mb-1">
                <SmallIconRice />
             </div>
             {inventory.rice > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold px-1 rounded-full min-w-[16px] text-center border border-white">
                  {inventory.rice}
                </span>
             )}
           </div>
           <span className="text-[10px] text-gray-300 font-bold mt-1">솥밥</span>
        </div>
      </div>
    </div>
  );
};

export default InventoryDisplay;