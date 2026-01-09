
import React, { useEffect, useRef } from 'react';
import { TelegramUser } from '../types';

interface TelegramLoginProps {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  useMock?: boolean;
  className?: string;
}

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramUser) => void;
  }
}

export const TelegramLogin: React.FC<TelegramLoginProps> = ({ 
  botName, 
  onAuth, 
  useMock = true,
  className = ""
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (useMock) return;

    // Define the global callback expected by the Telegram widget
    window.onTelegramAuth = (user: TelegramUser) => {
      onAuth(user);
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'false'); 
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.async = true;

    if (buttonRef.current) {
        buttonRef.current.innerHTML = '';
        buttonRef.current.appendChild(script);
    }

    return () => {
        if (buttonRef.current) {
            buttonRef.current.innerHTML = '';
        }
    };
  }, [botName, onAuth, useMock]);

  if (useMock) {
    return (
      <button
        onClick={() => onAuth({
          id: 12345678,
          first_name: "Dev",
          last_name: "User",
          username: "developer",
          photo_url: "",
          auth_date: Date.now(),
          hash: "mock_hash"
        })}
        className={`group relative flex items-center justify-center gap-3 bg-[#2AABEE] text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-[#229ED9] transition-all shadow-lg shadow-sky-200/50 active:scale-[0.98] ${className}`}
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-white shrink-0">
            <path d="M20.665 3.717L2.968 10.547C1.761 11.031 1.766 11.704 2.744 12.004L7.288 13.421L17.803 6.786C18.3 6.484 18.756 6.649 18.383 6.981L9.873 14.659H9.871L9.873 14.66L9.56 19.336C10.017 19.336 10.218 19.127 10.474 18.88L12.648 16.766L17.172 20.108C18.006 20.567 18.605 20.33 18.813 19.336L21.782 5.348C22.086 4.129 21.317 3.576 20.665 3.717Z"/>
        </svg>
        <span className="text-sm tracking-wide">Войти (Dev Mode)</span>
        <span className="absolute -top-2 -right-1 z-10 bg-amber-400 text-amber-950 text-[10px] px-2 py-0.5 rounded-lg font-black uppercase tracking-wider border-2 border-white shadow-md transform rotate-3 group-hover:rotate-0 transition-transform">
          Mock
        </span>
      </button>
    );
  }

  return (
    <div className={`flex justify-center items-center min-h-[44px] ${className}`}>
        <div ref={buttonRef} />
    </div>
  );
};
