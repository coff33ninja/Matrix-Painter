
import React, { useState, useEffect, useCallback } from 'react';

interface SerialPanelProps {
  onConnect: (port: string) => void;
  onDisconnect: () => void;
  isConnected: boolean;
}

export const SerialPanel: React.FC<SerialPanelProps> = ({ onConnect, onDisconnect, isConnected }) => {
  const [ports, setPorts] = useState<any[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');

  const fetchPorts = useCallback(async () => {
    try {
      const response = await fetch('/api/serial-ports');
      const data = await response.json();
      setPorts(data);
      if (data.length > 0) {
        setSelectedPort(data[0].path);
      }
    } catch (error) {
      console.error('Error fetching serial ports:', error);
    }
  }, []);

  useEffect(() => {
    fetchPorts();
  }, [fetchPorts]);

  const handleConnect = () => {
    if (selectedPort) {
      onConnect(selectedPort);
    }
  };

  return (
    <div className="flex-shrink-0 w-full lg:w-72 bg-gray-700/50 p-4 rounded-lg space-y-4">
      <h3 className="text-lg font-semibold text-cyan-300">Serial Connection</h3>
      <div className="flex items-center space-x-2">
        <select
          onChange={(e) => setSelectedPort(e.target.value)}
          value={selectedPort}
          disabled={isConnected}
          className="w-full bg-gray-600 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
          {ports.map((port) => (
            <option key={port.path} value={port.path}>
              {port.path}
            </option>
          ))}
        </select>
        <button
          onClick={fetchPorts}
          className="p-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white"
        >
          Refresh
        </button>
      </div>
      <button
        onClick={isConnected ? onDisconnect : handleConnect}
        className={`w-full px-4 py-2 rounded-lg transition-colors ${
          isConnected ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-600 hover:bg-cyan-700'
        } text-white`}
      >
        {isConnected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  );
};
