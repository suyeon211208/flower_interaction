export interface Cloud {
  id: string;
  x: number; // 0 to 1 relative screen width
  y: number; // 0 to 1 relative screen height
  scale: number;
  speed: number;
  opacity: number;
  type: 'large' | 'medium' | 'small' | 'fluffy';
}

export interface SwayingFlower {
  id: string;
  x: number; // relative 0 to 1
  y: number; // relative 0 to 1
  scale: number;
  flowerType: 'whiteDaisy' | 'coralDaisy' | 'redPoppy' | 'smallDaisy' | 'tallPoppy';
  swayPhase: number;
  swaySpeed: number;
  swayAmplitude: number;
  height: number;
}

export interface PetalParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  vRot: number;
  life: number; // 1 to 0
  maxLife: number;
}

export interface FlowerStamp {
  id: string;
  x: number; // canvas pixel X
  y: number; // canvas pixel Y
  flowerType: 'whiteDaisy' | 'coralDaisy' | 'redPoppy' | 'goldenDaisy' | 'blossom';
  scale: number;
  targetScale: number;
  rotation: number;
  createdAt: number;
  duration: number; // ms until fade starts
  fadeDuration: number; // ms fade out time
  opacity: number;
  swayPhase: number;
  particles: PetalParticle[];
}

export interface TouchRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

export interface HandPosition {
  id: string;
  x: number; // canvas pixel X
  y: number; // canvas pixel Y
  rawX: number; // 0 to 1
  rawY: number; // 0 to 1
  isPinching?: boolean;
}
