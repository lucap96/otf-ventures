import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AIRTABLE_EMBED_URL = 'https://airtable.com/embed/apphpMlsaOaussnwZ/shrb6LRMym7lZrr59';

export default function SourcingCRM() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-xs text-muted-foreground/50">|</span>
        <span className="text-sm font-display font-semibold tracking-wide text-foreground">Sourcing CRM</span>
      </div>
      <iframe
        src={AIRTABLE_EMBED_URL}
        className="flex-1 w-full border-0"
        title="Sourcing CRM"
        allow="fullscreen"
      />
    </div>
  );
}
