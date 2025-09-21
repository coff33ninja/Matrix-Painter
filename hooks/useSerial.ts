
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CMD_PIXEL, CMD_FRAME, CMD_BRIGHT, SERIAL_BAUD_RATE } from '../constants.js';
import type { Grid, RGBColor } from '../types.js';
import { mapXYtoIndex } from '../lib/utils.js';

interface UseSerialReturn {
  isConnected: boolean;
  isConnecting: boolean;
  connect: (port: string) => void;
  disconnect: () => void;
  sendPixel: (x: number, y: number, color: RGBColor) => Promise<void>;
  sendFrame: (grid: Grid) => Promise<void>;
  setBrightnessValue: (value: number) => Promise<void>;
}

export const useSerial = (): UseSerialReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  const connect = useCallback((port: string) => {
    if (ws.current) return;

    setIsConnecting(true);
    const socket = new WebSocket(`ws://${window.location.host}/ws`);

    socket.onopen = () => {
      ws.current = socket;
      socket.send(JSON.stringify({ type: 'CONNECT', path: port, baudRate: SERIAL_BAUD_RATE }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'STATUS') {
        if (data.message === 'connected') {
          setIsConnected(true);
          setIsConnecting(false);
        }
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      setIsConnecting(false);
      ws.current = null;
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      setIsConnecting(false);
    };
  }, []);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.send(JSON.stringify({ type: 'DISCONNECT' }));
      ws.current.close();
    }
  }, []);

  const send = useCallback(async (data: number[]) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ type: 'SEND', payload: data }));
  }, []);

  const sendPixel = useCallback(async (x: number, y: number, color: RGBColor) => {
    const data = [CMD_PIXEL, x, y, color.r, color.g, color.b];
    await send(data);
  }, [send]);

  const sendFrame = useCallback(async (grid: Grid) => {
    const { rows, cols } = { rows: grid.length, cols: grid[0]?.length || 0 };
    if(rows === 0 || cols === 0) return;

    const numLeds = rows * cols;
    const ledBuffer = new Array(numLeds);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const index = mapXYtoIndex(x, y);
            if(index < numLeds) {
                ledBuffer[index] = grid[y][x];
            }
        }
    }

    const flatBuffer = ledBuffer.flatMap(c => c ? [c.r, c.g, c.b] : [0,0,0]);
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
        ws.current.close();
      }
    };
  }, []);

  return { isConnected, isConnecting, connect, disconnect, sendPixel, sendFrame, setBrightnessValue };
};
