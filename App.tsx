import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { MatrixGrid } from './components/MatrixGrid';
import { Toolbar } from './components/Toolbar';
import { FramesPanel } from './components/FramesPanel';
import { SerialPanel } from './components/SerialPanel';
import { TextPanel } from './components/TextPanel';
import { Calculator } from './components/Calculator';
import { CalculatorIcon } from './components/icons/CalculatorIcon';
import { useSerial } from './hooks/useSerial';
import { useAnimationLoop } from './hooks/useAnimationLoop';
import { generateRainbowFrame, generatePlasmaFrame } from './lib/animations';
import { createEmptyGrid, floodFill, renderText, getTextWidth } from './lib/utils';
import type { Grid, RGBColor, Tool, AnimationId, Direction } from './types';
import { Animation } from './types';
import { ROWS, COLS } from './constants';
import { FONT } from './lib/font';
import Sidebar from './components/Sidebar';
import Optional from './components/Optional';


const App: React.FC = () => {
    const [animationFrames, setAnimationFrames] = useState<Grid[]>([createEmptyGrid()]);
    const [proceduralFrame, setProceduralFrame] = useState<Grid | null>(null); // Separate state for procedural animations
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [color, setColor] = useState<RGBColor>({ r: 255, g: 0, b: 255 });
    const [tool, setTool] = useState<Tool>('Pencil');
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);

    const [animationId, setAnimationId] = useState<AnimationId>(Animation.None);
    const [animationSpeed, setAnimationSpeed] = useState(5);
    const [animationDirection, setAnimationDirection] = useState<Direction>('right');
    const [customAnimationFps, setCustomAnimationFps] = useState(10);
    const [scrollingText, setScrollingText] = useState('');
    const [isClockActive, setIsClockActive] = useState(false); // New state for clock activity
    const calculatorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (calculatorRef.current && !calculatorRef.current.contains(event.target as Node)) {
                setShowCalculator(false);
            }
        }

        if (showCalculator) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCalculator]);
    
    const { isConnected, isConnecting, connect, disconnect, sendPixel, sendFrame, setBrightnessValue } = useSerial();
    const isAnimationRunning = animationId !== Animation.None;
    
    // Derived state for the current grid - use procedural frame if available, otherwise use custom frames
    const grid = useMemo(() => {
        if (proceduralFrame && isAnimationRunning && animationId !== Animation.Custom) {
            return proceduralFrame;
        }
        return animationFrames[currentFrameIndex] || createEmptyGrid();
    }, [proceduralFrame, animationFrames, currentFrameIndex, isAnimationRunning, animationId]);

    const animationCallback = useCallback((time: number) => {
        let newGrid: Grid;
        switch (animationId) {
            case Animation.Rainbow:
                newGrid = generateRainbowFrame(time * (animationSpeed / 100), animationDirection);
                setProceduralFrame(newGrid);
                break;
            case Animation.Plasma:
                newGrid = generatePlasmaFrame(time * (animationSpeed / 100), animationDirection);
                setProceduralFrame(newGrid);
                break;
            case Animation.Custom:
                const frameIndex = Math.floor(time * customAnimationFps) % animationFrames.length;
                setCurrentFrameIndex(frameIndex);
                newGrid = animationFrames[frameIndex];
                break;
            case Animation.TextScroll:
                const textWidth = getTextWidth(scrollingText, FONT);
                const scrollSpeed = animationSpeed * 10;
                const totalWidth = COLS + textWidth;
                const startX = COLS - (Math.floor(time * scrollSpeed) % totalWidth);
                newGrid = renderText(createEmptyGrid(), scrollingText, FONT, color, startX);
                setProceduralFrame(newGrid);
                break;
            default:
                return;
        }
        sendFrame(newGrid);
    }, [animationId, animationSpeed, animationDirection, customAnimationFps, animationFrames, sendFrame, scrollingText, color]);

    useAnimationLoop(animationCallback, isAnimationRunning);

    // Fixed: Only copy and modify the specific frame being updated
    const updateCurrentFrame = useCallback((updater: (grid: Grid) => Grid) => {
        setAnimationFrames(prevFrames => {
            const newFrames = [...prevFrames];
            newFrames[currentFrameIndex] = updater(prevFrames[currentFrameIndex]);
            return newFrames;
        });
    }, [currentFrameIndex]);

    const handleSetPixel = useCallback((x: number, y: number, newColor: RGBColor) => {
        updateCurrentFrame(currentGrid => {
            const newGrid = currentGrid.map(row => [...row]);
            newGrid[y][x] = newColor;
            return newGrid;
        });
        sendPixel(x, y, newColor);
    }, [sendPixel, updateCurrentFrame]);

    const handleFloodFill = useCallback((x: number, y: number, fillColor: RGBColor) => {
        const currentGrid = animationFrames[currentFrameIndex] || createEmptyGrid();
        const newGrid = floodFill(currentGrid, x, y, fillColor);
        updateCurrentFrame(() => newGrid);
        sendFrame(newGrid);
    }, [animationFrames, currentFrameIndex, sendFrame, updateCurrentFrame]);

    // Fixed: Simplified conditional logic
    const handleCellInteraction = useCallback((x: number, y: number) => {
        const shouldStopAnimation = isAnimationRunning && 
            !(animationId === Animation.Custom && (tool === 'Pencil' || tool === 'Fill'));

        if (shouldStopAnimation) {
            setAnimationId(Animation.None);
            setProceduralFrame(null); // Clear procedural frame when stopping animation
        }

        switch (tool) {
            case 'Pencil':
                handleSetPixel(x, y, color);
                break;
            case 'Fill':
                handleFloodFill(x, y, color);
                break;
            case 'Erase':
                handleSetPixel(x, y, { r: 0, g: 0, b: 0 });
                break;
        }
    }, [isAnimationRunning, tool, color, handleSetPixel, handleFloodFill, animationId]);
    
    const handleBrightnessChange = useCallback((value: number) => {
       setBrightnessValue(value);
    }, [setBrightnessValue]);

    const handleClearGrid = useCallback(() => {
        if (isAnimationRunning) {
            setAnimationId(Animation.None);
            setProceduralFrame(null);
        }
        const newGrid = createEmptyGrid();
        updateCurrentFrame(() => newGrid);
        sendFrame(newGrid);
        setIsClockActive(false); // Deactivate clock on clear
    }, [isAnimationRunning, sendFrame, updateCurrentFrame, setIsClockActive]);

    const handleTextSubmit = useCallback((text: string, scroll: boolean) => {
        if (scroll) {
            setScrollingText(text);
            setAnimationId(Animation.TextScroll);
            setIsClockActive(false); // Deactivate clock if other text is scrolling
        } else {
            if (isAnimationRunning) {
                setAnimationId(Animation.None);
                setProceduralFrame(null);
            }
            const textWidth = getTextWidth(text, FONT); // Calculate text width
            const startX = Math.floor((COLS - textWidth) / 2); // Calculate startX for centering
            const newGrid = renderText(createEmptyGrid(), text, FONT, color, startX); // Pass startX
            setAnimationFrames(prev => prev.map((frame, index) => index === currentFrameIndex ? newGrid : frame));
            sendFrame(newGrid);
            // If the submitted text is from the clock, activate clock auto-update
            if (text.match(/^\d{2}:\d{2}$/)) { // Simple regex to check if it looks like HH:MM
                setIsClockActive(true);
            } else {
                setIsClockActive(false);
            }
        }
    }, [isAnimationRunning, color, sendFrame, setScrollingText, setAnimationId, currentFrameIndex, setIsClockActive]);

    // Frame management handlers
    const handleSelectFrame = useCallback((index: number) => {
        if (isAnimationRunning) {
            setAnimationId(Animation.None);
            setProceduralFrame(null);
        }
        setCurrentFrameIndex(index);
        sendFrame(animationFrames[index]);
        setIsClockActive(false); // Deactivate clock if frame is changed
    }, [isAnimationRunning, animationFrames, sendFrame, setIsClockActive]);

    const handleAddFrame = useCallback(() => {
        setAnimationFrames(prev => [...prev, createEmptyGrid()]);
        setCurrentFrameIndex(animationFrames.length);
        setIsClockActive(false); // Deactivate clock if new frame is added
    }, [animationFrames.length, setIsClockActive]);

    const handleDeleteFrame = useCallback((index: number) => {
        if (animationFrames.length <= 1) return;
        const newFrames = animationFrames.filter((_, i) => i !== index);
        setAnimationFrames(newFrames);
        setCurrentFrameIndex(prev => Math.min(prev, newFrames.length - 1));
        setIsClockActive(false); // Deactivate clock if frame is deleted
    }, [animationFrames, setIsClockActive]);

    const handleDuplicateFrame = useCallback((index: number) => {
        const frameToDuplicate = animationFrames[index].map(row => [...row]);
        const newFrames = [...animationFrames.slice(0, index + 1), frameToDuplicate, ...animationFrames.slice(index + 1)];
        setAnimationFrames(newFrames);
        setCurrentFrameIndex(index + 1);
        setIsClockActive(false); // Deactivate clock if frame is duplicated
    }, [animationFrames, setIsClockActive]);

    // Clear procedural frame when animation stops
    useEffect(() => {
        if (!isAnimationRunning) {
            setProceduralFrame(null);
        }
    }, [isAnimationRunning]);

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-start p-4 font-sans">
            <div className="w-full bg-gray-800 rounded-2xl shadow-2xl p-4 md:p-6 space-y-6">
                <header className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <h1 className="text-3xl font-bold text-cyan-400 tracking-wider">
                        Live Matrix Designer
                    </h1>
                    <button onClick={() => setShowCalculator(!showCalculator)} className="p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                        <CalculatorIcon />
                    </button>
                </header>

                <main className="flex gap-6 relative">
                    {/* Left Column: Tools */}
                    <div className="lg:w-64 space-y-6 flex-shrink-0">
                        <div className="p-4 bg-gray-700/50 rounded-lg">
                            <SerialPanel
                                onConnect={connect}
                                onDisconnect={disconnect}
                                isConnected={isConnected}
                            />
                        </div>
                        <div className="p-4 bg-gray-700/50 rounded-lg">
                            <Toolbar
                                selectedColor={color}
                                onColorChange={setColor}
                                selectedTool={tool}
                                onToolChange={setTool}
                                onBrightnessChange={handleBrightnessChange}
                                onClear={handleClearGrid}
                                animationId={animationId}
                                onAnimationChange={setAnimationId}
                                animationSpeed={animationSpeed}
                                onAnimationSpeedChange={setAnimationSpeed}
                                animationDirection={animationDirection}
                                onAnimationDirectionChange={setAnimationDirection}
                                isAnimationRunning={isAnimationRunning}
                                customAnimationFps={customAnimationFps}
                                onCustomAnimationFpsChange={setCustomAnimationFps}
                                disabled={!isConnected}
                            />
                        </div>
                        {tool === 'Text' && (
                            <div className="bg-gray-700/50 p-4 rounded-lg">
                                <TextPanel onTextSubmit={handleTextSubmit} disabled={!isConnected} />
                            </div>
                        )}
                    </div>

                    {/* Middle Column: Matrix */}
                    <div 
                        className="flex-grow flex flex-col gap-6"
                        onMouseDown={() => setIsMouseDown(true)}
                        onMouseUp={() => setIsMouseDown(false)}
                        onMouseLeave={() => setIsMouseDown(false)}
                    >
                        <div className="p-4 bg-gray-700/50 rounded-lg">
                            <MatrixGrid
                                grid={grid}
                                onCellClick={handleCellInteraction}
                                isMouseDown={isMouseDown}
                                disabled={!isConnected}
                            />
                        </div>
                        <div className="p-4 bg-gray-700/50 rounded-lg">
                            <FramesPanel
                                frames={animationFrames}
                                currentIndex={currentFrameIndex}
                                onSelectFrame={handleSelectFrame}
                                onAddFrame={handleAddFrame}
                                onDuplicateFrame={handleDuplicateFrame}
                                onDeleteFrame={handleDeleteFrame}
                                disabled={!isConnected}
                            />
                        </div>
                    </div>

                    {/* Right Column: Optional */}
                    <div className="lg:w-64 space-y-6 flex-shrink-0">
                        <Optional onDisplayTime={(text) => handleTextSubmit(text, false)} isClockActive={isClockActive} setIsClockActive={setIsClockActive} />
                    </div>
                </main>
                {showCalculator && (
                    <div ref={calculatorRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 p-4 rounded-lg shadow-lg z-50 max-w-full sm:max-w-3xl lg:max-w-5xl max-h-screen overflow-y-auto">
                        <Calculator />
                    </div>
                )}
            </div>
             <footer className="text-center text-gray-500 mt-4 text-sm">
                <p>Designed for a {COLS}x{ROWS} WS2812B Serpentine LED Matrix.</p>
            </footer>
        </div>
    );
};

export default App;