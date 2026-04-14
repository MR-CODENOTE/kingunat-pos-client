import React, { useRef, useEffect, useState } from 'react';
import { usePrompt } from '../context/PromptContext';

const PromptModal = () => {
  const { isOpen, title, defaultValue, inputType, closePrompt } = usePrompt();
  const [inputValue, setInputValue] = useState(defaultValue);
  const inputRef = useRef(null);

  useEffect(() => {
    setInputValue(defaultValue);
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, defaultValue]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      closePrompt(true, inputValue);
    }
    if (event.key === 'Escape') {
      closePrompt(false, '');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black bg-opacity-50 p-4 transition-opacity" onClick={() => closePrompt(false, '')}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg leading-6 font-bold text-gray-900 mb-2" id="prompt-title">{title}</h3>
        <input
          ref={inputRef}
          type={inputType}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-japan-red mb-4"
          onKeyDown={handleKeyDown}
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={() => closePrompt(false, '')}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => closePrompt(true, inputValue)}
            className="bg-japan-red text-white px-4 py-2 rounded-lg hover:bg-red-800 text-sm font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;
