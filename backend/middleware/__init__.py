from flask import current_app


def get_repo():
    return current_app.extensions["repo"]
