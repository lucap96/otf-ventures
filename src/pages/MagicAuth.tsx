import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function MagicAuth() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleMagicLink = async () => {
      const queryParams = new URLSearchParams(window.location.search);
      const tokenHash = queryParams.get('token_hash');
      const type = queryParams.get('type');

      // token_hash flow: admin-generated manual magic link
      if (tokenHash && type === 'magiclink') {
        window.history.replaceState({}, document.title, '/magic-auth');
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'magiclink',
        });
        if (verifyError) {
          setError(verifyError.message);
          return;
        }
        // verifyOtp can return success with no session if the token was already used
        if (!verifyData.session) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData.session) {
            setError('Sign-in link is invalid or has already been used. Request a new one.');
            return;
          }
        }
        await supabase.rpc('increment_magic_link_click');
      } else {
        // Extract tokens from URL hash (present for both invite and magic-link flows)
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (!accessToken || !refreshToken) {
          setError('Invalid or expired sign-in link. Request a new one.');
          return;
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          setError(sessionError.message);
          return;
        }
        await supabase.rpc('increment_magic_link_click');
      }

      // Try to activate the pending invitation. This is a no-op for already-active users
      // (claim_invitation_role raises "No pending invitation" which we safely ignore).
      const { error: claimError } = await supabase.rpc('claim_invitation_role', { p_full_name: null });

      if (claimError && !claimError.message.includes('No pending invitation')) {
        setError(claimError.message);
        return;
      }

      // Refresh so the session picks up the updated user record
      await supabase.auth.refreshSession();

      navigate('/', { replace: true });
    };

    void handleMagicLink();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="glass-card p-8 max-w-md w-full">
          <h1 className="font-display text-xl font-bold mb-3">Sign-in Failed</h1>
          <p className="text-sm text-muted-foreground font-body">{error}</p>
          <button
            className="mt-6 w-full font-display uppercase tracking-wide text-sm text-primary hover:underline"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse font-display text-primary text-lg tracking-widest uppercase">
        Signing you in…
      </div>
    </div>
  );
}
