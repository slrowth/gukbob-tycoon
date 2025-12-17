import React from 'react';

interface ReputationBarProps {
  health: number;
}

const ReputationBar: React.FC<ReputationBarProps> = ({ health }) => {
  // Determine color based on health
  let barColor = 'bg-green-500';
  if (health < 60) barColor = 'bg-yellow-500';
  if (health < 30) barColor = 'bg-red-600 animate-pulse';

  return (
    <div className="w-full flex items-center gap-2">
      <span className="text-xs font-bold text-white bg-black px-2 py-0.5 rounded border border-gray-500 shrink-0">
        단골 신뢰도
      </span>
      <div className="flex-1 h-4 bg-gray-900 border border-white rounded relative overflow-hidden shadow-lg">
         {/* Background pattern */}
         <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xIDFoMnYySDF6IiBmaWxsPSIjZmZmIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')]"></div>
         
         {/* Health Bar */}
         <div 
           className={`h-full transition-all duration-300 ease-out ${barColor}`}
           style={{ width: `${Math.max(0, Math.min(100, health))}%` }}
         >
            {/* Shine effect */}
            <div className="w-full h-1/2 bg-white/30"></div>
         </div>
         
         {/* Percentage Text Overlay */}
         <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-mono text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              {Math.floor(health)}%
            </span>
         </div>
      </div>
    </div>
  );
};

export default ReputationBar;