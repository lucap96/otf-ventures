import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

const coverStats = [
  { value: '$1.2B+', label: 'Raised collectively' },
  { value: '3,000+', label: 'People hired' },
  { value: '$1B+', label: 'Revenue built' },
];

export default function Index() {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('dataroom_cover');
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="decorative-circle-lg" />
      <div className="decorative-circle-sm" />

      <div className="max-w-4xl mx-auto px-8 py-16 relative z-10">
        {/* Header */}
        <div className="mb-20 animate-fade-in">
          <div className="font-display text-xs font-bold tracking-[3px] uppercase text-primary mb-1">
            OTF Ventures
          </div>
          <div className="text-xs text-muted-foreground tracking-wider font-body">
            Data Room · Confidential
          </div>
        </div>

        {/* Hero */}
        <div className="mb-16 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="text-[11px] font-semibold tracking-[3px] uppercase text-primary mb-5 font-body">
            The people behind the access
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-extrabold text-foreground leading-[1.04] tracking-tight mb-6">
            The<br />
            <span className="text-primary">{'{Ωperators}'}</span>
          </h1>
          <div className="text-sm text-foreground leading-relaxed max-w-xl space-y-3 font-body">
            <p>
              The best founders do not want another investor. They want someone who has done it. Someone who has made the first uncomfortable hire, run out of runway and raised anyway, and pushed a product into a new market with no playbook.
            </p>
            <p>
              That is what this group is. They are not advisors. Between them they have taken two companies public, raised $1.2B+, hired 3,000+ people, and built over $1B in revenue.
            </p>
            <p>
              Every major inflection point a European founder is likely to face, someone in this group has lived it. When a portfolio company hits one of those moments, we do not send a generic intro. We put the right person in the room.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex animate-fade-in" style={{ animationDelay: '200ms' }}>
          {coverStats.map((stat, i) => (
            <div key={i} className="stat-card flex-1">
              <div className="font-display text-2xl font-extrabold text-primary">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-body">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-20 text-[10px] text-muted-foreground tracking-wider font-body animate-fade-in" style={{ animationDelay: '300ms' }}>
          Confidential · Not for distribution
        </div>
      </div>
    </div>
  );
}
