import React, { useState, useEffect, useRef } from 'react';
import { 
  GamePhase, 
  GukbapPot, 
  RicePot, 
  Customer, 
  BrothType, 
  CookingStatus, 
  Inventory,
  FeedbackEffect
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
  SPAWN_RATE_INCREASE_PER_TICK,
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
  BRAND_MESSAGES
} from './constants';

import Stove from './components/Stove';
import RiceStation from './components/RiceStation';
import MasterPot from './components/MasterPot';
import CustomerQueue from './components/CustomerQueue';
import InventoryDisplay from './components/InventoryDisplay';
import GameOverModal from './components/GameOverModal';
import BrandTicker from './components/BrandTicker';
import ReputationBar from './components/ReputationBar';
import FeedbackOverlay from './components/FeedbackOverlay';
import { CustomerAsset, MasterPotAsset } from './components/GameAssets';
import { Play, Menu } from 'lucide-react';

const DESIGN_WIDTH = 390; // Standard mobile width base

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.INTRO);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(START_HEALTH);
  const [masterPotHealth, setMasterPotHealth] = useState(100);
  const [brandMessage, setBrandMessage] = useState<string>(BRAND_MESSAGES.DEFAULT);
  const [gameTime, setGameTime] = useState(0);
  
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
      
      // Calculate scale to fit width, but verify height fits too if possible
      let newScale = windowWidth / DESIGN_WIDTH;
      
      // Optional: Cap scale at 1.2 for desktop so it doesn't look too huge
      if (newScale > 1.2) newScale = 1.2;
      
      setScale(newScale);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Init
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper to add floating effects
  const addEffect = (text: string, type: FeedbackEffect['type'], x: number | 'center', y: number | 'center') => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
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
      setGameTime(prev => prev + 1);

      // Check Health Death
      if (health <= 0 || masterPotHealth <= 0) {
        setPhase(GamePhase.GAMEOVER);
        return;
      }

      // 0. Natural Health Decay (increases with time)
      setHealth(prev => {
        // Base decay + extra decay based on how long game has been running
        const decayAmount = HEALTH_DECAY_BASE + (gameTime * HEALTH_DECAY_RAMP);
        return Math.max(0, prev - decayAmount);
      });

      // 1. Update Master Pot
      let warningTriggered = false;
      setMasterPotHealth(prev => {
        const next = prev - MASTER_POT_DECAY;
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
          const burnProgress = pot.progress + (100 / (BURN_TIME_GUKBAP - COOKING_TIME_GUKBAP));
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
           const burnProgress = pot.progress + (100 / (BURN_TIME_RICE - COOKING_TIME_RICE));
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
        let updated = prevCustomers.map(c => ({
          ...c,
          patience: c.patience - CUSTOMER_PATIENCE_DECAY
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

        const currentSpawnRate = Math.min(MAX_SPAWN_RATE, CUSTOMER_SPAWN_RATE + (gameTime * SPAWN_RATE_INCREASE_PER_TICK));
        
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
  }, [phase, gameTime, health, masterPotHealth]);

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
    <div className="h-screen w-full bg-black flex items-center justify-center overflow-hidden">
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
          height: '100%', // Use full height, contents will manage overflow
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
        className="relative bg-gray-900 text-white flex flex-col items-center shadow-2xl overflow-hidden"
      >
        
        {phase === GamePhase.INTRO && (
          <div 
            onClick={goToStory}
            className="flex flex-col items-center justify-between h-full w-full relative z-50 overflow-hidden cursor-pointer"
            style={{
              background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 60%, #172554 100%)' // Night Sky Gradient
            }}
          >
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
            <div className="w-full flex justify-end p-4 z-10">
              <Menu className="text-white w-8 h-8 drop-shadow-lg" />
            </div>

            {/* Main Title Section */}
            <div className="flex flex-col items-center z-10 mt-8 space-y-2">
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
            </div>

            {/* Middle Action Text */}
            <div className="z-10 mt-auto mb-10">
              <div className="bg-black/40 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20 animate-pulse cursor-pointer hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg tracking-widest blink-text">
                  TOUCH TO START
                </span>
              </div>
            </div>

            {/* Bottom Characters Assembly */}
            <div className="w-full flex items-end justify-center z-10 mb-0 relative">
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
            
            {/* Com2uS Platform Style Footer (Optional/Fake) */}
            <div className="absolute bottom-2 right-2 z-20">
               <div className="bg-yellow-100 px-2 py-0.5 border-2 border-red-500 rounded text-[8px] font-bold text-red-600 shadow-sm">
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

        {phase === GamePhase.STORY && (
          <div className="flex flex-col items-center justify-center h-full w-full bg-black text-white p-6 animate-fadeIn absolute inset-0 z-50">
             <div className="max-w-md w-full flex flex-col items-center gap-6">
                <h2 className="text-2xl font-bold text-yellow-500 mb-4 tracking-widest">PROLOGUE</h2>
                
                <div className="flex justify-center gap-8 mb-4">
                   <div className="w-24 h-24">
                     <CustomerAsset seed={1} mood='normal' />
                   </div>
                   <div className="w-24 h-24">
                     <CustomerAsset seed={3} mood='normal' />
                   </div>
                </div>

                <div className="bg-gray-800 border-2 border-white p-4 rounded-lg relative w-full">
                  <div className="absolute -top-3 left-4 bg-gray-800 px-2 text-yellow-400 font-bold border border-white">
                    형제들
                  </div>
                  <p className="text-lg leading-relaxed font-mono">
                    "70년 전 1953년부터 지켜온<br/>
                    <span className="text-red-400 font-bold">할머니의 맛</span>을<br/>
                    우리가 정성껏 지켜보겠어!"
                  </p>
                </div>

                <button 
                  onClick={startActualGame}
                  className="mt-8 bg-white text-black px-8 py-3 text-xl font-bold rounded hover:bg-gray-300 pixel-btn animate-bounce"
                >
                  장사 시작!
                </button>
             </div>
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
                <div className="bg-black px-4 py-1 rounded text-yellow-400 font-mono text-xl border border-gray-600">
                  ₩ {score.toLocaleString()}
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
              
              {/* Customer Queue (REDUCED HEIGHT to h-52) */}
              <div className="bg-gray-200 rounded-lg border-4 border-gray-500 shadow-inner h-52 shrink-0 relative z-0">
                 <CustomerQueue customers={customers} onServe={handleServeCustomer} />
              </div>

              {/* Inventory */}
              <div className="shrink-0">
                <InventoryDisplay inventory={inventory} />
              </div>

              {/* Kitchen */}
              <div className="flex flex-1 gap-2 min-h-0 mt-2 items-stretch">
                {/* Left: Ticker & Master Pot */}
                <div className="flex flex-col justify-end shrink-0 relative w-32">
                   <BrandTicker message={brandMessage} />
                   <MasterPot health={masterPotHealth} onStir={stirMasterPot} />
                </div>
                {/* Center: Stove */}
                <div className="flex-1 flex flex-col min-h-0 relative">
                   <Stove pots={gukbapPots} onInteract={handleGukbapInteract} />
                </div>
                {/* Right: Rice */}
                <div className="w-20 shrink-0">
                   <RiceStation pots={ricePots} onInteract={handleRiceInteract} />
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
      </div>
    </div>
  );
};

export default App;