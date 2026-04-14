import React, { createContext, useContext, useState, useCallback } from 'react';

const PromptContext = createContext();

export const PromptProvider = ({ children }) => {
  const [promptState, setPromptState] = useState({
    isOpen: false,
    title: '',
    defaultValue: '',
    inputType: 'text',
    callback: null,
  });

  const showPrompt = useCallback((title, defaultValue, callback, inputType = 'text') => {
    setPromptState({
      isOpen: true,
      title,
      defaultValue,
      inputType,
      callback,
    });
  }, []);

  const closePrompt = useCallback((saved, inputValue) => {
    if (saved && promptState.callback) {
      promptState.callback(inputValue);
    }
    setPromptState({
      isOpen: false,
      title: '',
      defaultValue: '',
      inputType: 'text',
      callback: null,
    });
  }, [promptState]);

  return (
    <PromptContext.Provider value={{ ...promptState, showPrompt, closePrompt }}>
      {children}
    </PromptContext.Provider>
  );
};

export const usePrompt = () => useContext(PromptContext);
