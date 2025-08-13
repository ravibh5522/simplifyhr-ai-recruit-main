// src/components/ui/MarkdownRenderer.tsx

import ReactMarkdown from 'react-markdown';
import './MarkdownStyles.css'; // We will create this file next for styling

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  return (
    <div className="markdown-container">
      <ReactMarkdown>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;