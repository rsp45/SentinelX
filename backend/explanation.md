Here's the explanation in viva-ready language.

**The problem**

A network carries hundreds of legitimate connections at once — web traffic, DNS lookups, pings, database queries — all as packets that look, at a glance, the same. Two attack patterns hide inside that noise particularly well:

- **Port scanning**: an attacker probing many ports on a target to find an open, exploitable service, before actually attacking.
- **SYN flooding**: an attacker sending a flood of connection requests (SYN packets) without ever finishing the handshake, trying to exhaust the server's resources.

A human can't watch raw packets in real time and notice these patterns. You need something automated that watches continuously and flags only what matters.

**The solution**

SentinelX is a pipeline with five stages, each one a separate Python file, matching Figure 1 in your report:

1. **Packet Capture** (`sensor.py`) — reads packets off the wire (or replays a recording), keeps only TCP/UDP/ICMP.
2. **Protocol Analyzer** (also `sensor.py`) — turns each raw packet into one clean record: source, destination, ports, TCP flags, timestamp.
3. **Detection Engine** (`rules.py`) — checks each record against two signature rules using a 10-second sliding window:
   - *Port scan*: one source hitting 15+ different ports on a target → alert (30+ → HIGH).
   - *SYN flood*: 60+ SYNs to one target with under 20% completing the handshake → alert.
4. **Event Logger** (`store.py`) — keeps running counters and writes everything to disk (`events.jsonl` for every packet, `alerts.log` for every alert) — this is your evidence for the report.
5. **Dashboard** (`app.py` + the HTML page) — a live webpage that polls the logger once a second and displays the current state.

Nothing here uses machine learning — it's plain counting against thresholds, which is exactly why every alert can be explained ("that's a HIGH because 30 unique ports crossed the 30-port line"), and that explainability is the whole point of a first prototype.

**What your screenshot shows**

That's the dashboard live during the simulated demo, 104 seconds in:

- **Top strip**: 2,929 packets processed, 17.6 packets/sec currently, 572 active flows (open conversations), 3 threats detected, 2 of them HIGH severity.
- **Protocol distribution**: mostly TCP (2,682), some UDP for DNS (164), a little ICMP/ping (83) — normal-looking mix.
- **Recent packets**: the raw feed — you can see ordinary three-way handshakes (`S` → `SA` → `A`) followed by data (`PA`), which is exactly what healthy traffic looks like.
- **Security alerts panel**, top to bottom (most recent first):
  - A **MEDIUM port scan** at 16:51:19 — host `.105` touched 15 ports on `.20`.
  - That scan widened, so 1 second later it re-alerted as **HIGH** at 30 ports — showing the system escalates severity as an attack gets worse rather than just alerting once and going quiet.
  - A **HIGH SYN flood** at 16:51:40 — host `.77` sent 201 SYNs to `.20` with only 40 completing (a 0.20 ratio), well past the flood threshold.

So in one screenshot you've got proof of all three things a viva examiner wants to see: normal traffic passing through untouched, a reconnaissance attack caught and correctly escalated, and a resource-exhaustion attack caught — all timestamped and explainable from the numbers in each alert.