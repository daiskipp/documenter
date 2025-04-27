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

// 日本語テキストか判定する関数
function containsJapanese(text: string): boolean {
  return /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
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
      fontFamily: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", Meiryo, sans-serif', // 日本語フォントを優先
      themeVariables: {
        // 図の線や文字を濃くする
        primaryColor: '#1a1a1a',
        primaryTextColor: '#000000',
        primaryBorderColor: '#000000',
        lineColor: '#000000',
        secondaryColor: '#006100',
        tertiaryColor: '#fff',
        // 日本語テキストのフォントサイズを調整
        fontSize: '16px',
        // 線の太さを調整
        strokeWidth: '2px'
      }
    });
    
    // marked.jsを使ってマークダウンをHTMLに変換
    let html = '';
    try {
      if (window.marked) {
        const renderer = new window.marked.Renderer();
        const originalCodeRenderer = renderer.code.bind(renderer);
        
        // 日本語のテキストのためのフォント処理
        renderer.text = function(text: string) {
          if (containsJapanese(text)) {
            return `<span class="jp-text">${text}</span>`;
          }
          return text;
        };
        
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
        
        // Mermaidの図が描画された後、SVGのスタイルを確認・調整
        setTimeout(() => {
          if (containerRef.current) {
            const mermaidSvgs = containerRef.current.querySelectorAll('.mermaid svg');
            mermaidSvgs.forEach(svg => {
              // SVGの表示サイズを調整
              svg.setAttribute('width', '100%');
              svg.setAttribute('height', 'auto');
              
              // テキスト要素を処理
              const texts = svg.querySelectorAll('text');
              texts.forEach(text => {
                // 日本語テキストのためのスタイル調整
                if (text.textContent && containsJapanese(text.textContent)) {
                  text.setAttribute('font-weight', 'normal');
                  text.setAttribute('font-family', '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", Meiryo, sans-serif');
                  text.setAttribute('font-size', '14px');
                }
              });
            });
          }
        }, 200);
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
  .markdown-body { font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", Meiryo, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
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
  .markdown-body .mermaid-container { @apply my-4 overflow-auto bg-gray-50 p-4 rounded-md border border-gray-200; }
  .markdown-body .mermaid { @apply flex justify-center; }
  .markdown-body .jp-text { font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", Meiryo, sans-serif; }
  
  /* PDFエクスポート用のスタイル調整 */
  .pdf-content .mermaid svg {
    min-width: 600px;
    background-color: white !important;
  }
  .pdf-content .mermaid svg text {
    font-weight: bold !important;
    fill: #000 !important;
  }
  .pdf-content .mermaid svg path,
  .pdf-content .mermaid svg line,
  .pdf-content .mermaid svg polyline,
  .pdf-content .mermaid svg rect {
    stroke: #000 !important;
    stroke-width: 1.5px !important;
  }
`;
document.head.appendChild(style);
