import { useState, useCallback, useRef, useEffect } from 'react';
import { CMD_PIXEL, CMD_FRAME, CMD_BRIGHT, SERIAL_BAUD_RATE } from '../constants.js';
import type { Grid, RGBColor } from '../types.js';
import { mapXYtoIndex } from '../lib/utils.js';

interface UseSerialReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: (port: string) => void;
  disconnect: () => void;
  sendPixel: (x: number, y: number, color: RGBColor) => Promise<void>;
  sendFrame: (grid: Grid) => Promise<void>;
  setBrightnessValue: (value: number) => Promise<void>;
}

export const useSerial = (): UseSerialReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  const connect = useCallback((port: string) => {
    if (ws.current) return;

    setIsConnecting(true);
    setError(null);
    const socket = new WebSocket(`ws://${window.location.host}/ws`);

    socket.onopen = () => {
      ws.current = socket;
      socket.send(JSON.stringify({ type: 'CONNECT', path: port, baudRate: SERIAL_BAUD_RATE }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'STATUS') {
          if (data.message === 'connected') {
            setIsConnected(true);
            setIsConnecting(false);
            setError(null);
          } else if (data.error) {
            setError(data.error);
            setIsConnecting(false);
          }
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
        setError('Failed to parse server response');
      }
    };

    socket.onclose = (event) => {
      setIsConnected(false);
      setIsConnecting(false);
      ws.current = null;
      if (event.code !== 1000) { // Not a normal closure
        setError(`Connection closed unexpectedly (code: ${event.code})`);
      }
    };

    socket.onerror = () => {
      setError('WebSocket connection failed');
      setIsConnected(false);
      setIsConnecting(false);
    };
  }, []);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.send(JSON.stringify({ type: 'DISCONNECT' }));
      ws.current.close(1000); // Normal closure
      setError(null);
    }
  }, []);

  const send = useCallback(async (data: number[]) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
    try {
      ws.current.send(JSON.stringify({ type: 'SEND', payload: data }));
    } catch (err) {
      setError('Failed to send data to device');
      throw err;
    }
  }, []);

  const sendPixel = useCallback(async (x: number, y: number, color: RGBColor) => {
    const data = [CMD_PIXEL, x, y, color.r, color.g, color.b];
    await send(data);
  }, [send]);

  // Fixed: Create ledBuffer with correct size from the beginning
  const sendFrame = useCallback(async (grid: Grid) => {
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    if (rows === 0 || cols === 0) return;

    const numLeds = rows * cols;
    const ledBuffer: RGBColor[] = new Array(numLeds);

    // Initialize buffer with proper data structure
    for (let i = 0; i < numLeds; i++) {
      ledBuffer[i] = { r: 0, g: 0, b: 0 };
    }

    // Fill buffer with grid data
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const index = mapXYtoIndex(x, y);
            if (index < numLeds) {
                ledBuffer[index] = grid[y][x];
            }
        }
    }

    const flatBuffer = ledBuffer.flatMap(c => [c.r, c.g, c.b]);
    const data = [CMD_FRAME, ...flatBuffer];
    await send(data);
  }, [send]);

  const setBrightnessValue = useCallback(async (value: number) => {
    const data = [CMD_BRIGHT, value];
    await send(data);
  }, [send]);

  useEffect(() => {
    return () => {
      if (ws.current) {
        ws.current.close(1000);
      }
    };
  }, []);

  return { 
    isConnected, 
    isConnecting, 
    error, 
    connect, 
    disconnect, 
    sendPixel, 
    sendFrame, 
    setBrightnessValue 
  };
};