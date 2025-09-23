export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export type Grid = RGBColor[][];

export type Tool = 'Pencil' | 'Fill' | 'Text' | 'Erase' | 'Spray';

export enum Animation {
    None = 'none',
    Rainbow = 'rainbow',
    Plasma = 'plasma',
    Custom = 'custom',
    TextScroll = 'text-scroll',
}

export type AnimationId = Animation;

export type Direction = 'up' | 'down' | 'left' | 'right';

export type Font = { [key: string]: number[][] };