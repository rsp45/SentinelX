"""
SentinelX - Event Logger
(box 6 of the architecture diagram)

Holds the live counters the dashboard reads, and writes two files:

  logs/events.jsonl  one JSON object per parsed packet (machine readable)
  logs/alerts.log    one line per alert in the report's Section 10.2 format

A lock guards the state because the capture thread writes while the web
server reads.
"""

import json
import os
import threading
import time
from collections import defaultdict, deque

import config


class EventStore:
    def __init__(self, event_log=config.EVENT_LOG, alert_log=config.ALERT_LOG):
        self.lock = threading.Lock()
        self.started = time.time()

        self.total_packets = 0
        self.protocol_counts = defaultdict(int)     # TCP / UDP / ICMP
        self.recent_packets = deque(maxlen=config.RECENT_PACKETS)
        self.recent_alerts = deque(maxlen=config.RECENT_ALERTS)
        self.alert_total = 0
        self.high_severity_total = 0

        self.packet_times = deque()                 # for packets/sec
        self.flows = {}                             # flow key -> last seen

        self.event_log = event_log
        self.alert_log = alert_log
        for path in (event_log, alert_log):
            os.makedirs(os.path.dirname(path) or ".", exist_ok=True)

    # ------------------------------------------------------------------
    def add_packet(self, event):
        with self.lock:
            self.total_packets += 1
            self.protocol_counts[event["protocol"]] += 1
            self.recent_packets.appendleft(event)

            now = event["ts"]
            self.packet_times.append(now)
            while self.packet_times and now - self.packet_times[0] > config.PPS_WINDOW_SECONDS:
                self.packet_times.popleft()

            flow = (event["src"], event["dst"], event["sport"], event["dport"])
            self.flows[flow] = now

        with open(self.event_log, "a") as handle:
            handle.write(json.dumps(event) + "\n")

    # ------------------------------------------------------------------
    def add_alert(self, alert):
        with self.lock:
            self.alert_total += 1
            if alert["severity"] == "HIGH":
                self.high_severity_total += 1
            self.recent_alerts.appendleft(alert)

        with open(self.alert_log, "a") as handle:
            handle.write(format_alert(alert) + "\n")
        print(format_alert(alert), flush=True)

    # ------------------------------------------------------------------
    def snapshot(self):
        """Everything the dashboard needs, in one JSON-safe dict."""
        now = time.time()
        with self.lock:
            self.flows = {flow: seen for flow, seen in self.flows.items()
                          if now - seen < config.FLOW_TIMEOUT_SECONDS}
            active = len(self.flows)
            return {
                "uptime": round(now - self.started),
                "total_packets": self.total_packets,
                "packets_per_second": round(
                    len(self.packet_times) / config.PPS_WINDOW_SECONDS, 1),
                "active_flows": active,
                "threats": self.alert_total,
                "high_severity": self.high_severity_total,
                "protocols": {
                    "TCP": self.protocol_counts["TCP"],
                    "UDP": self.protocol_counts["UDP"],
                    "ICMP": self.protocol_counts["ICMP"],
                },
                "recent_packets": [
                    {
                        "time": time.strftime("%H:%M:%S", time.localtime(p["ts"])),
                        "protocol": p["protocol"],
                        "src": p["src"],
                        "dst": p["dst"],
                        "dport": p["dport"],
                        "flags": p["flags"],
                    }
                    for p in self.recent_packets
                ],
                "alerts": [
                    {
                        "time": time.strftime("%H:%M:%S", time.localtime(a["ts"])),
                        "type": a["type"],
                        "severity": a["severity"],
                        "src": a["src"],
                        "dst": a["dst"],
                        "detail": a["detail"],
                    }
                    for a in self.recent_alerts
                ],
            }


def format_alert(alert):
    """Section 10.2 alert format."""
    ports = ", ".join(str(p) for p in alert.get("ports", [])) or "-"
    return (f"ALERT | {alert['type']} | Source: {alert['src']} | "
            f"Target: {alert['dst']} | Ports: {ports} | "
            f"Severity: {alert['severity']} | {alert['detail']}")
