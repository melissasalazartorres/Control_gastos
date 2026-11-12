import sqlite3
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, session, flash, g

app = Flask(__name__)
app.secret_key = "cambia-esta-clave-secreta"
DATABASE = "gastos.db"

USUARIO = "admin"
CLAVE = "123"


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    with sqlite3.connect(DATABASE) as con:
        con.execute(
            """CREATE TABLE IF NOT EXISTS gastos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fecha TEXT NOT NULL,
                descripcion TEXT NOT NULL,
                monto REAL NOT NULL
            )"""
        )


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("usuario"):
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return wrapper


@app.route("/", methods=["GET", "POST"])
def login():
    if session.get("usuario"):
        return redirect(url_for("gastos"))
    if request.method == "POST":
        if request.form["usuario"] == USUARIO and request.form["clave"] == CLAVE:
            session["usuario"] = USUARIO
            return redirect(url_for("gastos"))
        flash("Usuario o clave incorrectos", "error")
    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/gastos", methods=["GET", "POST"])
@login_required
def gastos():
    db = get_db()
    if request.method == "POST":
        fecha = request.form["fecha"]
        descripcion = request.form["descripcion"].strip()
        try:
            monto = float(request.form["monto"])
        except ValueError:
            monto = -1
        if not fecha or not descripcion or monto <= 0:
            flash("Completa todos los campos con un monto mayor a 0", "error")
        else:
            db.execute(
                "INSERT INTO gastos (fecha, descripcion, monto) VALUES (?, ?, ?)",
                (fecha, descripcion, monto),
            )
            db.commit()
            flash("Gasto registrado", "ok")
        return redirect(url_for("gastos"))
    lista = db.execute("SELECT * FROM gastos ORDER BY fecha DESC, id DESC").fetchall()
    return render_template("gastos.html", gastos=lista)


@app.route("/eliminar/<int:gasto_id>", methods=["POST"])
@login_required
def eliminar(gasto_id):
    db = get_db()
    db.execute("DELETE FROM gastos WHERE id = ?", (gasto_id,))
    db.commit()
    flash("Gasto eliminado", "ok")
    return redirect(url_for("gastos"))


@app.route("/reporte")
@login_required
def reporte():
    db = get_db()
    desde = request.args.get("desde", "")
    hasta = request.args.get("hasta", "")
    where, params = [], []
    if desde:
        where.append("fecha >= ?")
        params.append(desde)
    if hasta:
        where.append("fecha <= ?")
        params.append(hasta)
    cond = ("WHERE " + " AND ".join(where)) if where else ""

    lista = db.execute(
        f"SELECT * FROM gastos {cond} ORDER BY fecha, id", params
    ).fetchall()
    resumen = db.execute(
        f"""SELECT SUBSTR(fecha, 1, 7) AS mes, COUNT(*) AS cantidad, SUM(monto) AS total
            FROM gastos {cond} GROUP BY mes ORDER BY mes""",
        params,
    ).fetchall()
    total = sum(g_["monto"] for g_ in lista)
    promedio = total / len(lista) if lista else 0
    mayor = max(lista, key=lambda x: x["monto"]) if lista else None
    return render_template(
        "reporte.html", gastos=lista, resumen=resumen, total=total,
        promedio=promedio, mayor=mayor, desde=desde, hasta=hasta,
    )


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
