
import React from 'react';
import type { RGBColor } from '../types';

interface ColorPickerProps {
  color: RGBColor;
  onChange: (color: RGBColor) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const handleColorChange = (channel: 'r' | 'g' | 'b', value: number) => {
    onChange({ ...color, [channel]: value });
  };

  return (
    <div className="space-y-2">
      <div className="w-full h-10 rounded-lg border-2 border-gray-500" style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }} />
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
            <span className="font-mono text-sm w-4">R</span>
            <input
            type="range"
            min="0"
            max="255"
            value={color.r}
            onChange={(e) => handleColorChange('r', parseInt(e.target.value, 10))}
            className={`w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500`}
            />
            <span className="font-mono text-sm w-8 text-right">{color.r}</span>
        </div>
        <div className="flex items-center space-x-2">
            <span className="font-mono text-sm w-4">G</span>
            <input
            type="range"
            min="0"
            max="255"
            value={color.g}
            onChange={(e) => handleColorChange('g', parseInt(e.target.value, 10))}
            className={`w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500`}
            />
            <span className="font-mono text-sm w-8 text-right">{color.g}</span>
        </div>
        <div className="flex items-center space-x-2">
            <span className="font-mono text-sm w-4">B</span>
            <input
            type="range"
            min="0"
            max="255"
            value={color.b}
            onChange={(e) => handleColorChange('b', parseInt(e.target.value, 10))}
            className={`w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500`}
            />
            <span className="font-mono text-sm w-8 text-right">{color.b}</span>
        </div>
      </div>
    </div>
  );
};
