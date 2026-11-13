import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Texto de un agente real (Markdown: títulos, listas, tablas). */
export function Markdown({ children }) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ node: _n, ...props }) => <a {...props} target="_blank" rel="noreferrer" /> }}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
