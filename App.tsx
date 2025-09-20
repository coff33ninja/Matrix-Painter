import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { MatrixGrid } from './components/MatrixGrid';
import { Toolbar } from './components/Toolbar';
import { FramesPanel } from './components/FramesPanel';
import { SerialPanel } from './components/SerialPanel';
import { TextPanel } from './components/TextPanel';
import { useSerial } from './hooks/useSerial';
import { useAnimationLoop } from './hooks/useAnimationLoop';
import { generateRainbowFrame, generatePlasmaFrame } from './lib/animations';
import { createEmptyGrid, floodFill, renderText, getTextWidth } from './lib/utils';
import type { Grid, RGBColor, Tool, AnimationId, Direction } from './types';
import { Animation } from './types';
import { ROWS, COLS } from './constants';


const App: React.FC = () => {
    const [animationFrames, setAnimationFrames] = useState<Grid[]>([createEmptyGrid()]);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [color, setColor] = useState<RGBColor>({ r: 255, g: 0, b: 255 });
    const [tool, setTool] = useState<Tool>('Pencil');
    const [isMouseDown, setIsMouseDown] = useState(false);

    const [animationId, setAnimationId] = useState<AnimationId>(Animation.None);
    const [animationSpeed, setAnimationSpeed] = useState(5);
    const [animationDirection, setAnimationDirection] = useState<Direction>('right');
    const [customAnimationFps, setCustomAnimationFps] = useState(10);
    const [scrollingText, setScrollingText] = useState('');
    
    const { isConnected, isConnecting, connect, disconnect, sendPixel, sendFrame, setBrightnessValue } = useSerial();
    const isAnimationRunning = animationId !== Animation.None;
    
    // Derived state for the current grid
    const grid = useMemo(() => animationFrames[currentFrameIndex] || createEmptyGrid(), [animationFrames, currentFrameIndex]);

    const animationCallback = useCallback((time: number) => {
        let newGrid: Grid;
        switch (animationId) {
            case Animation.Rainbow:
                newGrid = generateRainbowFrame(time * (animationSpeed / 100), animationDirection);
                setAnimationFrames([newGrid]); // Procedural animations have one "frame"
                setCurrentFrameIndex(0);
                break;
            case Animation.Plasma:
                newGrid = generatePlasmaFrame(time * (animationSpeed / 100), animationDirection);
                setAnimationFrames([newGrid]);
                setCurrentFrameIndex(0);
                break;
            case Animation.Custom:
                const frameIndex = Math.floor(time * customAnimationFps) % animationFrames.length;
                newGrid = animationFrames[frameIndex];
                setCurrentFrameIndex(frameIndex); // Update index for thumbnail highlight
                break;
            case Animation.TextScroll:
                const textWidth = getTextWidth(scrollingText);
                const scrollSpeed = animationSpeed * 10; // Adjust speed for smoother scrolling
                const totalWidth = COLS + textWidth;
                const startX = COLS - (Math.floor(time * scrollSpeed) % totalWidth);
                newGrid = renderText(createEmptyGrid(), scrollingText, color, startX, 0);
                setAnimationFrames([newGrid]);
                setCurrentFrameIndex(0);
                break;
            default:
                return;
        }
        sendFrame(newGrid);
    }, [animationId, animationSpeed, animationDirection, customAnimationFps, animationFrames, sendFrame, scrollingText, color]);

    useAnimationLoop(animationCallback, isAnimationRunning);

    const updateCurrentFrame = useCallback((updater: (grid: Grid) => Grid) => {
        setAnimationFrames(prevFrames => {
            const newFrames = prevFrames.map(frame => frame.map(row => [...row])); // Deep copy
            newFrames[currentFrameIndex] = updater(newFrames[currentFrameIndex]);
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
        const newGrid = floodFill(grid, x, y, fillColor);
        updateCurrentFrame(() => newGrid);
        sendFrame(newGrid);
    }, [grid, sendFrame, updateCurrentFrame]);

    const handleCellInteraction = useCallback((x: number, y: number) => {
        // Only stop animation if it's not a custom animation being edited with Pencil/Fill
        if (isAnimationRunning && !(animationId === Animation.Custom && (tool === 'Pencil' || tool === 'Fill'))) {
            setAnimationId(Animation.None);
        }

        if (tool === 'Pencil') {
            handleSetPixel(x, y, color);
        } else if (tool === 'Fill') {
            handleFloodFill(x, y, color);
        } else if (tool === 'Erase') {
            handleSetPixel(x, y, { r: 0, g: 0, b: 0 });
        }
    }, [isAnimationRunning, tool, color, handleSetPixel, handleFloodFill, animationId]);
    
    const handleBrightnessChange = useCallback((value: number) => {
       setBrightnessValue(value);
    }, [setBrightnessValue]);

    const handleClearGrid = useCallback(() => {
        if (isAnimationRunning) setAnimationId(Animation.None);
        const newGrid = createEmptyGrid();
        updateCurrentFrame(() => newGrid);
        sendFrame(newGrid);
    }, [isAnimationRunning, sendFrame, updateCurrentFrame]);

    const handleTextSubmit = useCallback((text: string, scroll: boolean) => {
        if (scroll) {
            setScrollingText(text);
            setAnimationId(Animation.TextScroll);
        } else {
            if (isAnimationRunning) setAnimationId(Animation.None);
            const newGrid = renderText(createEmptyGrid(), text, color, 0, 0);
            setAnimationFrames(prev => prev.map((frame, index) => index === currentFrameIndex ? newGrid : frame));
            sendFrame(newGrid);
        }
    }, [isAnimationRunning, color, sendFrame, setScrollingText, setAnimationId, currentFrameIndex]);

    // Frame management handlers
    const handleSelectFrame = useCallback((index: number) => {
        if (isAnimationRunning) setAnimationId(Animation.None);
        setCurrentFrameIndex(index);
        sendFrame(animationFrames[index]);
    }, [isAnimationRunning, animationFrames, sendFrame]);

    const handleAddFrame = useCallback(() => {
        setAnimationFrames(prev => [...prev, createEmptyGrid()]);
        setCurrentFrameIndex(animationFrames.length);
    }, [animationFrames.length]);

    const handleDeleteFrame = useCallback((index: number) => {
        if (animationFrames.length <= 1) return; // Don't delete the last frame
        const newFrames = animationFrames.filter((_, i) => i !== index);
        setAnimationFrames(newFrames);
        setCurrentFrameIndex(prev => Math.min(prev, newFrames.length - 1));
    }, [animationFrames]);

    const handleDuplicateFrame = useCallback((index: number) => {
        const frameToDuplicate = animationFrames[index].map(row => [...row]);
        const newFrames = [...animationFrames.slice(0, index + 1), frameToDuplicate, ...animationFrames.slice(index + 1)];
        setAnimationFrames(newFrames);
        setCurrentFrameIndex(index + 1);
    }, [animationFrames]);


    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-start p-4 font-sans">
            <div className="w-full max-w-7xl bg-gray-800 rounded-2xl shadow-2xl p-4 md:p-6 space-y-6">
                <header className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <h1 className="text-3xl font-bold text-cyan-400 tracking-wider">
                        Live Matrix Designer
                    </h1>
                </header>

                <main className="flex flex-col lg:flex-row gap-6">
                    <div className="w-full lg:w-72 space-y-6 flex-shrink-0">
                        <SerialPanel
                            onConnect={connect}
                            onDisconnect={disconnect}
                            isConnected={isConnected}
                        />
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
                        {tool === 'Text' && (
                            <div className="bg-gray-700/50 p-4 rounded-lg">
                                <TextPanel onTextSubmit={handleTextSubmit} disabled={!isConnected} />
                            </div>
                        )}
                    </div>
                    <div 
                        className="flex-grow flex flex-col items-center justify-center gap-4"
                        onMouseDown={() => setIsMouseDown(true)}
                        onMouseUp={() => setIsMouseDown(false)}
                        onMouseLeave={() => setIsMouseDown(false)}
                    >
                        <MatrixGrid
                            grid={grid}
                            onCellClick={handleCellInteraction}
                            isMouseDown={isMouseDown}
                            disabled={!isConnected}
                        />
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
                </main>
            </div>
             <footer className="text-center text-gray-500 mt-4 text-sm">
                <p>Designed for a {COLS}x{ROWS} WS2812B Serpentine LED Matrix.</p>
            </footer>
        </div>
    );
};

export default App;