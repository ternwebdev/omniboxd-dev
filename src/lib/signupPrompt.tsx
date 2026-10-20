import React, { createContext, useCallback, useContext, useState } from 'react';
import { SignupPromptModal, SignupPromptContext } from '../components/SignupPromptModal';

interface SignupPromptContextValue {
  promptSignup: (context?: SignupPromptContext) => void;
  closePrompt: () => void;
}

const Ctx = createContext<SignupPromptContextValue>({
  promptSignup: () => {},
  closePrompt: () => {}
});

interface ProviderProps {
  children: React.ReactNode;
}

export const SignupPromptProvider: React.FC<ProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<SignupPromptContext>('generic');

  const promptSignup = useCallback((ctx: SignupPromptContext = 'generic') => {
    setContext(ctx);
    setIsOpen(true);
  }, []);

  const closePrompt = useCallback(() => {
    setIsOpen(false);
  }, []);

  const goToAuth = () => {
    closePrompt();
    window.dispatchEvent(new CustomEvent('omniboxd_go_auth'));
  };

  return (
    <Ctx.Provider value={{ promptSignup, closePrompt }}>
      {children}
      <SignupPromptModal
        isOpen={isOpen}
        context={context}
        onClose={closePrompt}
        onLogin={goToAuth}
        onRegister={goToAuth}
      />
    </Ctx.Provider>
  );
};

export const useSignupPrompt = () => useContext(Ctx);