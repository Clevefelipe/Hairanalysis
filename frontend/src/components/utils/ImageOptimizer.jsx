import React, { useRef, useState, useEffect } from 'react';

// Image Optimizer - Sistema de Otimização de Imagens
// Analyzer SDM IA — Diagnóstico Inteligente

/**
 * Comprime uma imagem mantendo qualidade adequada
 * @param {File} file - Arquivo de imagem a ser comprimido
 * @param {Function|boolean} callbackOrLiteMode - Callback ou useLiteMode
 * @param {Function} optionalCallback - Callback opcional se primeiro param for boolean
 */
export function compressImage(file, callbackOrLiteMode, optionalCallback) {
  if (!file || !(file instanceof File)) {
    const cb = typeof callbackOrLiteMode === 'function' ? callbackOrLiteMode : optionalCallback;
    if (cb) cb(file);
    return;
  }

  // Determinar callback e useLiteMode
  let callback;
  let useLiteMode = false;
  
  if (typeof callbackOrLiteMode === 'function') {
    callback = callbackOrLiteMode;
    useLiteMode = false;
  } else if (typeof callbackOrLiteMode === 'boolean') {
    useLiteMode = callbackOrLiteMode;
    callback = optionalCallback;
  } else {
    callback = optionalCallback;
  }

  const reader = new FileReader();
  
  reader.onload = (e) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Determinar dimensão máxima baseado no modo
      const maxDimension = useLiteMode ? 800 : 1920;
      const quality = useLiteMode ? 0.75 : 0.9;

      // Calcular escala mantendo proporção
      const scale = Math.min(maxDimension / width, maxDimension / height, 1);
      canvas.width = Math.floor(width * scale);
      canvas.height = Math.floor(height * scale);

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (!blob) {
          if (callback) callback(file);
          return;
        }

        const compressedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });

        const originalSize = (file.size / 1024 / 1024).toFixed(2);
        const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
        const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(1);

        if (callback) callback(compressedFile);
      }, 'image/jpeg', quality);
    };

    img.onerror = () => {
      if (callback) callback(file);
    };

    img.src = e.target.result;
  };

  reader.onerror = () => {
    if (callback) callback(file);
  };

  // Verificar se reader tem método readAsDataURL
  if (typeof reader.readAsDataURL === 'function') {
    reader.readAsDataURL(file);
  } else {
    if (callback) callback(file);
  }
}

// Componente React para lazy loading de imagens
export default function ImageOptimizer({ 
  src, 
  alt, 
  className = '',
  width,
  height,
  priority = false,
  ...props 
}) {
  const imgRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(null);

  useEffect(() => {
    if (!src) return;

    if (priority) {
      setCurrentSrc(src);
      return;
    }

    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setCurrentSrc(src);
            observer.unobserve(img);
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(img);

    return () => {
      if (img) observer.unobserve(img);
    };
  }, [src, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <img
      ref={imgRef}
      src={currentSrc || undefined}
      alt={alt}
      className={`${className} ${!isLoaded && currentSrc ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={handleLoad}
      style={{
        imageRendering: 'auto',
        ...props.style
      }}
      {...props}
    />
  );
}

export const ImageOptimizerUtils = {
  compressImage
};

