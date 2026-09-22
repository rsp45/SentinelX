# SentinelX

[![Security Defense](https://img.shields.io/badge/Security-Defensive%20NIDS-blue.svg)](https://github.com/rsp45/SentinelX)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![TanStack](https://img.shields.io/badge/TanStack-Router%20%2F%20Start-ff4154)](https://tanstack.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

Real-time network intrusion detection system (NIDS) and live threat visualization dashboard. Built as a defensive cybersecurity project for **Foundation of Cyber Security (STCS225)** at **Vijaybhoomi University**.

SentinelX pairs an explainable, rule-based packet analysis engine with a high-performance, dark-themed Security Operations Center (SOC) dashboard.

---

## Architecture & Data Flow

```text
[ Network Source ]
  ├── Live Interface Sniffing (Scapy)
  ├── Offline PCAP File Replay
  └── Deterministic Attack Simulation (Harness)
            │
            ▼
┌───────────────────────┐
│ Packet Sensor         │  Extracts IP, TCP/UDP/ICMP/ARP headers, flags, ports
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐     ┌───────────────────────┐
│ Event Store & Logger  │────▶│ JSONL & Alert Logs    │ (Forensics & Evidence)
└───────────┬───────────┘     └───────────────────────┘
            │
            ▼
┌───────────────────────┐
│ Rule Detection Engine │  Sliding-window evaluation with cooldown de-duplication
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ Flask REST API        │  Serves /api/state & /api/health (Port 5000)
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ TanStack React UI     │  Real-time SOC monitoring interface with guided tour
└───────────────────────┘
```

---

## Key Features

- **Explainable Rule-Based Detection Engine**:
  - **Port Scan Detection**: Tracks unique destination ports contacted per `(source, target)` pair within a configurable 10-second sliding window. Generates a **MEDIUM** severity alert at 15+ ports and escalates to **HIGH** at 30+ ports. Only connection-initiating bare SYN packets count to eliminate false positives from server responses.
  - **SYN Flood (DoS) Detection**: Measures the ratio of completed TCP 3-way handshakes (`ACK`) to half-open connection attempts (`SYN`) within a 10-second window. Triggers a **HIGH** severity alert when 60+ connection attempts occur with under 20% completion.
  - **Alert Cooldown**: Enforces a 20-second cooldown per `(rule, severity, source, target)` key to eliminate alert flooding while preserving threat escalation visibility.

- **Multi-Phase Attack Simulation Harness**:
  - Built-in simulation (`simulate.py`) generates a reproducible 45-second timeline: Quiet Baseline Traffic ➔ Reconnaissance Port Scan ➔ Volumetric SYN Flood.
  - Runs offline within the process with zero external network dependencies or administrative privilege requirements.

- **Modern Interactive SOC Monitoring Dashboard**:
  - Live KPI cards: Total Packets, Active Threats, High-Severity Alert Counts, and Traffic Throughput.
  - Interactive protocol distribution and event breakdown charts.
  - Searchable, filterable real-time alerts table and event inspector.
  - Guided interactive onboarding tour powered by React Joyride for security analysts.
  - Direct toggle between simulated attacks and live packet streams.

---

## Project Structure

```text
SentinelX/
├── backend/                  # Python intrusion detection backend
│   ├── app.py                # Flask REST API serving /api/state
│   ├── config.py             # Configurable detection thresholds and windows
│   ├── rules.py              # Signature detection logic (Port scan, SYN flood)
│   ├── run.py                # Core pipeline entry point (Simulation, PCAP, Live)
│   ├── sensor.py             # Scapy sniffer and protocol packet dissector
│   ├── simulate.py           # Offline attack traffic generator
│   ├── store.py              # In-memory metrics & persistent event/alert loggers
│   ├── requirements.txt      # Python dependencies
│   └── README.md             # In-depth backend architecture and viva guide
├── frontend/                 # Modern React / TanStack monitoring UI
│   ├── src/
│   │   ├── routes/           # Application routes (/ and /monitor)
│   │   ├── components/ui/    # UI component library & Radix primitives
│   │   └── lib/              # Client utilities and helpers
│   ├── package.json          # Frontend scripts and dependencies
│   └── README.md             # Frontend architecture and integration notes
├── archive/                  # Historical route templates and early backups
└── README.md                 # Root project documentation
```

---

## Quick Start

### 1. Start the Backend

From the repository root:

```powershell
# Install dependencies
pip install -r backend/requirements.txt

# Run in simulation mode (recommended for demos)
python backend/run.py --simulate
```

#### Optional Traffic Sources

```powershell
# Live packet capture (requires Administrator/root privileges & Scapy)
python backend/run.py --iface eth0

# Replay an existing packet capture (PCAP)
python backend/run.py --pcap lab_capture.pcap

# Increase simulation or replay playback speed
python backend/run.py --simulate --speed 4
```

The Flask API will run on `http://127.0.0.1:5000`.

---

### 2. Start the Frontend

In a second terminal:

```powershell
cd frontend

# Install dependencies
bun install   # or npm install

# Launch development server
bun run dev -- --host 127.0.0.1 --port 3000
```

Open [http://127.0.0.1:3000/monitor](http://127.0.0.1:3000/monitor) in your browser. The Vite dev server automatically proxies `/api/state` requests to the Flask backend running on port `5000`.

---

## Detection Thresholds (`backend/config.py`)

All detection parameters are centralized in `backend/config.py` for reproducible tuning:

| Setting | Default | Description |
|---|---|---|
| `WINDOW_SECONDS` | `10.0` | Sliding window duration for evaluating traffic rates |
| `PORT_SCAN_PORTS_MEDIUM` | `15` | Unique destination ports triggering MEDIUM severity |
| `PORT_SCAN_PORTS_HIGH` | `30` | Unique destination ports triggering HIGH severity |
| `SYN_FLOOD_MIN_SYNS` | `60` | Minimum SYN attempts required before flood ratio check |
| `SYN_FLOOD_MAX_RATIO` | `0.20` | Maximum completion ratio (`ACK/SYN`) below which an alert fires |
| `COOLDOWN_SECONDS` | `20.0` | Cooldown period suppressing duplicate alerts for the same key |

---

## Evidence & Logs for Incident Reports

During and after running traffic, the backend automatically generates:

- `backend/logs/events.jsonl` — Every ingested packet as structured JSON (timestamp, protocols, flags, source, destination, size).
- `backend/logs/alerts.log` — Security alerts in human-readable forensic format with timestamps, rule names, and alert metrics.

Quick summary commands:

```powershell
# Count total packets captured
Get-Content backend/logs/events.jsonl | Measure-Object -Line

# Count port scan and SYN flood alerts
Select-String -Path backend/logs/alerts.log -Pattern "PORT SCAN" | Measure-Object -Line
Select-String -Path backend/logs/alerts.log -Pattern "SYN FLOOD" | Measure-Object -Line
Select-String -Path backend/logs/alerts.log -Pattern "Severity: HIGH" | Measure-Object -Line
```

---

## Academic Notice & Ethics

> [!IMPORTANT]
> SentinelX is built strictly for defensive, educational cybersecurity research and authorized network administration. Live capture features must only be executed on equipment and networks you own or have explicit written permission to test.
