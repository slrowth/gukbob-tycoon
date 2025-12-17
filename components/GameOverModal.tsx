import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  onRestart: () => void;
  onHome: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ score, onRestart, onHome }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call to save data
    console.log('Lead Captured:', { score, email });
    setSubmitted(true);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Background with Night Gradient matching Intro */}
      <div 
        className="absolute inset-0 bg-black/95 z-0"
        style={{
          background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 60%, #172554 100%)' // Night Sky Gradient
        }}
      >
        {/* Snow Effect for consistency */}
        <div className="absolute inset-0 pointer-events-none opacity-50">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute bg-white rounded-full opacity-0"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}px`,
                width: `${Math.random() * 2 + 2}px`,
                height: `${Math.random() * 2 + 2}px`,
                animation: `snow ${Math.random() * 2 + 2}s linear infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Defines Snow Animation locally if not inherited, though App.tsx has it global style usually */}
      <style>{`
        @keyframes snow {
          0% { transform: translateY(-10px); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `}</style>

      {/* Main Modal Card - Retro Style */}
      <div className="relative z-10 w-full max-w-sm p-6 mx-4 bg-orange-50 rounded-xl border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.5)] text-center">
        {/* Header Ribbon */}
        <div className="relative -top-10 mb-[-20px]">
           <div className="bg-red-600 text-white py-2 px-6 inline-block border-2 border-white shadow-md transform -rotate-2">
              <h2 className="text-4xl font-black tracking-widest drop-shadow-md">영업 종료!</h2>
           </div>
        </div>

        <p className="text-gray-800 mb-6 font-bold mt-4">
           오늘의 장사가 끝났습니다.<br/>
           <span className="text-xs text-red-600">육수가 탔거나 손님이 화났어요!</span>
        </p>
        
        {/* Score Board */}
        <div className="bg-gray-800 p-4 rounded-lg border-4 border-gray-600 mb-6 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/5 pointer-events-none"></div>
          <p className="text-xs text-gray-400 font-bold mb-1">FINAL SCORE</p>
          <p className="text-4xl font-black text-yellow-400 font-mono tracking-widest drop-shadow-[2px_2px_0_#000]">
            ₩ {score.toLocaleString()}
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="mb-6 text-left bg-white p-3 rounded border-2 border-gray-200">
            <label className="block text-xs font-bold text-gray-700 mb-1">
              랭킹 등록 (이메일)
            </label>
            <div className="flex gap-2">
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 border-2 border-gray-300 rounded px-2 py-2 text-sm focus:border-red-500 outline-none font-sans bg-gray-50"
                placeholder="example@email.com"
              />
              <button 
                type="submit"
                className="bg-black text-white px-3 py-2 rounded font-bold text-sm hover:bg-gray-800 pixel-btn"
              >
                등록
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-green-100 text-green-800 p-3 rounded mb-6 text-sm font-bold border border-green-300">
            등록되었습니다! 감사합니다.
          </div>
        )}

        {/* Restart Button */}
        <button 
          onClick={onRestart}
          className="w-full bg-gray-900 border-4 border-gray-600 py-4 rounded-lg hover:bg-gray-800 active:translate-y-1 transition-all flex items-center justify-center gap-3 group relative overflow-hidden pixel-btn"
        >
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-[shine_1s_infinite]"></div>
           <RotateCcw size={24} className="text-yellow-500" />
           <span className="text-2xl font-black tracking-widest text-yellow-500 drop-shadow-md">
             다시 장사하기
           </span>
        </button>

        <button 
          onClick={onHome}
          className="mt-4 text-xs font-bold text-gray-500 hover:text-black hover:underline transition-colors"
        >
          메인 화면으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;