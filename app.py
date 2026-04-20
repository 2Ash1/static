from flask import Flask, redirect

app = Flask(__name__)

@app.route("/")
def home():
    return redirect("https://www.chess.com", code=302)
