import React, { useEffect, useRef } from 'react';
import { TelegramUser } from '../types';

interface TelegramLoginProps {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  useMock?: boolean; // For development without a real bot
}

export const TelegramLogin: React.FC<TelegramLoginProps> = ({ botName, onAuth, useMock = true }) => {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (useMock) return; // Don't load script if mocking

    // Clear previous script if any (handling re-renders)
    if (buttonRef.current) {
        buttonRef.current.innerHTML = '';
    }

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '10');
    script.setAttribute('data-userpic', 'false'); 
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    // Define the callback function globally
    (window as any).onTelegramAuth = (user: TelegramUser) => {
      onAuth(user);
    };
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');

    if (buttonRef.current) {
        buttonRef.current.appendChild(script);
    }
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
        className="group relative flex items-center justify-center gap-3 bg-[#54A9EB] text-white px-5 py-2.5 rounded-full font-medium hover:bg-[#4096D9] transition-all shadow-sm w-fit mx-auto min-w-[240px]"
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-white">
            <path d="M20.665 3.717L2.968 10.547C1.761 11.031 1.766 11.704 2.744 12.004L7.288 13.421L17.803 6.786C18.3 6.484 18.756 6.649 18.383 6.981L9.873 14.659H9.871L9.873 14.66L9.56 19.336C10.017 19.336 10.218 19.127 10.474 18.88L12.648 16.766L17.172 20.108C18.006 20.567 18.605 20.33 18.813 19.336L21.782 5.348C22.086 4.129 21.317 3.576 20.665 3.717Z"/>
        </svg>
        <span className="font-sans font-bold text-[14px]">Войти через Telegram</span>
        <span className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide border border-white">Dev Mode</span>
      </button>
    );
  }

  return <div ref={buttonRef} className="flex justify-center min-h-[40px]" />;
};