import ftplib
import os
import shutil
from pathlib import Path
from typing import Iterable

from dotenv import dotenv_values


ROOT = Path("e:/Project1")
BACKEND_DIR = ROOT / "Video-master"
STAGE_DIR = ROOT / ".ifb"


def require_env(cfg: dict, key: str) -> str:
    value = cfg.get(key)
    if not value:
        raise RuntimeError(f"Missing required env key: {key}")
    return value


def clean_stage() -> None:
    if STAGE_DIR.exists():
        shutil.rmtree(STAGE_DIR, ignore_errors=True)
    STAGE_DIR.mkdir(parents=True, exist_ok=True)


def copy_tree(src: Path, dst: Path, skip_dirs: Iterable[str], skip_files: Iterable[str]) -> None:
    skip_dirs_set = set(skip_dirs)
    skip_files_set = set(skip_files)

    for root, dirs, files in os.walk(src):
        root_path = Path(root)
        rel = root_path.relative_to(src)

        dirs[:] = [d for d in dirs if d not in skip_dirs_set]

        target_dir = dst / rel
        target_dir.mkdir(parents=True, exist_ok=True)

        for f in files:
            if f in skip_files_set:
                continue
            sp = root_path / f
            dp = target_dir / f
            try:
                dp.parent.mkdir(parents=True, exist_ok=True)
                dp.write_bytes(sp.read_bytes())
            except OSError as exc:
                # On Windows, a few deeply nested vendor files can exceed path limits.
                # Skip only those edge cases to keep deployment moving.
                print("skipped", sp, "->", exc)


def build_stage_env(cfg: dict) -> str:
    lines = [
        "APP_NAME=Laravel",
        "APP_ENV=production",
        f"APP_KEY={require_env(cfg, 'IF_APP_KEY')}",
        "APP_DEBUG=false",
        "APP_URL=https://octopussol.com",
        "LOG_CHANNEL=stack",
        "DB_CONNECTION=mysql",
        f"DB_HOST={require_env(cfg, 'IF_DB_HOST')}",
        f"DB_PORT={cfg.get('IF_DB_PORT', '3306')}",
        f"DB_DATABASE={require_env(cfg, 'IF_DB_DATABASE')}",
        f"DB_USERNAME={require_env(cfg, 'IF_DB_USERNAME')}",
        f"DB_PASSWORD={require_env(cfg, 'IF_DB_PASSWORD')}",
        "DB_SOCKET=",
        "CACHE_DRIVER=file",
        "SESSION_DRIVER=file",
        "QUEUE_DRIVER=sync",
        "FRONTEND_URL=https://octopussol.com",
        "SANCTUM_STATEFUL_DOMAINS=octopussol.com,www.octopussol.com",
        "CORS_ALLOWED_ORIGINS=https://octopussol.com,https://www.octopussol.com",
        "CORS_ALLOWED_METHODS=GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "CORS_ALLOWED_HEADERS=Content-Type, Authorization, X-Requested-With, token, client_id, Accept",
        "CORS_MAX_AGE=3600",
        "DROPBOX_CLIENT_ID=hczocrkw8l7dl21",
        "DROPBOX_CLIENT_SECRET=46visk1tvrmnxgl",
        "DROPBOX_REDIRECT_URI=https://octopussol.com/api/v1/oauth/dropbox/callback",
    ]
    return "\n".join(lines) + "\n"


def ensure_remote_dirs(ftp: ftplib.FTP, base_remote: str) -> None:
    needed = [
        base_remote,
        f"{base_remote}/app",
        f"{base_remote}/bootstrap",
        f"{base_remote}/config",
        f"{base_remote}/database",
        f"{base_remote}/public",
        f"{base_remote}/resources",
        f"{base_remote}/routes",
        f"{base_remote}/storage",
        f"{base_remote}/storage/framework",
        f"{base_remote}/storage/framework/cache",
        f"{base_remote}/storage/framework/cache/data",
        f"{base_remote}/storage/framework/sessions",
        f"{base_remote}/storage/framework/views",
        f"{base_remote}/storage/logs",
        f"{base_remote}/vendor",
    ]

    for d in needed:
        try:
            ftp.mkd(d)
        except Exception:
            pass


def ensure_remote_path(ftp: ftplib.FTP, remote_dir: str) -> None:
    parts = [p for p in remote_dir.strip("/").split("/") if p]
    current = ""
    for part in parts:
        current = f"{current}/{part}"
        try:
            ftp.mkd(current)
        except Exception:
            pass


def upload_tree(ftp: ftplib.FTP, local_root: Path, remote_root: str) -> None:
    for root, dirs, files in os.walk(local_root):
        rel = Path(root).relative_to(local_root)
        remote_dir = (Path(remote_root) / rel).as_posix()

        ensure_remote_path(ftp, remote_dir)
        ftp.cwd(remote_dir)

        for f in files:
            lp = Path(root) / f
            with lp.open("rb") as fh:
                ftp.storbinary(f"STOR {f}", fh)
            print("uploaded", f"{remote_dir}/{f}")

        ftp.cwd(remote_root)


def remove_remote_file_if_exists(ftp: ftplib.FTP, path: str) -> None:
    try:
        ftp.delete(path)
        print("deleted", path)
    except Exception:
        pass


def main() -> None:
    cfg = dotenv_values(ROOT / ".env.infinityfree")

    ftp_host = cfg.get("IF_FTP_HOST", "ftpupload.net")
    ftp_user = require_env(cfg, "IF_FTP_USER")
    ftp_pass = require_env(cfg, "IF_FTP_PASS")
    remote_dir = cfg.get("IF_REMOTE_DIR", "/htdocs").rstrip("/") or "/htdocs"

    clean_stage()

    copy_tree(
        BACKEND_DIR,
        STAGE_DIR,
        skip_dirs=[
            ".git",
            "node_modules",
            "storage",
            "tests",
            "frontend/node_modules",
            "frontend/build",
        ],
        skip_files=[
            ".env",
            ".phpunit.result.cache",
            "database.sqlite",
            "Dockerfile",
            "railway.json",
        ],
    )

    (STAGE_DIR / ".env").write_text(build_stage_env(cfg), encoding="utf-8")

    # InfinityFree /htdocs document-root -> Laravel public/
    root_htaccess = """RewriteEngine On

RewriteCond %{REQUEST_URI} !^/public/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ public/$1 [L]

RewriteRule ^$ public/index.php [L]
"""
    (STAGE_DIR / ".htaccess").write_text(root_htaccess, encoding="utf-8")

    # shared-hosting safe directories
    for p in [
        STAGE_DIR / "storage/framework/cache/data",
        STAGE_DIR / "storage/framework/sessions",
        STAGE_DIR / "storage/framework/views",
        STAGE_DIR / "storage/logs",
        STAGE_DIR / "bootstrap/cache",
    ]:
        p.mkdir(parents=True, exist_ok=True)

    print("Connecting FTP:", ftp_host)
    ftp = ftplib.FTP(ftp_host, timeout=60)
    ftp.login(ftp_user, ftp_pass)

    ensure_remote_dirs(ftp, remote_dir)

    # Remove default placeholder page if exists
    remove_remote_file_if_exists(ftp, f"{remote_dir}/index2.html")

    upload_tree(ftp, STAGE_DIR, remote_dir)

    ftp.quit()
    print("Deploy upload complete.")


if __name__ == "__main__":
    main()
