<!doctype html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>{{ config('app.name', 'Video Master API') }}</title>

    <style>
        :root {
            --bg: #0f172a;
            --card: #111827;
            --text: #e5e7eb;
            --muted: #9ca3af;
            --accent: #22d3ee;
            --border: #1f2937;
        }

        * { box-sizing: border-box; }

        html, body {
            height: 100%;
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            background: radial-gradient(circle at top, #1e293b 0%, var(--bg) 45%);
            color: var(--text);
        }

        .page {
            min-height: 100%;
            display: grid;
            place-items: center;
            padding: 24px;
        }

        .card {
            width: min(760px, 100%);
            border: 1px solid var(--border);
            background: rgba(17, 24, 39, 0.92);
            border-radius: 16px;
            padding: 28px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
        }

        h1 {
            margin: 0 0 10px;
            font-size: 28px;
        }

        p {
            margin: 0 0 14px;
            color: var(--muted);
            line-height: 1.55;
        }

        code {
            color: var(--accent);
            font-family: Consolas, Monaco, monospace;
        }

        .grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
            margin-top: 16px;
        }

        .item {
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 10px 12px;
            background: #0b1220;
        }
    </style>
</head>
<body>
<main class="page">
    <section class="card">
        <h1>Video Master Backend is running</h1>
        <p>
            This server is the API/backend service. The old upload debug form shown on this route has been removed.
        </p>
        <p>
            Use your frontend app for UI, and call backend endpoints under <code>/api/v1</code>.
        </p>

        <div class="grid">
            <div class="item"><strong>API base:</strong> <code>{{ url('/api/v1') }}</code></div>
            <div class="item"><strong>Auth login:</strong> <code>{{ url('/api/v1/auth/login') }}</code></div>
            <div class="item"><strong>Videos:</strong> <code>{{ url('/api/v1/video') }}</code></div>
        </div>
    </section>
</main>
</body>
</html>
