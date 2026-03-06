import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

const AIRTABLE_URL = 'https://airtable.com/embed/apphpMlsaOaussnwZ/shrb6LRMym7lZrr59';

export default function SourcingCRM() {
  const { trackExternalLink } = useAnalytics();

  useEffect(() => {
    void (async () => {
      await trackExternalLink('Airtable CRM', AIRTABLE_URL);
      window.location.replace(AIRTABLE_URL);
    })();
  }, [trackExternalLink]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse font-display text-primary text-lg tracking-widest uppercase">
        Opening CRM…
      </div>
    </div>
  );
}
