import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check, Shield, User } from 'lucide-react';

// Small copy-to-clipboard button used for whole messages and individual code blocks.
function CopyButton({ getText, className = '', label }) {
  const [done, setDone] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setDone(true);
      setTimeout(() => setDone(false), 1400);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <button
      onClick={onCopy}
      title={done ? 'Copied!' : 'Copy'}
      className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-1 rounded-md transition
        ${done ? 'text-accent-green' : 'text-txt-muted hover:text-primary hover:bg-primary/10'} ${className}`}
    >
      {done ? <Check size={13} /> : <Copy size={13} />}
      {label && <span>{done ? 'Copied' : label}</span>}
    </button>
  );
}

// Code block with its own header bar + copy button (ChatGPT/Claude style).
// react-markdown v9 doesn't pass `inline`, so detect block code by a language class or newline.
function CodeBlock({ inline, className, children }) {
  const text = String(children ?? '').replace(/\n$/, '');
  const isBlock = inline === false || /language-/.test(className || '') || text.includes('\n');
  if (!isBlock) return <code className={className}>{children}</code>;
  const lang = /language-(\w+)/.exec(className || '')?.[1] || 'text';
  return (
    <div className="relative group/code my-3 rounded-lg overflow-hidden border border-[#162234] bg-[#060a11]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a1119] border-b border-[#162234]">
        <span className="text-[10px] uppercase tracking-wider text-txt-muted font-mono">{lang}</span>
        <CopyButton getText={() => text} label="Copy" />
      </div>
      <pre className="!my-0 !border-0 !rounded-none">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export default function Message({ role, content, streaming }) {
  const isUser = role === 'user';
  return (
    <div className={`group flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shadow-glow">
          <Shield size={16} />
        </div>
      )}
      <div className="min-w-0 max-w-[760px]">
        <div
          className={`relative rounded-2xl px-4 py-3 text-[15px] leading-relaxed
            ${isUser ? 'bg-accent-blue/15 text-txt-primary border border-accent-blue/25'
                     : 'bg-bg-secondary text-txt-primary border border-line'}`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{content}</div>
          ) : (
            <div className={`md ${streaming ? 'caret' : ''}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{ code: CodeBlock }}
              >
                {content || ' '}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {/* whole-message copy (appears on hover) */}
        {!streaming && content?.trim() && (
          <div className={`mt-1 flex ${isUser ? 'justify-end' : 'justify-start'} opacity-0 group-hover:opacity-100 transition`}>
            <CopyButton getText={() => content} label="Copy message" />
          </div>
        )}
      </div>
      {isUser && (
        <div className="shrink-0 w-8 h-8 rounded-lg bg-accent-blue/20 text-accent-blue flex items-center justify-center">
          <User size={16} />
        </div>
      )}
    </div>
  );
}
