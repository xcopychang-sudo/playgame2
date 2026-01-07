export enum GameStatus {
  MENU,
  PLAYING,
  GAME_OVER,
  VICTORY
}

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Entity {
  id: string;
  position: Point;
  width: number;
  height: number;
  color: string;
  markedForDeletion: boolean;
}

export interface Player extends Entity {
  velocity: number;
  isShooting: boolean;
  cooldown: number;
  hp: number;
}

export interface Enemy extends Entity {
  type: 'basic' | 'shooter' | 'diver';
  row: number;
  col: number;
  velocity: Point;
}

export interface Projectile extends Entity {
  velocity: Point;
  isEnemy: boolean;
}

export interface Particle extends Entity {
  velocity: Point;
  life: number;
  maxLife: number;
  alpha: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
}
