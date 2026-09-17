import json
import os
import socket
import threading
import time
import urllib.parse
import urllib.request

_ORIGINAL_GETADDRINFO = socket.getaddrinfo
_ORIGINAL_GETHOSTBYNAME = socket.gethostbyname
_ORIGINAL_GETHOSTBYNAME_EX = socket.gethostbyname_ex
_CACHE = {}
_CACHE_LOCK = threading.Lock()
_CACHE_TTL_SECONDS = 300
_DOH_HOSTS = {"cloudflare-dns.com", "cloudflare-dns.com."}


def _doh_url(host: str, record_type: str) -> str:
    base_url = os.environ.get(
        "EXTRACTOR_DOH_URL", "https://cloudflare-dns.com/dns-query"
    )
    query = urllib.parse.urlencode({"name": host, "type": record_type})
    return f"{base_url}?{query}"


def _resolve(host: str, record_type: str) -> list[str]:
    cache_key = (host.lower().rstrip("."), record_type)
    now = time.monotonic()

    with _CACHE_LOCK:
        cached = _CACHE.get(cache_key)
        if cached and cached[0] > now:
            return cached[1]

    request = urllib.request.Request(
        _doh_url(host, record_type),
        headers={"Accept": "application/dns-json"},
    )
    with urllib.request.urlopen(request, timeout=8) as response:
        payload = json.loads(response.read().decode("utf-8"))

    addresses = [
        answer["data"]
        for answer in payload.get("Answer", [])
        if answer.get("type") == (1 if record_type == "A" else 28)
    ]

    if not addresses:
        raise OSError(f"DoH returned no {record_type} record for {host}")

    with _CACHE_LOCK:
        _CACHE[cache_key] = (now + _CACHE_TTL_SECONDS, addresses)

    return addresses


def _getaddrinfo(host, port=0, family=0, type=0, proto=0, flags=0):
    if not host or host.lower().rstrip(".") in _DOH_HOSTS:
        return _ORIGINAL_GETADDRINFO(host, port, family, type, proto, flags)

    try:
        if family in (0, socket.AF_INET):
            addresses = _resolve(host, "A")
            result_type = type or socket.SOCK_STREAM
            return [
                (socket.AF_INET, result_type, proto, "", (address, port))
                for address in addresses
            ]

        if family == socket.AF_INET6:
            addresses = _resolve(host, "AAAA")
            result_type = type or socket.SOCK_STREAM
            return [
                (socket.AF_INET6, result_type, proto, "", (address, port, 0, 0))
                for address in addresses
            ]
    except Exception:
        return _ORIGINAL_GETADDRINFO(host, port, family, type, proto, flags)

    return _ORIGINAL_GETADDRINFO(host, port, family, type, proto, flags)


def _gethostbyname(host):
    try:
        return _resolve(host, "A")[0]
    except Exception:
        return _ORIGINAL_GETHOSTBYNAME(host)


def _gethostbyname_ex(host):
    try:
        addresses = _resolve(host, "A")
        return host, [], addresses
    except Exception:
        return _ORIGINAL_GETHOSTBYNAME_EX(host)


def install() -> None:
    socket.getaddrinfo = _getaddrinfo
    socket.gethostbyname = _gethostbyname
    socket.gethostbyname_ex = _gethostbyname_ex
