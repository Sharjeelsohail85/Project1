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
    remote_root = (cfg.get("IF_REMOTE_DIR", "/htdocs") or "/htdocs").rstrip("/") or "/htdocs"

    local_routes = ROOT / "Video-master" / "routes"
    route_files = sorted(local_routes.glob("*.php"))

    lines: list[str] = []
    lines.append(f"REMOTE_ROOT={remote_root}")
    lines.append(f"LOCAL_ROUTE_COUNT={len(route_files)}")

    ftp = FTP(host, timeout=60)
    ftp.login(user, password)

    try:
        ftp.mkd(f"{remote_root}/routes")
    except Exception:
        pass

    ftp.cwd(f"{remote_root}/routes")
    lines.append(f"PWD={ftp.pwd()}")

    for p in route_files:
        try:
            with p.open("rb") as fh:
                ftp.storbinary(f"STOR {p.name}", fh)
            lines.append(f"UPLOAD_OK={p.name}")
        except Exception as exc:
            lines.append(f"UPLOAD_ERR={p.name} ERR={exc!r}")

    try:
        lines.append("NLST=" + ",".join(ftp.nlst()))
    except Exception as exc:
        lines.append(f"NLST_ERR={exc!r}")

    for p in route_files:
        try:
            b = BytesIO()
            ftp.retrbinary(f"RETR {p.name}", b.write)
            lines.append(f"VERIFY_OK={p.name} LEN={len(b.getvalue())}")
        except Exception as exc:
            lines.append(f"VERIFY_ERR={p.name} ERR={exc!r}")

    ftp.quit()

    (ROOT / ".tmp-if-routes-upload.log").write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

