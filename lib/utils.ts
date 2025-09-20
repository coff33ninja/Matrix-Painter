import { ROWS, COLS } from '../constants';
import type { Grid, RGBColor, Selection } from '../types';
import { FONT } from './font';

export const createEmptyGrid = (): Grid => {
  return Array.from({ length: ROWS }, () =>
    Array(COLS).fill({ r: 0, g: 0, b: 0 })
  );
};

// Replicates the Arduino's serpentine layout mapping
export const mapXYtoIndex = (x: number, y: number): number => {
    if (y % 2 === 1) { // Odd rows are reversed
        return (y * COLS) + (COLS - 1 - x);
    }
    return (y * COLS) + x; // Even rows are normal
};

// Non-recursive flood fill algorithm
export const floodFill = (grid: Grid, startX: number, startY: number, fillColor: RGBColor): Grid => {
    const newGrid = grid.map(row => [...row]);
    const { r, g, b } = newGrid[startY][startX];
    const targetColor = {r, g, b};

    if (targetColor.r === fillColor.r && targetColor.g === fillColor.g && targetColor.b === fillColor.b) {
        return newGrid; // No need to fill if colors are the same
    }

    const queue: [number, number][] = [[startX, startY]];
    
    while(queue.length > 0) {
        const [x, y] = queue.shift()!;
        
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) continue;

        const currentColor = newGrid[y][x];
        if (currentColor.r === targetColor.r && currentColor.g === targetColor.g && currentColor.b === targetColor.b) {
            newGrid[y][x] = fillColor;
            queue.push([x + 1, y]);
            queue.push([x - 1, y]);
            queue.push([x, y + 1]);
            queue.push([x, y - 1]);
        }
    }

    return newGrid;
};

export const getTextWidth = (text: string): number => {
    let width = 0;
    for (const char of text.toUpperCase()) {
        const charData = FONT[char];
        if (charData) {
            width += charData[0].length + 1; // Add 1 for spacing
        }
    }
    return width;
}

export const renderText = (grid: Grid, text: string, color: RGBColor, startX: number, startY: number): Grid => {
  const newGrid = grid.map(row => [...row]);
  let currentX = startX;

  for (const char of text.toUpperCase()) {
    const charData = FONT[char];
    if (charData) {
      for (let y = 0; y < charData.length; y++) {
        for (let x = 0; x < charData[y].length; x++) {
          if (charData[y][x] === 1) {
            const gridX = currentX + x;
            const gridY = startY + y;
            if (gridX >= 0 && gridX < COLS && gridY >= 0 && gridY < ROWS) {
              newGrid[gridY][gridX] = color;
            }
          }
        }
      }
      currentX += charData[0].length + 1; // Add 1 for spacing between characters
    }
  }

  return newGrid;
};

export const selectConnectedPixels = (grid: Grid, startX: number, startY: number): Selection => {
    const selection: Selection = new Set();
    const visited: Set<string> = new Set();
    const queue: [number, number][] = [[startX, startY]];

    if (startX < 0 || startX >= COLS || startY < 0 || startY >= ROWS) {
        return selection;
    }

    const targetColor = grid[startY][startX];

    while (queue.length > 0) {
        const [x, y] = queue.shift()!;
        const coord = `${x},${y}`;

        if (x < 0 || x >= COLS || y < 0 || y >= ROWS || visited.has(coord)) {
            continue;
        }

        visited.add(coord);
        const currentColor = grid[y][x];

        if (currentColor.r === targetColor.r && currentColor.g === targetColor.g && currentColor.b === targetColor.b) {
            selection.add(coord);
            queue.push([x + 1, y]);
            queue.push([x - 1, y]);
            queue.push([x, y + 1]);
            queue.push([x, y - 1]);
        }
    }

    return selection;
}
