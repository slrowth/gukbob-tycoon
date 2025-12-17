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
import { supabase, isSupabaseConfigured } from './supabaseClient';

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
import { CustomerAsset, MasterPotAsset } from './components/GameAssets';
import { Menu, Trophy } from 'lucide-react';

const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 800; // Fixed design height for safe area scaling

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.INTRO);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [health, setHealth] = useState(START_HEALTH);
  const [masterPotHealth, setMasterPotHealth] = useState(100);
  const [brandMessage, setBrandMessage] = useState<string>(BRAND_MESSAGES.DEFAULT);
  const [gameTime, setGameTime] = useState(0);
  const [topRankers, setTopRankers] = useState<LeaderboardEntry[]>([]);
  const [isRankLoading, setIsRankLoading] = useState(false); // Add loading state
  const [showSettings, setShowSettings] = useState(false);
  const [, setSecretClickCount] = useState(0);
  
  // Mobile Scaling State
  const [scale, setScale] = useState(1);
  
  // Visual Effects State
  const [effects, setEffects] = useState<FeedbackEffect[]>([]);
  
  // Game Objects
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

  // Handle Resize for Scale-to-Fit
  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Calculate scale to fit width AND height (contain strategy)
      const scaleX = windowWidth / DESIGN_WIDTH;
      const scaleY = windowHeight / DESIGN_HEIGHT;
      
      // Use the smaller scale factor to ensure the entire app fits on screen
      const newScale = Math.min(scaleX, scaleY);
      
      setScale(newScale);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Init
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Top 3 Rankers on Intro
  useEffect(() => {
    if (phase === GamePhase.INTRO && isSupabaseConfigured()) {
       const fetchTopRankers = async () => {
         setIsRankLoading(true);
         const { data } = await supabase
           .from('leaderboard')
           .select('*')
           .order('score', { ascending: false })
           .limit(3);
         
         if (data) {
           setTopRankers(data);
         }
         setIsRankLoading(false);
       };
       fetchTopRankers();
    }
  }, [phase]);

  // Handle Secret Click for Settings
  const handleSecretClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent game start
    setSecretClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        setShowSettings(true);
        return 0;
      }
      return newCount;
    });
  };

  // Helper to add floating effects
  const addEffect = (text: string, type: FeedbackEffect['type'], x: number | 'center', y: number | 'center') => {
    if (!containerRef.current) return;
    
    // We need to adjust coordinates because of the scaling transform
    // The incoming X/Y might be based on screen coordinates or scaled coordinates.
    // For simplicity in this logic, we assume we are working within the 390px coordinate space.
    
    let effectX = 0;
    let effectY = 0;

    if (x === 'center') effectX = DESIGN_WIDTH / 2;
    else effectX = x;

    if (y === 'center') effectY = containerRef.current.offsetHeight / 2;
    else effectY = y;

    const newEffect: FeedbackEffect = {
      id: Date.now() + Math.random(),
      x: effectX,
      y: effectY,
      text,
      type
    };
    setEffects(prev => [...prev, newEffect]);
    
    // Cleanup after animation
    setTimeout(() => {
      setEffects(prev => prev.filter(e => e.id !== newEffect.id));
    }, 1000);
  };

  // Game Loop
  useEffect(() => {
    if (phase !== GamePhase.PLAYING) return;

    const interval = setInterval(() => {
      // Increment Game Time
      let nextTime = 0;
      setGameTime(prev => {
        nextTime = prev + 1;
        return nextTime;
      });

      // --- Level System ---
      const calculatedLevel = Math.floor(nextTime / LEVEL_DURATION_TICKS) + 1;
      
      // Difficulty Multiplier: 1.2^ (Level - 1) -> 20% compounded per level
      const difficultyMultiplier = Math.pow(1.2, calculatedLevel - 1);

      if (calculatedLevel > level) {
        setLevel(calculatedLevel);
        addEffect(`LEVEL ${calculatedLevel}!`, 'score', 'center', 'center');
        setBrandMessage(`속도 증가! 레벨 ${calculatedLevel} 시작!`);
      }

      // Check Health Death
      if (health <= 0 || masterPotHealth <= 0) {
        setPhase(GamePhase.GAMEOVER);
        return;
      }

      // 0. Natural Health Decay (increases with time)
      setHealth(prev => {
        // Base decay + extra decay based on how long game has been running
        const decayAmount = HEALTH_DECAY_BASE + (nextTime * HEALTH_DECAY_RAMP);
        return Math.max(0, prev - decayAmount);
      });

      // 1. Update Master Pot
      // Decay scales with difficulty
      let warningTriggered = false;
      setMasterPotHealth(prev => {
        const next = prev - (MASTER_POT_DECAY * difficultyMultiplier);
        if (next < MASTER_POT_WARNING_THRESHOLD && prev >= MASTER_POT_WARNING_THRESHOLD) {
           warningTriggered = true;
        }
        return next;
      });
      if (warningTriggered) setBrandMessage(BRAND_MESSAGES.MASTER_POT_WARNING);

      // 2. Update Gukbap Pots
      let anyGukbapBurnt = false;
      setGukbapPots(prevPots => prevPots.map(pot => {
        if (pot.status === CookingStatus.COOKING) {
          const newProgress = pot.progress + (100 / COOKING_TIME_GUKBAP);
          if (newProgress >= 100) {
            setBrandMessage(BRAND_MESSAGES.GUKBAP_DONE);
            return { ...pot, status: CookingStatus.DONE, progress: 0 }; 
          }
          return { ...pot, progress: newProgress };
        } 
        if (pot.status === CookingStatus.DONE) {
          // Accelerate burning with difficulty level
          const baseBurnIncrement = 100 / (BURN_TIME_GUKBAP - COOKING_TIME_GUKBAP);
          const burnProgress = pot.progress + (baseBurnIncrement * difficultyMultiplier);
          
          if (burnProgress >= 100) {
             anyGukbapBurnt = true;
             return { ...pot, status: CookingStatus.BURNT, progress: 100 };
          }
          return { ...pot, progress: burnProgress };
        }
        return pot;
      }));

      // 3. Update Rice Pots
      let anyRiceBurnt = false;
      setRicePots(prevPots => prevPots.map(pot => {
        if (pot.status === CookingStatus.COOKING) {
          const newProgress = pot.progress + (100 / COOKING_TIME_RICE);
          if (newProgress >= 100) {
            setBrandMessage(BRAND_MESSAGES.RICE_DONE);
            return { ...pot, status: CookingStatus.DONE, progress: 0 };
          }
          return { ...pot, progress: newProgress };
        }
        if (pot.status === CookingStatus.DONE) {
           // Accelerate burning with difficulty level
           const baseBurnIncrement = 100 / (BURN_TIME_RICE - COOKING_TIME_RICE);
           const burnProgress = pot.progress + (baseBurnIncrement * difficultyMultiplier);
           
           if (burnProgress >= 100) {
             anyRiceBurnt = true;
             return { ...pot, status: CookingStatus.BURNT, progress: 100 };
           }
           return { ...pot, progress: burnProgress };
        }
        return pot;
      }));
      
      // Handle Burning Damage
      if (anyGukbapBurnt) {
        setHealth(prev => Math.max(0, prev - HEALTH_DAMAGE_BURN));
        setBrandMessage(BRAND_MESSAGES.BURNT);
        addEffect(`-${HEALTH_DAMAGE_BURN}`, 'damage', 'center', 'center');
        addEffect("🔥 탔다!", 'damage', 'center', 100);
      }
      if (anyRiceBurnt) {
        setHealth(prev => Math.max(0, prev - HEALTH_DAMAGE_BURN));
        setBrandMessage(BRAND_MESSAGES.BURNT);
        addEffect(`-${HEALTH_DAMAGE_BURN}`, 'damage', 'center', 'center');
      }

      // 4. Update Customers & Spawn
      setCustomers(prevCustomers => {
        // Patience decay scales with difficulty
        let updated = prevCustomers.map(c => ({
          ...c,
          patience: c.patience - (CUSTOMER_PATIENCE_DECAY * difficultyMultiplier)
        }));

        const keptCustomers = [];
        let angryLeave = false;
        
        for (const c of updated) {
          if (c.patience > 0) {
            keptCustomers.push(c);
          } else {
            angryLeave = true;
          }
        }
        
        if (angryLeave) {
            setHealth(prev => Math.max(0, prev - HEALTH_DAMAGE_MISS));
            setBrandMessage(BRAND_MESSAGES.ANGRY_CUSTOMER);
            addEffect("😡 손님 분노!", 'damage', 'center', 50);
            addEffect(`-${HEALTH_DAMAGE_MISS} Reputation`, 'damage', 'center', 80);
        }

        // Spawn Rate scales with difficulty
        const currentSpawnRate = Math.min(MAX_SPAWN_RATE, CUSTOMER_SPAWN_RATE * difficultyMultiplier);
        
        if (keptCustomers.length < 5 && Math.random() < currentSpawnRate) {
           const broths = Object.values(BrothType) as BrothType[];
           const randomBroth = broths[Math.floor(Math.random() * broths.length)];
           const needsRice = Math.random() > 0.3; 
           
           keptCustomers.push({
             id: Date.now(),
             order: { broth: randomBroth, needsRice },
             patience: CUSTOMER_MAX_PATIENCE,
             maxPatience: CUSTOMER_MAX_PATIENCE
           });
        }
        
        return keptCustomers;
      });

    }, GAME_TICK_MS);

    return () => clearInterval(interval);
  }, [phase, gameTime, health, masterPotHealth, level]);

  // Actions
  const stirMasterPot = () => {
    if (phase !== GamePhase.PLAYING) return;
    setMasterPotHealth(prev => Math.min(100, prev + MASTER_POT_STIR_RECOVERY));
    setBrandMessage(BRAND_MESSAGES.MASTER_POT_STIRRED);
    addEffect("육수 관리 OK!", 'info', 60, 300);
  };

  const handleGukbapInteract = (potId: number, selectedBroth?: BrothType) => {
    setGukbapPots(prev => prev.map(pot => {
      if (pot.id !== potId) return pot;

      if (pot.status === CookingStatus.EMPTY && selectedBroth) {
        setBrandMessage(BRAND_MESSAGES.GUKBAP_COOKING);
        return { ...pot, status: CookingStatus.COOKING, brothType: selectedBroth, progress: 0 };
      }
      if (pot.status === CookingStatus.DONE && pot.brothType) {
        setInventory(inv => ({ ...inv, [pot.brothType!]: inv[pot.brothType!] + 1 }));
        addEffect("+1 획득", 'info', 'center', 'center');
        return { ...pot, status: CookingStatus.EMPTY, brothType: null, progress: 0 };
      }
      if (pot.status === CookingStatus.BURNT) {
        return { ...pot, status: CookingStatus.EMPTY, brothType: null, progress: 0 };
      }
      return pot;
    }));
  };

  const handleRiceInteract = (potId: number) => {
    setRicePots(prev => prev.map(pot => {
      if (pot.id !== potId) return pot;
      if (pot.status === CookingStatus.EMPTY) {
        return { ...pot, status: CookingStatus.COOKING, progress: 0 };
      }
      if (pot.status === CookingStatus.DONE) {
        setInventory(inv => ({ ...inv, rice: inv.rice + 1 }));
        addEffect("+1 밥", 'info', 'center', 'center');
        return { ...pot, status: CookingStatus.EMPTY, progress: 0 };
      }
      if (pot.status === CookingStatus.BURNT) {
        return { ...pot, status: CookingStatus.EMPTY, progress: 0 };
      }
      return pot;
    }));
  };

  const handleServeCustomer = (customerId: number, event: React.MouseEvent<HTMLButtonElement>) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || !containerRef.current) return;

    const { broth, needsRice } = customer.order;
    const hasSoup = inventory[broth] > 0;
    const hasRice = !needsRice || inventory.rice > 0;

    // Calculate click position relative to the SCALED container
    const rect = event.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // We adjust the coordinates to match the internal 390px design width space
    // Since everything is visually scaled, we reverse the scale to find the "logical" x/y
    const x = (rect.left - containerRect.left + (rect.width / 2)) / scale;
    const y = (rect.top - containerRect.top) / scale;

    if (hasSoup && hasRice) {
      setInventory(prev => ({
        ...prev,
        [broth]: prev[broth] - 1,
        rice: needsRice ? prev.rice - 1 : prev.rice
      }));

      // Calculate Score & Health based on patience
      const patiencePercent = (customer.patience / customer.maxPatience) * 100;
      let scoreToAdd = SCORE_BAD;
      let healthToAdd = 0;
      let effectText = "+50 😅";
      let effectType: FeedbackEffect['type'] = 'info';

      if (patiencePercent > 70) {
        scoreToAdd = SCORE_PERFECT;
        healthToAdd = HEALTH_RECOVER_PERFECT;
        effectText = "+200 ❤️ PERFECT!";
        effectType = 'score';
        setBrandMessage(BRAND_MESSAGES.PERFECT_SERVE);
      } else if (patiencePercent > 30) {
        scoreToAdd = SCORE_GOOD;
        healthToAdd = HEALTH_RECOVER_GOOD;
        effectText = "+100 👍 GOOD";
        effectType = 'heal';
      }

      setScore(s => s + scoreToAdd);
      setHealth(h => Math.min(MAX_HEALTH, h + healthToAdd));
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      
      // Trigger Effect at Customer Position
      addEffect(effectText, effectType, x, y);

    } else {
       addEffect("재료 부족!", 'damage', x, y);
    }
  };

  const goToStory = () => {
    setPhase(GamePhase.STORY);
  };

  const goToTitle = () => {
    setPhase(GamePhase.INTRO);
  };

  const startActualGame = () => {
    setScore(0);
    setHealth(START_HEALTH);
    setLevel(1);
    setMasterPotHealth(100);
    setGameTime(0);
    setGukbapPots(Array.from({ length: 9 }, (_, i) => ({ id: i, status: CookingStatus.EMPTY, brothType: null, progress: 0 })));
    setRicePots(Array.from({ length: 4 }, (_, i) => ({ id: i, status: CookingStatus.EMPTY, progress: 0 })));
    setInventory({ [BrothType.MILKY]: 0, [BrothType.CLEAR]: 0, [BrothType.MALA]: 0, rice: 0 });
    setCustomers([]);
    setBrandMessage(BRAND_MESSAGES.DEFAULT);
    setPhase(GamePhase.PLAYING);
  };

  // --- RENDERING ---
  
  // Outer container is black background covering full screen
  return (
    <div className="fixed inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* Defines Snow Animation */}
      <style>{`
        @keyframes snow {
          0% { transform: translateY(-10px); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
      `}</style>

      {/* Scaled Inner Container */}
      <div 
        style={{
          width: `${DESIGN_WIDTH}px`,
          height: `${DESIGN_HEIGHT}px`, // Fixed height guarantees ratio behavior
          transform: `scale(${scale})`,
          // Center origin ensures scaling stays centered
        }}
        className="relative bg-gray-900 text-white flex flex-col items-center shadow-2xl overflow-hidden shrink-0"
      >
        
        {phase === GamePhase.INTRO && (
          <div 
            className="flex flex-col items-center justify-between h-full w-full relative z-50 overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 60%, #172554 100%)' // Night Sky Gradient
            }}
          >
            {/* Click Handler for Starting Game (Avoid settings click) */}
            <div className="absolute inset-0 z-0" onClick={goToStory} />

            {/* Falling Snow Effect */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute bg-white rounded-full opacity-0"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-${Math.random() * 20}px`,
                    width: `${Math.random() * 3 + 2}px`,
                    height: `${Math.random() * 3 + 2}px`,
                    animation: `snow ${Math.random() * 3 + 3}s linear infinite`,
                    animationDelay: `${Math.random() * 5}s`
                  }}
                />
              ))}
            </div>

            {/* Background City Skyline (Abstract) */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
               {/* Buildings */}
               <div className="absolute bottom-0 left-0 w-16 h-48 bg-black/60 border-t border-r border-indigo-900"></div>
               <div className="absolute bottom-0 left-12 w-20 h-64 bg-black/50 border-t border-x border-indigo-800 flex flex-col items-center pt-4 gap-4">
                  <div className="w-2 h-2 bg-yellow-400/50 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-yellow-400/50 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
               </div>
               <div className="absolute bottom-0 right-0 w-24 h-56 bg-black/60 border-t border-l border-indigo-900"></div>
               <div className="absolute bottom-0 right-20 w-16 h-32 bg-black/50 border-t border-x border-indigo-800"></div>
            </div>

            {/* Header / Menu Icon */}
            <div className="w-full flex justify-between p-4 z-20 pointer-events-none">
              {/* Online Indicator */}
              {isSupabaseConfigured() && (
                 <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm border border-green-900">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]"></div>
                    <span className="text-[10px] text-green-400 font-mono">ONLINE</span>
                 </div>
              )}
              {/* Spacer if not online to keep layout */}
              {!isSupabaseConfigured() && <div />}
              
              <Menu className="text-white w-8 h-8 drop-shadow-lg" />
            </div>

            {/* Main Title Section */}
            <div className="flex flex-col items-center z-10 mt-8 space-y-2 pointer-events-none">
               {/* Ribbon Banner */}
               <div className="relative bg-red-600 text-white px-8 py-1 shadow-[0_4px_0_rgba(0,0,0,0.5)] transform -rotate-2 border-2 border-white mb-4">
                  <div className="absolute -left-2 top-0 bottom-0 w-2 bg-red-800 border-l-2 border-white skew-y-12 origin-right"></div>
                  <div className="absolute -right-2 top-0 bottom-0 w-2 bg-red-800 border-r-2 border-white -skew-y-12 origin-left"></div>
                  <span className="text-xl font-black tracking-widest drop-shadow-md font-mono">SINCE 1953</span>
               </div>
               
               <p className="text-yellow-300 text-sm font-bold tracking-tighter drop-shadow-md animate-pulse">
                 찬 바람 불 땐, 따끈한 국밥 한 그릇
               </p>
               
               {/* Main Logo */}
               <div className="text-center relative">
                  <h1 className="text-8xl font-black tracking-tighter leading-tight relative z-10" style={{
                     color: '#fef3c7', // light yellow
                     WebkitTextStroke: '3px #78350f', // dark brown stroke
                     textShadow: '6px 6px 0px #000, 6px 8px 0px #78350f'
                  }}>
                    국밥<br/>타이쿤
                  </h1>
                  <div className="absolute -top-6 -right-6 text-5xl animate-[bounce_2s_infinite]">🔥</div>
               </div>
               
               {/* Top Rankers - Dynamic */}
               <div className="mt-4 bg-black/60 backdrop-blur-sm border border-yellow-500/50 rounded-lg p-2 w-64 pointer-events-auto min-h-[80px] flex flex-col justify-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy size={16} className="text-yellow-400" />
                    <span className="text-yellow-400 font-bold text-xs tracking-widest">명예의 전당</span>
                  </div>
                  <div className="space-y-1">
                    {isSupabaseConfigured() ? (
                        isRankLoading ? (
                          <div className="text-center text-xs text-gray-400 py-1 flex justify-center gap-1">
                             <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                             <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                             <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                          </div>
                        ) : topRankers.length > 0 ? (
                            topRankers.map((ranker, i) => (
                                <div key={i} className="flex justify-between text-xs text-white">
                                <span className={`${i===0?'text-red-400 font-bold':''} ${i===1?'text-orange-300':''} ${i===2?'text-yellow-200':''}`}>
                                    {i+1}. {ranker.nickname}
                                </span>
                                <span className="font-mono opacity-80">{ranker.score.toLocaleString()}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-2 animate-pulse">
                                <p className="text-xs text-yellow-200 font-bold">첫 번째 주인공이 되어보세요!</p>
                            </div>
                        )
                    ) : (
                        <div className="text-center text-xs text-gray-500 py-1">
                            랭킹 시스템 미연동
                        </div>
                    )}
                  </div>
               </div>
            </div>

            {/* Middle Action Text */}
            <div className="z-10 mt-auto mb-10 pointer-events-none">
              <div className="bg-black/40 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20 animate-pulse">
                <span className="text-white font-bold text-lg tracking-widest blink-text">
                  TOUCH TO START
                </span>
              </div>
            </div>

            {/* Bottom Characters Assembly */}
            <div className="w-full flex items-end justify-center z-10 mb-0 relative pointer-events-none">
               {/* Floor Shadow */}
               <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-black to-transparent opacity-80"></div>
               
               {/* Left Group */}
               <div className="w-24 h-24 -mr-6 mb-2 transform scale-90 z-10">
                 <CustomerAsset seed={3} mood='happy' />
               </div>
               
               {/* Center Pot (The "Cart") */}
               <div className="w-40 h-36 z-20 relative -mb-4 drop-shadow-2xl transform scale-110">
                  <MasterPotAsset health={80} />
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-0.5 border border-black rounded shadow-md whitespace-nowrap">
                    1953형제돼지국밥
                  </div>
               </div>
               
               {/* Right Group */}
               <div className="w-24 h-24 -ml-6 mb-2 transform scale-90 scale-x-[-1] z-10">
                 <CustomerAsset seed={1} mood='happy' />
               </div>
            </div>
            
            {/* Secret Footer Trigger - Enhanced Touch Area */}
            <div 
               className="absolute bottom-0 right-0 w-24 h-24 z-[100] flex items-end justify-end p-2 cursor-pointer"
               onClick={handleSecretClick}
            >
               <div className="bg-yellow-100 px-2 py-0.5 border-2 border-red-500 rounded text-[8px] font-bold text-red-600 shadow-sm select-none active:scale-90 transition-transform mb-2 mr-2">
                 1953 Studio
               </div>
            </div>

            <style>{`
              .blink-text {
                animation: blink 1s infinite;
              }
              @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
              }
            `}</style>
          </div>
        )}

        {/* --- MAIN GAME UI --- */}
        {/* Only rendered if not in Intro/Story to keep DOM lighter, or keep it hidden */}
        {(phase === GamePhase.PLAYING || phase === GamePhase.GAMEOVER) && (
          <>
            {/* 1. Header Area */}
            <div className="w-full bg-gray-800 p-2 border-b-2 border-gray-600 z-10 shrink-0 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h1 className="text-lg font-bold text-white">1953형제돼지국밥</h1>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-yellow-500 font-bold bg-black border border-yellow-600 px-2 py-1 rounded">
                    LV {level}
                  </div>
                  <div className="bg-black px-4 py-1 rounded text-yellow-400 font-mono text-xl border border-gray-600">
                    ₩ {score.toLocaleString()}
                  </div>
                </div>
              </div>
              <ReputationBar health={health} />
            </div>

            {/* 2. Main Game Area */}
            <div 
              ref={containerRef}
              className="flex-1 w-full relative flex flex-col p-2 gap-2 min-h-0 overflow-hidden bg-gray-800/50"
            >
              <FeedbackOverlay effects={effects} />
              
              {/* Customer Queue (Reduced height from h-52 to h-44 to prevent kitchen overlap) */}
              <div className="bg-gray-200 rounded-lg border-4 border-gray-500 shadow-inner h-44 shrink-0 relative z-0">
                 <CustomerQueue customers={customers} onServe={handleServeCustomer} />
              </div>

              {/* Inventory */}
              <div className="shrink-0">
                <InventoryDisplay inventory={inventory} />
              </div>

              {/* Kitchen */}
              <div className="flex-1 flex gap-2 min-h-0 mt-2 items-end">
                {/* Left: Ticker & Master Pot */}
                <div className="flex flex-col justify-end shrink-0 relative w-32">
                   <BrandTicker message={brandMessage} />
                   <MasterPot health={masterPotHealth} onStir={stirMasterPot} />
                </div>
                {/* Right Column: Cooking Area (Vertical Stack) */}
                <div className="flex flex-col gap-2 min-h-0 justify-end w-full">
                   {/* Rice (Top) */}
                   <div className="h-24 shrink-0">
                      <RiceStation pots={ricePots} onInteract={handleRiceInteract} />
                   </div>
                   {/* Stove (Bottom) */}
                   <div className="shrink-0">
                      <Stove pots={gukbapPots} onInteract={handleGukbapInteract} />
                   </div>
                </div>
              </div>
            </div>
            
            {/* 3. Footer Spacer */}
            <div className="w-full shrink-0 h-4 bg-gray-800 border-t border-gray-700"></div>

            {phase === GamePhase.GAMEOVER && (
              <GameOverModal score={score} onRestart={startActualGame} onHome={goToTitle} />
            )}
          </>
        )}

        {/* Settings Modal Layer */}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </div>
    </div>
  );
};

export default App;