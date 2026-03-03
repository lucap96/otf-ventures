type DataRoomItem = {
  number: string;
  title: string;
  description: string;
};

type DataRoomSection = {
  label: string;
  items: DataRoomItem[];
};

const sections: DataRoomSection[] = [
  {
    label: "The Pitch",
    items: [
      { number: "01", title: "The OTF Deck", description: "The full pitch - thesis, model, market, team." },
    ],
  },
  {
    label: "Track Record",
    items: [
      { number: "02", title: "Deals in Numbers", description: "49 investments, 3.2x MOIC, 1.2x DPI - the full picture." },
      { number: "03", title: "Deals in Words", description: "How we sourced, why we invested, and what happened." },
    ],
  },
  {
    label: "The {Ωperators}",
    items: [
      { number: "04", title: "Who They Are & Why They Win", description: "Bios, track records, and the capability matrix." },
      { number: "05", title: "How We Work With Them", description: "The day-to-day model - sourcing, support, and engagement." },
      { number: "06", title: "Incentive Structure", description: "GP buy-in, carry allocation, and why this is not a scout fund." },
    ],
  },
  {
    label: "Fund Model",
    items: [
      { number: "07", title: "Fund Model", description: "Live model - adjust assumptions and run your own scenarios." },
      { number: "08", title: "Model Walkthrough", description: "The logic behind OTF." },
      { number: "09", title: "Exit Strategy & Liquidity", description: "How we think about secondaries, DPI, and returning capital to LPs." },
    ],
  },
  {
    label: "Sourcing",
    items: [
      { number: "10", title: "How We Source", description: "The three channels and why the {Ωperator} layer beats any VC-to-VC relationship." },
      { number: "11", title: "Committed Deals - 2026", description: "4 committed deals in 2026 already." },
    ],
  },
  {
    label: "Legals & Admin",
    items: [
      { number: "12", title: "Fund Terms", description: "Target EUR30M - Management fee capped at 15% over the fund lifetime - 3yr investment period - 8yr fund life." },
      { number: "13", title: "Subscription Agreement", description: "The formal commitment document." },
      { number: "14", title: "Fund Structure & Setup", description: "Luxembourg domicile - Legal: CMS - Fund admin: Brightpoint - Compliance: AQ" },
    ],
  },
];

export default function Index() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-8 sm:px-6 md:px-8">
      <div className="decorative-circle-lg" />
      <div className="decorative-circle-sm" />

      <button
        type="button"
        onClick={() => window.print()}
        className="fixed bottom-6 right-6 z-50 rounded-lg bg-primary px-4 py-2.5 font-display text-sm font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 print:hidden"
      >
        Export as PDF
      </button>

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
              Target EUR30M · Luxembourg
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
                navid@otf.vc
              </p>
            </article>
            <article className="rounded-lg border border-border bg-card p-4 sm:p-5">
              <h2 className="font-display text-base font-extrabold text-foreground">Mark Batunskiy</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                +44 756 234 5032
                <br />
                mark@otf.vc
              </p>
            </article>
          </section>

          {sections.map((section) => (
            <section key={section.label}>
              <div className="mb-2 flex items-center gap-3">
                <div className="whitespace-nowrap text-[9.5px] font-bold uppercase tracking-[2.5px] text-primary">{section.label}</div>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <article key={item.number} className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3">
                    <div className="mt-0.5 min-w-5 font-display text-xs font-bold text-primary/40">{item.number}</div>
                    <div>
                      <h3 className="font-display text-[15px] font-extrabold text-foreground">{item.title}</h3>
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
