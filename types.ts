export enum BrothType {
  MILKY = 'MILKY', // 뽀얀 육수 (Donkotsu style)
  CLEAR = 'CLEAR', // 맑은 육수
  MALA = 'MALA'    // 마라 육수
}

export enum CookingStatus {
  EMPTY = 'EMPTY',
  COOKING = 'COOKING',
  DONE = 'DONE',
  BURNT = 'BURNT'
}

export interface GukbapPot {
  id: number;
  status: CookingStatus;
  brothType: BrothType | null;
  progress: number; // 0 to 100 (Done), > 100 (Burning)
}

export interface RicePot {
  id: number;
  status: CookingStatus;
  progress: number;
}

export interface Customer {
  id: number;
  order: {
    broth: BrothType;
    needsRice: boolean;
  };
  patience: number; // Decreases over time
  maxPatience: number;
}

export interface Inventory {
  [BrothType.MILKY]: number;
  [BrothType.CLEAR]: number;
  [BrothType.MALA]: number;
  rice: number;
}

export enum GamePhase {
  INTRO = 'INTRO',
  STORY = 'STORY',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER'
}

export interface FeedbackEffect {
  id: number;
  x: number;
  y: number;
  text: string;
  type: 'score' | 'damage' | 'heal' | 'info';
}