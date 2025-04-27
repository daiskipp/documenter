import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className
}: MarkdownRendererProps) {
  let html = '';
  
  // Use the marked library to render markdown
  try {
    // In a real app, we would use a library like 'marked' or 'react-markdown'
    // For simplicity, we'll import the library from CDN in the index.html
    if (typeof marked !== 'undefined') {
      html = marked.parse(content);
    } else {
      // Fallback if the library isn't loaded
      html = content;
    }
  } catch (error) {
    console.error('Error rendering markdown:', error);
    html = content;
  }
  
  return (
    <div 
      className={cn("prose prose-sm md:prose-base dark:prose-invert max-w-none break-words markdown-body", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Add the marked library
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
script.async = true;
document.head.appendChild(script);

// Add markdown styles
const style = document.createElement('style');
style.textContent = `
  .markdown-body h1 { @apply text-2xl font-bold mt-6 mb-4; }
  .markdown-body h2 { @apply text-xl font-bold mt-5 mb-3; }
  .markdown-body h3 { @apply text-lg font-bold mt-4 mb-2; }
  .markdown-body h4 { @apply text-base font-bold mt-3 mb-2; }
  .markdown-body p { @apply my-3; }
  .markdown-body ul { @apply list-disc pl-6 my-3; }
  .markdown-body ol { @apply list-decimal pl-6 my-3; }
  .markdown-body li { @apply mb-1; }
  .markdown-body blockquote { @apply border-l-4 border-gray-300 pl-4 py-1 italic; }
  .markdown-body code { @apply font-mono bg-gray-100 px-1 py-0.5 rounded; }
  .markdown-body pre { @apply bg-gray-100 p-3 my-3 font-mono rounded; }
  .markdown-body a { @apply text-primary-500 underline; }
  .markdown-body table { @apply w-full border-collapse my-3; }
  .markdown-body th { @apply border border-gray-300 bg-gray-50 px-3 py-1; }
  .markdown-body td { @apply border border-gray-300 px-3 py-1; }
  .markdown-body img { @apply max-w-full; }
  .markdown-body hr { @apply my-4 border-t border-gray-300; }
`;
document.head.appendChild(style);
