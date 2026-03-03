import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useAnalytics() {
  const { user } = useAuth();

  const trackPageView = async (page: string) => {
    if (!user) return;
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'page_view',
      metadata: { page, timestamp: new Date().toISOString() },
    });
  };

  const trackDocumentView = async (documentId: string, documentTitle: string) => {
    if (!user) return;
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'document_view',
      metadata: { document_id: documentId, document_title: documentTitle, timestamp: new Date().toISOString() },
    });
  };

  return { trackPageView, trackDocumentView };
}
