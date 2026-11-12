// ---------------- Gastos ----------------
function pintarGastos() {
  const lista = leerGastos().sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
  if (lista.length === 0) {
    $("lista-gastos").innerHTML = "<p>Aún no has registrado gastos.</p>";
    return;
  }
  let filas = "";
  lista.forEach((g) => {
    filas += "<tr><td>" + escapar(g.fecha) + "</td><td>" + escapar(g.descripcion) +
      '</td><td class="num">' + dinero(g.monto) + '</td><td class="num">' +
      '<button class="danger" data-id="' + g.id + '">Eliminar</button></td></tr>';
  });
  $("lista-gastos").innerHTML =
    '<table><tr><th>Fecha</th><th>Descripción</th><th class="num">Monto</th><th></th></tr>' +
    filas + "</table>";
}

$("form-gasto").addEventListener("submit", (e) => {
  e.preventDefault();
  const fecha = $("fecha").value;
  const descripcion = $("descripcion").value.trim();
  const monto = parseFloat($("monto").value);

  if (!fecha || !descripcion || isNaN(monto) || monto <= 0) {
    mostrarMensaje("Completa todos los campos con un monto mayor a 0", "error");
    return;
  }
  const lista = leerGastos();
  lista.push({ id: Date.now(), fecha: fecha, descripcion: descripcion, monto: monto });
  guardarGastos(lista);
  $("form-gasto").reset();
  mostrarMensaje("Gasto registrado", "ok");
  pintarGastos();
});

$("lista-gastos").addEventListener("click", (e) => {
  const id = e.target.getAttribute("data-id");
  if (!id || !confirm("¿Eliminar este gasto?")) { return; }
  guardarGastos(leerGastos().filter((g) => String(g.id) !== id));
  mostrarMensaje("Gasto eliminado", "ok");
  pintarGastos();
});
