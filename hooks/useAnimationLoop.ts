
import { useRef, useEffect } from 'react';

export const useAnimationLoop = (callback: (time: number) => void, isRunning: boolean) => {
    // FIX: The useRef hook requires an initial value. Provide `undefined` as the initial value for the refs.
    const requestRef = useRef<number | undefined>(undefined);
    const previousTimeRef = useRef<number | undefined>(undefined);
    const startTimeRef = useRef<number | undefined>(undefined);

    const animate = (time: number) => {
        if (previousTimeRef.current !== undefined) {
            if (startTimeRef.current === undefined) {
                startTimeRef.current = time;
            }
            const elapsedTime = (time - startTimeRef.current) / 1000; // time in seconds
            callback(elapsedTime);
        }
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    };

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRunning, callback]);
};
