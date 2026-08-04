import re
import sqlite3
from pathlib import Path


ROOT = Path("e:/Project1")
SQLITE_DB = ROOT / "Video-master" / "database" / "database.sqlite"
OUTPUT_SQL = ROOT / "Video-master" / "database" / "infinityfree_schema.sql"


def q(name: str) -> str:
    return f"`{name}`"


def mysql_type(sqlite_decl: str, column_name: str) -> str:
    raw = (sqlite_decl or "").strip().upper()
    col = (column_name or "").strip().lower()

    if not raw:
        return "TEXT"

    if "BOOL" in raw:
        return "TINYINT(1)"

    if "INT" in raw:
        if col == "id" or col.endswith("_id"):
            return "BIGINT UNSIGNED"
        return "BIGINT"

    if raw.startswith("VARCHAR"):
        if "(" in raw and ")" in raw:
            return raw
        return "VARCHAR(255)"

    if "CHAR" in raw:
        if "(" in raw and ")" in raw:
            return raw
        return "VARCHAR(255)"

    if "TEXT" in raw or "CLOB" in raw:
        return "TEXT"

    if "BLOB" in raw:
        return "LONGBLOB"

    if "REAL" in raw or "FLOA" in raw or "DOUB" in raw:
        return "DOUBLE"

    if "DECIMAL" in raw or "NUMERIC" in raw:
        return raw if "(" in raw else "DECIMAL(10,2)"

    if "DATETIME" in raw:
        return "DATETIME"

    if raw == "DATE":
        return "DATE"

    if "TIMESTAMP" in raw:
        return "TIMESTAMP"

    return "TEXT"


def normalize_default(default_value):
    if default_value is None:
        return None

    raw = str(default_value).strip()
    if not raw:
        return None

    upper = raw.upper()
    if upper in {"NULL", "CURRENT_TIMESTAMP", "CURRENT_TIMESTAMP()"}:
        return upper

    if re.fullmatch(r"-?\d+(\.\d+)?", raw):
        return raw

    if raw.startswith("'") and raw.endswith("'"):
        return raw

    escaped = raw.replace("'", "''")
    return f"'{escaped}'"


def fetch_table_names(cur: sqlite3.Cursor):
    cur.execute(
        """
        SELECT name
        FROM sqlite_master
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
        """
    )
    return [r[0] for r in cur.fetchall()]


def order_tables_by_dependencies(cur: sqlite3.Cursor, tables: list[str]) -> list[str]:
    """Topologically order tables so referenced tables are created first."""
    table_set = set(tables)

    deps: dict[str, set[str]] = {}
    for table in tables:
        fk_rows = fetch_foreign_keys(cur, table)
        refs = {
            str(r[2])
            for r in fk_rows
            if str(r[2]) in table_set and str(r[2]) != str(table)
        }
        deps[table] = refs

    ordered: list[str] = []
    placed = set()
    remaining = set(tables)

    while remaining:
        ready = sorted(
            [t for t in remaining if deps.get(t, set()).issubset(placed)]
        )

        # Fallback for cycles/unexpected metadata: keep deterministic order.
        if not ready:
            ready = sorted(remaining)

        for table in ready:
            ordered.append(table)
            placed.add(table)
            remaining.discard(table)

    return ordered


def fetch_columns(cur: sqlite3.Cursor, table: str):
    cur.execute(f"PRAGMA table_info({q(table)})")
    # cid, name, type, notnull, dflt_value, pk
    return cur.fetchall()


def fetch_foreign_keys(cur: sqlite3.Cursor, table: str):
    cur.execute(f"PRAGMA foreign_key_list({q(table)})")
    # id, seq, table, from, to, on_update, on_delete, match
    return cur.fetchall()


def fetch_indexes(cur: sqlite3.Cursor, table: str):
    cur.execute(f"PRAGMA index_list({q(table)})")
    # seq, name, unique, origin, partial
    rows = cur.fetchall()
    indexes = []
    for row in rows:
        idx_name = row[1]
        is_unique = bool(row[2])
        origin = row[3] if len(row) > 3 else "c"

        # Skip sqlite auto PK index; we generate PK explicitly
        if str(origin).lower() == "pk":
            continue

        cur.execute(f"PRAGMA index_info({q(idx_name)})")
        # seqno, cid, name
        cols = [c[2] for c in cur.fetchall()]
        if not cols:
            continue
        indexes.append((idx_name, is_unique, cols))

    return indexes


