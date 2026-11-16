"""SQLite data layer for the Task Dashboard.

Every query is parameterised (the ? placeholders), so user input is never
concatenated into SQL. This keeps the app safe from SQL injection.
"""
import os
import sqlite3
from contextlib import closing

DB_PATH = os.environ.get("TASKS_DB") or os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "tasks.db"
)


def _connect(path=None):
    conn = sqlite3.connect(path or DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(path=None):
    """Create the tasks table if it does not exist yet."""
    with closing(_connect(path)) as conn, conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS tasks (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                title       TEXT    NOT NULL,
                description TEXT    NOT NULL DEFAULT '',
                priority    TEXT    NOT NULL DEFAULT 'medium',
                status      TEXT    NOT NULL DEFAULT 'todo',
                created_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


def list_tasks(status=None, path=None):
    """READ: all tasks (newest first), optionally filtered by status."""
    with closing(_connect(path)) as conn:
        if status:
            rows = conn.execute(
                "SELECT * FROM tasks WHERE status = ? ORDER BY id DESC", (status,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM tasks ORDER BY id DESC").fetchall()
    return [dict(r) for r in rows]


def get_task(task_id, path=None):
    """READ: one task, or None if it does not exist."""
    with closing(_connect(path)) as conn:
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    return dict(row) if row else None


def create_task(data, path=None):
    """CREATE: insert a task and return it."""
    with closing(_connect(path)) as conn, conn:
        cur = conn.execute(
            "INSERT INTO tasks (title, description, priority, status) VALUES (?, ?, ?, ?)",
            (data["title"], data["description"], data["priority"], data["status"]),
        )
        new_id = cur.lastrowid
    return get_task(new_id, path)


def update_task(task_id, data, path=None):
    """UPDATE: replace a task's fields. Returns the task, or None if not found."""
    with closing(_connect(path)) as conn, conn:
        cur = conn.execute(
            """
            UPDATE tasks
               SET title = ?, description = ?, priority = ?, status = ?,
                   updated_at = CURRENT_TIMESTAMP
             WHERE id = ?
            """,
            (data["title"], data["description"], data["priority"], data["status"], task_id),
        )
        if cur.rowcount == 0:
            return None
    return get_task(task_id, path)


def delete_task(task_id, path=None):
    """DELETE: returns True if a row was deleted, False if it did not exist."""
    with closing(_connect(path)) as conn, conn:
        cur = conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        return cur.rowcount > 0