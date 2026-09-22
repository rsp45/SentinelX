"""
SentinelX - entry point

Wires the five modules into the pipeline from Figure 1:

    source -> sensor.parse -> rules.inspect -> store -> dashboard

Usage
    python run.py --simulate              demo with synthetic traffic
    python run.py --pcap capture.pcap     replay traffic you recorded
    sudo python run.py --iface eth0       live capture (authorized hosts only)
"""

import argparse
import threading

import app as dashboard_app
import rules
import simulate
import store as store_module


def build_pipeline(store, engine):
    """One function every packet passes through. This IS the pipeline."""
    def handle(event):
        store.add_packet(event)                 # log + counters
        for alert in engine.inspect(event):     # rule evaluation
            store.add_alert(alert)              # alert + dashboard
    return handle


def main():
    parser = argparse.ArgumentParser(description="SentinelX network IDS")
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--simulate", action="store_true",
                        help="synthetic traffic, no network access needed")
    source.add_argument("--pcap", help="replay a .pcap file you captured")
    source.add_argument("--iface", help="live capture on an authorized interface")
    parser.add_argument("--speed", type=float, default=1.0, help="replay speed")
    parser.add_argument("--port", type=int, default=5000, help="dashboard port")
    args = parser.parse_args()

    store = store_module.EventStore()
    engine = rules.DetectionEngine()
    handle = build_pipeline(store, engine)

    if args.simulate:
        target, kwargs = simulate.run, {"handler": handle, "speed": args.speed}
    elif args.pcap:
        import sensor
        target = sensor.replay_pcap
        kwargs = {"path": args.pcap, "handler": handle, "speed": args.speed}
    else:
        import sensor
        target = sensor.capture_live
        kwargs = {"handler": handle, "iface": args.iface}

    threading.Thread(target=target, kwargs=kwargs, daemon=True).start()

    print(f"[sentinelx] dashboard: http://127.0.0.1:{args.port}")
    dashboard_app.create_app(store).run(host="127.0.0.1", port=args.port,
                                        debug=False, use_reloader=False)


if __name__ == "__main__":
    main()
