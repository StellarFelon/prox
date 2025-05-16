import { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const generateFingerprint = async () => {
      try {
        setLoading(true);
        // Initialize FingerprintJS
        const fp = await FingerprintJS.load();
        
        // Get the visitor identifier
        const result = await fp.get();
        
        // The visitorId is the stable fingerprint
        setFingerprint(result.visitorId);
      } catch (err) {
        console.error('Error generating fingerprint:', err);
        setError(err instanceof Error ? err : new Error('Failed to generate fingerprint'));
      } finally {
        setLoading(false);
      }
    };

    generateFingerprint();
  }, []);

  return { fingerprint, loading, error };
}
