import { Blocks, Palette, PackageOpen } from "lucide-react";

const FEATURES = [
  {
    icon: Blocks,
    title: "Compound, not config",
    body: "Compose <Bar />, <Grid />, <Legend /> as children — no thousand-key options object.",
  },
  {
    icon: Palette,
    title: "Themed with your tokens",
    body: "Colors, radius, and dark mode read from your CSS variables. No theme prop to wire up.",
  },
  {
    icon: PackageOpen,
    title: "You own the source",
    body: "Installed through the shadcn registry — the chart code lands in your repo, yours to edit.",
  },
];

const CODE = `import {
  BeeBarChart, Bar, Grid, XAxis, Legend, Tooltip,
} from "@/components/beecharts/charts/bar-chart";

export function Traffic({ data }) {
  return (
    <BeeBarChart data={data} config={config} xDataKey="month">
      <Grid />
      <XAxis dataKey="month" />
      <Legend isClickable />
      <Tooltip />
      <Bar dataKey="desktop" />
      <Bar dataKey="mobile" />
    </BeeBarChart>
  );
}`;

export function FeatureCode() {
  return (
    <section className="grid w-full items-start gap-10 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Readable charts, by construction</h2>
          <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
            The API mirrors the markup you already write. What you read is what renders.
          </p>
        </div>
        <ul className="flex flex-col gap-5">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3.5">
              <span className="bg-muted text-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
                <Icon className="size-4" />
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="flex items-center gap-1.5 border-b px-4 py-2.5">
          <span className="bg-muted-foreground/30 size-2.5 rounded-full" />
          <span className="bg-muted-foreground/30 size-2.5 rounded-full" />
          <span className="bg-muted-foreground/30 size-2.5 rounded-full" />
          <span className="text-muted-foreground ml-2 font-mono text-xs">bar-chart.tsx</span>
        </div>
        <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-relaxed">
          <code className="text-foreground/90 font-mono">{CODE}</code>
        </pre>
      </div>
    </section>
  );
}
