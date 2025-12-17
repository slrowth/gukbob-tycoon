import React, { useState, useEffect, useRef } from 'react';
import { 
  GamePhase, 
  GukbapPot, 
  RicePot, 
  Customer, 
  BrothType, 
  CookingStatus, 
  Inventory,
  FeedbackEffect,
  LeaderboardEntry
} from './types';
import { 
  GAME_TICK_MS, 
  COOKING_TIME_GUKBAP, 
  BURN_TIME_GUKBAP, 
  COOKING_TIME_RICE, 
  BURN_TIME_RICE,
  MASTER_POT_DECAY,
  MASTER_POT_STIR_RECOVERY,
  MASTER_POT_WARNING_THRESHOLD,
  CUSTOMER_SPAWN_RATE,
  MAX_SPAWN_RATE,
  CUSTOMER_MAX_PATIENCE,
  CUSTOMER_PATIENCE_DECAY,
  MAX_HEALTH,
  START_HEALTH,
  HEALTH_DECAY_BASE,
  HEALTH_DECAY_RAMP,
  HEALTH_DAMAGE_MISS,
  HEALTH_DAMAGE_BURN,
  HEALTH_RECOVER_PERFECT,
  HEALTH_RECOVER_GOOD,
  SCORE_PERFECT,
  SCORE_GOOD,
  SCORE_BAD,
  BRAND_MESSAGES,
  LEVEL_DURATION_TICKS
} from './constants';
import { fetchLeaderboard, isApiConfigured } from './apiClient';

import Stove from './components/Stove';
import RiceStation from './components/RiceStation';
import MasterPot from './components/MasterPot';
import CustomerQueue from './components/CustomerQueue';
import InventoryDisplay from './components/InventoryDisplay';
import GameOverModal from './components/GameOverModal';
import BrandTicker from './components/BrandTicker';
import ReputationBar from './components/ReputationBar';
import FeedbackOverlay from './components/FeedbackOverlay';
import SettingsModal from './components/SettingsModal';
import { MasterPotAsset, BrotherAsset } from './components/GameAssets';
import { Menu, Trophy } from 'lucide-react';

