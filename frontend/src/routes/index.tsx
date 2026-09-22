import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SentinelX — Real-time Network Intrusion Detection" },
      {
        name: "description",
        content:
          "Inspect every packet, detect network threats, and prioritize security alerts in real time with SentinelX.",
      },
      { property: "og:title", content: "SentinelX — Real-time Network Intrusion Detection" },
      {
        property: "og:description",
        content: "A calm, precise live view of network traffic, threats, and security alerts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const bars = [42, 66, 52, 82, 62, 100];

const packets: Array<[string, string, string]> = [
  ["192.168.1.30", "192.168.1.20:3306", "TCP"],
  ["192.168.1.20", "192.168.1.30:46649", "TCP"],
  ["192.168.1.30", "192.168.1.53:53", "UDP"],
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "flex items-center" : "flex items-center"}>
      <span className="font-display text-sm font-semibold">SentinelX</span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-[26px] font-bold leading-none">{value}</p>
      {children}
    </div>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Brand />
            <span className="hidden text-[11px] font-medium text-muted-foreground sm:inline">
              Network intrusion detection
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-[13px] font-medium text-muted-foreground md:flex">
            <a href="#platform" className="transition-colors hover:text-foreground">
              Platform
            </a>
            <a href="#detection" className="transition-colors hover:text-foreground">
              Detection
            </a>
            <a href="#monitor" className="transition-colors hover:text-foreground">
              Live view
            </a>
          </nav>
          <Link
            to="/monitor"
            className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Open live monitor
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl items-center px-4 py-5 sm:px-6 md:py-3 lg:py-0">
          <div className="grid w-full items-start gap-6 md:grid-cols-12 md:gap-4">
            <div className="animate-rise md:col-span-5">
              <div className="mb-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase text-primary">
                <span className="size-1.5 animate-pulse-dot rounded-full bg-primary" /> Live network
                view
              </div>
              <h1 className="max-w-[15ch] text-balance font-display text-[42px] font-extrabold leading-[1.06] sm:text-[52px]">
                See every packet. Catch every intrusion.
              </h1>
              <p className="mt-5 max-w-[48ch] text-[15px] leading-relaxed text-muted-foreground">
                SentinelX inspects network traffic in real time, surfacing SYN floods, port scans,
                and anomalous flows the moment they cross your perimeter.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to="/monitor"
                  className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Open live monitor
                </Link>
                <a
                  href="#detection"
                  className="px-4 py-3 text-sm font-medium transition-colors hover:text-primary"
                >
                  View detection logic
                </a>
              </div>
              <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
                <span>
                  <strong className="font-display text-foreground">12,091</strong> packets / 608s
                </span>
                <span className="h-4 w-px bg-border" />
                <span>
                  <strong className="font-display text-foreground">99.98%</strong> uptime
                </span>
              </div>
            </div>

            <div
              id="monitor"
              className="grid animate-rise grid-cols-6 gap-1.5 [animation-delay:100ms] md:col-span-7"
            >
              <div className="col-span-6 flex items-center justify-between rounded-lg border border-border bg-secondary/60 px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 animate-pulse-dot rounded-full bg-primary" />
                  <span className="font-display text-xs font-semibold">SentinelX — live view</span>
                </div>
                <span className="text-[10px] text-muted-foreground">12,091 packets / 608s</span>
              </div>
              <div className="col-span-6 sm:col-span-3">
                <MetricCard label="Packets / sec" value="19.2">
                  <div className="mt-3 flex h-10 items-end gap-1">
                    {bars.map((height, index) => (
                      <span
                        key={height + index}
                        className={`w-full rounded-sm ${index === bars.length - 1 ? "bg-primary" : "bg-primary/25"}`}
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </MetricCard>
              </div>
              <div className="col-span-6 sm:col-span-3">
                <MetricCard label="Active flows" value="574">
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/15">
                    <div className="animate-grow-bar h-full w-[72%] rounded-full bg-primary" />
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">72% of observed capacity</p>
                </MetricCard>
              </div>
              <div className="col-span-6 rounded-lg border border-border bg-card p-2.5 sm:col-span-4">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Protocol distribution
                </p>
                <div className="mt-2 space-y-1.5">
                  {[
                    ["TCP", "88%", "88%"],
                    ["UDP", "8%", "8%"],
                    ["ICMP", "4%", "4%"],
                  ].map(([name, value, width]) => (
                    <div key={name}>
                      <div className="flex justify-between text-[11px] font-medium">
                        <span>{name}</span>
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-primary/15">
                        <div
                          className="animate-grow-bar h-full rounded-full bg-primary"
                          style={{ width }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-6 sm:col-span-2">
                <MetricCard label="Threats detected" value="3">
                  <div className="mt-3 flex gap-2 text-[10px]">
                    <span className="rounded bg-primary/10 px-2 py-1 font-semibold text-primary">
                      High 2
                    </span>
                    <span className="px-1 py-1 text-muted-foreground">Med 1</span>
                  </div>
                </MetricCard>
              </div>
              <div className="col-span-6 rounded-lg border border-border bg-card p-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium text-muted-foreground">Recent packets</p>
                  <span className="text-[10px] text-muted-foreground">
                    Source · Destination · Protocol
                  </span>
                </div>
                <div className="mt-1.5 divide-y divide-border">
                  {packets.map(([source, destination, protocol]) => (
                    <div
                      key={source + destination}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-1 font-mono text-[11px]"
                    >
                      <span>{source}</span>
                      <span className="text-muted-foreground">→ {destination}</span>
                      <span className="font-bold text-primary">{protocol}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-6 rounded-lg border border-border bg-card p-2.5 sm:col-span-3">
                <p className="text-[11px] font-medium text-muted-foreground">Security alerts</p>
                <div className="mt-1.5 space-y-1.5">
                  <div className="border-l-2 border-primary pl-3">
                    <div className="flex justify-between">
                      <strong className="text-xs">SYN FLOOD</strong>
                      <span className="text-[10px] font-semibold text-primary">HIGH</span>
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      192.168.1.77 → 192.168.1.20
                    </p>
                  </div>
                  <div className="border-l-2 border-primary/50 pl-3">
                    <div className="flex justify-between">
                      <strong className="text-xs">PORT SCAN</strong>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        MEDIUM
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      15 unique ports in 10s
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-span-6 sm:col-span-3">
                <MetricCard label="High severity" value="2">
                  <p className="mt-3 text-xs text-muted-foreground">Requires immediate review</p>
                </MetricCard>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase text-primary">About SentinelX</p>
            <h2 className="mt-3 text-balance font-display text-3xl font-bold">
              Clarity in the chaos of network traffic.
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  What is SentinelX?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  SentinelX is a real-time network intrusion detection system designed to inspect
                  every packet, identify anomalous flows, and surface high-priority security threats
                  instantly.
                </p>
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Why use it?</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Traditional logs are noisy and overwhelming. SentinelX provides immediate clarity,
                  allowing you to detect and prioritize threats like SYN floods or port scans
                  without alert fatigue.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Who is it for?</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Built for SecOps teams, network administrators, and IT security professionals who
                  need a calm, operational view of their network perimeter.
                </p>
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  How is it different?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Instead of endless scrolling logs, SentinelX focuses on precise visibility,
                  aggregating traffic into actionable metrics, flow visualizations, and categorized
                  alerts for immediate triage.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="monitor-details" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="rounded-2xl border border-border bg-secondary/20 p-8 sm:p-12">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance font-display text-3xl font-bold">
                What the live monitor shows
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                The SentinelX dashboard gives you a comprehensive, real-time pulse of your network
                activity.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-5">
                <h4 className="font-semibold">Throughput & Flows</h4>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Live packets per second, total active flows, and inbound/outbound volume trends
                  over time.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h4 className="font-semibold">Protocol Distribution</h4>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Visual breakdown of TCP, UDP, and ICMP traffic to quickly spot protocol-based
                  anomalies.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h4 className="font-semibold">Live Packet Stream</h4>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  A real-time ticker of raw packets showing source, destination, port, and security
                  decisions.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 sm:col-span-2 lg:col-span-3">
                <h4 className="font-semibold">Priority Security Alerts</h4>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Threats are automatically categorized by severity (High, Medium). Instantly see
                  the source and details of SYN floods, port scans, and unusual traffic volumes so
                  you can respond to the most critical issues first.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase text-primary">Built for the wire</p>
            <h2 className="mt-3 text-balance font-display text-3xl font-bold">
              Calm visibility for high-stakes network operations.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              From raw traffic to prioritized response, every signal stays precise and immediately
              actionable.
            </p>
          </div>
          <div id="detection" className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              [
                "01",
                "Real-time flow inspection",
                "Every packet is parsed and correlated as it arrives across every monitored interface.",
              ],
              [
                "02",
                "Anomaly detection",
                "Traffic baselines reveal SYN floods, port scans, and unusual behavior before escalation.",
              ],
              [
                "03",
                "Severity triage",
                "High, medium, and low signals are ranked so operators address the right alert first.",
              ],
            ].map(([number, title, copy]) => (
              <article
                key={number}
                className="rounded-lg border border-border bg-secondary/40 p-6 transition-colors hover:bg-secondary"
              >
                <span className="font-display text-xs font-bold text-primary">{number}</span>
                <h3 className="mt-5 font-display text-base font-semibold">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <div className="rounded-lg bg-primary px-8 py-12 text-primary-foreground md:px-14 md:py-16">
            <div className="max-w-xl">
              <h2 className="text-balance font-display text-3xl font-bold">
                Put your network under watch.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80">
                See traffic, threats, and alerts in one calm, precise live view.
              </p>
              <Link
                to="/monitor"
                className="mt-7 inline-block rounded-lg bg-background px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-secondary"
              >
                Open live monitor
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <Brand compact />
          <span className="text-xs text-muted-foreground">
            Network intrusion detection · Live view
          </span>
        </div>
      </footer>
    </div>
  );
}
