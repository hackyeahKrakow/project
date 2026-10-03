import sqlite3

import pytest
from sqlalchemy.pool import AsyncAdaptedQueuePool

from app.config import Settings
from app.database import create_engine
from app.turso import _Connection, _Cursor, _translate


def test_constraint_error_becomes_integrity_error() -> None:
    error = ValueError('Hrana: `... "SQLite error: UNIQUE constraint failed", code: "SQLITE_CONSTRAINT"`')
    assert isinstance(_translate(error), sqlite3.IntegrityError)


def test_other_libsql_error_becomes_operational_error() -> None:
    error = ValueError('Hrana: `... "SQLite error: no such table: nope"`')
    assert isinstance(_translate(error), sqlite3.OperationalError)


def test_unrelated_errors_are_left_alone() -> None:
    error = ValueError("something else")
    assert _translate(error) is error
    assert _translate(KeyError("x")).args == ("x",)


class _FailingCursor:
    rowcount = 3

    def execute(self, *_: object) -> None:
        raise ValueError('"SQLite error: UNIQUE constraint failed", code: "SQLITE_CONSTRAINT"')


def test_cursor_translates_errors_and_exposes_attributes() -> None:
    cursor = _Cursor(_FailingCursor())
    assert cursor.rowcount == 3
    with pytest.raises(sqlite3.IntegrityError):
        cursor.execute("insert into t values (1)")


def test_connection_wraps_cursors_and_ignores_create_function() -> None:
    raw = sqlite3.connect(":memory:")
    connection = _Connection(raw)
    connection.create_function("regexp", 2, lambda a, b: True)  # libsql has no such method
    cursor = connection.cursor()
    assert isinstance(cursor, _Cursor)
    assert cursor.execute("select 1").fetchall() == [(1,)]


def test_libsql_url_selects_the_turso_engine() -> None:
    settings = Settings(
        database_url="libsql://example.turso.io", database_auth_token="token", _env_file=None
    )
    engine = create_engine(settings)
    assert engine.url.database == "turso"  # placeholder, the real connection is libsql
    assert isinstance(engine.pool, AsyncAdaptedQueuePool)


def test_sqlite_url_keeps_the_local_engine() -> None:
    settings = Settings(database_url="sqlite+aiosqlite:///./local.db", _env_file=None)
    assert str(create_engine(settings).url) == "sqlite+aiosqlite:///./local.db"
