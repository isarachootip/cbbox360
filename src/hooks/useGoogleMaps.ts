import { useState, useEffect } from 'react';

// Declare google global window type
declare global {
  interface Window {
    google?: any;
    initGoogleMapsCallback?: () => void;
  }
}

interface UseGoogleMapsOptions {
  apiKey?: string;
  libraries?: string[];
}

export const useGoogleMaps = (options?: UseGoogleMapsOptions) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(() => !!window.google?.maps);
  const [loadError, setLoadError] = useState<string | null>(null);

  const envKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';
  const apiKey = options?.apiKey || envKey;

  useEffect(() => {
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    if (!apiKey) {
      // No key provided
      setLoadError('MISSING_API_KEY');
      return;
    }

    const scriptId = 'google-maps-script';
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (existingScript) {
      if (window.google?.maps) {
        setIsLoaded(true);
      } else {
        existingScript.addEventListener('load', () => setIsLoaded(true));
        existingScript.addEventListener('error', () => setLoadError('SCRIPT_LOAD_FAILED'));
      }
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'text/javascript';
    const libraries = (options?.libraries || ['places']).join(',');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries}&language=th&region=TH`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
      setLoadError(null);
    };

    script.onerror = () => {
      setLoadError('SCRIPT_LOAD_FAILED');
    };

    document.head.appendChild(script);
  }, [apiKey]);

  return { isLoaded, loadError, apiKey };
};
