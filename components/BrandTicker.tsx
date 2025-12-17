import React from 'react';

interface BrandTickerProps {
  message: string;
}

const BrandTicker: React.FC<BrandTickerProps> = ({ message }) => {
  return (
    <div className="w-full relative mb-4 px-2">
      {/* Speech Bubble */}
      <div className="bg-white text-black p-3 rounded-xl border-2 border-black shadow-lg relative animate-[bounce_2s_infinite]">
         <div className="flex flex-col items-center">
             <span className="text-[10px] bg-red-600 text-white px-1 rounded mb-1 font-bold">1953 MESSAGE</span>
             <p className="text-xs font-bold text-center leading-tight break-keep">
               {message}
             </p>
         </div>
         {/* Tail */}
         <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-black rotate-45"></div>
      </div>
    </div>
  );
};

export default BrandTicker;