import { useEffect, useRef, useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';

interface GoogleAdProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: boolean;
  className?: string;
}

let adsScriptLoaded = false;
let adsScriptLoading = false;

const loadAdsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (adsScriptLoaded) {
      resolve();
      return;
    }

    if (adsScriptLoading) {
      // Wait for existing load
      const checkLoaded = setInterval(() => {
        if (adsScriptLoaded) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);
      return;
    }

    adsScriptLoading = true;
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      adsScriptLoaded = true;
      adsScriptLoading = false;
      resolve();
    };
    script.onerror = () => {
      adsScriptLoading = false;
      reject(new Error('Failed to load AdSense script'));
    };
    document.head.appendChild(script);
  });
};

export default function GoogleAd({
  slot,
  format = 'auto',
  responsive = true,
  className = ''
}: GoogleAdProps) {
  const { hasFeature, isOnTrial } = useSubscription();
  const adRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);


  // Intersection Observer for lazy loading
  useEffect(() => {
    if (hasFeature('no_ads') || isOnTrial) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => observer.disconnect();
  }, [hasFeature]);

  // Load ads when visible
  useEffect(() => {
    if (hasFeature('no_ads') || !isVisible || adLoaded) return;

    const loadAd = async () => {
      try {
        await loadAdsScript();
        // @ts-expect-error - Adsense global
        if (window.adsbygoogle) {
          // @ts-expect-error - Adsense global
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setAdLoaded(true);
        }
      } catch (error) {
        console.error('AdSense error:', error);
      }
    };

    // Delay ad loading to not block main thread
    const timer = requestIdleCallback ?
      requestIdleCallback(() => loadAd()) :
      setTimeout(loadAd, 1000);

    return () => {
      if (typeof timer === 'number') {
        if (cancelIdleCallback) {
          cancelIdleCallback(timer);
        } else {
          clearTimeout(timer);
        }
      }
    };
  }, [isVisible, adLoaded, hasFeature]);

  if (hasFeature('no_ads') || isOnTrial) return null;

  return (
    <div ref={adRef} className={`google-ad-container ${className}`}>
      {isVisible && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive.toString()}
        />
      )}
    </div>
  );
}
