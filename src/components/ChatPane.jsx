import { useEffect, useRef } from 'react';
import { useChat } from '../store/chatStore.js';
import Message from './Message.jsx';
import Composer from './Composer.jsx';
import { Logo } from '../ui/index.jsx';

const SUGGESTIONS = [
  'Explain the phases of a web app penetration test.',
  'How do I enumerate subdomains for an authorized target?',
  'Write an nmap command to fingerprint services on a host.',
  'What is the difference between reflected and stored XSS?',
];

function Welcome() {
  const { sendMessage } = useChat();
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
      <Logo size={64} />
      <h1 className="text-3xl font-bold text-txt-primary mt-5 tracking-tight">CypherMind AI</h1>
      <p className="text-txt-secondary mt-2 max-w-md">
        Your AI security copilot. Ask about recon, web testing, exploitation, or learning —
        for authorized testing and education.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-xl">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => sendMessage(s)}
            className="text-left text-sm text-txt-secondary bg-bg-secondary border border-line rounded-2xl px-4 py-3 shadow-soft transition hover:shadow-lift hover:-translate-y-0.5 hover:border-primary/40 hover:text-txt-primary"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatPane() {
  const { messages, loadingMessages, streaming } = useChat();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const empty = messages.length === 0 && !loadingMessages;

  return (
    <main className="flex-1 h-full flex flex-col bg-bg-primary min-w-0">
      {empty ? (
        <Welcome />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[820px] mx-auto px-4 py-6 space-y-5">
            {messages.map((m, i) => (
              <Message
                key={m.id}
                role={m.role}
                content={m.content}
                streaming={streaming && i === messages.length - 1 && m.role === 'assistant'}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      )}
      <Composer />
    </main>
  );
}
