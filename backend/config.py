"""
SentinelX - configuration

Every threshold lives here so the detection rules can be tuned without
touching capture or dashboard code (Section 9.1 of the report).
"""

# ---- Detection window ----
WINDOW_SECONDS = 10          # how far back each rule looks

# ---- Rule 1: port scan ----
PORT_SCAN_UNIQUE_PORTS = 15  # unique destination ports from one source = scan

# ---- Rule 2: SYN flood ----
SYN_FLOOD_MIN_SYNS = 60      # minimum SYNs toward one target in the window
SYN_FLOOD_MAX_RATIO = 0.2    # completed/SYN ratio below this = suspicious

# ---- Alert behaviour ----
ALERT_COOLDOWN_SECONDS = 20  # don't repeat the same alert more often than this

# ---- Storage / display ----
RECENT_PACKETS = 40          # rows kept in "Recent activity"
RECENT_ALERTS = 20           # alerts kept on screen
FLOW_TIMEOUT_SECONDS = 60    # a flow counts as "active" for this long
PPS_WINDOW_SECONDS = 5       # packets/sec is averaged over this window

EVENT_LOG = "logs/events.jsonl"   # every parsed packet
ALERT_LOG = "logs/alerts.log"     # human-readable alerts
