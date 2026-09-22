import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Check,
  ChevronRight,
  CirclePause,
  CirclePlay,
  Clock3,
  FileWarning,
  Gauge,
  Menu,
  Network,
  Search,
  Settings2,
  ShieldCheck,
  ShieldAlert,
  SlidersHorizontal,
  X,
  Zap,
  HelpCircle,
} from "lucide-react";
import { Joyride, Step } from "react-joyride";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/monitor")({
  head: () => ({
    meta: [
      { title: "Live Monitor — SentinelX" },
      {
        name: "description",
        content:
          "Monitor network packets, active flows, and security alerts in real time with SentinelX.",
      },
      { property: "og:title", content: "Live Monitor — SentinelX" },
      {
        property: "og:description",
        content: "A real-time operational view of network traffic, threats, and alerts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MonitorPage,
});

type View = "Overview" | "Packets" | "Alerts" | "Rules";

type Packet = {
  id: number;
  time: string;
  source: string;
  destination: string;
  protocol: "TCP" | "UDP" | "ICMP";
  port: string;
  size: string;
  status: "Allowed" | "Flagged";
};

type AlertItem = {
  id: number;
  severity: "High" | "Medium";
  title: string;
  detail: string;
  source: string;
  time: string;
  acknowledged: boolean;
};

type BackendState = {
  total_packets: number;
  packets_per_second: number;
  active_flows: number;
  threats: number;
  high_severity: number;
  protocols: Record<string, number>;
  recent_packets: Array<{
    time: string;
    protocol: Packet["protocol"];
    src: string;
    dst: string;
    dport: number | string;
  }>;
  alerts: Array<{
    time: string;
    type: string;
    severity: "HIGH" | "MEDIUM";
    src: string;
    dst: string;
    detail: string;
  }>;
};

const initialTraffic = [
  { time: "18:14", inbound: 14, outbound: 9 },
  { time: "18:15", inbound: 18, outbound: 12 },
  { time: "18:16", inbound: 16, outbound: 10 },
  { time: "18:17", inbound: 24, outbound: 14 },
  { time: "18:18", inbound: 21, outbound: 15 },
  { time: "18:19", inbound: 31, outbound: 19 },
  { time: "18:20", inbound: 27, outbound: 17 },
  { time: "18:21", inbound: 35, outbound: 22 },
  { time: "18:22", inbound: 29, outbound: 18 },
  { time: "18:23", inbound: 38, outbound: 24 },
  { time: "18:24", inbound: 33, outbound: 21 },
];

const initialPackets: Packet[] = [
  {
    id: 1,
    time: "18:25:08.412",
    source: "192.168.1.30",
    destination: "192.168.1.20",
    protocol: "TCP",
    port: "3306",
    size: "1.42 KB",
    status: "Allowed",
  },
  {
    id: 2,
    time: "18:25:08.209",
    source: "192.168.1.77",
    destination: "192.168.1.20",
    protocol: "TCP",
    port: "443",
    size: "64 B",
    status: "Flagged",
  },
  {
    id: 3,
    time: "18:25:07.934",
    source: "192.168.1.20",
    destination: "192.168.1.30",
    protocol: "TCP",
    port: "46649",
    size: "892 B",
    status: "Allowed",
  },
  {
    id: 4,
    time: "18:25:07.602",
    source: "192.168.1.30",
    destination: "192.168.1.53",
    protocol: "UDP",
    port: "53",
    size: "124 B",
    status: "Allowed",
  },
  {
    id: 5,
    time: "18:25:07.118",
    source: "10.0.2.15",
    destination: "192.168.1.8",
    protocol: "ICMP",
    port: "—",
    size: "84 B",
    status: "Allowed",
  },
  {
    id: 6,
    time: "18:25:06.845",
    source: "192.168.1.77",
    destination: "192.168.1.20",
    protocol: "TCP",
    port: "22",
    size: "64 B",
    status: "Flagged",
  },
];

const initialAlerts: AlertItem[] = [
  {
    id: 1,
    severity: "High",
    title: "SYN flood detected",
    detail: "2,384 SYN packets received in 10 seconds",
    source: "192.168.1.77 → 192.168.1.20",
    time: "18:24:42",
    acknowledged: false,
  },
  {
    id: 2,
    severity: "High",
    title: "Port scan detected",
    detail: "42 destination ports probed in 8 seconds",
    source: "10.0.2.44 → 192.168.1.20",
    time: "18:22:16",
    acknowledged: false,
  },
  {
    id: 3,
    severity: "Medium",
    title: "Unusual outbound volume",
    detail: "Traffic exceeded the 15-minute baseline by 240%",
    source: "192.168.1.30 → 34.117.21.9",
    time: "18:18:03",
    acknowledged: false,
  },
];

const rules = [
  ["SYN flood protection", "Triggers above 1,500 SYN packets / 10s", "Enabled"],
  ["Port scan detection", "15 or more unique destination ports / 10s", "Enabled"],
  ["Traffic anomaly", "200% above the rolling 15-minute baseline", "Enabled"],
  ["Blocked region watch", "Flags connections from selected regions", "Paused"],
];

const navItems: Array<{ label: View; icon: typeof Activity }> = [
  { label: "Overview", icon: Gauge },
  { label: "Packets", icon: Network },
  { label: "Alerts", icon: ShieldAlert },
  { label: "Rules", icon: SlidersHorizontal },
];

const tourSteps: Step[] = [
  {
    target: ".tour-nav",
    content: "Navigate between different views: Overview, Packets, Alerts, and Rules.",
    disableBeacon: true,
  },
  {
    target: ".tour-metrics",
    content:
      "Get a quick pulse of your network with real-time metrics including packet rate, active flows, and threats.",
  },
  {
    target: ".tour-throughput",
    content:
      "Monitor inbound and outbound traffic volume dynamically over your selected time range.",
  },
  {
    target: ".tour-packets",
    content: "View a live stream of raw network packets as they are processed by the sensor.",
  },
  {
    target: ".tour-alerts",
    content:
      "Prioritized security alerts appear here. Acknowledge them once you have investigated the issue.",
  },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-7 place-items-center rounded-md bg-primary">
        <span className="size-2 animate-pulse-dot rounded-full bg-primary-foreground" />
      </span>
      <span className="font-display text-sm font-semibold">SentinelX</span>
    </div>
  );
}

function Metric({
  label,
  value,
  change,
  icon: Icon,
}: {
  label: string;
  value: string;
  change: string;
  icon: typeof Activity;
}) {
  return (
    <article className="min-w-0 border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-display text-2xl font-bold leading-none sm:text-[28px]">
            {value}
          </p>
        </div>
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">{change}</p>
    </article>
  );
}

function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0 border border-border bg-card", className)}>
      <header className="flex min-h-12 items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <h2 className="font-display text-sm font-semibold">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function PacketTable({ packets }: { packets: Packet[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-xs">
        <thead className="bg-secondary/50 text-[10px] uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Time</th>
            <th className="px-4 py-3 font-semibold">Source</th>
            <th className="px-4 py-3 font-semibold">Destination</th>
            <th className="px-4 py-3 font-semibold">Protocol</th>
            <th className="px-4 py-3 font-semibold">Port</th>
            <th className="px-4 py-3 font-semibold">Size</th>
            <th className="px-4 py-3 font-semibold">Decision</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border font-mono">
          {packets.map((packet) => (
            <tr key={packet.id} className="transition-colors hover:bg-secondary/40">
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{packet.time}</td>
              <td className="whitespace-nowrap px-4 py-3 font-medium">{packet.source}</td>
              <td className="whitespace-nowrap px-4 py-3">{packet.destination}</td>
              <td className="px-4 py-3">
                <span className="rounded bg-secondary px-2 py-1 font-sans text-[10px] font-bold text-primary">
                  {packet.protocol}
                </span>
              </td>
              <td className="px-4 py-3">{packet.port}</td>
              <td className="px-4 py-3 text-muted-foreground">{packet.size}</td>
              <td
                className={cn(
                  "px-4 py-3 font-sans font-semibold",
                  packet.status === "Flagged" ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {packet.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {packets.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          No packets match the current filters.
        </p>
      )}
    </div>
  );
}

function AlertsList({
  alerts,
  onAcknowledge,
}: {
  alerts: AlertItem[];
  onAcknowledge: (id: number) => void;
}) {
  return (
    <div className="divide-y divide-border">
      {alerts.map((alert) => (
        <article key={alert.id} className={cn("p-4", alert.acknowledged && "opacity-55")}>
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 grid size-8 shrink-0 place-items-center rounded-md",
                alert.severity === "High"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-secondary text-primary",
              )}
            >
              <ShieldAlert className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold">{alert.title}</h3>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                      alert.severity === "High"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-secondary text-primary",
                    )}
                  >
                    {alert.severity}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">{alert.time}</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {alert.detail}
              </p>
              <p className="mt-2 truncate font-mono text-[10px]">{alert.source}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 px-2"
                onClick={() => onAcknowledge(alert.id)}
                disabled={alert.acknowledged}
              >
                <Check /> {alert.acknowledged ? "Acknowledged" : "Acknowledge"}
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function MonitorPage() {
  const [view, setView] = useState<View>("Overview");
  const [paused, setPaused] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [seconds, setSeconds] = useState(608);
  const [packetRate, setPacketRate] = useState(19.2);
  const [traffic, setTraffic] = useState(initialTraffic);
  const [search, setSearch] = useState("");
  const [protocol, setProtocol] = useState("all");
  const [range, setRange] = useState("15m");
  const [alerts, setAlerts] = useState(initialAlerts);
  const [backendState, setBackendState] = useState<BackendState | null>(null);
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("sentinelx_tour_completed")) {
      // Small delay makes the transition smoother instead of popping instantly on render
      const timer = setTimeout(() => {
        setRunTour(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = ["finished", "skipped"];
    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem("sentinelx_tour_completed", "true");
    }
  };

  useEffect(() => {
    let active = true;
    const fetchState = async () => {
      try {
        const response = await fetch("/api/state");
        if (!response.ok) return;
        const state = (await response.json()) as BackendState;
        if (active) setBackendState(state);
      } catch {
        // Keep the last known state while the backend is unavailable.
      }
    };
    void fetchState();
    const poller = window.setInterval(fetchState, 1000);
    return () => {
      active = false;
      window.clearInterval(poller);
    };
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setSeconds((value) => value + 1);
      setPacketRate((value) =>
        Number(Math.max(12, Math.min(28, value + (Math.random() - 0.5) * 2.4)).toFixed(1)),
      );
      setTraffic((items) => [
        ...items.slice(1),
        {
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          inbound: Math.round(22 + Math.random() * 17),
          outbound: Math.round(10 + Math.random() * 15),
        },
      ]);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [paused]);

  const filteredPackets = useMemo(
    () =>
      initialPackets.filter((packet) => {
        const matchesProtocol = protocol === "all" || packet.protocol.toLowerCase() === protocol;
        const query = search.toLowerCase();
        return (
          matchesProtocol &&
          (!query ||
            `${packet.source} ${packet.destination} ${packet.port} ${packet.status}`
              .toLowerCase()
              .includes(query))
        );
      }),
    [protocol, search],
  );

  const livePackets: Packet[] =
    backendState?.recent_packets.map((packet, index) => ({
      id: index,
      time: packet.time,
      source: packet.src,
      destination: packet.dst,
      protocol: packet.protocol,
      port: String(packet.dport),
      size: "-",
      status: "Allowed",
    })) ?? initialPackets;
  const liveAlerts: AlertItem[] =
    backendState?.alerts.map((alert, index) => ({
      id: index,
      severity: alert.severity === "HIGH" ? "High" : "Medium",
      title: alert.type.replaceAll("_", " "),
      detail: alert.detail,
      source: `${alert.src} → ${alert.dst}`,
      time: alert.time,
      acknowledged: false,
    })) ?? alerts;
  const displayedPacketRate = backendState?.packets_per_second ?? packetRate;
  const displayedActiveFlows = backendState?.active_flows ?? 574;
  const displayedThreats = backendState?.threats ?? 3;
  const displayedHighSeverity = backendState?.high_severity ?? 2;
  const protocolCounts = backendState?.protocols ?? { TCP: 10683, UDP: 937, ICMP: 471 };
  const protocolTotal = Object.values(protocolCounts).reduce((sum, count) => sum + count, 0) || 1;

  const acknowledgeAlert = (id: number) =>
    setAlerts((items) =>
      items.map((item) => (item.id === id ? { ...item, acknowledged: true } : item)),
    );
  const activeAlerts = liveAlerts.filter((alert) => !alert.acknowledged).length;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased lg:grid lg:grid-cols-[220px_1fr]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[220px] border-r border-border bg-background transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          mobileNav ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link to="/" aria-label="SentinelX home">
            <BrandMark />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileNav(false)}
          >
            <X />
          </Button>
        </div>
        <nav className="p-3 tour-nav" aria-label="Dashboard navigation">
          <p className="px-3 pb-2 pt-3 text-[9px] font-bold uppercase text-muted-foreground">
            Monitor
          </p>
          {navItems.map(({ label, icon: Icon }) => (
            <Button
              key={label}
              variant="ghost"
              onClick={() => {
                setView(label);
                setMobileNav(false);
              }}
              className={cn(
                "mb-1 w-full justify-start px-3 text-xs",
                view === label && "bg-secondary text-primary hover:bg-secondary",
              )}
            >
              <Icon /> {label}
              {label === "Alerts" && activeAlerts > 0 && (
                <span className="ml-auto grid size-5 place-items-center rounded bg-destructive text-[9px] font-bold text-destructive-foreground">
                  {activeAlerts}
                </span>
              )}
            </Button>
          ))}
        </nav>
        <div className="absolute inset-x-3 bottom-4 border border-border bg-secondary/45 p-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <span
              className={cn(
                "size-1.5 rounded-full",
                paused ? "bg-muted-foreground" : "animate-pulse-dot bg-primary",
              )}
            />
            Sensor node 01
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">eth0 · 1 Gbps uplink</p>
        </div>
      </aside>

      {mobileNav && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-foreground/15 lg:hidden"
          onClick={() => setMobileNav(false)}
        />
      )}

      <main className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileNav(true)}
          >
            <Menu />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-sm font-semibold">Live monitor</h1>
              <span className="hidden text-muted-foreground sm:inline">/</span>
              <span className="hidden text-xs text-muted-foreground sm:inline">{view}</span>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-[11px] text-muted-foreground md:flex">
            <Clock3 className="size-3.5" />
            Capture {Math.floor(seconds / 60)}m {seconds % 60}s
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setView("Overview");
              setRunTour(true);
            }}
            className="hidden sm:flex text-xs h-8"
          >
            <HelpCircle className="size-3.5 mr-1" /> Tour
          </Button>
          <Button
            variant={paused ? "default" : "outline"}
            size="sm"
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? <CirclePlay /> : <CirclePause />}
            {paused ? "Resume" : "Pause"}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
            <Bell />
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-destructive" />
          </Button>
        </header>

        <Joyride
          steps={tourSteps}
          run={runTour}
          continuous={true}
          scrollToFirstStep={true}
          showProgress={true}
          showSkipButton={true}
          callback={handleJoyrideCallback}
          floaterProps={{
            disableAnimation: false,
            placement: "bottom-start",
            styles: {
              floater: {
                transition: "opacity 0.4s ease-in-out",
              },
            },
          }}
          styles={{
            options: {
              primaryColor: "hsl(var(--primary))",
              backgroundColor: "hsl(var(--card))",
              textColor: "hsl(var(--foreground))",
              arrowColor: "hsl(var(--card))",
              overlayColor: "rgba(0, 0, 0, 0.65)",
            },
          }}
        />

        <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase text-primary">Operations center</p>
              <h2 className="mt-1 font-display text-2xl font-bold">{view}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Real-time inspection across the perimeter network.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-[11px] font-semibold",
                  paused
                    ? "border-border text-muted-foreground"
                    : "border-primary/20 bg-secondary text-primary",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    paused ? "bg-muted-foreground" : "animate-pulse-dot bg-primary",
                  )}
                />
                {paused ? "Capture paused" : "Capture healthy"}
              </span>
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger className="w-[94px] text-xs" aria-label="Time range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5m">Last 5m</SelectItem>
                  <SelectItem value="15m">Last 15m</SelectItem>
                  <SelectItem value="1h">Last 1h</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {view === "Overview" && (
            <div className="animate-rise space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 tour-metrics">
                <Metric
                  label="Packets / sec"
                  value={displayedPacketRate.toFixed(1)}
                  change={paused ? "Stream paused" : "Live from sensor"}
                  icon={Activity}
                />
                <Metric
                  label="Active flows"
                  value={displayedActiveFlows.toLocaleString()}
                  change="Current observed flows"
                  icon={Network}
                />
                <Metric
                  label="Threats detected"
                  value={displayedThreats.toLocaleString()}
                  change={`${displayedHighSeverity} high · ${Math.max(0, displayedThreats - displayedHighSeverity)} medium`}
                  icon={ShieldAlert}
                />
                <Metric
                  label="Packets inspected"
                  value={(
                    backendState?.total_packets ?? 12091 + Math.max(0, seconds - 608) * 19
                  ).toLocaleString()}
                  change="No packets dropped"
                  icon={ShieldCheck}
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(290px,0.7fr)]">
                <Panel
                  className="tour-throughput"
                  title="Network throughput"
                  action={
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <i className="size-2 rounded-full bg-primary" />
                        Inbound
                      </span>
                      <span className="flex items-center gap-1.5">
                        <i className="size-2 rounded-full bg-chart-2" />
                        Outbound
                      </span>
                    </div>
                  }
                >
                  <div className="h-[280px] p-3 pt-5">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={traffic} margin={{ top: 5, right: 8, left: -26, bottom: 0 }}>
                        <defs>
                          <linearGradient id="inboundFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.24} />
                            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="var(--border)" vertical={false} />
                        <XAxis
                          dataKey="time"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: 6,
                            fontSize: 11,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="inbound"
                          stroke="var(--primary)"
                          strokeWidth={2}
                          fill="url(#inboundFill)"
                          isAnimationActive={!paused}
                        />
                        <Area
                          type="monotone"
                          dataKey="outbound"
                          stroke="var(--chart-2)"
                          strokeWidth={2}
                          fill="transparent"
                          isAnimationActive={!paused}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>

                <Panel title="Protocol distribution">
                  <div className="space-y-5 p-5">
                    {["TCP", "UDP", "ICMP"].map((name) => {
                      const value = protocolCounts[name] ?? 0;
                      const width = Math.round((value / protocolTotal) * 100);
                      return (
                        <div key={name}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold">{name}</span>
                            <span className="font-mono text-muted-foreground">
                              {value.toLocaleString()}{" "}
                              <small className="ml-1 font-sans">{width}%</small>
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    <div className="border-t border-border pt-4">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Classification rate</span>
                        <strong>100%</strong>
                      </div>
                    </div>
                  </div>
                </Panel>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(290px,0.7fr)]">
                <Panel
                  className="tour-packets"
                  title="Recent packets"
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px]"
                      onClick={() => setView("Packets")}
                    >
                      View stream <ChevronRight />
                    </Button>
                  }
                >
                  <PacketTable packets={livePackets.slice(0, 5)} />
                </Panel>
                <Panel
                  className="tour-alerts"
                  title="Priority alerts"
                  action={
                    <span className="rounded bg-destructive/10 px-2 py-1 text-[9px] font-bold text-destructive">
                      {activeAlerts} ACTIVE
                    </span>
                  }
                >
                  <AlertsList alerts={liveAlerts.slice(0, 3)} onAcknowledge={acknowledgeAlert} />
                </Panel>
              </div>
            </div>
          )}

          {view === "Packets" && (
            <div className="animate-rise space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric
                  label="Packets inspected"
                  value="12,091"
                  change="Since capture started"
                  icon={Activity}
                />
                <Metric
                  label="Allowed traffic"
                  value="99.6%"
                  change="12,043 packets"
                  icon={ShieldCheck}
                />
                <Metric
                  label="Flagged traffic"
                  value="48"
                  change="0.4% of total volume"
                  icon={FileWarning}
                />
              </div>
              <Panel
                title="Packet stream"
                action={
                  <span className="flex items-center gap-2 text-[10px] text-primary">
                    <span className="size-1.5 animate-pulse-dot rounded-full bg-primary" />
                    LIVE
                  </span>
                }
              >
                <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search IP, port, or decision"
                      className="pl-9 text-xs"
                    />
                  </div>
                  <Select value={protocol} onValueChange={setProtocol}>
                    <SelectTrigger
                      className="w-full text-xs sm:w-[150px]"
                      aria-label="Protocol filter"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All protocols</SelectItem>
                      <SelectItem value="tcp">TCP</SelectItem>
                      <SelectItem value="udp">UDP</SelectItem>
                      <SelectItem value="icmp">ICMP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <PacketTable packets={backendState ? livePackets : filteredPackets} />
              </Panel>
            </div>
          )}

          {view === "Alerts" && (
            <div className="animate-rise grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_340px]">
              <Panel
                title="Security alerts"
                action={<span className="text-[10px] text-muted-foreground">Newest first</span>}
              >
                <AlertsList alerts={liveAlerts} onAcknowledge={acknowledgeAlert} />
              </Panel>
              <div className="space-y-4">
                <Panel title="Severity summary">
                  <div className="grid grid-cols-2 gap-px bg-border">
                    <div className="bg-card p-5">
                      <p className="text-[10px] font-bold uppercase text-destructive">High</p>
                      <p className="mt-2 font-display text-3xl font-bold">
                        {displayedHighSeverity}
                      </p>
                    </div>
                    <div className="bg-card p-5">
                      <p className="text-[10px] font-bold uppercase text-primary">Medium</p>
                      <p className="mt-2 font-display text-3xl font-bold">
                        {Math.max(0, displayedThreats - displayedHighSeverity)}
                      </p>
                    </div>
                  </div>
                </Panel>
                <Panel title="Response status">
                  <div className="space-y-3 p-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Awaiting review</span>
                      <strong>{activeAlerts}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Acknowledged</span>
                      <strong>{liveAlerts.length - activeAlerts}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mean response</span>
                      <strong>Live</strong>
                    </div>
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {view === "Rules" && (
            <div className="animate-rise grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <Panel
                title="Detection rules"
                action={
                  <Button size="sm">
                    <Zap />
                    New rule
                  </Button>
                }
              >
                <div className="divide-y divide-border">
                  {rules.map(([name, description, status]) => (
                    <div key={name} className="flex items-center gap-4 p-4">
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          status === "Enabled" ? "bg-primary" : "bg-muted-foreground",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-bold">{name}</h3>
                        <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {status}
                      </span>
                      <Button variant="ghost" size="icon" aria-label={`Configure ${name}`}>
                        <Settings2 />
                      </Button>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Detection health">
                <div className="p-5">
                  <div className="grid size-28 place-items-center rounded-full border-[8px] border-secondary mx-auto">
                    <div className="text-center">
                      <p className="font-display text-2xl font-bold">99.9%</p>
                      <p className="text-[9px] text-muted-foreground">Coverage</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rules evaluated</span>
                      <strong>48</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average latency</span>
                      <strong>8 ms</strong>
                    </div>
                  </div>
                </div>
              </Panel>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
