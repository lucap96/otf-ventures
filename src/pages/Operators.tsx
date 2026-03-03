import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import OperatorCard from '@/components/OperatorCard';
import { operators, capabilityMatrix } from '@/data/operators';
import { cn } from '@/lib/utils';

export default function Operators() {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('operators');
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="decorative-circle-lg" />
      <div className="decorative-circle-sm" />

      <div className="max-w-4xl mx-auto px-8 py-12 relative z-10">
        <div className="page-header">
          <div className="font-display text-xs font-bold tracking-[3px] text-primary uppercase">OTF Ventures</div>
          <div className="text-[10px] text-muted-foreground tracking-[1.5px] uppercase font-body">Operators</div>
        </div>

        <div className="space-y-5 mb-16">
          {operators.map((op, i) => (
            <OperatorCard key={i} {...op} index={i} />
          ))}
        </div>

        {/* Capability Matrix */}
        <div className="mb-8">
          <div className="text-[10px] font-semibold tracking-[2px] uppercase text-primary mb-1 font-body">Overview</div>
          <h2 className="font-display text-2xl font-extrabold text-foreground tracking-tight mb-1">Operator Capability Matrix</h2>
          <div className="section-rule mb-6" />
        </div>

        <div className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary">
                  {capabilityMatrix.headers.map((h, i) => (
                    <th
                      key={i}
                      className={cn(
                        "px-3 py-3 text-[10px] font-bold text-left text-primary-foreground uppercase tracking-wider font-body",
                        i === 0 && "w-[30%]"
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {capabilityMatrix.sections.map((section, si) => (
                  <>
                    <tr key={`section-${si}`}>
                      <td
                        colSpan={5}
                        className="bg-accent text-primary text-[9.5px] font-bold uppercase tracking-wider px-3 py-1.5 font-body"
                      >
                        {section.title}
                      </td>
                    </tr>
                    {section.rows.map((row, ri) => (
                      <tr key={`${si}-${ri}`} className={cn("border-b border-border", ri % 2 === 1 && "bg-background")}>
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className={cn(
                              "px-3 py-2 text-[11px] font-body",
                              ci === 0 ? "text-muted-foreground" : "text-foreground",
                              cell === 'Exceptional' && "text-primary font-bold"
                            )}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between mt-8 text-[9.5px] text-muted-foreground font-body">
          <span className="font-display font-bold tracking-[2px] uppercase text-primary">OTF Ventures</span>
          <span>Confidential · Not for distribution</span>
        </div>
      </div>
    </div>
  );
}
