import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { downloadNativePagesAsPdf } from '@/lib/pdfDownload';

type DataRoomItem = {
  number: string;
  title: string;
  description: string;
  id?: string;
  href?: string;
  to?: string;
};

type DataRoomSection = {
  label: string;
  id?: string;
  items: DataRoomItem[];
};

const sections: DataRoomSection[] = [
  {
    label: "The Pitch",
    id: "deck",
    items: [
      {
        number: "01",
        id: "long-deck",
        title: "The OTF Deck",
        description: "The full pitch - thesis, model, market, team.",
        href: "https://docsend.com/view/xsfzbimm3qdvtcdv",
      },
    ],
  },
  {
    label: "Track Record",
    id: "track-record",
    items: [
      {
        number: "02",
        id: "in-numbers",
        title: "Deals in Numbers",
        description: "49 investments, 3.2x MOIC, 1.2x DPI - the full picture.",
        href: "https://docs.google.com/spreadsheets/d/1c0zREYWLCO_rwHuahqN84zLJwzEMQY2xxoErGzSSuH0/edit?gid=0#gid=0",
      },
      {
        number: "03",
        id: "in-words",
        title: "Deals in Words",
        description: "How we sourced, why we invested, and what happened.",
        to: "/track-record/in-words",
      },
    ],
  },
  {
    label: "The {Ωperators}",
    items: [
      { number: "04", title: "Who They Are & Why They Win", description: "Bios, track records, and the capability matrix.", to: "/operators/our-operators" },
      { number: "05", title: "How We Work With Them", description: "The day-to-day model - sourcing, support, and engagement.", to: "/operators/how-we-work-together" },
      { number: "06", title: "Incentive Structure", description: "GP buy-in, carry allocation, and why this is not a scout fund.", to: "/operators/operator-incentives" },
    ],
  },
  {
    label: "Fund Model",
    id: "fund-model",
    items: [
      {
        number: "07",
        id: "model",
        title: "Fund Model",
        description: "Live model - adjust assumptions and run your own scenarios.",
        href: "https://docs.google.com/spreadsheets/d/1FWXf2pkKaMxaKej9S3d0QoLHXt4bwvk6/edit?rtpof=true&sd=true&gid=1596136530#gid=1596136530",
      },
      { number: "08", id: "walk-through", title: "Model Walkthrough", description: "The logic behind OTF.", to: "/fund-model/walk-through" },
      { number: "09", title: "Exit Strategy & Liquidity", description: "How we think about secondaries, DPI, and returning capital to LPs.", to: "/fund-model/exit-strategy-liquidity" },
    ],
  },
  {
    label: "Sourcing",
    id: "sourcing",
    items: [
      { number: "10", title: "How We Source", description: "The three channels and why the {Ωperator} layer beats any VC-to-VC relationship.", to: "/sourcing" },
      { number: "11", id: "committed-deals-2026", title: "Committed Deals · 2026", description: "5 committed deals in 2026 already.", to: "/committed-deals-2026" },
    ],
  },
  {
    label: "Legals & Admin",
    id: "legals",
    items: [
      { number: "12", id: "fund-terms", title: "Fund Terms", description: "Mgmt fee cap 15%, 3 yr investment period, 8 yr fund life", to: "/legals/fund-terms" },
      { number: "13", id: "subscription-agreement", title: "Subscription Agreement", description: "The formal commitment document.", to: "/legals/subscription-agreement" },
      { number: "14", id: "fund-structure-setup", title: "Fund Structure & Setup", description: "Luxembourg domicile · Legal: CMS · Fund admin: Brightpoint · Compliance: AQ", to: "/legals/fund-structure-setup" },
    ],
  },
];

export default function Index() {
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await downloadNativePagesAsPdf();
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-8 sm:px-6 md:px-8">
      <div className="decorative-circle-lg" />
      <div className="decorative-circle-sm" />

      {/* <button
        type="button"
        onClick={handleExportPdf}
        disabled={isExportingPdf}
        aria-busy={isExportingPdf}
        className="fixed bottom-6 right-6 z-50 rounded-lg bg-primary px-4 py-2.5 font-display text-sm font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70 print:hidden"
      >
        {isExportingPdf ? 'Preparing PDF…' : 'Export as PDF'}
      </button> */}

      <div className="mx-auto w-full max-w-5xl rounded-xl border border-border bg-[hsl(var(--background))] p-5 sm:p-8 md:p-11">
        <div className="relative z-10 flex flex-col gap-9">
          <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="font-display text-xs font-bold uppercase tracking-[3px] text-primary">OTF Ventures</div>
              <div className="mt-1 text-[10px] tracking-wider text-muted-foreground">Data Room · Confidential</div>
            </div>
            <div className="text-left font-body text-[9.5px] uppercase tracking-wide text-muted-foreground sm:text-right">
              Fund I · Pre-Seed & Seed
              <br />
              Target €30M · Luxembourg
            </div>
          </header>

          <section>
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[2.5px] text-primary">Welcome</div>
            <h1 className="font-display text-4xl font-extrabold leading-[1.04] tracking-tight text-foreground sm:text-5xl">
              The OTF
              <br />
              <span className="text-primary">Data Room</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Everything you need to evaluate OTF is in this room. Please reach out directly if anything is missing or if you have questions.
            </p>
          </section>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <article className="rounded-lg border border-border bg-card p-4 sm:p-5">
              <h2 className="font-display text-base font-extrabold text-foreground">Navid Meyer</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                +49 172 147 1814
                <br />
                <a href="mailto:navid@otf.vc" className="font-semibold text-primary hover:underline">navid@otf.vc</a>
              </p>
            </article>
            <article className="rounded-lg border border-border bg-card p-4 sm:p-5">
              <h2 className="font-display text-base font-extrabold text-foreground">Mark Batunskiy</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                +44 756 234 5032
                <br />
                <a href="mailto:mark@otf.vc" className="font-semibold text-primary hover:underline">mark@otf.vc</a>
              </p>
            </article>
          </section>

          {sections.map((section) => (
            <section key={section.label} id={section.id} className={section.id ? "scroll-mt-8" : undefined}>
              <div className="mb-2 flex items-center gap-3">
                <div className="whitespace-nowrap text-[9.5px] font-bold uppercase tracking-[2.5px] text-primary">{section.label}</div>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <article
                    key={item.number}
                    id={item.id}
                    className={item.id ? "scroll-mt-8 flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3" : "flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3"}
                  >
                    <div className="mt-0.5 min-w-5 font-display text-xs font-bold text-primary/40">{item.number}</div>
                    <div>
                      {item.href ? (
                        <h3 className="font-display text-[15px] font-extrabold text-foreground">
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-primary hover:underline"
                          >
                            {item.title}
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        </h3>
                      ) : item.to ? (
                        <h3 className="font-display text-[15px] font-extrabold text-foreground">
                          <Link to={item.to} className="text-primary hover:underline">
                            {item.title}
                          </Link>
                        </h3>
                      ) : (
                        <h3 className="font-display text-[15px] font-extrabold text-foreground">{item.title}</h3>
                      )}
                      <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}

          <footer className="flex flex-col gap-2 border-t border-border pt-4 text-[10px] tracking-wide text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span className="font-display font-bold uppercase tracking-[2px] text-primary">OTF Ventures</span>
            <span>Confidential · Not for distribution</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
