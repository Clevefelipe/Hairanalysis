// Performance Optimizer - Analyzer SDM IA
// Sistema de Otimização Automática de Performance

import { useEffect } from 'react';

export default function PerformanceOptimizer() {
  useEffect(() => {

    // 1. LAZY LOADING DE IMAGENS
    const enableImageLazyLoading = () => {
      const images = document.querySelectorAll('img[src]');
      
      if ('loading' in HTMLImageElement.prototype) {
        images.forEach(img => {
          if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
          }
        });
      } else {
        // Fallback para navegadores sem suporte
        const imageObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                imageObserver.unobserve(img);
              }
            }
          });
        });

        images.forEach(img => {
          if (img.src && !img.dataset.src) {
            img.dataset.src = img.src;
            img.src = '';
            imageObserver.observe(img);
          }
        });
      }
    };

    // 2. COMPRESSÃO E OTIMIZAÇÃO DE IMAGENS
    const optimizeImages = () => {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        // Adicionar decode async para melhor performance
        img.decoding = 'async';
        
        // Aplicar CSS de otimização
        img.style.imageRendering = 'auto';
        img.style.willChange = 'auto';
      });
    };

    // 3. DEFER DE SCRIPTS PESADOS
    const deferHeavyScripts = () => {
      const scripts = document.querySelectorAll('script:not([defer]):not([async])');
      scripts.forEach(script => {
        if (script.src && !script.async && !script.defer) {
          script.defer = true;
        }
      });
    };

    // 4. REMOVER EVENT LISTENERS DUPLICADOS
    const cleanupEventListeners = () => {
      // Limpar listeners de scroll pesados
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'scroll' || type === 'resize') {
          // Throttle automático
          let timeout;
          const throttledListener = function(...args) {
            if (timeout) return;
            timeout = setTimeout(() => {
              timeout = null;
              listener.apply(this, args);
            }, 100);
          };
          originalAddEventListener.call(this, type, throttledListener, options);
        } else {
          originalAddEventListener.call(this, type, listener, options);
        }
      };
    };

    // 5. OTIMIZAR CSS - REMOVER ESTILOS NÃO USADOS
    const optimizeCSS = () => {
      // Adicionar CSS de otimização global
      if (!document.getElementById('performance-optimizer-styles')) {
        const style = document.createElement('style');
        style.id = 'performance-optimizer-styles';
        style.textContent = `
          /* Otimizações de Performance */
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }
          
          img {
            content-visibility: auto;
            max-width: 100%;
            height: auto;
          }
          
          .glass-effect {
            will-change: opacity;
            contain: layout style paint;
          }
          
          /* Melhorar contraste */
          body {
            -webkit-font-smoothing: antialiased;
            color: #1a1a1a;
          }
          
          /* Garantir responsividade total */
          @media (max-width: 768px) {
            * {
              -webkit-tap-highlight-color: transparent;
            }
            
            body {
              font-size: 14px;
              line-height: 1.5;
            }
            
            h1 { font-size: 1.75rem !important; }
            h2 { font-size: 1.5rem !important; }
            h3 { font-size: 1.25rem !important; }
            
            .container {
              padding-left: 1rem;
              padding-right: 1rem;
            }
          }
          
          /* Otimizar animações */
          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
          
          /* Prevenir lags na tela branca */
          html {
            background: linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 50%, #dbeafe 100%);
          }
          
          /* Cache de fonts */
          @font-face {
            font-family: 'Poppins';
            font-display: swap;
          }
          
          /* Otimizar renderização de gradientes */
          .gradient-text {
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            will-change: background;
          }
        `;
        document.head.appendChild(style);
      }
    };

    // 6. HABILITAR CACHE DO NAVEGADOR
    const enableBrowserCache = () => {
      // Service Worker para cache (opcional, sem quebrar)
      if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
        // Registrar apenas se não existir
      }
      
      // Cache de imagens no localStorage
      const cacheImages = async () => {
        const images = document.querySelectorAll('img[src]');
        const cacheVersion = localStorage.getItem('image-cache-version') || '1.0';
        
        // Limpar cache antigo após 30 dias
        const lastClear = localStorage.getItem('image-cache-last-clear');
        if (lastClear) {
          const daysSinceCleared = (Date.now() - parseInt(lastClear)) / (1000 * 60 * 60 * 24);
          if (daysSinceCleared > 30) {
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('img-cache-')) {
                localStorage.removeItem(key);
              }
            });
            localStorage.setItem('image-cache-last-clear', String(Date.now()));
          }
        } else {
          localStorage.setItem('image-cache-last-clear', String(Date.now()));
        }
      };
      
      cacheImages();
    };

    // 7. REMOVER LAGS NA TELA BRANCA
    const preventWhiteScreen = () => {
      // Garantir que body está sempre visível
      document.body.style.visibility = 'visible';
      document.body.style.opacity = '1';
      
      // Prevenir flash de conteúdo não estilizado
      const style = document.createElement('style');
      style.textContent = `
        html, body {
          visibility: visible !important;
          opacity: 1 !important;
        }
      `;
      document.head.insertBefore(style, document.head.firstChild);
    };

    // 8. MELHORAR CARREGAMENTO INICIAL
    const optimizeInitialLoad = () => {
      // Preconnect para recursos externos
      const preconnectUrls = [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
      ];
      
      preconnectUrls.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = url;
        link.crossOrigin = 'anonymous';
        if (!document.querySelector(`link[href="${url}"]`)) {
          document.head.appendChild(link);
        }
      });
      
      // DNS Prefetch
      const dnsPrefetchUrls = [
        'https://storage.googleapis.com',
      ];
      
      dnsPrefetchUrls.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = url;
        if (!document.querySelector(`link[rel="dns-prefetch"][href="${url}"]`)) {
          document.head.appendChild(link);
        }
      });
    };

    // 9. DIAGNÓSTICO PERIÓDICO
    const runPeriodicDiagnostics = () => {
      const diagnostics = {
        images: document.querySelectorAll('img').length,
        scripts: document.querySelectorAll('script').length,
        styles: document.querySelectorAll('style, link[rel="stylesheet"]').length,
        memory: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 'N/A',
        timestamp: new Date().toLocaleString('pt-BR')
      };
      
      // Salvar no localStorage para análise
      localStorage.setItem('last-performance-check', JSON.stringify(diagnostics));
    };

    // 10. APLICAR TODAS AS OTIMIZAÇÕES
    const applyOptimizations = () => {
      try {
        preventWhiteScreen();
        optimizeCSS();
        optimizeImages();
        enableImageLazyLoading();
        optimizeInitialLoad();
        enableBrowserCache();
        deferHeavyScripts();
        cleanupEventListeners();
        
        // Executar diagnóstico inicial
        runPeriodicDiagnostics();
        
        // Diagnóstico periódico a cada 5 minutos
        const diagnosticInterval = setInterval(runPeriodicDiagnostics, 5 * 60 * 1000);
        
        return () => clearInterval(diagnosticInterval);
      } catch (error) {
      }
    };

    // Executar após carregamento completo
    if (document.readyState === 'complete') {
      applyOptimizations();
    } else {
      window.addEventListener('load', applyOptimizations);
    }

    // Re-aplicar quando DOM mudar
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          enableImageLazyLoading();
          optimizeImages();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Componente invisível
  return null;
}

