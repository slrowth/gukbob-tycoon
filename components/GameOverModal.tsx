import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { LeaderboardEntry } from '../types';

interface GameOverModalProps {
  score: number;
  onRestart: () => void;
  onHome: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ score, onRestart, onHome }) => {
  const [nickname, setNickname] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isListLoading, setIsListLoading] = useState(false);

  // Check config and fetch leaderboard on mount
  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
    if (isSupabaseConfigured()) {
      fetchLeaderboard();
    }
  }, [showAll]);

  const fetchLeaderboard = async () => {
    setIsListLoading(true);
    const limit = showAll ? 100 : 10;
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);

    if (!error && data) {
      setLeaderboard(data);
    }
    setIsListLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    
    setLoading(true);
    
    // Insert score to Supabase
    const { error } = await supabase
      .from('leaderboard')
      .insert([{ nickname: nickname.substring(0, 10), score }]); // Limit nickname length

    setLoading(false);

    if (!error) {
      setSubmitted(true);
      fetchLeaderboard(); // Refresh list
    } else {
      console.error("Error submitting score:", error);
      alert("점수 등록에 실패했습니다.");
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Background with Night Gradient matching Intro */}
      <div 
        className="absolute inset-0 bg-black/95 z-0"
        style={{
          background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 60%, #172554 100%)' 
        }}
      >
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
      
      <style>{`
        @keyframes snow {
          0% { transform: translateY(-10px); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `}</style>

      {/* Main Modal Card */}
      <div className="relative z-10 w-full max-w-sm h-[90%] mx-4 bg-orange-50 rounded-xl border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.5)] text-center flex flex-col p-4">
        {/* Header Ribbon */}
        <div className="relative -top-8 mb-[-20px] shrink-0">
           <div className="bg-red-600 text-white py-2 px-6 inline-block border-2 border-white shadow-md transform -rotate-2">
              <h2 className="text-3xl font-black tracking-widest drop-shadow-md">영업 종료!</h2>
           </div>
        </div>

        <p className="text-gray-800 font-bold mt-4 shrink-0">
           수고하셨습니다, 사장님!
        </p>
        
        {/* Score Board */}
        <div className="bg-gray-800 p-2 rounded-lg border-4 border-gray-600 my-4 shadow-inner relative overflow-hidden shrink-0">
          <p className="text-xs text-gray-400 font-bold mb-1">FINAL SCORE</p>
          <p className="text-4xl font-black text-yellow-400 font-mono tracking-widest drop-shadow-[2px_2px_0_#000]">
            ₩ {score.toLocaleString()}
          </p>
        </div>

        {/* Form Area */}
        {isConfigured ? (
          !submitted ? (
            <form onSubmit={handleSubmit} className="mb-4 text-left bg-white p-2 rounded border-2 border-gray-200 shrink-0">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                랭킹 등록 (닉네임)
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  required
                  maxLength={8}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="flex-1 border-2 border-gray-300 rounded px-2 py-2 text-sm focus:border-red-500 outline-none font-sans bg-gray-50 text-black uppercase"
                  placeholder="AAA"
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-black text-white px-3 py-2 rounded font-bold text-sm hover:bg-gray-800 pixel-btn disabled:opacity-50"
                >
                  {loading ? '...' : '등록'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-green-100 text-green-800 p-2 rounded mb-4 text-sm font-bold border border-green-300 shrink-0">
              랭킹에 등록되었습니다!
            </div>
          )
        ) : (
           <div className="mb-4 bg-gray-200 border-2 border-gray-400 rounded p-3 text-center shrink-0">
             <div className="flex justify-center mb-1 text-gray-600">
                <AlertCircle size={20} />
             </div>
             <p className="text-xs text-gray-600 font-bold">
               랭킹 시스템 미설정<br/>
               <span className="font-normal text-[10px]">(메인 화면의 설정에서 API 키를 등록하세요)</span>
             </p>
           </div>
        )}

        {/* Leaderboard List */}
        <div className="flex-1 bg-white border-2 border-gray-300 rounded-lg p-2 overflow-hidden flex flex-col min-h-0">
          <div className="flex justify-between items-center border-b-2 border-gray-100 pb-2 mb-2">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Trophy size={14} className="text-yellow-500" />
              명예의 전당
            </h3>
            <button 
              onClick={() => setShowAll(!showAll)}
              className="text-[10px] text-gray-500 flex items-center hover:text-black"
            >
              {showAll ? '접기' : '더보기'} 
              {showAll ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
            </button>
          </div>
          
          <div className="overflow-y-auto flex-1 no-scrollbar space-y-1">
            {!isConfigured ? (
               <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                 데이터 없음
               </div>
            ) : isListLoading ? (
               <div className="flex justify-center py-4 gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150"></div>
               </div>
            ) : leaderboard.length === 0 ? (
              <div className="flex items-center justify-center h-full flex-col gap-2">
                 <p className="text-xs text-gray-400 font-bold">아직 기록이 없습니다.</p>
                 <p className="text-[10px] text-gray-400">첫 번째로 이름을 올려보세요!</p>
              </div>
            ) : (
              leaderboard.map((entry, index) => (
                <div 
                  key={entry.id} 
                  className={`flex justify-between items-center text-xs p-1 rounded ${entry.nickname === nickname && submitted ? 'bg-yellow-100 border border-yellow-300' : 'even:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 text-center font-bold ${index < 3 ? 'text-red-500' : 'text-gray-500'}`}>
                      {index + 1}
                    </span>
                    <span className="font-bold text-gray-800 truncate max-w-[80px]">
                      {entry.nickname}
                    </span>
                  </div>
                  <span className="font-mono text-gray-600">
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              ))
            )}
            {showAll && isConfigured && leaderboard.length > 0 && (
               <div className="text-[10px] text-gray-400 text-center pt-2">
                 최대 100위까지 표시됩니다.
               </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-2 shrink-0">
          <button 
            onClick={onRestart}
            className="w-full bg-gray-900 border-4 border-gray-600 py-3 rounded-lg hover:bg-gray-800 active:translate-y-1 transition-all flex items-center justify-center gap-2 group relative overflow-hidden pixel-btn"
          >
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-[shine_1s_infinite]"></div>
             <RotateCcw size={18} className="text-yellow-500" />
             <span className="text-lg font-black tracking-widest text-yellow-500 drop-shadow-md">
               다시 하기
             </span>
          </button>

          <button 
            onClick={onHome}
            className="text-xs font-bold text-gray-500 hover:text-black hover:underline transition-colors"
          >
            메인 화면으로
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;