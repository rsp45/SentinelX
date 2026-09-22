# SentinelX Frontend

React/TanStack live monitor for the SentinelX intrusion detection backend.

## Development

Run the backend from the repository root, then start this UI in a second terminal.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

```sh
python backend/run.py --simulate
cd frontend
bun install
bun run dev -- --host 127.0.0.1 --port 3000
```

## SentinelX integration

The live monitor polls the Python SentinelX backend at `/api/state`.

Open `http://127.0.0.1:3000/monitor`. The Vite proxy forwards `/api/state`
to `http://127.0.0.1:5000`, so packets, counters, protocol totals, and alerts
come from the running sensor instead of the demo data.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
