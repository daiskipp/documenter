// この内容は自動的に実行されます
console.log('mermaid-initialize.js loaded');

// グローバルのmermaidオブジェクトが存在するか確認
if (typeof window.mermaid === 'undefined') {
  console.log('mermaid is not defined, loading from CDN...');
  
  // Mermaidスクリプトをロード
  const mermaidScript = document.createElement('script');
  mermaidScript.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js';
  mermaidScript.onload = function() {
    console.log('mermaid loaded from mermaid-initialize.js');
    initializeMermaid();
  };
  document.head.appendChild(mermaidScript);
} else {
  console.log('mermaid already loaded, initializing...');
  initializeMermaid();
}

function initializeMermaid() {
  if (window.mermaid) {
    window.mermaid.initialize({
      startOnLoad: true,
      theme: 'default', 
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif'
    });
    
    // レンダリング
    window.renderMermaidDiagrams = function() {
      console.log('rendering mermaid diagrams...');
      const elements = document.querySelectorAll('.mermaid');
      
      if (elements.length > 0) {
        console.log(`Found ${elements.length} mermaid elements to render`);
        
        elements.forEach((element, index) => {
          try {
            if (element.querySelector('svg')) {
              console.log(`Element ${index} already rendered`);
              return;
            }
            
            console.log(`Rendering element ${index}`);
            const content = element.textContent || '';
            window.mermaid.render(`mermaid-${Date.now()}-${index}`, content, 
              (svg) => {
                element.innerHTML = svg;
                console.log(`Element ${index} rendered successfully`);
              }, 
              element);
          } catch (error) {
            console.error(`Failed to render element ${index}:`, error);
          }
        });
      } else {
        console.log('No mermaid elements found');
      }
    };
    
    // MutationObserverを使って動的なコンテンツ変更を監視
    const observer = new MutationObserver((mutations) => {
      let shouldRender = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && 
            Array.from(mutation.addedNodes).some(node => 
              node.nodeType === 1 && 
              ((node.classList && node.classList.contains('mermaid')) ||
               (node.querySelector && node.querySelector('.mermaid')))
            )) {
          shouldRender = true;
        }
      });
      
      if (shouldRender) {
        console.log('Mermaid elements added to DOM, rendering...');
        // 少し遅延させてレンダリング
        setTimeout(window.renderMermaidDiagrams, 100);
      }
    });
    
    // 全ドキュメントの変更を監視
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
    
    // DOMContentLoadedイベントが既に発火している場合は直接実行
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', window.renderMermaidDiagrams);
    } else {
      window.renderMermaidDiagrams();
    }
  }
}

// 初期化関数をグローバルに公開
window.initializeMermaid = initializeMermaid;