def build_create_table_sql(cur: sqlite3.Cursor, table: str) -> str:
    columns = fetch_columns(cur, table)
    foreign_keys = fetch_foreign_keys(cur, table)
    indexes = fetch_indexes(cur, table)

    pk_columns = [c[1] for c in columns if int(c[5]) > 0]
    pk_columns_sorted = [x for _, x in sorted((int(c[5]), c[1]) for c in columns if int(c[5]) > 0)]

    auto_increment_pk = (
        len(pk_columns_sorted) == 1
        and pk_columns_sorted[0] == "id"
        and "INT" in str(next(c for c in columns if c[1] == "id")[2]).upper()
    )

    opening = f"CREATE TABLE {q(table)} ("

    col_defs = []
    for _, col_name, col_type_decl, not_null, default_value, _pk in columns:
        col_type = mysql_type(col_type_decl, col_name)

        if auto_increment_pk and col_name == "id":
            col_defs.append(f"  {q(col_name)} BIGINT UNSIGNED NOT NULL AUTO_INCREMENT")
            continue

        parts = [f"  {q(col_name)} {col_type}"]

        if int(not_null):
            parts.append("NOT NULL")

        default_sql = normalize_default(default_value)
        if default_sql is not None:
            parts.append(f"DEFAULT {default_sql}")

        col_defs.append(" ".join(parts))

    constraints = []

    if pk_columns_sorted:
        constraints.append(
            "  PRIMARY KEY (" + ", ".join(q(c) for c in pk_columns_sorted) + ")"
        )

    fk_groups = {}
    for fk in foreign_keys:
        fk_id = fk[0]
        fk_groups.setdefault(fk_id, []).append(fk)

    for fk_id, fk_rows in sorted(fk_groups.items(), key=lambda x: x[0]):
        fk_rows_sorted = sorted(fk_rows, key=lambda x: x[1])
        ref_table = fk_rows_sorted[0][2]
        from_cols = [r[3] for r in fk_rows_sorted]
        to_cols = [r[4] for r in fk_rows_sorted]
        on_update = str(fk_rows_sorted[0][5] or "").upper()
        on_delete = str(fk_rows_sorted[0][6] or "").upper()

        cname = f"fk_{table}_{fk_id}"
        fk_sql = (
            f"  CONSTRAINT {q(cname)} FOREIGN KEY ("
            + ", ".join(q(c) for c in from_cols)
            + ") REFERENCES "
            + q(ref_table)
            + " ("
            + ", ".join(q(c) for c in to_cols)
            + ")"
        )

        if on_delete and on_delete != "NO ACTION":
            fk_sql += f" ON DELETE {on_delete}"
        if on_update and on_update != "NO ACTION":
            fk_sql += f" ON UPDATE {on_update}"

        constraints.append(fk_sql)

    for idx_name, unique, idx_cols in indexes:
        key_type = "UNIQUE KEY" if unique else "KEY"
        constraints.append(
            f"  {key_type} {q(idx_name)} (" + ", ".join(q(c) for c in idx_cols) + ")"
        )

    merged = col_defs + constraints

    lines = [opening]
    for i, line in enumerate(merged):
        suffix = "," if i < len(merged) - 1 else ""
        lines.append(line + suffix)

    lines.append(
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"
    )

    return "\n".join(lines)


def build_migrations_insert(cur: sqlite3.Cursor) -> str:
    cur.execute("SELECT migration, batch FROM migrations ORDER BY batch, migration")
    rows = cur.fetchall()
    if not rows:
        return ""

    values = []
    for migration, batch in rows:
        mig = str(migration).replace("'", "''")
        values.append(f"('{mig}', {int(batch)})")

    return (
        "INSERT INTO `migrations` (`migration`, `batch`) VALUES\n"
        + ",\n".join(values)
        + ";"
    )


def main() -> None:
    if not SQLITE_DB.exists():
        raise FileNotFoundError(f"SQLite database not found: {SQLITE_DB}")

    conn = sqlite3.connect(str(SQLITE_DB))
    cur = conn.cursor()

    tables = fetch_table_names(cur)
    ordered_tables = order_tables_by_dependencies(cur, tables)

    out = []
    out.append("-- InfinityFree / MySQL schema dump")
    out.append("-- Generated from Laravel sqlite migration state")
    out.append("SET NAMES utf8mb4;")
    out.append("SET FOREIGN_KEY_CHECKS=0;")
    out.append("")

    for table in ordered_tables:
        out.append(f"DROP TABLE IF EXISTS {q(table)};")
        out.append(build_create_table_sql(cur, table))
        out.append("")

    migrations_insert = build_migrations_insert(cur)
    if migrations_insert:
        out.append(migrations_insert)
        out.append("")

    out.append("SET FOREIGN_KEY_CHECKS=1;")
    out.append("")

    OUTPUT_SQL.write_text("\n".join(out), encoding="utf-8")

    conn.close()

    print(f"Generated: {OUTPUT_SQL}")
    print(f"Tables: {len(ordered_tables)}")


if __name__ == "__main__":
    main()

