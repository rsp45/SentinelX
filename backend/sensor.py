"""
SentinelX - Packet Capture + Protocol Analyzer
(boxes 2 and 3 of the architecture diagram)

Job: take a raw packet off the wire and turn it into one flat dictionary
that the rest of the system understands. Nothing else in the project ever
touches scapy.

Normalized event:
    {
      "ts": 1726830872.41,      # unix time
      "protocol": "TCP",        # TCP | UDP | ICMP
      "src": "192.168.1.105",
      "dst": "192.168.1.20",
      "sport": 51234,           # None for ICMP
      "dport": 443,             # None for ICMP
      "flags": "S",             # TCP flags only, e.g. "S", "SA", "PA"
      "length": 74              # bytes
    }
"""

import time

try:
    from scapy.all import sniff, rdpcap, IP, TCP, UDP, ICMP
    SCAPY_AVAILABLE = True
except ImportError:          # simulation mode still works without scapy
    SCAPY_AVAILABLE = False


def parse_packet(pkt):
    """Scapy packet -> normalized event dict, or None if we ignore it."""
    if IP not in pkt:
        return None                      # skip ARP, IPv6, etc. for v1

    ip = pkt[IP]
    event = {
        "ts": float(pkt.time) if hasattr(pkt, "time") else time.time(),
        "protocol": None,
        "src": ip.src,
        "dst": ip.dst,
        "sport": None,
        "dport": None,
        "flags": "",
        "length": len(pkt),
    }

    if TCP in pkt:
        event["protocol"] = "TCP"
        event["sport"] = int(pkt[TCP].sport)
        event["dport"] = int(pkt[TCP].dport)
        event["flags"] = str(pkt[TCP].flags)
    elif UDP in pkt:
        event["protocol"] = "UDP"
        event["sport"] = int(pkt[UDP].sport)
        event["dport"] = int(pkt[UDP].dport)
    elif ICMP in pkt:
        event["protocol"] = "ICMP"
    else:
        return None                      # other IP protocols are out of scope

    return event


def capture_live(handler, iface=None, bpf_filter="ip"):
    """
    Sniff an authorized interface and hand every parsed event to `handler`.
    Blocks forever. Needs root/admin (raw sockets).
    """
    if not SCAPY_AVAILABLE:
        raise RuntimeError("scapy is not installed - run: pip install scapy")

    def _on_packet(pkt):
        event = parse_packet(pkt)
        if event:
            handler(event)

    sniff(iface=iface, filter=bpf_filter, prn=_on_packet, store=False)


def replay_pcap(path, handler, speed=1.0):
    """
    Feed a previously captured .pcap file through the same pipeline.
    Useful for a repeatable demo: record the lab test once, replay it
    as many times as you like.
    """
    if not SCAPY_AVAILABLE:
        raise RuntimeError("scapy is not installed - run: pip install scapy")

    packets = rdpcap(path)
    previous = None
    for pkt in packets:
        event = parse_packet(pkt)
        if not event:
            continue
        if previous is not None and speed > 0:
            time.sleep(min((event["ts"] - previous) / speed, 1.0))
        previous = event["ts"]
        event["ts"] = time.time()        # re-stamp so the rules see "now"
        handler(event)
