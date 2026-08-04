import secrets
from ftplib import FTP
from pathlib import Path

import requests
from dotenv import dotenv_values


ROOT = Path("e:/Project1")


def build_php_runner(secret_key: str) -> str:
    return f'''<?php
header('Content-Type: text/plain; charset=utf-8');

$expected = '{secret_key}';
$provided = isset($_GET['key']) ? (string)$_GET['key'] : '';
if (!hash_equals($expected, $provided)) {{
    http_response_code(403);
    echo "Forbidden\n";
    exit;
}}

try {{
    require __DIR__ . '/bootstrap/autoload.php';
    $app = require_once __DIR__ . '/bootstrap/app.php';
    $kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);

    echo "== migrate --force ==\n";
    $exit1 = $kernel->call('migrate', ['--force' => true]);
    echo $kernel->output() . "\n";
    echo "exit=" . $exit1 . "\n\n";

    echo "== migrate:status ==\n";
    $exit2 = $kernel->call('migrate:status');
    echo $kernel->output() . "\n";
    echo "exit=" . $exit2 . "\n";
}} catch (\Throwable $e) {{
    http_response_code(500);
    echo "EXCEPTION: " . get_class($e) . "\n";
    echo $e->getMessage() . "\n";
    echo $e->getFile() . ':' . $e->getLine() . "\n";
}}
'''


def main() -> None:
    cfg = dotenv_values(ROOT / ".env.infinityfree")

    ftp_host = cfg.get("IF_FTP_HOST", "ftpupload.net")
    ftp_user = str(cfg.get("IF_FTP_USER", ""))
    ftp_pass = str(cfg.get("IF_FTP_PASS", ""))
    remote_root = (str(cfg.get("IF_REMOTE_DIR", "/htdocs")) or "/htdocs").rstrip("/") or "/htdocs"

    if not ftp_user or not ftp_pass:
        raise RuntimeError("Missing IF_FTP_USER/IF_FTP_PASS in .env.infinityfree")

    runner_name = "migrate_once.php"
    runner_path = f"{remote_root}/{runner_name}"
    key = secrets.token_hex(16)
    runner_php = build_php_runner(key)

    lines: list[str] = []
    lines.append(f"ftp_host={ftp_host}")
    lines.append(f"remote_root={remote_root}")
    lines.append(f"runner_path={runner_path}")

    ftp = FTP(ftp_host, timeout=60)
    ftp.login(ftp_user, ftp_pass)

    from io import BytesIO

    ftp.cwd(remote_root)
    ftp.storbinary(f"STOR {runner_name}", BytesIO(runner_php.encode("utf-8")))
    lines.append("uploaded_runner=yes")

    runner_url = f"https://octopussol.com/{runner_name}?key={key}"
    lines.append(f"runner_url={runner_url}")

    candidate_urls = [
        runner_url,
        f"https://if0_41301332.infinityfreeapp.com/{runner_name}?key={key}",
        f"http://if0_41301332.infinityfreeapp.com/{runner_name}?key={key}",
        f"https://if0_41301332.epizy.com/{runner_name}?key={key}",
        f"http://if0_41301332.epizy.com/{runner_name}?key={key}",
    ]

    for url in candidate_urls:
        lines.append(f"probe_url={url}")
        try:
            response = requests.get(url, timeout=180, allow_redirects=True)
            lines.append(f"http_status={response.status_code}")
            lines.append(f"final_url={response.url}")
            lines.append("response_body_begin")
            lines.append(response.text)
            lines.append("response_body_end")
            lines.append("---")
        except Exception as exc:
            lines.append(f"http_error={exc!r}")
            lines.append("---")

    try:
        ftp.delete(runner_name)
        lines.append("deleted_runner=yes")
    except Exception as exc:
        lines.append(f"deleted_runner_error={exc!r}")

    ftp.quit()

    (ROOT / ".tmp-if-migrate-once.log").write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    main()

