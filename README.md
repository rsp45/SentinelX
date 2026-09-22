# SentinelX

Real-time network intrusion detection and threat visualization.

## Project layout

- `backend/` - Python packet sensor, detection rules, event store, and Flask API.
- `frontend/` - React/TanStack live monitoring interface.
## Run locally

Start the backend from the repository root:

```powershell
python backend/run.py --simulate
```

Start the frontend in a second terminal:

```powershell
cd frontend
bun install
bun run dev -- --host 127.0.0.1 --port 3000
```

Open [http://127.0.0.1:3000/monitor](http://127.0.0.1:3000/monitor).
The frontend proxies `/api/state` to the Flask backend at port `5000`.

For authorized live capture or recorded traffic replay, see
[backend/README.md](backend/README.md).
