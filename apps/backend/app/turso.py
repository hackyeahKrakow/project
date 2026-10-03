"""Async SQLAlchemy engine for Turso (libsql).

SQLAlchemy has no async libsql dialect, so this reuses the aiosqlite one: aiosqlite runs a
sqlite3-style connection in a worker thread, and `async_creator_fn` lets us give it a libsql
connection instead. libsql is not a drop-in sqlite3 replacement, so `_Connection` and `_Cursor`
close the two gaps SQLAlchemy runs into: a missing `create_function`, and errors that are plain
`ValueError`s instead of sqlite3 exceptions (the app relies on `IntegrityError` for 409).
"""

import sqlite3
from collections.abc import Callable
from typing import Any

import aiosqlite
import libsql
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import AsyncAdaptedQueuePool


def _translate(error: Exception) -> Exception:
    """Map a libsql error to the sqlite3 exception SQLAlchemy and the app expect."""
    if not isinstance(error, ValueError):
        return error
    message = str(error)
    if "SQLITE_CONSTRAINT" in message:
        return sqlite3.IntegrityError(message)
    if "SQLite error" in message or "Hrana" in message:
        return sqlite3.OperationalError(message)
    return error


def _translating(method: Callable[..., Any]) -> Callable[..., Any]:
    def call(*args: Any, **kwargs: Any) -> Any:
        try:
            return method(*args, **kwargs)
        except Exception as error:
            translated = _translate(error)
            if translated is error:
                raise
            raise translated from error

    return call


class _Cursor:
    def __init__(self, cursor: Any) -> None:
        self._cursor = cursor

    def __getattr__(self, name: str) -> Any:
        value = getattr(self._cursor, name)
        return _translating(value) if callable(value) else value

    def execute(self, *args: Any, **kwargs: Any) -> "_Cursor":
        _translating(self._cursor.execute)(*args, **kwargs)
        return self


class _Connection:
    row_factory = None
    isolation_level = ""

    def __init__(self, connection: Any) -> None:
        self._connection = connection

    def __getattr__(self, name: str) -> Any:
        value = getattr(self._connection, name)
        return _translating(value) if callable(value) else value

    def cursor(self, *args: Any, **kwargs: Any) -> _Cursor:
        return _Cursor(self._connection.cursor(*args, **kwargs))

    def create_function(self, *args: Any, **kwargs: Any) -> None:
        """SQLAlchemy registers a REGEXP function on connect; libsql has none and the app
        does not use it."""


def create_turso_engine(url: str, auth_token: str | None) -> AsyncEngine:
    def connect(*_: Any, **__: Any) -> aiosqlite.Connection:
        connection = aiosqlite.Connection(
            lambda: _Connection(libsql.connect(url, auth_token=auth_token)), 64
        )
        connection._thread.daemon = True  # SQLAlchemy only sets this when it creates it itself
        return connection

    return create_async_engine(
        "sqlite+aiosqlite:///turso",  # placeholder, the connection comes from async_creator_fn
        connect_args={"async_creator_fn": connect},
        poolclass=AsyncAdaptedQueuePool,
        pool_pre_ping=True,  # remote streams expire while a serverless instance is idle
    )
