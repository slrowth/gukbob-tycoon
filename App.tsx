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
import { CustomerAsset } from './components/GameAssets';
import { Play } from 'lucide-react';

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.INTRO);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(START_HEALTH);
  const [masterPotHealth, setMasterPotHealth] = useState(100);
  const [brandMessage, setBrandMessage] = useState<string>(BRAND_MESSAGES.DEFAULT);
  const [gameTime, setGameTime] = useState(0);
  
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

  // Helper to add floating effects
  // Now accepts optional clientX/clientY to calculate position relative to container
  const addEffect = (text: string, type: FeedbackEffect['type'], x: number | 'center', y: number | 'center') => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    let effectX = 0;
    let effectY = 0;

    if (x === 'center') effectX = rect.width / 2;
    else effectX = x;

    if (y === 'center') effectY = rect.height / 2;
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

    // Calculate effect position based on click target
    const rect = event.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Position relative to the container
    const x = rect.left - containerRect.left + (rect.width / 2);
    const y = rect.top - containerRect.top;

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

  if (phase === GamePhase.INTRO) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-orange-50 text-center p-6 space-y-8">
        <div className="bg-white p-8 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm">
           <div className="flex flex-col items-center mb-6">
             <span className="text-xl font-bold text-gray-800 mb-2">1953형제돼지국밥</span>
             <h1 className="text-5xl font-black tracking-widest leading-normal" style={{
               background: 'linear-gradient(180deg, #FCD34D 0%, #EA580C 100%)',
               WebkitBackgroundClip: 'text',
               WebkitTextFillColor: 'transparent',
               filter: 'drop-shadow(3px 3px 0px #000000)'
             }}>
               국밥 타이쿤
             </h1>
           </div>
           
           <p className="text-sm text-gray-800 mb-6">형제돼지국밥의 전통을 이어가세요!</p>
           
           <div className="text-left text-xs bg-gray-100 p-4 rounded mb-6 space-y-2 border border-gray-300">
             <p>1. <span className="font-bold text-red-600">진한 사골육수</span>를 틈틈히 정성스레 저어주세요.</p>
             <p>2. 손님에게 빠르게 서빙하여 <span className="font-bold text-green-600">신뢰도</span>를 유지하세요.</p>
             <p>3. <span className="font-bold text-red-600">시간이 지날수록 신뢰도는 더 빨리 떨어집니다!</span></p>
           </div>

           <button 
             onClick={goToStory}
             className="w-full bg-gray-900 border-4 border-gray-600 py-6 rounded-lg hover:bg-gray-800 active:translate-y-1 transition-all flex items-center justify-center gap-3 group relative overflow-hidden pixel-btn"
           >
             {/* Retro Shine Effect */}
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-[shine_1s_infinite]"></div>

             <Play size={32} className="text-yellow-500 fill-yellow-500" />
             <span className="text-4xl font-black tracking-widest" style={{
               background: 'linear-gradient(180deg, #FCD34D 0%, #EA580C 100%)',
               WebkitBackgroundClip: 'text',
               WebkitTextFillColor: 'transparent',
               filter: 'drop-shadow(2px 2px 0px #000000)'
             }}>
               영업 시작
             </span>
           </button>
        </div>
      </div>
    );
  }

  if (phase === GamePhase.STORY) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-6 animate-fadeIn">
         <div className="max-w-md w-full flex flex-col items-center gap-6">
            <h2 className="text-2xl font-bold text-yellow-500 mb-4 tracking-widest">PROLOGUE</h2>
            
            <div className="flex justify-center gap-8 mb-4">
               {/* Brother 1 */}
               <div className="w-24 h-24">
                 <CustomerAsset seed={1} mood='normal' />
               </div>
               {/* Brother 2 */}
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
    );
  }

  return (
    <div className="h-screen w-full bg-gray-900 text-white overflow-hidden flex flex-col items-center">
      
      {/* 1. Header Area */}
      <div className="w-full max-w-md bg-gray-800 p-2 border-b-2 border-gray-600 z-10 shrink-0 flex flex-col gap-2">
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
        className="flex-1 w-full max-w-md bg-gray-800/50 relative flex flex-col p-2 gap-2 min-h-0 overflow-hidden"
      >
        <FeedbackOverlay effects={effects} />
        
        {/* Customer Queue - Increased Height */}
        <div className="bg-gray-200 rounded-lg border-4 border-gray-500 shadow-inner h-48 shrink-0 relative z-0">
           <CustomerQueue customers={customers} onServe={handleServeCustomer} />
        </div>

        {/* Inventory */}
        <div className="shrink-0">
          <InventoryDisplay inventory={inventory} />
        </div>

        {/* Kitchen (Pots & Stations) */}
        {/* items-stretch ensures columns (especially stove and rice) match height */}
        <div className="flex flex-1 gap-2 min-h-0 mt-2 items-stretch">
          
          {/* Left Column: Ticker & Master Pot */}
          <div className="flex flex-col justify-end shrink-0 relative w-32">
             <BrandTicker message={brandMessage} />
             <MasterPot health={masterPotHealth} onStir={stirMasterPot} />
          </div>

          {/* Stove - Center (Fills space) */}
          <div className="flex-1 flex flex-col min-h-0 relative">
             <Stove pots={gukbapPots} onInteract={handleGukbapInteract} />
          </div>

          {/* Rice - Right */}
          <div className="w-20 shrink-0">
             <RiceStation pots={ricePots} onInteract={handleRiceInteract} />
          </div>
        </div>
      </div>
      
      {/* 3. Footer Spacer (since ticker moved) */}
      <div className="w-full max-w-md shrink-0 h-4 bg-gray-800 border-t border-gray-700"></div>

      {phase === GamePhase.GAMEOVER && (
        <GameOverModal score={score} onRestart={startActualGame} />
      )}
    </div>
  );
};

export default App;