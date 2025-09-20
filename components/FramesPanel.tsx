import React from 'react';
import type { Grid, RGBColor } from '../types';
import { COLS } from '../constants';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DuplicateIcon } from './icons/DuplicateIcon';

interface FramesPanelProps {
  frames: Grid[];
  currentIndex: number;
  onSelectFrame: (index: number) => void;
  onAddFrame: () => void;
  onDuplicateFrame: (index: number) => void;
  onDeleteFrame: (index: number) => void;
  disabled: boolean;
}

const FrameThumbnail: React.FC<{ grid: Grid, isSelected: boolean, onClick: () => void }> = ({ grid, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className={`aspect-[22/9] w-full grid gap-px p-1 bg-black rounded cursor-pointer border-2 transition-colors ${isSelected ? 'border-cyan-400' : 'border-gray-600 hover:border-gray-500'}`}
    style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
  >
    {grid.map((row, y) =>
      row.map((color, x) => (
        <div
          key={`${x}-${y}`}
          className="w-full h-full rounded-xs"
          style={{ backgroundColor: `rgb(${color.r},${color.g},${color.b})` }}
        />
      ))
    )}
  </div>
);

export const FramesPanel: React.FC<FramesPanelProps> = ({
  frames,
  currentIndex,
  onSelectFrame,
  onAddFrame,
  onDuplicateFrame,
  onDeleteFrame,
  disabled
}) => {
  return (
    <div className={`w-full bg-gray-700/50 p-3 rounded-lg ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-3 overflow-x-auto pb-3">
            {frames.map((frame, index) => (
                <div key={index} className="flex-shrink-0 w-32 space-y-1.5">
                    <FrameThumbnail
                        grid={frame}
                        isSelected={index === currentIndex}
                        onClick={() => onSelectFrame(index)}
                    />
                    <div className="flex items-center justify-between">
                         <span className="text-xs text-gray-400 font-mono pl-1">#{index + 1}</span>
                         <div className="flex items-center gap-1">
                             <IconButton onClick={() => onDuplicateFrame(index)}><DuplicateIcon /></IconButton>
                             <IconButton onClick={() => onDeleteFrame(index)} disabled={frames.length <= 1}><TrashIcon /></IconButton>
                         </div>
                    </div>
                </div>
            ))}
            <button
                onClick={onAddFrame}
                className="flex-shrink-0 w-20 h-20 bg-gray-800 hover:bg-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-400 transition-colors"
            >
                <PlusIcon />
                <span className="text-xs mt-1">Add Frame</span>
            </button>
        </div>
    </div>
  );
};

const IconButton: React.FC<{ onClick: () => void; children: React.ReactNode; disabled?: boolean }> = ({ onClick, children, disabled }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className="p-1 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed rounded transition-colors"
    >
        {children}
    </button>
)
