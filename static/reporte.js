// ---------------- Reporte ----------------
function pintarReporte() {
  const desde = $("desde").value;
  const hasta = $("hasta").value;
  const lista = leerGastos()
    .filter((g) => (!desde || g.fecha >= desde) && (!hasta || g.fecha <= hasta))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id);

  const total = lista.reduce((suma, g) => suma + g.monto, 0);
  const promedio = lista.length ? total / lista.length : 0;
  const mayor = lista.length ? Math.max(...lista.map((g) => g.monto)) : null;

  $("estadisticas").innerHTML =
    '<div class="stat"><span>Total gastado</span><strong>' + dinero(total) + "</strong></div>" +
    '<div class="stat"><span>N.º de gastos</span><strong>' + lista.length + "</strong></div>" +
    '<div class="stat"><span>Promedio</span><strong>' + dinero(promedio) + "</strong></div>" +
    '<div class="stat"><span>Mayor gasto</span><strong>' + (mayor === null ? "-" : dinero(mayor)) + "</strong></div>";

  // Resumen por mes
  const meses = {};
  lista.forEach((g) => {
    const mes = g.fecha.slice(0, 7);
    meses[mes] = meses[mes] || { cantidad: 0, total: 0 };
    meses[mes].cantidad += 1;
    meses[mes].total += g.monto;
  });
  let filasMes = "";
  Object.keys(meses).sort().forEach((mes) => {
    filasMes += "<tr><td>" + mes + '</td><td class="num">' + meses[mes].cantidad +
      '</td><td class="num">' + dinero(meses[mes].total) + "</td></tr>";
  });
  $("resumen-mes").innerHTML = filasMes
    ? '<table><tr><th>Mes</th><th class="num">Cantidad</th><th class="num">Total</th></tr>' + filasMes + "</table>"
    : "<p>Sin datos</p>";

  // Detalle
  let filas = "";
  lista.forEach((g) => {
    filas += "<tr><td>" + escapar(g.fecha) + "</td><td>" + escapar(g.descripcion) +
      '</td><td class="num">' + dinero(g.monto) + "</td></tr>";
  });
  $("detalle").innerHTML = filas
    ? '<table><tr><th>Fecha</th><th>Descripción</th><th class="num">Monto</th></tr>' + filas +
      '<tr><th colspan="2">TOTAL</th><th class="num">' + dinero(total) + "</th></tr></table>"
    : "<p>Sin datos</p>";
}

$("form-filtro").addEventListener("submit", (e) => { e.preventDefault(); pintarReporte(); });
$("btn-imprimir").addEventListener("click", () => window.print());

// ---------------- Inicio ----------------
mostrarVista();
