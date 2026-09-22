"""
SentinelX - Detection Engine + Threat Detector
(boxes 4 and 5 of the architecture diagram)

Two rules, both sliding-window counters over the last WINDOW_SECONDS.

  Rule 1 - Port scan
      one source IP touches >= PORT_SCAN_UNIQUE_PORTS different
      destination ports on one target inside the window.

  Rule 2 - SYN flood
      a target receives >= SYN_FLOOD_MIN_SYNS TCP SYN packets in the window
      while the completed-handshake ratio stays under SYN_FLOOD_MAX_RATIO.

Everything is counted, nothing is guessed, so any alert can be justified
by pointing at the numbers carried in the alert itself.
"""

from collections import defaultdict, deque

import config


def _trim(window, now, span):
    """Drop entries older than `span` seconds from the left of the deque."""
    while window and now - window[0][0] > span:
        window.popleft()


class DetectionEngine:
    def __init__(self):
        # (src, dst) -> deque of (timestamp, destination_port)
        self.scan_window = defaultdict(deque)
        # dst -> deque of (timestamp, "syn" | "established")
        self.syn_window = defaultdict(deque)
        # alert key -> last time we raised it (cooldown, stops alert spam)
        self.last_alert = {}

    # ------------------------------------------------------------------
    def inspect(self, event):
        """Run every rule against one event. Returns a list of alerts."""
        alerts = []
        if event["protocol"] == "TCP":
            scan = self.check_port_scan(event)
            if scan:
                alerts.append(scan)
            flood = self.check_syn_flood(event)
            if flood:
                alerts.append(flood)
        return alerts

    # ------------------------------------------------------------------
    def check_port_scan(self, event):
        # Count connection ATTEMPTS only. Without this filter a busy server's
        # own SYN-ACK replies (which go back to random high client ports) look
        # exactly like a scan - a false positive we hit during testing.
        if "S" not in event["flags"] or "A" in event["flags"]:
            return None

        now = event["ts"]
        key = (event["src"], event["dst"])
        window = self.scan_window[key]
        window.append((now, event["dport"]))
        _trim(window, now, config.WINDOW_SECONDS)

        ports = {port for _, port in window}
        if len(ports) < config.PORT_SCAN_UNIQUE_PORTS:
            return None
        severity = ("HIGH" if len(ports) >= 2 * config.PORT_SCAN_UNIQUE_PORTS
                    else "MEDIUM")
        # severity is part of the key, so a scan that grows worse can re-alert
        if not self._cooldown_passed(("scan", severity) + key, now):
            return None

        sample = sorted(ports)[:6]
        return {
            "ts": now,
            "type": "PORT SCAN",
            "severity": severity,
            "src": event["src"],
            "dst": event["dst"],
            "detail": f"{len(ports)} unique ports in {config.WINDOW_SECONDS}s",
            "ports": sample,
        }

    # ------------------------------------------------------------------
    def check_syn_flood(self, event):
        now = event["ts"]
        flags = event["flags"]

        # "S" alone = connection attempt.
        # A bare "A" = third leg of the handshake, i.e. a completed connection.
        # "PA" is data on an already-open connection, so it must NOT be counted
        # as a completion or a busy server hides a real flood.
        if flags == "S":
            kind = "syn"
        elif flags == "A":
            kind = "established"
        else:
            return None                  # SYN-ACK, PSH, FIN, RST: ignored here

        # Both the opening SYN and the final ACK of a handshake travel
        # client -> server, so the target is always the destination.
        target = event["dst"]
        window = self.syn_window[target]
        window.append((now, kind))
        _trim(window, now, config.WINDOW_SECONDS)

        syns = sum(1 for _, k in window if k == "syn")
        done = sum(1 for _, k in window if k == "established")
        if syns < config.SYN_FLOOD_MIN_SYNS:
            return None

        ratio = done / syns
        if ratio >= config.SYN_FLOOD_MAX_RATIO:
            return None                  # busy but healthy server
        if not self._cooldown_passed(("syn", target), now):
            return None

        return {
            "ts": now,
            "type": "SYN FLOOD",
            "severity": "HIGH",
            "src": event["src"],
            "dst": target,
            "detail": f"{syns} SYNs, {done} completed "
                      f"(ratio {ratio:.2f}) in {config.WINDOW_SECONDS}s",
            "ports": [event["dport"]] if event["dport"] else [],
        }

    # ------------------------------------------------------------------
    def _cooldown_passed(self, key, now):
        last = self.last_alert.get(key, 0)
        if now - last < config.ALERT_COOLDOWN_SECONDS:
            return False
        self.last_alert[key] = now
        return True
