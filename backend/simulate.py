"""
SentinelX - Test Harness (offline)

This does NOT send anything onto a network. It fabricates the same
dictionaries that sensor.parse_packet() would produce and feeds them
straight into the pipeline, so the detection rules can be demonstrated
on any laptop, without root, without touching another machine.

That makes the demo repeatable and keeps the project inside the ethical
boundary stated in Section 14 of the report. If you also want evidence
from real traffic, capture your own lab traffic with --iface or replay a
.pcap you recorded yourself.

Timeline (about 45 seconds):
    0-12s   normal mixed traffic only            -> no alerts
   12-20s   normal + one host sweeping ports     -> PORT SCAN
   20-32s   normal traffic only                  -> quiet again
   32-42s   normal + SYN burst with no handshakes-> SYN FLOOD
"""

import random
import time

NORMAL_HOSTS = ["192.168.1.10", "192.168.1.11", "192.168.1.12", "192.168.1.30"]
SERVER = "192.168.1.20"
SCANNER = "192.168.1.105"
FLOODER = "192.168.1.77"


def _event(protocol, src, dst, sport=None, dport=None, flags="", length=74):
    return {"ts": time.time(), "protocol": protocol, "src": src, "dst": dst,
            "sport": sport, "dport": dport, "flags": flags, "length": length}


def normal_traffic():
    """A few packets of ordinary-looking activity."""
    out = []
    host = random.choice(NORMAL_HOSTS)
    port = random.choice([80, 443, 22, 3306])
    sport = random.randint(40000, 60000)
    # a complete TCP handshake plus data
    out.append(_event("TCP", host, SERVER, sport, port, "S"))
    out.append(_event("TCP", SERVER, host, port, sport, "SA"))
    out.append(_event("TCP", host, SERVER, sport, port, "A"))
    out.append(_event("TCP", host, SERVER, sport, port, "PA", 520))
    if random.random() < 0.4:
        out.append(_event("UDP", host, "192.168.1.1", sport, 53, "", 96))
    if random.random() < 0.2:
        out.append(_event("ICMP", host, SERVER, length=98))
    return out


_scan_port = 20


def port_scan_step(ports_per_tick=3):
    """One host walking up through destination ports, the classic sweep."""
    global _scan_port
    batch = []
    for _ in range(ports_per_tick):
        _scan_port += 1
        batch.append(_event("TCP", SCANNER, SERVER,
                            random.randint(40000, 60000), _scan_port, "S", 60))
    return batch


def syn_burst_step(count=25):
    """Many SYNs to one port, none of them ever completing."""
    return [_event("TCP", FLOODER, SERVER, random.randint(1024, 65535), 80, "S", 60)
            for _ in range(count)]


def run(handler, speed=1.0):
    """Drive the whole timeline, calling handler(event) for each packet."""
    tick = 0.25 / max(speed, 0.01)
    start = time.time()
    print("[sim] generating synthetic traffic (no packets leave this machine)")

    while True:
        elapsed = (time.time() - start) * speed
        batch = normal_traffic()

        if 12 <= elapsed < 20:
            batch += port_scan_step()
        elif 32 <= elapsed < 42:
            batch += syn_burst_step()
        elif elapsed >= 45:
            print("[sim] timeline finished - dashboard stays up, Ctrl+C to stop")
            while True:
                for event in normal_traffic():
                    handler(event)
                time.sleep(tick)

        for event in batch:
            handler(event)
        time.sleep(tick)
