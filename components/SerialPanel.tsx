
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
    <div className="serial-panel">
      <select onChange={(e) => setSelectedPort(e.target.value)} value={selectedPort} disabled={isConnected}>
        {ports.map((port) => (
          <option key={port.path} value={port.path}>
            {port.path}
          </option>
        ))}
      </select>
      <button onClick={isConnected ? onDisconnect : handleConnect}>
        {isConnected ? 'Disconnect' : 'Connect'}
      </button>
      <button onClick={fetchPorts}>Refresh</button>
    </div>
  );
};
