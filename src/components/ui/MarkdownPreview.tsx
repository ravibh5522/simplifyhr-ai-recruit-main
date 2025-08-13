// In src/components/ui/MarkdownPreview.tsx

import ReactMarkdown from 'react-markdown';

interface MarkdownPreviewProps {
  content: string;
  truncate?: number;
}

const MarkdownPreview = ({ content, truncate = 120 }: MarkdownPreviewProps) => {
  // --- THIS IS THE FIX ---
  // We create a single, clean string variable first.
  const previewText = `${content.substring(0, truncate)}...`;

  return (
    <ReactMarkdown
      components={{
        h1: 'p',
        h2: 'p',
        h3: 'p',
        hr: () => null,
        img: () => null,
        code: ({ children }) => <span className="font-mono text-xs">{children}</span>,
        pre: ({ children }) => <div>{children}</div>,
      }}
      // And then we pass that single string variable as the child.
    >
      {previewText}
    </ReactMarkdown>
  );
};

export default MarkdownPreview;