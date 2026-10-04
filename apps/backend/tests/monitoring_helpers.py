"""Helpers for the monitoring tests: a LangSmith client that talks to a fake HTTP session.

`langsmith.Client` sends everything through `session.request(...)`. With `auto_batch_tracing=False`
it sends one `POST /runs` when a run starts and one `PATCH /runs/{id}` when it ends, synchronously
and as JSON, so a test can read exactly what would have left the service, with no network.
"""

import json
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import httpx
import requests
from langsmith import Client

from app.monitoring import TracedJevClient, scrub_error_text

# A state shaped like the one the recommender builds, with choices that must never reach a trace.
PRIVATE_CHOICE = "MARKER-PRIVATE-CHOICE"
STATE = {
    "liked": [
        {"id": "L1", "event_name": "Korn", "description": "Metal concert", "price": None, "address": "Lema 7"}
    ],
    "disliked": [
        {"id": "D1", "event_name": "Spacer", "description": "A walk", "price": 15, "address": "Wolnica 1"}
    ],
    "candidates": [
        {"id": "C1", "event_name": "Kabaret", "description": "Comedy night", "price": None, "address": "Lema 7"},
        {"id": "C2", "event_name": "Glenn Miller", "description": "Swing", "price": None, "address": "Konopnickiej 17"},
    ],
    "choices": {"interests": [PRIVATE_CHOICE], "home": "ul. Tajna 5"},
}
QUESTION_IDS = ["C1", "C2"]


class FakeLangSmithSession(requests.Session):
    def __init__(self) -> None:
        super().__init__()
        self.sent: list[dict] = []
        self.down = False  # when True every request fails like an unreachable service

    def request(self, method, url, *args, **kwargs):
        if self.down:
            raise requests.ConnectionError("langsmith is down")
        body = kwargs.get("data")
        text = body.decode("utf-8", "replace") if isinstance(body, (bytes, bytearray)) else None
        self.sent.append({"method": method, "url": url, "body": text})
        response = requests.Response()
        response.status_code = 200
        response.url = url
        response._content = b'{"version": "0.10.0"}' if url.endswith("/info") else b"{}"
        return response

    def everything_sent(self) -> str:
        """All request bodies joined, for 'this text appears nowhere' assertions."""
        return "\n".join(r["body"] or "" for r in self.sent)


def captured_traces(session: FakeLangSmithSession) -> list[dict]:
    """The runs the session received, start and end merged, in the order they started."""
    runs: dict[str, dict] = {}
    for request in session.sent:
        if not request["body"] or "/runs" not in request["url"]:
            continue
        payload = json.loads(request["body"])
        if request["method"] == "POST":
            runs[payload["id"]] = dict(payload)
        elif request["method"] == "PATCH":
            run_id = request["url"].rsplit("/", 1)[-1]
            runs.setdefault(run_id, {"id": run_id}).update(payload)
    return [
        {
            "name": run.get("name"),
            "project": run.get("session_name"),
            "tags": run.get("tags"),
            "metadata": (run.get("extra") or {}).get("metadata") or {},
            "inputs": run.get("inputs"),
            "outputs": run.get("outputs"),
            "error": run.get("error"),
        }
        for run in runs.values()
    ]


def jev_scores(scores: dict[str, float]):
    """A Jev stand-in that answers with these probabilities."""

    def handler(request: httpx.Request) -> httpx.Response:
        answers = {qid: {"type": "noul", "noul": value} for qid, value in scores.items()}
        return httpx.Response(200, json={"answers": answers})

    return handler


def traced_client(handler, session: FakeLangSmithSession, environment: str | None = None) -> TracedJevClient:
    """A TracedJevClient whose Jev goes to `handler` and whose traces go to `session`."""
    tracing = Client(
        api_url="http://langsmith.test",
        api_key="ls-test-key",
        session=session,
        auto_batch_tracing=False,
        anonymizer=scrub_error_text,  # the same filter the real client has
    )
    options = {} if environment is None else {"environment": environment}
    return TracedJevClient(
        api_key="test-key",
        model="jev-test",
        url="https://jev.test/systemone",
        timeout=2.0,
        transport=httpx.MockTransport(handler),
        tracing_client=tracing,
        **options,
    )


class StubLangSmith:
    """A LangSmith API stand-in on a free local port, for the production client config.

    mode `ok` answers 200, `forbidden` rejects the key with 403, `slow` answers after `delay` seconds.
    It runs in daemon threads, so a request that is still sleeping never keeps the test run waiting.
    """

    def __init__(self, mode: str = "ok", delay: float = 1.0) -> None:
        self.mode, self.delay = mode, delay
        stub = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args) -> None:  # keep the test output clean
                pass

            def _reply(self, code: int, body: bytes = b"{}") -> None:
                self.send_response(code)
                self.send_header("content-type", "application/json")
                self.send_header("content-length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            def do_GET(self) -> None:
                self._reply(200, b'{"version": "0.10.0"}')

            def do_POST(self) -> None:
                self.rfile.read(int(self.headers.get("content-length", 0)))
                if stub.mode == "slow":
                    time.sleep(stub.delay)
                self._reply(403 if stub.mode == "forbidden" else 200)

            do_PATCH = do_POST

        class Server(ThreadingHTTPServer):
            daemon_threads = True

        self._server = Server(("127.0.0.1", 0), Handler)
        self.url = f"http://127.0.0.1:{self._server.server_port}"
        threading.Thread(target=self._server.serve_forever, daemon=True).start()

    def close(self) -> None:
        self._server.shutdown()
        self._server.server_close()
