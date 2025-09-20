
import type { Grid, RGBColor, Direction } from '../types';
import { ROWS, COLS } from '../constants';

const createGrid = (): Grid => Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, () => ({ r: 0, g: 0, b: 0 }))
);

const hsvToRgb = (h: number, s: number, v: number): RGBColor => {
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
    };
};

export const getRainbowColor = (x: number, y: number, time: number, direction: Direction): RGBColor => {
    let val;
    switch(direction) {
        case 'up': val = y; break;
        case 'down': val = -y; break;
        case 'left': val = x; break;
        case 'right': val = -x; break;
    }
    const hue = (time + val / 20) % 1;
    return hsvToRgb(hue, 1, 1);
};

export const generateRainbowFrame = (time: number, direction: Direction): Grid => {
    const grid = createGrid();
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            grid[y][x] = getRainbowColor(x, y, time, direction);
        }
    }
    return grid;
};


export const getPlasmaColor = (x: number, y: number, time: number, direction: Direction): RGBColor => {
    let dx, dy;
    switch(direction) {
        case 'up': dx = time; dy = 0; break;
        case 'down': dx = -time; dy = 0; break;
        case 'left': dx = 0; dy = time; break;
        case 'right': dx = 0; dy = -time; break;
    }

    const v1 = Math.sin((x * 0.2) + time + dx);
    const v2 = Math.sin((y * 0.3) + time + dy);
    const v3 = Math.sin(((x + y) * 0.15) + time);

    const value = (v1 + v2 + v3 + 3) / 6; // Normalize to 0-1
    return hsvToRgb(value, 1, 1);
};

export const generatePlasmaFrame = (time: number, direction: Direction): Grid => {
    const grid = createGrid();
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            grid[y][x] = getPlasmaColor(x, y, time, direction);
        }
    }
    return grid;
};
