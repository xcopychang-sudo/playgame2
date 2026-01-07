export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const PLAYER_SPEED = 7;
export const PLAYER_SIZE = 32;
export const PROJECTILE_SPEED = 10;
export const ENEMY_PROJECTILE_SPEED = 6;
export const FIRE_COOLDOWN = 15; // Frames

export const ENEMY_ROWS = 4;
export const ENEMY_COLS = 8;
export const ENEMY_SIZE = 28;
export const ENEMY_PADDING = 20;
export const ENEMY_SPEED_X = 2;
export const ENEMY_DROP_HEIGHT = 20;

export const COLORS = {
  PLAYER: '#00ffff', // Cyan
  PLAYER_BULLET: '#ccffff',
  ENEMY_BASIC: '#ff00ff', // Magenta
  ENEMY_SHOOTER: '#ff9900', // Orange
  ENEMY_BULLET: '#ff3333', // Red
  PARTICLE_EXPLOSION: '#ffff00',
  BACKGROUND: '#050510',
};

export const KEYS = {
  LEFT: ['ArrowLeft', 'a', 'A'],
  RIGHT: ['ArrowRight', 'd', 'D'],
  SHOOT: [' ', 'Space', 'Enter'],
};
