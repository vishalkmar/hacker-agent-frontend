import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

export default function Message({ role, content, streaming }) {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="shrink-0 w-8 h-8 rounded-lg bg-accent-cyan/15 text-accent-cyan flex items-center justify-center text-sm">
          🛡️
        </div>
      )}
      <div
        className={`max-w-[760px] rounded-2xl px-4 py-3 text-[15px] leading-relaxed
          ${isUser ? 'bg-accent-blue/20 text-txt-primary' : 'bg-bg-secondary text-txt-primary border border-line'}`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{content}</div>
        ) : (
          <div className={`md ${streaming ? 'caret' : ''}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {content || ' '}
            </ReactMarkdown>
          </div>
        )}
      </div>
      {isUser && (
        <div className="shrink-0 w-8 h-8 rounded-lg bg-accent-blue/20 text-accent-blue flex items-center justify-center text-sm">
          🧑
        </div>
      )}
    </div>
  );
}
