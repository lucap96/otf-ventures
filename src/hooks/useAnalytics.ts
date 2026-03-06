import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCallback } from 'react';

const pageViewDedupe = new Map<string, number>();
const DEDUPE_WINDOW_MS = 10000;

export function useAnalytics() {
  const { user, isAdmin, roleLoading } = useAuth();

  const shouldTrackPageView = useCallback((page: string) => {
    if (typeof window === 'undefined') return true;
    const dedupeKey = `analytics:last_page_view:${user?.id ?? 'anon'}:${page}`;
    const now = Date.now();
    const sessionTracked = Number(window.sessionStorage.getItem(dedupeKey) || 0);
    const memoryTracked = pageViewDedupe.get(dedupeKey) ?? 0;
    const lastTracked = Math.max(sessionTracked, memoryTracked);
    if (now - lastTracked < DEDUPE_WINDOW_MS) {
      return false;
    }
    window.sessionStorage.setItem(dedupeKey, String(now));
    pageViewDedupe.set(dedupeKey, now);
    return true;
  }, [user?.id]);

  const trackPageView = useCallback(async (page: string) => {
    if (!user || isAdmin || roleLoading || !shouldTrackPageView(page)) return;
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'page_view',
      metadata: { page, timestamp: new Date().toISOString() },
    });
  }, [isAdmin, roleLoading, shouldTrackPageView, user]);

  const trackDocumentView = useCallback(async (documentId: string, documentTitle: string) => {
    if (!user || isAdmin || roleLoading) return;
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      document_id: documentId,
      event_type: 'document_view',
      metadata: { document_id: documentId, document_title: documentTitle, timestamp: new Date().toISOString() },
    });
  }, [isAdmin, roleLoading, user]);

  const trackExternalLink = useCallback(async (label: string, url: string) => {
    if (!user || isAdmin || roleLoading) return;
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'external_link',
      metadata: { label, url, timestamp: new Date().toISOString() },
    });
  }, [isAdmin, roleLoading, user]);

  return { trackPageView, trackDocumentView, trackExternalLink };
}
