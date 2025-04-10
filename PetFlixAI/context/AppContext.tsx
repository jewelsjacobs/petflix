import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AppState {
  selectedImageUri: string | null;
  selectedTheme: string | null; // Or a more specific type if themes are defined
}

interface AppContextProps extends AppState {
  setSelectedImageUri: (uri: string | null) => void;
  setSelectedTheme: (theme: string | null) => void;
}

// Create the context with a default value
const AppContext = createContext<AppContextProps | undefined>(undefined);

// Create the provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  const value = {
    selectedImageUri,
    selectedTheme,
    setSelectedImageUri,
    setSelectedTheme,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Create a custom hook for using the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 