import React from 'react';
import { ColorPicker } from './ColorPicker';
import type { RGBColor, Tool, AnimationId, Direction } from '../types';
import { Animation } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { FillIcon } from './icons/FillIcon';
import { SprayIcon } from './icons/SprayIcon';
import { TextIcon } from './icons/TextIcon';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ToolbarProps {
  selectedColor: RGBColor;
  onColorChange: (color: RGBColor) => void;
  selectedTool: Tool;
  onToolChange: (tool: Tool) => void;
  onBrightnessChange: (value: number) => void;
  onClear: () => void;
  animationId: AnimationId;
  onAnimationChange: (id: AnimationId) => void;
  isAnimationRunning: boolean;
  animationSpeed: number;
  onAnimationSpeedChange: (speed: number) => void;
  animationDirection: Direction;
  onAnimationDirectionChange: (direction: Direction) => void;
  customAnimationFps: number;
  onCustomAnimationFpsChange: (fps: number) => void;
  disabled: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = (props) => {
    const {
        selectedColor, onColorChange, selectedTool, onToolChange,
        onBrightnessChange, onClear, animationId, onAnimationChange,
        isAnimationRunning, animationSpeed, onAnimationSpeedChange,
        animationDirection, onAnimationDirectionChange, customAnimationFps,
        onCustomAnimationFpsChange, disabled
    } = props;
    
    const handleToggleAnimation = () => {
        if (isAnimationRunning) {
            onAnimationChange(Animation.None);
        } else {
            // If play is pressed with no animation selected, default to rainbow
            if (animationId === Animation.None) {
                 onAnimationChange(Animation.Rainbow);
            } else {
                // This will trigger the animation loop in App.tsx for the currently selected animation
                 onAnimationChange(animationId);
            }
        }
    };

    return (
        <div className={`flex-shrink-0 w-full lg:w-72 bg-gray-700/50 p-4 rounded-lg space-y-6 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
            {/* Color Picker Section */}
            <div>
                <h3 className="text-lg font-semibold mb-3 text-cyan-300">Color</h3>
                <ColorPicker color={selectedColor} onChange={onColorChange} />
            </div>

            {/* Tools Section */}
            <div>
                <h3 className="text-lg font-semibold mb-3 text-cyan-300">Tools</h3>
                <div className="grid grid-cols-3 gap-2">
                    <ToolButton name="Pencil" icon={<PencilIcon />} selectedTool={selectedTool} onSelect={onToolChange} />
                    <ToolButton name="Fill" icon={<FillIcon />} selectedTool={selectedTool} onSelect={onToolChange} />
                    <ToolButton name="Text" icon={<TextIcon />} selectedTool={selectedTool} onSelect={onToolChange} />
                    <ToolButton name="Spray" icon={<SprayIcon />} selectedTool={selectedTool} onSelect={onToolChange} />
                    <ToolButton name="Erase" icon={<TrashIcon />} selectedTool={selectedTool} onSelect={onToolChange} />
                </div>
            </div>

            {/* Controls Section */}
            <div>
                <h3 className="text-lg font-semibold mb-3 text-cyan-300">Controls</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="brightness" className="block text-sm font-medium text-gray-300">Brightness</label>
                        <input
                            id="brightness"
                            type="range"
                            min="0"
                            max="255"
                            defaultValue="32"
                            onChange={(e) => onBrightnessChange(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>
                    <button onClick={onClear} className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                        Clear Grid
                    </button>
                </div>
            </div>

            {/* Animation Section */}
            <div>
                <h3 className="text-lg font-semibold mb-3 text-cyan-300">Animations</h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <select
                            value={animationId}
                            onChange={(e) => onAnimationChange(e.target.value as AnimationId)}
                            className="w-full bg-gray-600 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        >
                            <option value={Animation.None}>None</option>
                            <option value={Animation.Rainbow}>Rainbow</option>
                            <option value={Animation.Plasma}>Plasma</option>
                            <option value={Animation.Custom}>Custom</option>
                        </select>
                        <button onClick={handleToggleAnimation} className="p-2 bg-gray-600 hover:bg-gray-500 rounded-md" disabled={animationId === Animation.None}>
                            {isAnimationRunning ? <PauseIcon /> : <PlayIcon />}
                        </button>
                    </div>
                    
                    {(animationId === Animation.Rainbow || animationId === Animation.Plasma) && (
                        <>
                            <div>
                                <label htmlFor="anim_speed" className="block text-sm font-medium text-gray-300">Speed</label>
                                <input
                                    id="anim_speed"
                                    type="range"
                                    min="1"
                                    max="20"
                                    value={animationSpeed}
                                    onChange={(e) => onAnimationSpeedChange(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Direction</label>
                                <div className="grid grid-cols-2 gap-2">
                                <DirectionButton name="up" current={animationDirection} set={onAnimationDirectionChange} />
                                <DirectionButton name="down" current={animationDirection} set={onAnimationDirectionChange} />
                                <DirectionButton name="left" current={animationDirection} set={onAnimationDirectionChange} />
                                <DirectionButton name="right" current={animationDirection} set={onAnimationDirectionChange} />
                                </div>
                            </div>
                        </>
                    )}

                    {animationId === Animation.Custom && (
                         <div>
                            <label htmlFor="anim_fps" className="block text-sm font-medium text-gray-300">FPS ({customAnimationFps})</label>
                            <input
                                id="anim_fps"
                                type="range"
                                min="1"
                                max="30"
                                value={customAnimationFps}
                                onChange={(e) => onCustomAnimationFpsChange(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ToolButton: React.FC<{ name: Tool, icon: React.ReactNode, selectedTool: Tool, onSelect: (tool: Tool) => void }> = ({ name, icon, selectedTool, onSelect }) => (
    <button
        onClick={() => onSelect(name)}
        className={`flex items-center justify-center space-x-2 p-2 rounded-lg transition-colors ${
            selectedTool === name ? 'bg-cyan-600 text-white' : 'bg-gray-600 hover:bg-gray-500'
        }`}
    >
        {icon}
        <span>{name}</span>
    </button>
);


const DirectionButton: React.FC<{ name: Direction, current: Direction, set: (dir: Direction) => void }> = ({ name, current, set }) => (
    <button 
        onClick={() => set(name)}
        className={`capitalize p-2 rounded-lg transition-colors text-sm ${
            current === name ? 'bg-cyan-600 text-white' : 'bg-gray-600 hover:bg-gray-500'
        }`}
    >
        {name}
    </button>
);