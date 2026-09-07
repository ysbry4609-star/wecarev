// Logo management utility for WeCare Rescue System
// Supports custom uploaded company logo with fallback to default asset

const LOGO_STORAGE_KEY = 'wecare_custom_logo_v1';
const DEFAULT_LOGO = '/assets/wecare_logo.png';

export function getActiveLogo(): string {
  try {
    const custom = localStorage.getItem(LOGO_STORAGE_KEY);
    if (custom && custom.startsWith('data:image/')) {
      return custom;
    }
  } catch {}
  return DEFAULT_LOGO;
}

export function setActiveLogo(dataUrl: string): void {
  try {
    localStorage.setItem(LOGO_STORAGE_KEY, dataUrl);
    window.dispatchEvent(new CustomEvent('wecare_logo_updated', { detail: dataUrl }));

    // Persist permanently to server files (public/assets/wecare_logo.png and logoBase64.ts)
    fetch('/api/save-logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl }),
    }).catch((e) => console.warn('Could not persist logo to server disk:', e));
  } catch (err) {
    console.error('Failed to save logo to localStorage', err);
  }
}

// Auto-sync existing custom logo on initialization
if (typeof window !== 'undefined') {
  try {
    const existing = localStorage.getItem(LOGO_STORAGE_KEY);
    if (existing && existing.startsWith('data:image/')) {
      fetch('/api/save-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl: existing }),
      }).catch(() => {});
    }
  } catch {}
}

export function resetActiveLogo(): void {
  try {
    localStorage.removeItem(LOGO_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('wecare_logo_updated', { detail: DEFAULT_LOGO }));
  } catch (err) {
    console.error('Failed to reset logo', err);
  }
}

import { useState, useEffect, useCallback } from 'react';

export function useWeCareLogo() {
  const [logo, setLogo] = useState<string>(() => getActiveLogo());

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setLogo(customEvent.detail);
      } else {
        setLogo(getActiveLogo());
      }
    };

    window.addEventListener('wecare_logo_updated', handleUpdate);
    return () => {
      window.removeEventListener('wecare_logo_updated', handleUpdate);
    };
  }, []);

  const uploadLogo = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/')) {
        resolve(false);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (result) {
          setActiveLogo(result);
          resolve(true);
        } else {
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsDataURL(file);
    });
  }, []);

  return {
    logo,
    uploadLogo,
    resetLogo: resetActiveLogo
  };
}
