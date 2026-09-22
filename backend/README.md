# SentinelX

Real-time network intrusion detection and threat visualization.
Foundation of Cyber Security (STCS225) — Vijaybhoomi University.

Defensive project. Run live capture only on machines and networks you own
or have written permission to test.

## Run it

```bash
pip install flask
python run.py --simulate
```

Open <http://127.0.0.1:5000>. The simulation runs a 45-second timeline:
quiet traffic, then a port scan, then a SYN burst. You should see a
MEDIUM port-scan alert, a HIGH one as the scan widens, and a HIGH SYN
flood alert. Nothing is sent over the network — the harness fabricates
packet metadata inside the process.

Other traffic sources (need `pip install scapy`):

```bash
sudo python run.py --iface eth0        # live capture, authorized hosts only
python run.py --pcap lab_capture.pcap  # replay traffic you recorded
```

`--speed 4` makes the simulation or replay run 4× faster.

## Files

| File | Architecture box | What it does |
|---|---|---|
| `sensor.py` | Packet Capture + Protocol Analyzer | scapy → one flat dict per packet |
| `rules.py` | Detection Engine + Threat Detector | the two signature rules |
| `store.py` | Event Logger | counters + `logs/events.jsonl`, `logs/alerts.log` |
| `app.py` | Dashboard API | Flask API serving `/api/state` |
| `../frontend/` | Dashboard UI | React monitor, polls the API once a second |
| `simulate.py` | Test Harness | offline traffic generator for the demo |
| `run.py` | — | wires the pipeline together |
| `config.py` | — | every threshold, in one place |

The whole pipeline is six lines in `run.py::build_pipeline`:
packet in → store it → run the rules → store any alert.

## The two rules

**Port scan.** For each (source, target) pair, keep the destination ports
seen in the last 10 seconds. 15+ unique ports = alert, 30+ = HIGH.
Only SYN packets count, because they are connection *attempts*.

**SYN flood.** For each target, count SYNs and completed handshakes in the
last 10 seconds. 60+ SYNs with under 20% completing = alert. A busy but
healthy server has a high completion ratio, so it does not trip.

Thresholds live in `config.py`. Pick values, then keep them fixed while
you collect your results.

## Evidence for the report

After a run you will have:

- `logs/events.jsonl` — every parsed packet, one JSON object per line
- `logs/alerts.log` — alerts in the Section 10.2 format
- dashboard screenshots — take one during the quiet phase and one after
  the alerts appear

Quick counts for the results table:

```bash
wc -l logs/events.jsonl                       # total packets
grep -c "PORT SCAN" logs/alerts.log           # scan alerts
grep -c "SYN FLOOD" logs/alerts.log           # flood alerts
grep -c "Severity: HIGH" logs/alerts.log      # high severity
```

Detection delay: compare the `ts` of the first scan packet in
`events.jsonl` with the alert time in `alerts.log`.

## Likely viva questions

**Why signature-based and not machine learning?**
Every alert traces back to a counter you can print. That makes false
positives explainable, which is the point of a first prototype. ML is in
the future scope.

**What false positive did you actually hit?**
During testing the server's own SYN-ACK replies — which go back to random
high client ports — looked like a scan from the server. Fixed by counting
only bare SYN packets. Same class of bug on the flood rule: `PSH-ACK`
data packets were being counted as completed handshakes and hid the
flood, so only a bare `ACK` counts now.

**How do you avoid alert spam?**
A 20-second cooldown per (rule, severity, source, target) key. Severity is
part of the key, so a scan that widens from 15 to 30 ports still re-alerts.

**What would evade it?**
A slow scan spread over hours beats the 10-second window. A distributed
SYN flood from many sources beats the per-target counter if each source
stays quiet. Encrypted payloads are invisible to us — we only read headers.

**Why a separate config file?**
Tuning thresholds should never mean editing capture code. It also means
the exact thresholds used for the results are recorded in one place.
