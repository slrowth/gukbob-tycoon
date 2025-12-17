import { BrothType } from './types';

export const GAME_TICK_MS = 100; // Game loop updates every 100ms

// Cooking settings (in ticks)
// 1 second = 10 ticks
export const COOKING_TIME_GUKBAP = 40; // 4 seconds to cook
export const BURN_TIME_GUKBAP = 200;   // 20 seconds total (16 seconds safe time)
export const COOKING_TIME_RICE = 30;   // 3 seconds
export const BURN_TIME_RICE = 160;     // 16 seconds total (13 seconds safe time)

// Master Pot settings
export const MASTER_POT_DECAY = 0.5;   // Increased from 0.3 for faster decay
export const MASTER_POT_STIR_RECOVERY = 40;
export const MASTER_POT_WARNING_THRESHOLD = 70; 

// Customer settings
export const CUSTOMER_SPAWN_RATE = 0.035; // Increased base rate (0.025 -> 0.035)
export const SPAWN_RATE_INCREASE_PER_TICK = 0.00004; // Increased ramp up
export const MAX_SPAWN_RATE = 0.15; // Higher cap
export const CUSTOMER_MAX_PATIENCE = 150; // 15 sec
export const CUSTOMER_PATIENCE_DECAY = 0.9; // Increased from 0.6 (Much faster patience drop)

// Scoring & Health (Reputation)
export const MAX_HEALTH = 100;
export const START_HEALTH = 100; 
export const HEALTH_DECAY_BASE = 0.08; // Increased base decay (0.05 -> 0.08)
export const HEALTH_DECAY_RAMP = 0.0001; // Doubled ramp speed
export const HEALTH_DAMAGE_MISS = 20; 
export const HEALTH_DAMAGE_BURN = 15; 
export const HEALTH_RECOVER_PERFECT = 10; 
export const HEALTH_RECOVER_GOOD = 5; 

export const SCORE_PERFECT = 200;
export const SCORE_GOOD = 100;
export const SCORE_BAD = 50;

export const BROTH_LABELS: Record<BrothType, string> = {
  [BrothType.MILKY]: '뽀얀', // Donkotsu / Thick
  [BrothType.CLEAR]: '맑은', // Clear
  [BrothType.MALA]: '마라'   // Spicy
};

export const BROTH_COLORS: Record<BrothType, string> = {
  [BrothType.MILKY]: 'bg-yellow-100 text-yellow-900',
  [BrothType.CLEAR]: 'bg-amber-200 text-amber-900',
  [BrothType.MALA]: 'bg-red-500 text-white'
};

export const BRAND_MESSAGES = {
  DEFAULT: "1953년의 전통, 형제돼지국밥의 맛을 이어가세요.",
  GUKBAP_COOKING: "육수는 선택이 중요합니다. 1953은 대충 끓이지 않습니다.",
  GUKBAP_DONE: "골든타임! 육수가 가장 맛있는 순간입니다.",
  RICE_DONE: "이 집은 밥도 중요하게 다룹니다. 솥밥 준비 완료!",
  MASTER_POT_WARNING: "육수는 계속 지켜봐야 합니다! 서둘러 저어주세요!",
  MASTER_POT_STIRRED: "정성으로 육수를 저어 깊은 맛을 냅니다.",
  BURNT: "아차! 정성이 부족해 음식이 타버렸습니다.",
  ANGRY_CUSTOMER: "손님이 기다리다 지쳐 떠났습니다! 신뢰도 하락!",
  PERFECT_SERVE: "완벽한 타이밍! 손님이 감동했습니다.",
};