const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 800;

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.INTRO);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [health, setHealth] = useState(START_HEALTH);
  const [masterPotHealth, setMasterPotHealth] = useState(100);
  const [brandMessage, setBrandMessage] = useState<string>(BRAND_MESSAGES.DEFAULT);
  const [gameTime, setGameTime] = useState(0);
  const [topRankers, setTopRankers] = useState<LeaderboardEntry[]>([]);
  const [isRankLoading, setIsRankLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [, setSecretClickCount] = useState(0);
  const [scale, setScale] = useState(1);
  const [effects, setEffects] = useState<FeedbackEffect[]>([]);
  
  const [gukbapPots, setGukbapPots] = useState<GukbapPot[]>(
    Array.from({ length: 9 }, (_, i) => ({ id: i, status: CookingStatus.EMPTY, brothType: null, progress: 0 }))
  );
  const [ricePots, setRicePots] = useState<RicePot[]>(
    Array.from({ length: 4 }, (_, i) => ({ id: i, status: CookingStatus.EMPTY, progress: 0 }))
  );
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<Inventory>({
    [BrothType.MILKY]: 0,
    [BrothType.CLEAR]: 0,
    [BrothType.MALA]: 0,
    rice: 0
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const scaleX = windowWidth / DESIGN_WIDTH;
      const scaleY = windowHeight / DESIGN_HEIGHT;
      setScale(Math.min(scaleX, scaleY));
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (phase === GamePhase.INTRO && isApiConfigured()) {
       const loadTopRankers = async () => {
         setIsRankLoading(true);
         const data = await fetchLeaderboard();
         if (data && data.length > 0) {
           setTopRankers(data.slice(0, 3));
         }
         setIsRankLoading(false);
       };
       loadTopRankers();
    }
  }, [phase]);

  const handleSecretClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSecretClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        setShowSettings(true);
        return 0;
      }
      return newCount;
    });
  };

  const addEffect = (text: string, type: FeedbackEffect['type'], x: number | 'center', y: number | 'center') => {
    if (!containerRef.current) return;
    let effectX = x === 'center' ? DESIGN_WIDTH / 2 : x as number;
    let effectY = y === 'center' ? containerRef.current.offsetHeight / 2 : y as number;
    const newEffect: FeedbackEffect = { id: Date.now() + Math.random(), x: effectX, y: effectY, text, type };
    setEffects(prev => [...prev, newEffect]);
    setTimeout(() => setEffects(prev => prev.filter(e => e.id !== newEffect.id)), 1000);
  };

  useEffect(() => {
    if (phase !== GamePhase.PLAYING) return;
    const interval = setInterval(() => {
      let nextTime = 0;
      setGameTime(prev => { nextTime = prev + 1; return nextTime; });
      const calculatedLevel = Math.floor(nextTime / LEVEL_DURATION_TICKS) + 1;
      const difficultyMultiplier = Math.pow(1.2, calculatedLevel - 1);
      if (calculatedLevel > level) {
        setLevel(calculatedLevel);
        addEffect(`LEVEL ${calculatedLevel}!`, 'score', 'center', 'center');
        setBrandMessage(`속도 증가! 레벨 ${calculatedLevel} 시작!`);
      }
      if (health <= 0 || masterPotHealth <= 0) { setPhase(GamePhase.GAMEOVER); return; }
      setHealth(prev => Math.max(0, prev - (HEALTH_DECAY_BASE + (nextTime * HEALTH_DECAY_RAMP))));
      setMasterPotHealth(prev => prev - (MASTER_POT_DECAY * difficultyMultiplier));
      setGukbapPots(prevPots => prevPots.map(pot => {
        if (pot.status === CookingStatus.COOKING) {
          const newProgress = pot.progress + (100 / COOKING_TIME_GUKBAP);
          if (newProgress >= 100) return { ...pot, status: CookingStatus.DONE, progress: 0 }; 
          return { ...pot, progress: newProgress };
        } 
        if (pot.status === CookingStatus.DONE) {
          const burnProgress = pot.progress + ((100 / (BURN_TIME_GUKBAP - COOKING_TIME_GUKBAP)) * difficultyMultiplier);
          if (burnProgress >= 100) return { ...pot, status: CookingStatus.BURNT, progress: 100 };
          return { ...pot, progress: burnProgress };
        }
        return pot;
      }));
      setRicePots(prevPots => prevPots.map(pot => {
        if (pot.status === CookingStatus.COOKING) {
          const newProgress = pot.progress + (100 / COOKING_TIME_RICE);
          if (newProgress >= 100) return { ...pot, status: CookingStatus.DONE, progress: 0 };
          return { ...pot, progress: newProgress };
        }
        if (pot.status === CookingStatus.DONE) {
           const burnProgress = pot.progress + ((100 / (BURN_TIME_RICE - COOKING_TIME_RICE)) * difficultyMultiplier);
           if (burnProgress >= 100) return { ...pot, status: CookingStatus.BURNT, progress: 100 };
           return { ...pot, progress: burnProgress };
        }
        return pot;
      }));
      setCustomers(prevCustomers => {
        let updated = prevCustomers.map(c => ({ ...c, patience: c.patience - (CUSTOMER_PATIENCE_DECAY * difficultyMultiplier) }));
        const keptCustomers = updated.filter(c => c.patience > 0);
        if (keptCustomers.length < updated.length) {
            setHealth(prev => Math.max(0, prev - HEALTH_DAMAGE_MISS));
            addEffect("😡 손님 분노!", 'damage', 'center', 50);
        }
        const currentSpawnRate = Math.min(MAX_SPAWN_RATE, CUSTOMER_SPAWN_RATE * difficultyMultiplier);
        if (keptCustomers.length < 5 && Math.random() < currentSpawnRate) {
           const broths = Object.values(BrothType) as BrothType[];
           keptCustomers.push({
             id: Date.now(),
             order: { broth: broths[Math.floor(Math.random() * broths.length)], needsRice: Math.random() > 0.3 },
             patience: CUSTOMER_MAX_PATIENCE,
             maxPatience: CUSTOMER_MAX_PATIENCE
           });
        }
        return keptCustomers;
      });
    }, GAME_TICK_MS);
    return () => clearInterval(interval);
  }, [phase, gameTime, health, masterPotHealth, level]);

  const stirMasterPot = () => {
    setMasterPotHealth(prev => Math.min(100, prev + MASTER_POT_STIR_RECOVERY));
    addEffect("육수 관리 OK!", 'info', 60, 300);
  };

  const handleGukbapInteract = (potId: number, selectedBroth?: BrothType) => {
    setGukbapPots(prev => prev.map(pot => {
      if (pot.id !== potId) return pot;
      if (pot.status === CookingStatus.EMPTY && selectedBroth) return { ...pot, status: CookingStatus.COOKING, brothType: selectedBroth, progress: 0 };
      if (pot.status === CookingStatus.DONE && pot.brothType) {
        setInventory(inv => ({ ...inv, [pot.brothType!]: inv[pot.brothType!] + 1 }));
        return { ...pot, status: CookingStatus.EMPTY, brothType: null, progress: 0 };
      }
      if (pot.status === CookingStatus.BURNT) return { ...pot, status: CookingStatus.EMPTY, brothType: null, progress: 0 };
      return pot;
    }));
  };

  const handleRiceInteract = (potId: number) => {
    setRicePots(prev => prev.map(pot => {
      if (pot.id !== potId) return pot;
      if (pot.status === CookingStatus.EMPTY) return { ...pot, status: CookingStatus.COOKING, progress: 0 };
      if (pot.status === CookingStatus.DONE) {
        setInventory(inv => ({ ...inv, rice: inv.rice + 1 }));
        return { ...pot, status: CookingStatus.EMPTY, progress: 0 };
      }
      if (pot.status === CookingStatus.BURNT) return { ...pot, status: CookingStatus.EMPTY, progress: 0 };
      return pot;
    }));
  };

  const handleServeCustomer = (customerId: number, event: React.MouseEvent<HTMLButtonElement>) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || !containerRef.current) return;
    const { broth, needsRice } = customer.order;
    if (inventory[broth] > 0 && (!needsRice || inventory.rice > 0)) {
      setInventory(prev => ({ ...prev, [broth]: prev[broth] - 1, rice: needsRice ? prev.rice - 1 : prev.rice }));
      const patiencePercent = (customer.patience / customer.maxPatience) * 100;
      let scoreToAdd = patiencePercent > 70 ? SCORE_PERFECT : patiencePercent > 30 ? SCORE_GOOD : SCORE_BAD;
      setScore(s => s + scoreToAdd);
      setHealth(h => Math.min(MAX_HEALTH, h + (patiencePercent > 70 ? HEALTH_RECOVER_PERFECT : patiencePercent > 30 ? HEALTH_RECOVER_GOOD : 0)));
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      addEffect(patiencePercent > 70 ? "+200 ❤️ PERFECT!" : "+100 👍 GOOD", patiencePercent > 70 ? 'score' : 'heal', 'center', 'center');
    } else {
       addEffect("재료 부족!", 'damage', 'center', 'center');
    }
  };

  const startActualGame = () => {
    setScore(0); setHealth(START_HEALTH); setLevel(1); setMasterPotHealth(100); setGameTime(0);
    setGukbapPots(Array.from({ length: 9 }, (_, i) => ({ id: i, status: CookingStatus.EMPTY, brothType: null, progress: 0 })));
    setRicePots(Array.from({ length: 4 }, (_, i) => ({ id: i, status: CookingStatus.EMPTY, progress: 0 })));
    setInventory({ [BrothType.MILKY]: 0, [BrothType.CLEAR]: 0, [BrothType.MALA]: 0, rice: 0 });
    setCustomers([]); setPhase(GamePhase.PLAYING);
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <style>{`
        @keyframes snow {
          0% { transform: translateY(-10px); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translateY(800px); opacity: 0; }
        }
      `}</style>
      <div 
        style={{ width: `${DESIGN_WIDTH}px`, height: `${DESIGN_HEIGHT}px`, transform: `scale(${scale})` }}
        className="relative bg-gray-900 text-white flex flex-col items-center shadow-2xl overflow-hidden shrink-0"
      >
        {phase === GamePhase.INTRO && (
          <div 
            className="flex flex-col items-center justify-between h-full w-full relative z-50 overflow-hidden cursor-pointer"
            onClick={() => setPhase(GamePhase.STORY)}
            style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 60%, #172554 100%)' }}
          >
            <div className="absolute inset-0 z-0 pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <div key={i} className="absolute bg-white rounded-full opacity-0" style={{ left: `${Math.random() * 100}%`, top: `-${Math.random() * 20}px`, width: `${Math.random() * 3 + 2}px`, height: `${Math.random() * 3 + 2}px`, animation: `snow ${Math.random() * 3 + 3}s linear infinite`, animationDelay: `${Math.random() * 5}s` }} />
              ))}
            </div>

            <div className="w-full flex justify-between p-4 z-20">
              {isApiConfigured() && (
                 <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full border border-green-900">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]"></div>
                    <span className="text-[10px] text-green-400 font-mono uppercase font-bold">ONLINE</span>
                 </div>
              )}
              <Menu className="text-white w-8 h-8" />
            </div>

            <div className="flex flex-col items-center z-10 mt-6 space-y-2">
               <div className="relative bg-[#b91c1c] text-white px-8 py-1 shadow-md transform -rotate-1 border-2 border-white mb-4">
                  <span className="text-2xl font-black tracking-widest font-mono uppercase">SINCE 1953</span>
               </div>
               <p className="text-yellow-300 text-base font-bold animate-pulse mb-2">찬 바람 불 땐, 따끈한 국밥 한 그릇</p>
               <div className="text-center relative">
                  <h1 className="text-8xl font-black tracking-tighter leading-[0.85] relative" style={{ color: '#fef3c7', WebkitTextStroke: '2.5px #78350f', textShadow: '6px 6px 0px #000' }}>
                    국밥<br/>타이쿤
                    <span className="absolute -top-4 -right-10 text-5xl animate-bounce">🔥</span>
                  </h1>
               </div>

               <div className="mt-8 bg-[#1a1a2e]/90 border border-yellow-500/40 rounded-lg p-4 w-64 min-h-[100px] flex flex-col justify-center shadow-2xl">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Trophy size={16} className="text-yellow-400" />
                    <span className="text-yellow-400 font-bold text-xs tracking-widest uppercase">명예의 전당</span>
                  </div>
                  <div className="space-y-2">
                    {isApiConfigured() ? (
                        isRankLoading ? (
                          <div className="text-center text-[10px] text-gray-400 py-1">불러오는 중...</div>
                        ) : topRankers.length > 0 ? (
                            topRankers.map((ranker, i) => (
                              <div key={i} className="flex justify-between items-center text-xs text-white border-b border-white/5 pb-1 last:border-0">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <span className={`${i===0?'text-yellow-400 font-bold':''} ${i===1?'text-gray-300':''} ${i===2?'text-orange-300':''}`}>
                                      {i+1}.
                                  </span>
                                  <span className="truncate max-w-[90px] font-bold">{ranker.nickname}</span>
                                </div>
                                <span className="font-mono opacity-90">{ranker.score.toLocaleString()}</span>
                              </div>
                            ))
                        ) : (
                            <div className="text-center py-1"><p className="text-[10px] text-yellow-200 font-bold animate-pulse">첫 번째 주인공이 되어보세요!</p></div>
                        )
                    ) : (
                        <div className="text-center text-[10px] text-gray-500 py-1">랭킹 시스템 미연동</div>
                    )}
                  </div>
               </div>
            </div>

            <div className="z-10 mt-auto mb-8">
              <div className="bg-[#1a1a2e]/80 px-10 py-3 rounded-full border-2 border-white/40 animate-pulse shadow-2xl active:scale-95">
                <span className="text-white font-black text-xl tracking-widest uppercase font-mono">TOUCH TO START</span>
              </div>
            </div>

            <div className="w-full flex items-end justify-center z-10 mb-2 relative px-4 h-32">
               <div className="w-16 h-20 mb-0 -mr-2 drop-shadow-xl z-10">
                  <BrotherAsset type="younger" />
               </div>
               <div className="w-48 flex flex-col items-center z-20">
                  <div className="bg-white text-black text-[10px] font-black px-3 py-1 border-2 border-black rounded shadow-md whitespace-nowrap mb-1">
                    1953형제돼지국밥
                  </div>
                  <div className="w-32 h-20">
                    <MasterPotAsset health={100} />
                  </div>
               </div>
               <div className="w-16 h-20 mb-0 -ml-2 drop-shadow-xl z-10">
                  <BrotherAsset type="older" />
               </div>
            </div>

            <div className="absolute bottom-4 right-4 z-[100] cursor-pointer" onClick={handleSecretClick}>
               <div className="bg-yellow-100 px-2 py-0.5 border-2 border-red-500 rounded text-[9px] font-bold text-red-600 shadow-sm uppercase tracking-tighter">1953 Studio</div>
            </div>
          </div>
        )}

        {phase === GamePhase.STORY && (
          <div className="flex flex-col items-center justify-center h-full w-full bg-black text-white p-8 animate-fadeIn absolute inset-0 z-50">
             <div className="max-w-md w-full flex flex-col items-center gap-12 text-center">
                <h2 className="text-4xl font-black text-yellow-500 tracking-[0.2em] font-mono">PROLOGUE</h2>
                <div className="flex gap-8 mb-4">
                  <div className="w-24 h-24"><BrotherAsset type="older" /></div>
                  <div className="w-24 h-24"><BrotherAsset type="younger" /></div>
                </div>
                <div className="relative w-full">
                  <div className="absolute -top-3 left-4 bg-[#1e293b] border-2 border-white px-4 py-0.5 text-yellow-400 font-black text-sm z-10">
                    형제들
                  </div>
                  <div className="bg-[#1e293b] border-2 border-white p-8 rounded shadow-[6px_6px_0px_#fff]">
                    <p className="text-2xl leading-relaxed text-left font-bold break-keep">
                      "70년 전 1953년부터 지켜온 <br/>
                      <span className="text-red-400 underline decoration-2 underline-offset-4">할머니의 맛</span>을 <br/>
                      우리가 정성껏 지켜보겠어!"
                    </p>
                  </div>
                </div>
                <button 
                  onClick={startActualGame} 
                  className="bg-white text-black px-16 py-4 text-3xl font-black rounded border-b-8 border-gray-400 active:translate-y-2 active:border-b-0 hover:bg-gray-200 transition-all uppercase tracking-tighter"
                >
                  장사 시작!
                </button>
             </div>
          </div>
        )}

        {(phase === GamePhase.PLAYING || phase === GamePhase.GAMEOVER) && (
          <>
            <div className="w-full bg-gray-800 p-2 border-b-2 border-gray-600 z-10 shrink-0 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h1 className="text-lg font-bold text-white">1953형제돼지국밥</h1>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-yellow-500 font-bold bg-black border border-yellow-600 px-2 py-1 rounded uppercase">LV {level}</div>
                  <div className="bg-black px-4 py-1 rounded text-yellow-400 font-mono text-xl border border-gray-600">₩ {score.toLocaleString()}</div>
                </div>
              </div>
              <ReputationBar health={health} />
            </div>
            <div ref={containerRef} className="flex-1 w-full relative flex flex-col p-2 gap-2 min-h-0 overflow-hidden bg-gray-800/50">
              <FeedbackOverlay effects={effects} />
              <div className="bg-gray-200 rounded-lg border-4 border-gray-500 h-44 shrink-0 relative z-0"><CustomerQueue customers={customers} onServe={handleServeCustomer} /></div>
              <div className="shrink-0"><InventoryDisplay inventory={inventory} /></div>
              <div className="flex-1 flex gap-2 min-h-0 mt-2 items-end">
                <div className="flex flex-col justify-end shrink-0 relative w-32"><BrandTicker message={brandMessage} /><MasterPot health={masterPotHealth} onStir={stirMasterPot} /></div>
                <div className="flex flex-col gap-2 min-h-0 justify-end w-full"><div className="h-24 shrink-0"><RiceStation pots={ricePots} onInteract={handleRiceInteract} /></div><div className="shrink-0"><Stove pots={gukbapPots} onInteract={handleGukbapInteract} /></div></div>
              </div>
            </div>
            {phase === GamePhase.GAMEOVER && <GameOverModal score={score} onRestart={startActualGame} onHome={() => setPhase(GamePhase.INTRO)} />}
          </>
        )}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </div>
    </div>
  );
};

export default App;