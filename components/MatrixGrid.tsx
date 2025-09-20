
import React from 'react';
import type { Grid, RGBColor, Selection } from '../types';
import { COLS } from '../constants';

interface MatrixGridProps {
  grid: Grid;
  selection: Selection;
  onCellClick: (x: number, y: number) => void;
  isMouseDown: boolean;
  disabled: boolean;
}

const Cell: React.FC<{
  color: RGBColor;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}> = ({ color, isSelected, onClick, onMouseEnter }) => {
  const cellColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
  const shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`;
  const isOff = color.r === 0 && color.g === 0 && color.b === 0;

  return (
    <div
      className="w-full h-full rounded-sm cursor-pointer transition-all duration-100 relative"
      style={{
        backgroundColor: cellColor,
        boxShadow: isOff ? 'none' : `0 0 4px 1px ${shadowColor}`,
        border: isOff ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
        {isSelected && (
            <div className="absolute inset-0 bg-white/30 rounded-sm border-2 border-cyan-400 animate-pulse"></div>
        )}
    </div>
  );
};


export const MatrixGrid: React.FC<MatrixGridProps> = ({ grid, selection, onCellClick, isMouseDown, disabled }) => {
  const handleCellMouseEnter = (x: number, y: number) => {
    if (isMouseDown) {
      onCellClick(x, y);
    }
  };

  return (
    <div
      className={`aspect-[22/9] w-full max-w-full grid gap-1 p-2 bg-black rounded-lg border-2 border-gray-700 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
      onContextMenu={(e) => e.preventDefault()} // Disable right click menu
    >
      {grid.map((row, y) =>
        row.map((color, x) => (
          <Cell
            key={`${x}-${y}`}
            color={color}
            isSelected={selection.has(`${x},${y}`)}
            onClick={() => !disabled && onCellClick(x, y)}
            onMouseEnter={() => !disabled && handleCellMouseEnter(x, y)}
          />
        ))
      )}
    </div>
  );
};
