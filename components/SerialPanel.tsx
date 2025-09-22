import React, { useState, useEffect, useCallback } from 'react';

// Fixed: Proper type definition for serial port
interface SerialPort {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
  locationId?: string;
  productId?: string;
  vendorId?: string;
}

interface SerialPanelProps {
  onConnect: (port: string) => void;
  onDisconnect: () => void;
  isConnected: boolean;
}

export const SerialPanel: React.FC<SerialPanelProps> = ({ onConnect, onDisconnect, isConnected }) => {
  const [ports, setPorts] = useState<SerialPort[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false); // Fixed: Added loading state
  const [error, setError] = useState<string | null>(null);

  // Fixed: Added loading feedback while fetching ports
  const fetchPorts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/serial-ports');
      if (!response.ok) {
        throw new Error(`Failed to fetch ports: ${response.statusText}`);
      }
      const data: SerialPort[] = await response.json();
      setPorts(data);
      if (data.length > 0 && !selectedPort) {
        setSelectedPort(data[0].path);
      }
    } catch (error) {
      console.error('Error fetching serial ports:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch serial ports');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPort]);

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
      
      {/* Fixed: Show error message if there's an error */}
      {error && (
        <div className="text-red-400 text-sm p-2 bg-red-900/20 rounded">
          {error}
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        <select
          onChange={(e) => setSelectedPort(e.target.value)}
          value={selectedPort}
          disabled={isConnected || isLoading}
          className="w-full bg-gray-600 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
        >
          {ports.length === 0 && !isLoading ? (
            <option value="">No ports available</option>
          ) : (
            ports.map((port) => (
              <option key={port.path} value={port.path}>
                {port.path} {port.manufacturer ? `(${port.manufacturer})` : ''}
              </option>
            ))
          )}
        </select>
        <button
          onClick={fetchPorts}
          disabled={isConnected || isLoading}
          className="p-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-white"
          title="Refresh port list"
        >
          {/* Fixed: Show loading indicator */}
          {isLoading ? '⟳' : '↻'}
        </button>
      </div>
      
      <button
        onClick={isConnected ? onDisconnect : handleConnect}
        disabled={!selectedPort && !isConnected}
        className={`w-full px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isConnected ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-600 hover:bg-cyan-700'
        } text-white`}
      >
        {isConnected ? 'Disconnect' : 'Connect'}
      </button>
      
      {/* Show port info when connected */}
      {isConnected && selectedPort && (
        <div className="text-xs text-gray-300 p-2 bg-gray-800/50 rounded">
          Connected to: {selectedPort}
        </div>
      )}
      
      {/* Fixed: Show loading state while fetching ports */}
      {isLoading && (
        <div className="text-xs text-gray-400 flex items-center justify-center">
          <span className="animate-spin mr-2">⟳</span>
          Loading ports...
        </div>
      )}
    </div>
  );
};