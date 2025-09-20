
import React, { useState } from 'react';

interface TextPanelProps {
  onTextSubmit: (text: string, scroll: boolean) => void;
  disabled: boolean;
}

export const TextPanel: React.FC<TextPanelProps> = ({ onTextSubmit, disabled }) => {
  const [text, setText] = useState('');
  const [scroll, setScroll] = useState(false);

  const handleSubmit = () => {
    onTextSubmit(text, scroll);
  };

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
        <h3 className="text-lg font-semibold mb-3 text-cyan-300">Text</h3>
        <div className="flex items-center gap-2">
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full bg-gray-600 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Enter text..."
            />
            <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                Apply
            </button>
        </div>
        <div className="flex items-center">
            <input
                type="checkbox"
                id="scroll-checkbox"
                checked={scroll}
                onChange={(e) => setScroll(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
            />
            <label htmlFor="scroll-checkbox" className="ml-2 block text-sm text-gray-300">
                Scroll
            </label>
        </div>
    </div>
  );
};
