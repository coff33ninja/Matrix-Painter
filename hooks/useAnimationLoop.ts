import { useRef, useEffect, useCallback } from 'react';

export const useAnimationLoop = (callback: (time: number) => void, isRunning: boolean) => {
    const requestRef = useRef<number | undefined>(undefined);
    const previousTimeRef = useRef<number | undefined>(undefined);
    const startTimeRef = useRef<number | undefined>(undefined);

    // Fixed: Wrapped animate function in useCallback with proper dependencies
    const animate = useCallback((time: number) => {
        if (previousTimeRef.current !== undefined) {
            if (startTimeRef.current === undefined) {
                startTimeRef.current = time;
            }
            const elapsedTime = (time - startTimeRef.current) / 1000;
            callback(elapsedTime);
        }
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    }, [callback]);

    // Fixed: Properly handled dependencies instead of using eslint-disable
    useEffect(() => {
        if (isRunning) {
            startTimeRef.current = undefined;
            previousTimeRef.current = undefined;
            requestRef.current = requestAnimationFrame(animate);
        } else {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        }
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isRunning, animate]);
};