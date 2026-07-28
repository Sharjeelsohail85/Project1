from ftplib import FTP
from io import BytesIO
from pathlib import Path

from dotenv import dotenv_values


ROOT = Path("e:/Project1")


def main() -> None:
    cfg = dotenv_values(ROOT / ".env.infinityfree")
    host = cfg.get("IF_FTP_HOST", "ftpupload.net")
    user = cfg.get("IF_FTP_USER", "")
    password = cfg.get("IF_FTP_PASS", "")
    remote = (cfg.get("IF_REMOTE_DIR", "/htdocs") or "/htdocs").rstrip("/") or "/htdocs"

    lines: list[str] = []

    ftp = FTP(host, timeout=60)
    ftp.login(user, password)
    ftp.cwd(remote)

    try:
        names = ftp.nlst()
    except Exception as exc:
        names = []
        lines.append(f"NLST_ERROR={exc!r}")

    lines.append(f"REMOTE={remote}")
    lines.append(f"TOP_COUNT={len(names)}")
    lines.append("TOP_SAMPLE=" + ",".join(names[:100]))

    file_checks = [
        ".htaccess",
        ".env",
        "artisan",
        "composer.json",
        "bootstrap/app.php",
        "routes/api.php",
        "public/index.php",
        "public/.htaccess",
        "vendor/autoload.php",
    ]

    cwd_file_checks = [
        ("routes", "api.php"),
        ("public", "index.php"),
        ("public", ".htaccess"),
        ("vendor", "autoload.php"),
    ]

    dir_checks = [
        "app",
        "bootstrap",
        "config",
        "database",
        "public",
        "resources",
        "routes",
        "storage",
        "storage/framework",
        "storage/framework/cache",
        "storage/framework/cache/data",
        "storage/framework/sessions",
        "storage/framework/views",
        "storage/logs",
        "vendor",
    ]

    for rel in file_checks:
        try:
            b = BytesIO()
            ftp.retrbinary(f"RETR {rel}", b.write)
            lines.append(f"FILE_OK={rel} LEN={len(b.getvalue())}")
        except Exception as exc:
            lines.append(f"FILE_MISSING={rel} ERR={exc!r}")

    for d, f in cwd_file_checks:
        try:
            ftp.cwd(f"{remote}/{d}")
            b = BytesIO()
            ftp.retrbinary(f"RETR {f}", b.write)
            lines.append(f"FILE_OK_CWD={d}/{f} LEN={len(b.getvalue())}")
        except Exception as exc:
            lines.append(f"FILE_MISSING_CWD={d}/{f} ERR={exc!r}")
        finally:
            ftp.cwd(remote)

    for rel in dir_checks:
        try:
            ftp.cwd(f"{remote}/{rel}")
            ftp.cwd(remote)
            lines.append(f"DIR_OK={rel}")
        except Exception as exc:
            lines.append(f"DIR_MISSING={rel} ERR={exc!r}")

    for rel in ["public", "routes", "vendor", "storage/framework", "storage/logs"]:
        try:
            ftp.cwd(f"{remote}/{rel}")
            entries = ftp.nlst()
            lines.append(f"LIST_{rel}=" + ",".join(entries[:80]))
        except Exception as exc:
            lines.append(f"LIST_ERR_{rel}={exc!r}")
        finally:
            ftp.cwd(remote)

    try:
        ftp.delete("index2.html")
        lines.append("DELETE_INDEX2=deleted")
    except Exception:
        lines.append("DELETE_INDEX2=already_absent")

    ftp.quit()

    (ROOT / ".tmp-if-remote-state.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

