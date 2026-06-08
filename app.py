"""Jitz — a study tool for Royce Gracie Jiu-Jitsu (Gracie Combatives).

Browse the 36 essential techniques, filter by position/category, and watch the
move on an embedded YouTube video. "Watched" progress is kept in the browser
(localStorage) — no accounts, no server-side data.
"""
import json
import os
from pathlib import Path

from flask import Flask, jsonify, render_template

BASE_DIR = Path(__file__).parent
MOVES_FILE = BASE_DIR / "moves.json"

app = Flask(__name__)


def load_data() -> dict:
    with open(MOVES_FILE) as f:
        return json.load(f)


@app.route("/")
def index():
    data = load_data()
    moves = data["moves"]
    categories = sorted({m["category"] for m in moves})
    with_video = sum(1 for m in moves if m.get("youtube"))
    return render_template(
        "index.html",
        meta=data["meta"],
        moves=moves,
        categories=categories,
        total=len(moves),
        with_video=with_video,
    )


@app.route("/api/moves")
def api_moves():
    return jsonify(load_data())


@app.route("/about")
def about():
    return render_template("about.html", meta=load_data()["meta"])


if __name__ == "__main__":
    # debug=False + threaded: single process, clean to stop from Claude Hub.
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug, host="127.0.0.1", port=5009, threaded=True)
