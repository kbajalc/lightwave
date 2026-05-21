# LightWAVE — Claude Code guidance

## Project overview

LightWAVE v0.72 is a browser-based physiologic waveform viewer/editor. It has two main components:

- **C CGI server** (`server/lightwave.c`, `server/cgi.c`) — compiled binary that serves JSON to the browser via WFDB library
- **JavaScript client** (`client/js/lightwave.js`, `client/lightwave.html`) — jQuery-based front end, no build step

## Build

```bash
make lightwave      # compile CGI binary (requires libwfdb, libcurl, gcc)
make                # compile + install under physionet/
python lw-server    # start built-in HTTP server (port 7777 by default)
```

Prerequisites: `libwfdb`, `libcurl`, `gcc`, Python 3 (for `lw-server`).  
Apache + Perl + `CGI.pm` are only needed for the full `lw-scribe` annotation editing pipeline.

## Directory layout

```
server/       C source — lightwave.c (main CGI), cgi.c/h, sandbox.c/h,
              setrepos.c, patchann.c, lw-scribe (Perl), lw-apache.conf
client/       HTML/CSS/JS front end (no build step)
  js/           lightwave.js (main client code), jQuery + jQuery UI
  css/          lightwave.css, jquery-ui.min.css
  doc/          HTML documentation pages
  images/       SVG assets
check/        Shell test script (lw-test) and expected output
physionet/    Build output — populated by `make` (git-ignored)
ptmp/         Scribe temp dir — git-ignored
lw-server     Python 3 convenience HTTP server (local mode)
lw-oldver     Older version of lw-server (different CLI)
start         Shell script: cd to project root and run lw-server
Makefile      Build + install; configure DocumentRoot, LW_WFDB, etc. here
```

## Server API actions

The compiled `lightwave` binary is a CGI app. It accepts `action=` query parameters:

| action | required params | returns |
|---|---|---|
| `dblist` | — | list of databases |
| `rlist` | `db` | list of records in database |
| `alist` | `db` | list of annotators |
| `info` | `db`, `record` | record metadata |
| `fetch` | `db`, `record`, `t0`, `tf`, signals, annotators | signal + annotation data (JSON) |

Supports JSONP via `callback=` parameter (can be disabled with `LIGHTWAVE_DISABLE_JSONP` env var).

## Data repository

The WFDB path is set at compile time via `LW_WFDB` in `Makefile`, or overridden at runtime by the `WFDB` environment variable. `lw-server` sets `WFDB` to a temp directory of symlinks, and `LIGHTWAVE_DBLIST` to a name→path mapping used by `setrepos.c`.

A repository must contain:
- `DBS` — tab-separated `name<tab>description` lines
- `<db>/RECORDS` — one record name per line (blank lines and `#` comments ignored)
- `<db>/ANNOTATORS` — one annotator name per line

## Running tests

```bash
make test          # runs check/lw-test against physionet/cgi-bin/lightwave
```

The test calls the binary in interactive mode (`lightwave i`) with stdin params and diffs against `check/lw-test-output`.

## Key files to know

- [server/lightwave.c](server/lightwave.c) — all server logic; `main()` dispatches on `action` param
- [server/setrepos.c](server/setrepos.c) — included directly by lightwave.c; sets WFDB path
- [server/sandbox.c](server/sandbox.c) — Linux seccomp sandbox (only active when compiled with `-DSANDBOX`)
- [client/js/lightwave.js](client/js/lightwave.js) — entire client in one IIFE; `server` and `scribe` vars at top control back-end URLs
- [lw-server](lw-server) — Python 3 script; use `-P PORT` flag, pass data directories as positional args

## Conventions

- C code uses WFDB library types (`WFDB_Sample`, `WFDB_Time`, etc.) — see `<wfdb/wfdb.h>`
- Client JavaScript uses jQuery 1.7+ conventions; all code is inside a single IIFE (`(function(){ "use strict"; ... }())`)
- The `physionet/` and `ptmp/` directories are git-ignored build outputs — never commit files there
- Version is defined in `Makefile` as `LWVERSION` and baked into the binary via `-DLWVER`
