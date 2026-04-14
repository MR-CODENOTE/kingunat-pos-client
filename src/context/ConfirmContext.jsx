import React, { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext();

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    callback: null,
  });

  const showConfirm = useCallback((title, message, callback) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      callback,
    });
  }, []);

  const closeConfirm = useCallback((confirmed) => {
    if (confirmed && confirmState.callback) {
      confirmState.callback();
    }
    setConfirmState({
      isOpen: false,
      title: '',
      message: '',
      callback: null,
    });
  }, [confirmState]);

  return (
    <ConfirmContext.Provider value={{ ...confirmState, showConfirm, closeConfirm }}>
      {children}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => useContext(ConfirmContext);
