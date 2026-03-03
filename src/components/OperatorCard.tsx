interface OperatorStat {
  value: string;
  label: string;
}

interface OperatorCardProps {
  name: string;
  role: string;
  tagline: string;
  description: string[];
  stats: OperatorStat[];
  tags: string[];
  index?: number;
}

export default function OperatorCard({ name, role, tagline, description, stats, tags, index = 0 }: OperatorCardProps) {
  return (
    <div
      className="glass-card p-7 animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex justify-between items-start mb-3 gap-4 flex-wrap">
        <div>
          <h3 className="font-display text-lg font-extrabold text-foreground tracking-tight">{name}</h3>
          <div className="text-[10px] text-primary font-bold uppercase tracking-[1.5px] font-body">{role}</div>
        </div>
        <div className="flex gap-5 shrink-0">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="font-display text-base font-extrabold text-primary">{s.value}</div>
              <div className="text-[8.5px] text-muted-foreground uppercase tracking-wider mt-0.5 font-body">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground italic leading-relaxed pl-3 border-l-[3px] border-primary mb-4 font-body">
        {tagline}
      </div>

      <div className="h-px bg-border mb-4" />

      <div className="text-sm leading-relaxed text-foreground mb-5 font-body space-y-3">
        {description.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag, i) => (
          <span key={i} className="tag-pill">{tag}</span>
        ))}
      </div>
    </div>
  );
}
