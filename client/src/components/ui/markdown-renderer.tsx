import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

// markedのtype定義
declare global {
  interface Window {
    marked: any;
  }
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className
}: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderedContent, setRenderedContent] = useState("");
  
  // マークダウンとMermaidを処理
  useEffect(() => {
    // Mermaidを初期化
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif'
    });
    
    // marked.jsを使ってマークダウンをHTMLに変換
    let html = '';
    try {
      if (window.marked) {
        const renderer = new window.marked.Renderer();
        const originalCodeRenderer = renderer.code.bind(renderer);
        
        // コードブロックのレンダリングをカスタマイズ
        renderer.code = function(code: string, language: string) {
          if (language === 'mermaid') {
            // mermaidコードブロックには特別なクラスを付与
            const id = `mermaid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            return `<div class="mermaid-container"><div id="${id}" class="mermaid">${code}</div></div>`;
          }
          return originalCodeRenderer(code, language);
        };
        
        html = window.marked.parse(content, { 
          renderer, 
          gfm: true,
          breaks: true
        });
      } else {
        console.error('marked library not loaded');
        html = content;
      }
    } catch (error) {
      console.error('Error rendering markdown:', error);
      html = content;
    }
    
    setRenderedContent(html);
    
    // マークダウンがレンダリングされた後でmermaidを処理
    setTimeout(() => {
      try {
        // Mermaid図を描画
        mermaid.run({
          querySelector: '.mermaid'
        }).catch(error => {
          console.error('Mermaid processing error:', error);
        });
      } catch (error) {
        console.error('Error during mermaid run:', error);
      }
    }, 100);
    
  }, [content]);
  
  return (
    <div 
      ref={containerRef}
      className={cn("prose prose-sm md:prose-base dark:prose-invert max-w-none break-words markdown-body", className)}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}

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
  .markdown-body .mermaid-container { @apply my-4 overflow-auto bg-gray-50 p-4 rounded-md; }
  .markdown-body .mermaid { @apply flex justify-center; }
`;
document.head.appendChild(style);
