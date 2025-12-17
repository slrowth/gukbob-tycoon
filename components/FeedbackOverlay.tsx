import React from 'react';
import { FeedbackEffect } from '../types';

interface FeedbackOverlayProps {
  effects: FeedbackEffect[];
}

const FeedbackOverlay: React.FC<FeedbackOverlayProps> = ({ effects }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {effects.map((effect) => (
        <div
          key={effect.id}
          className="absolute font-bold text-shadow-pixel animate-[floatUp_1s_ease-out_forwards]"
          style={{ 
            left: effect.x, 
            top: effect.y,
            textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
          }}
        >
          <span className={`
            text-xl whitespace-nowrap px-2 py-1 rounded
            ${effect.type === 'score' ? 'text-yellow-300' : ''}
            ${effect.type === 'heal' ? 'text-green-400' : ''}
            ${effect.type === 'damage' ? 'text-red-500 text-2xl' : ''}
            ${effect.type === 'info' ? 'text-white' : ''}
          `}>
            {effect.text}
          </span>
        </div>
      ))}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 1; }
          100% { transform: translateY(-40px) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default FeedbackOverlay;