// 60 FPS Fluid Snake Game Engine

export const SPEED_LEVELS = {
  slow: { name: 'Slow', interval: 140 },
  normal: { name: 'Normal', interval: 100 },
  fast: { name: 'Insane', interval: 65 }
};

export const FOOD_TYPES = {
  apple: { name: 'Apple', points: 10, color: '#ef4444', icon: '🍎' },
  star: { name: 'Golden Star', points: 30, color: '#facc15', icon: '⭐' },
  cherry: { name: 'Cherry', points: 20, color: '#ec4899', icon: '🍒' }
};

export class SnakeEngine {
  constructor(gridSize = 22) {
    this.gridSize = gridSize;
    this.score = 0;
    this.bestScore = parseInt(localStorage.getItem('snake_best_score') || '0', 10);
    this.mode = 'classic'; // 'classic' (walls deadly) | 'borderless' (wraps)
    this.speedLevel = 'normal';
    this.status = 'ready'; // 'ready' | 'playing' | 'paused' | 'gameover'
    this.theme = 'modern'; // 'modern' | 'nokia' | 'neon'
    this.reset();
  }

  reset() {
    this.score = 0;
    this.status = 'ready';
    const mid = Math.floor(this.gridSize / 2);
    // Start with 4 segments moving right
    this.snake = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
      { x: mid - 3, y: mid }
    ];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.food = null;
    this.spawnFood();
  }

  setDirection(dir) {
    if (this.status === 'ready') {
      this.status = 'playing';
    }
    if (this.status !== 'playing') return;

    // Disallow 180 degree immediate reverse
    if (dir.x !== -this.direction.x || dir.y !== -this.direction.y) {
      this.nextDirection = dir;
    }
  }

  spawnFood() {
    const emptyCells = [];
    const snakeMap = new Set(this.snake.map(s => `${s.x},${s.y}`));

    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        if (!snakeMap.has(`${x},${y}`)) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length === 0) return null; // Player filled the entire board!

    const choice = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const roll = Math.random();
    let type = 'apple';
    if (roll < 0.15) type = 'star';
    else if (roll < 0.3) type = 'cherry';

    this.food = {
      x: choice.x,
      y: choice.y,
      type,
      ...FOOD_TYPES[type]
    };
    return this.food;
  }

  step() {
    if (this.status !== 'playing') return { moved: false };

    this.direction = this.nextDirection;
    const head = this.snake[0];
    let newX = head.x + this.direction.x;
    let newY = head.y + this.direction.y;

    // Handle Wall Collision / Wrap
    if (this.mode === 'borderless') {
      newX = (newX + this.gridSize) % this.gridSize;
      newY = (newY + this.gridSize) % this.gridSize;
    } else {
      if (newX < 0 || newX >= this.gridSize || newY < 0 || newY >= this.gridSize) {
        this.status = 'gameover';
        return { moved: true, status: 'gameover', reason: 'wall' };
      }
    }

    // Handle Self-Collision (skip last tail segment since it will move unless eating food)
    const eating = (this.food && newX === this.food.x && newY === this.food.y);
    const bodyToCheck = eating ? this.snake : this.snake.slice(0, -1);
    for (const seg of bodyToCheck) {
      if (seg.x === newX && seg.y === newY) {
        this.status = 'gameover';
        return { moved: true, status: 'gameover', reason: 'self' };
      }
    }

    // Move Head
    const newHead = { x: newX, y: newY };
    this.snake.unshift(newHead);

    let ateFood = false;
    let pointsGained = 0;

    if (eating) {
      ateFood = true;
      pointsGained = this.food.points;
      this.score += pointsGained;
      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        localStorage.setItem('snake_best_score', this.bestScore);
      }
      this.spawnFood();
    } else {
      this.snake.pop(); // Remove tail segment
    }

    return {
      moved: true,
      status: 'playing',
      ateFood,
      pointsGained,
      score: this.score,
      bestScore: this.bestScore
    };
  }

  togglePause() {
    if (this.status === 'playing') {
      this.status = 'paused';
    } else if (this.status === 'paused') {
      this.status = 'playing';
    }
    return this.status;
  }
}
