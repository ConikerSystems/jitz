# Jitz

A personal study tool for **Royce Gracie Jiu-Jitsu** — the foundational
**Gracie Combatives** curriculum (36 essential techniques across 23 classes),
as taught at the [Royce Gracie Jiu-Jitsu Academy of Cary](https://roycegraciecary.com).

Browse every move by position and category, and watch the technique on an
embedded YouTube video. "Watched" progress is stored in your browser only.

## Run

```bash
python3 -m venv venv
venv/bin/pip install -r requirements.txt
venv/bin/python app.py      # http://127.0.0.1:5009
```

Part of the **Claude Hub** family — launch/stop it from the hub.

## Data

`moves.json` holds the 36 techniques. The first 10 (the foundation of the
course) have **verified, embeddable** YouTube links from Gracie-lineage
instructors. The remaining 26 list a name/position/category and a "Find on
YouTube" search link until a specific video is curated for each.

> Move names follow the published Gracie Combatives curriculum. Official class
> calendars rotate which techniques pair per class; the 36 core techniques are
> stable.
