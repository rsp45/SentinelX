"""
SentinelX - Dashboard
(box 7 of the architecture diagram)

A small Flask server. One HTML page, one JSON endpoint. The page polls
/api/state once a second and redraws; no build step, no framework.
"""

from flask import Flask, jsonify, render_template


def create_app(store):
    app = Flask(__name__, template_folder=".")

    @app.route("/")
    def dashboard():
        return render_template("dashboard.html")

    @app.route("/api/state")
    def state():
        return jsonify(store.snapshot())

    return app
