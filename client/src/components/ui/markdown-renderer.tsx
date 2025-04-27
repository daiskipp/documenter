import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

// グローバル変数の型定義
declare global {
  interface Window {
    // markedとmermaidはindex.htmlで読み込まれる
    marked: any;
    mermaid: any;
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
  
  useEffect(() => {
    // Mermaidを初期化
    if (window.mermaid) {
      try {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Inter, sans-serif'
        });
      } catch (e) {
        console.error("Mermaid initialization error:", e);
      }
    }
  }, []);

  useEffect(() => {
    // レンダリング後にMermaidダイアグラムを処理
    if (containerRef.current && window.mermaid) {
      try {
        window.mermaid.init(undefined, containerRef.current.querySelectorAll('.mermaid'));
      } catch (e) {
        console.error("Mermaid rendering error:", e);
      }
    }
  }, [content]);

  let html = '';
  
  // Markedを使用してマークダウンをHTMLに変換
  try {
    if (window.marked) {
      // カスタムレンダラーを作成してMermaidコードブロックを処理
      const renderer = new window.marked.Renderer();
      const originalCodeRenderer = renderer.code.bind(renderer);
      
      // コードブロックのレンダリングをカスタマイズ
      renderer.code = function(code: string, language: string) {
        if (language === 'mermaid') {
          return `<div class="mermaid">${code}</div>`;
        }
        return originalCodeRenderer(code, language);
      };
      
      html = window.marked.parse(content, { renderer });
    } else {
      console.warn('marked library not loaded');
      html = content;
    }
  } catch (error) {
    console.error('Error rendering markdown:', error);
    html = content;
  }
  
  return (
    <div 
      ref={containerRef}
      className={cn("prose prose-sm md:prose-base dark:prose-invert max-w-none break-words markdown-body", className)}
      dangerouslySetInnerHTML={{ __html: html }}
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
  .markdown-body .mermaid { @apply my-4 overflow-auto; }
`;
document.head.appendChild(style);
