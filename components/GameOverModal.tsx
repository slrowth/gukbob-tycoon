import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  onRestart: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ score, onRestart }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call to save data
    console.log('Lead Captured:', { score, email });
    setSubmitted(true);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="bg-white w-full max-w-md p-6 rounded-lg border-4 border-red-600 shadow-2xl text-center">
        <h2 className="text-5xl font-black tracking-widest mb-4 leading-normal" style={{
            background: 'linear-gradient(180deg, #EF4444 0%, #991B1B 100%)', // Red gradient for Game Over
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(3px 3px 0px #000000)'
          }}>
          영업 종료!
        </h2>
        <p className="text-gray-800 mb-6 font-bold">육수가 타버렸거나 손님이 화가 났어요.</p>
        
        <div className="bg-yellow-100 p-4 rounded-lg border-2 border-yellow-400 mb-6">
          <p className="text-sm text-yellow-800 font-bold">최종 매출</p>
          <p className="text-4xl font-black text-yellow-900 drop-shadow-sm">₩ {score.toLocaleString()}</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="mb-6 text-left">
            <label className="block text-xs font-bold text-gray-700 mb-1">
              랭킹 등록 & 이벤트 참여 (이메일)
            </label>
            <div className="flex gap-2">
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 border-2 border-gray-300 rounded px-3 py-2 text-sm focus:border-red-500 outline-none font-sans"
                placeholder="example@email.com"
              />
              <button 
                type="submit"
                className="bg-red-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-red-700 pixel-btn shadow-md"
              >
                등록
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              * 1953형제돼지국밥의 프로모션 소식을 받아보세요.
            </p>
          </form>
        ) : (
          <div className="bg-green-100 text-green-800 p-3 rounded mb-6 text-sm font-bold border border-green-300">
            등록되었습니다! 감사합니다.
          </div>
        )}

        <button 
          onClick={onRestart}
          className="w-full bg-gray-900 border-4 border-gray-600 py-4 rounded-lg hover:bg-gray-800 active:translate-y-1 transition-all flex items-center justify-center gap-3 group relative overflow-hidden pixel-btn"
        >
           {/* Retro Shine Effect */}
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-[shine_1s_infinite]"></div>
           
           <RotateCcw size={28} className="text-yellow-500" />
           <span className="text-3xl font-black tracking-widest" style={{
             background: 'linear-gradient(180deg, #FCD34D 0%, #EA580C 100%)',
             WebkitBackgroundClip: 'text',
             WebkitTextFillColor: 'transparent',
             filter: 'drop-shadow(2px 2px 0px #000000)'
           }}>
             다시 장사하기
           </span>
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;