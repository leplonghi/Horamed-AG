/**
 * useAnvisaLookup — fetches drug information from OpenFDA API
 * (CORS-enabled public API, no key required)
 * Production target: ANVISA Bulário Eletrônico (requires server-side proxy for CORS)
 */

import { useState, useCallback } from 'react';

export interface AnvisaInfo {
  brandName: string;
  genericName: string;
  manufacturer: string;
  drugClass: string;
  warnings: string;
  contraindications: string;
  adverseReactions: string;
  source: 'openfda' | 'cache';
}

const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCacheKey(name: string) {
  return `anvisa_lookup_${name.toLowerCase().trim()}`;
}

function readCache(name: string): AnvisaInfo | null {
  try {
    const raw = sessionStorage.getItem(getCacheKey(name));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > SESSION_TTL_MS) {
      sessionStorage.removeItem(getCacheKey(name));
      return null;
    }
    return data as AnvisaInfo;
  } catch {
    return null;
  }
}

function writeCache(name: string, data: AnvisaInfo) {
  try {
    sessionStorage.setItem(getCacheKey(name), JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // storage full — ignore
  }
}

function truncate(str: string | undefined, len = 400): string {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

export function useAnvisaLookup() {
  const [info, setInfo] = useState<AnvisaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (medicationName: string) => {
    if (!medicationName.trim()) return;

    // Check cache first
    const cached = readCache(medicationName);
    if (cached) {
      setInfo({ ...cached, source: 'cache' });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const encoded = encodeURIComponent(`"${medicationName.trim()}"`);
      // Try brand name first, fallback to generic name
      const urls = [
        `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${encoded}&limit=1`,
        `https://api.fda.gov/drug/label.json?search=openfda.generic_name:${encoded}&limit=1`,
      ];

      let result = null;
      for (const url of urls) {
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.results?.[0]) { result = json.results[0]; break; }
        }
      }

      if (!result) {
        setInfo(null);
        setError('Medicamento não encontrado na base de dados.');
        return;
      }

      const openfda = result.openfda || {};
      const parsed: AnvisaInfo = {
        brandName: openfda.brand_name?.[0] || medicationName,
        genericName: openfda.generic_name?.[0] || '',
        manufacturer: openfda.manufacturer_name?.[0] || '',
        drugClass: openfda.pharm_class_epc?.[0] || openfda.pharm_class_cs?.[0] || '',
        warnings: truncate(result.warnings?.[0] || result.warnings_and_cautions?.[0]),
        contraindications: truncate(result.contraindications?.[0]),
        adverseReactions: truncate(result.adverse_reactions?.[0]),
        source: 'openfda',
      };

      writeCache(medicationName, parsed);
      setInfo(parsed);
    } catch (err) {
      console.error('useAnvisaLookup error:', err);
      setError('Erro ao buscar informações do medicamento.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setInfo(null);
    setError(null);
  }, []);

  return { info, isLoading, error, lookup, clear };
}
