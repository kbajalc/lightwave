# LightWAVE

**LightWAVE** is a lightweight waveform and annotation viewer and editor. It runs entirely within any modern web browser and does not require installation on the user's computer.

LightWAVE is modelled on [WAVE](http://physionet.org/physiotools/wug/), an X11/XView application originally developed by George B. Moody at MIT. It provides browser-based access to physiologic signal recordings and their annotations (event markers).

## Features

- View physiologic waveform recordings from [PhysioBank](http://physionet.org/physiobank/database/) or a local data repository
- Display and edit annotations (beat labels, event markers) in-browser
- Tabbed UI: **Choose input**, **View/edit**, **Tables**, **Settings**
- SVG-based rendering via HTML5 + jQuery/jQuery UI
- JSON/JSONP API — supports custom or alternative front ends
- CGI back end written in C using the [WFDB library](http://physionet.org/physiotools/wfdb.shtml)
- Optional sandboxed server (Linux seccomp/capabilities)
- `lw-scribe` annotation edit log receiver (Perl + `patchann` C utility)

## Architecture

```
Browser (lightwave.html + lightwave.js)
    │  AJAX/JSON(P)
    ▼
lightwave  (C CGI binary — reads WFDB data, serves JSON)
    │  WFDB path
    ▼
Local storage  /  PhysioNet PhysioBank  /  any WFDB-compatible repository
```

- **Client** — `client/` — HTML5 page, CSS, JavaScript (jQuery). No build step; open `client/lightwave.html` directly in a browser to connect to the public PhysioNet server.
- **Server** — `server/lightwave.c` + `server/cgi.c` — C CGI application. Compiled with `make`.
- **Scribe** — `server/lw-scribe` (Perl) + `server/patchann.c` (C) — receives and applies annotation edit logs.
- **Local server** — `lw-server` (Python 3) — convenience wrapper for running LightWAVE against local WFDB data files without Apache.

## Quick start (local mode, no Apache required)

```bash
# 1. Build the C server binary
make lightwave          # produces ./lightwave

# 2. Install client + binary under physionet/
make client server      # or just: make

# 3. Start the built-in Python HTTP server
python lw-server        # default port 7777
# or
./start

# 4. Open browser
#   http://lw:7777/lw
```

To serve a directory of local WFDB data files (needs a compiled `./lightwave` binary):

```bash
python lw-oldver  [DIRECTORY] [-P PORT]
```

## Full Apache installation

See `client/doc/server-install.html` for detailed instructions. Summary:

1. Install prerequisites: Apache, `libwfdb`, `libcurl`, `gcc`, Perl + `CGI.pm`
2. Edit `Makefile` variables (`DocumentRoot`, `ServerName`, `ScriptAlias*`, `LW_WFDB`)
3. `make install`
4. `make test` — runs `check/lw-test` against the CGI binary

## Data repository layout

A WFDB-compatible repository needs:

```
<repo>/
  DBS           # tab-separated list: db-name <tab> description
  wfdbcal       # signal calibration table
  <db>/
    RECORDS     # one record name per line (blank lines and # comments ignored)
    ANNOTATORS  # one annotator name per line
    <record>.*  # WFDB binary signal/header/annotation files
```

Set `LW_WFDB` in `Makefile` (or the `WFDB` environment variable at runtime) to the space-separated list of repository paths/URLs.

## URL parameters

| Parameter | Example | Description |
|---|---|---|
| `db` | `db=mitdb` | Database name |
| `record` / `r` | `record=200` | Record name |
| `t` / `t0` | `t=0:05:25` | Initial window start time (HH:MM:SS or seconds) |
| `x` | `x=0:05:30` | Event marker — opens window 5 s before this time and draws a green vertical line with a triangle at the top margin to mark the exact position |

Example: `http://localhost:7777/lw/lightwave.html?db=mitdb&record=200&x=0:05:30`

## Screenshots (automated)

`lw-screenshot.mjs` uses [Playwright](https://playwright.dev/) to capture the chart from a running server. Requires Node.js and `npm install playwright` (already done if you cloned this repo).

```bash
# default: mitdb/200 with x marker at 0:05:30
make screenshot

# custom query string
make screenshot QUERY="db=mitdb&record=200&x=0:06:00"

# custom output path
make screenshot OUT=~/Desktop/lw.png

# or invoke directly
node lw-screenshot.mjs "db=mitdb&record=200&x=0:05:30" /tmp/out.png
```

The server must be running (`make run` or `make exe`) before taking a screenshot.

## Build targets

| Target | Description |
|---|---|
| `make` / `make all` | Build server, scribe, and install client |
| `make install` | Same as `all`, with success message |
| `make run` | Build + install, then start `lw-server` |
| `make exe` | Start `lw-server` without rebuilding |
| `make test` | Run `check/lw-test` against the CGI binary |
| `make screenshot` | Capture a screenshot via Playwright (server must be running) |
| `make lightwave` | Compile the C CGI binary only |
| `make sandboxed-server` | Compile with Linux seccomp sandbox |
| `make patchann` | Compile patchann annotation merge tool |
| `make tarball` | Create `lightwave-<VERSION>.tar.gz` source archive |
| `make clean` | Remove compiled binaries and temp files |

## License

GNU General Public License v2 or later. See `client/doc/COPYING.html`.

Original author: George B. Moody (george@mit.edu), MIT.
