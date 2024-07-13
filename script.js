let estado = false;
let perturbacion = 0;
let chart = undefined;
let chart1 = undefined;
let chart2 = undefined;
let iteracion = 0;

/*
 * Iteraciones
 */
$(document).ready(function () {
  setInterval(function () {
    if (!estado) {
      return;
    }

    iteracion++;

    if (perturbacion > 0) {
      $("#capital_actual").val(
        parseFloat($("#capital_actual").val()) + perturbacion
      );
      const capitalDisponible = parseFloat(
        $("#crypto_inversion_cantidad_0").val()
      );
      $("#crypto_inversion_cantidad_0").val(capitalDisponible + perturbacion);
      perturbacion = 0;
    }

    actualizarPrecioCrypto(1);
    actualizarPrecioCrypto(2);
    invertir();
    actualizarCapitalActual();
    actualizarGraficos();
  }, 1000);
});

/*
 * Invertir
 */
function invertir() {
  const capitalActual = parseFloat($("#capital_actual").val());
  const capitalInvertido = obtenerCapitalInvertido();
  const capital = parseFloat($("#capital").val());

  let meta1 = obtenerMetadatosCryptos(1);
  let meta2 = obtenerMetadatosCryptos(2);

  //Primera inversion   Math.abs(capitalActual - capital) > capital * 0.5
  if (Math.abs(capitalActual - capitalInvertido) > capitalActual * 0.5) {
    if (meta1.cantidad > 0) {
      invertirCrypto(meta1, capitalActual - capitalInvertido);
    } else {
      invertirCrypto(meta2, capitalActual - capitalInvertido);
    }
  }

  if (Math.abs(capitalActual - capital) > capital * 0.075) {
    meta1 = obtenerMetadatosCryptos(1);
    meta2 = obtenerMetadatosCryptos(2);

    if(capitalActual>=capital){
      if (meta1.cantidad > 0) {
        desinvertirCrypto(meta1);
        invertirCrypto(meta2, capitalActual);
      }
    }else{
      if (meta2.cantidad > 0) {
        desinvertirCrypto(meta2);
        invertirCrypto(meta1, capitalActual);;
      }
    }
  }
}

function desinvertirCrypto(meta) {
  $(`#crypto_inversion_cantidad_${meta.id}`).val(0);

  //Actualizo capital restante
  const capitalDisponible = parseFloat($("#crypto_inversion_cantidad_0").val());
  $("#crypto_inversion_cantidad_0").val(
    capitalDisponible + meta.cantidad * meta.precioActual
  );

  $("#tableOperacion").append(`
        <tr>
          <td>${generateLabel()}</td>
          <td>Venta</td>
          <td>${meta.nombre}</td>
          <td>${meta.precioActual}</td>
          <td>${meta.cantidad}</td>
        </tr>
      `);
}

function invertirCrypto(meta, capital) {
  //Calculo cantidad que puedo comprar
  const cant = Math.floor((capital * 100) / meta.precioActual) / 100;

  //Actualizo cantidad de la crypto
  $(`#crypto_inversion_cantidad_${meta.id}`).val(meta.cantidad + cant);

  //Actualizo capital restante
  const capitalDisponible =
    Math.round(parseFloat($("#crypto_inversion_cantidad_0").val()) * 100) / 100;
  $("#crypto_inversion_cantidad_0").val(
    Math.floor((capitalDisponible - cant * meta.precioActual) * 100) / 100
  );

  $("#tableOperacion").append(`
      <tr>
        <td>${generateLabel()}</td>
        <td>Compra</td>
        <td>${meta.nombre}</td>
        <td>${meta.precioActual}</td>
        <td>${cant}</td>
      </tr>
    `);
}

function obtenerCapitalInvertido() {
  let capitalInvertido = 0;
  $("#tableCryptos tr").each(function (idx, elem) {
    const id = parseFloat(elem.id.replace("crypto_row_", ""));
    if (id === 0) {
      return;
    }

    const precioActual = parseFloat($(`#crypto_precio_actual_${id}`).val());
    const cantidad = parseFloat($(`#crypto_inversion_cantidad_${id}`).val());
    capitalInvertido += precioActual * cantidad;
  });
  return capitalInvertido;
}

/*
 * Cryptos
 */

function obtenerMetadatosCryptos(id) {
  const nombre = $(`#crypto_nombre_${id}`).val();
  const precioActual = parseFloat($(`#crypto_precio_actual_${id}`).val());
  const historial = $(`#crypto_historial_${id}`).val();
  const cantidad = parseFloat($(`#crypto_inversion_cantidad_${id}`).val());

  let pendiente = 0;
  if (historial !== "") {
    let index = 0;
    const historialArr = $(`#crypto_historial_${id}`).val().split(",");
    if (historialArr.length > 2) {
      const values = historialArr.map((x) => {
        index++;
        return [index, parseFloat(x)];
      });

      const result = regression.linear(values);
      pendiente = result.equation[0];
    }
  }

  return {
    id,
    nombre,
    precioActual,
    pendiente,
    cantidad,
  };
}

/*
 * Valores
 */

function actualizarPrecioCrypto(id) {
  if (iteracion % 3 !== 0) {
    return;
  }

  let precioActual = parseFloat($(`#crypto_precio_actual_${id}`).val());
  precioActual += obtenerVariacionSegundId(id, precioActual);
  precioActual = Math.round(precioActual * 100) / 100
  console.log(precioActual)

  if ($(`#crypto_historial_${id}`).val() === "") {
    $(`#crypto_historial_${id}`).val(precioActual);
    return
  }

  const historial = $(`#crypto_historial_${id}`)
    .val()
    .split(",")
    .map((x) => parseFloat(x));
  historial.push(precioActual);
  $(`#crypto_historial_${id}`).val(historial.splice(-20).join(","));

  $(`#crypto_precio_actual_${id}`).val(precioActual);
}

function obtenerVariacionSegundId(id, precioActual) {
  switch (id) {
    case 1:
      return precioActual * (Math.floor(Math.random() * (2 - 1 + 1)) + 1) / 100
      break;
    case 2:
      return - precioActual * (Math.floor(Math.random() * (1.5 - 1 + 1)) + 1) / 100
      break;
    default:
      return 0;
      break;
  }
}
/*
 * Onclick functions
 */

function iniciar() {
  estado = true;

  $("#iniciar").prop("disabled", true);
  $("#frenar").prop("disabled", false);

  graficarInicio();
}

function frenar() {
  estado = false;

  $("#iniciar").prop("disabled", false);
  $("#frenar").prop("disabled", true);
}

/*
 * Onchange functions
 */

function capitalInicialChange() {
  $("#capital_actual").val(parseFloat($("#capital").val()));
  $("#crypto_precio_actual_0").val(parseFloat($("#capital").val()));
  $("#crypto_inversion_cantidad_0").val(parseFloat($("#capital").val()));
  $("#crypto_inversion_efectivo_0").val(parseFloat($("#capital").val()));
}

function actualizarCapitalActual() {
  let capitalActual = 0;
  $("#tableCryptos tr").each(function (idx, elem) {
    const id = parseFloat(elem.id.replace("crypto_row_", ""));

    const precioActual = parseFloat($(`#crypto_precio_actual_${id}`).val());
    const cantidad = parseFloat($(`#crypto_inversion_cantidad_${id}`).val());
    $(`#crypto_inversion_efectivo_${id}`).val(
      Math.floor(precioActual * cantidad * 100) / 100
    );

    capitalActual += Math.floor(precioActual * cantidad * 100) / 100;
  });

  $("#capital_actual").val(capitalActual);
}

function agregarPerturbacion(val) {
  perturbacion = parseFloat(val);
  $("#perturbacion").val("0");
}

function actualizarCryptoValorActual(id) {
  $(`#crypto_precio_actual_${id}`).val(
    parseFloat($(`#crypto_precio_${id}`).val())
  );
}

/*
 * Utils
 */
function generateLabel() {
  var date = new Date();

  var seconds = date.getSeconds();
  var minutes = date.getMinutes();
  var hour = date.getHours();

  return hour + ":" + minutes + ":" + seconds;
}

/*
 * Grafico capital / capital actual
 */

function graficarInicio() {
  var graphGradient = document
    .getElementById("performanceLine")
    .getContext("2d");
  var saleGradientBg = graphGradient.createLinearGradient(5, 0, 5, 100);
  saleGradientBg.addColorStop(0, "rgba(26, 115, 232, 0.18)");
  saleGradientBg.addColorStop(1, "rgba(26, 115, 232, 0.02)");

  var graphGradient2 = document
    .getElementById("performanceLine")
    .getContext("2d");
  var saleGradientBg2 = graphGradient2.createLinearGradient(100, 0, 50, 150);
  saleGradientBg2.addColorStop(0, "rgba(0, 208, 255, 0.19)");
  saleGradientBg2.addColorStop(1, "rgba(0, 208, 255, 0.03)");

  var graphGradient3 = document
    .getElementById("performanceLine1")
    .getContext("2d");
  var saleGradientBg3 = graphGradient3.createLinearGradient(100, 0, 50, 150);
  saleGradientBg3.addColorStop(0, "rgba(0, 208, 255, 0.19)");
  saleGradientBg3.addColorStop(1, "rgba(0, 208, 255, 0.03)");

  var graphGradient4 = document
    .getElementById("performanceLine2")
    .getContext("2d");
  var saleGradientBg4 = graphGradient4.createLinearGradient(100, 0, 50, 150);
  saleGradientBg4.addColorStop(0, "rgba(0, 208, 255, 0.19)");
  saleGradientBg4.addColorStop(1, "rgba(0, 208, 255, 0.03)");

  chart.data.labels = [generateLabel()];
  chart.data.datasets = [
    {
      label: "Capital nominal",
      data: [parseFloat($("#capital").val())],
      backgroundColor: saleGradientBg,
      borderColor: ["#1F3BB3"],
      borderWidth: 1.5,
      fill: true, // 3: no fill
      pointBorderWidth: 1,
      pointRadius: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      pointHoverRadius: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      pointBackgroundColor: [
        "#1F3BB3)",
        "#1F3BB3",
        "#1F3BB3",
        "#1F3BB3",
        "#1F3BB3)",
        "#1F3BB3",
        "#1F3BB3",
        "#1F3BB3",
        "#1F3BB3)",
        "#1F3BB3",
        "#1F3BB3",
        "#1F3BB3",
        "#1F3BB3)",
      ],
      pointBorderColor: [
        "#fff",
        "#fff",
        "#fff",
        "#fff",
        "#fff",
        "#fff",
        "#fff",
        "#fff",
        "#fff",
        "#fff",
        "#fff",
        "#fff",
        "#fff",
      ],
    },
  ];

  chart.data.datasets.push({
    label: "Capital actual",
    data: [parseFloat($("#capital_actual").val())],
    backgroundColor: saleGradientBg2,
    borderColor: ["#52CDFF"],
    borderWidth: 1.5,
    fill: true, // 3: no fill
    pointBorderWidth: 1,
    pointRadius: [0, 0, 0, 4, 0],
    pointHoverRadius: [0, 0, 0, 2, 0],
    pointBackgroundColor: [
      "#52CDFF)",
      "#52CDFF",
      "#52CDFF",
      "#52CDFF",
      "#52CDFF)",
      "#52CDFF",
      "#52CDFF",
      "#52CDFF",
      "#52CDFF)",
      "#52CDFF",
      "#52CDFF",
      "#52CDFF",
      "#52CDFF)",
    ],
    pointBorderColor: [
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
    ],
  });

  chart1.data.labels = [generateLabel()];
  chart1.data.datasets.push({
    label: "Bitcoin",
    data: [parseFloat($("#crypto_precio_actual_1").val())],
    backgroundColor: saleGradientBg3,
    borderColor: ["#52CDFF"],
    borderWidth: 1.5,
    fill: true, // 3: no fill
    pointBorderWidth: 1,
    pointRadius: [0, 0, 0, 4, 0],
    pointHoverRadius: [0, 0, 0, 2, 0],
    pointBackgroundColor: [
      "#52CDFF)",
      "#52CDFF",
      "#52CDFF",
      "#52CDFF",
      "#52CDFF)",
      "#52CDFF",
      "#52CDFF",
      "#52CDFF",
      "#52CDFF)",
      "#52CDFF",
      "#52CDFF",
      "#52CDFF",
      "#52CDFF)",
    ],
    pointBorderColor: [
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
    ],
  });

  chart2.data.labels = [generateLabel()];
  chart2.data.datasets.push({
    label: "Doge",
    data: [parseFloat($("#crypto_precio_actual_2").val())],
    backgroundColor: saleGradientBg4,
    borderColor: ["#52CDFF"],
    borderWidth: 1.5,
    fill: true, // 3: no fill
    pointBorderWidth: 1,
    pointRadius: [0, 0, 0, 4, 0],
    pointHoverRadius: [0, 0, 0, 2, 0],
    pointBackgroundColor: [
      "#52CDFF)",
      "#52CDFF",
      "#52CDFF",
      "#52CDFF",
      "#52CDFF)",
      "#52CDFF",
      "#52CDFF",
      "#52CDFF",
      "#52CDFF)",
      "#52CDFF",
      "#52CDFF",
      "#52CDFF",
      "#52CDFF)",
    ],
    pointBorderColor: [
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
      "#fff",
    ],
  });

  chart.update();
  chart1.update();
  chart2.update();
}

function actualizarGraficos() {
  const label = generateLabel();

  chart.data.labels.push(label);
  chart.data.datasets[0].data.push(parseFloat($("#capital").val()));
  chart.data.datasets[1].data.push(parseFloat($("#capital_actual").val()));

  chart1.data.labels.push(label);
  chart1.data.datasets[0].data.push(
    parseFloat($("#crypto_precio_actual_1").val())
  );

  chart2.data.labels.push(label);
  chart2.data.datasets[0].data.push(
    parseFloat($("#crypto_precio_actual_2").val())
  );

  chart.update();
  chart1.update();
  chart2.update();
}

(function ($) {
  "use strict";
  $(function () {
    if ($("#performanceLine").length) {
      const ctx = document.getElementById("performanceLine");

      chart = new Chart(ctx, {
        type: "line",
        data: {
          labels: [],
          datasets: [],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          elements: {
            line: {
              tension: 0.4,
            },
          },

          scales: {
            y: {
              border: {
                display: false,
              },
              grid: {
                display: true,
                color: "#F0F0F0",
                drawBorder: false,
              },
              ticks: {
                beginAtZero: false,
                autoSkip: true,
                maxTicksLimit: 4,
                color: "#6B778C",
                font: {
                  size: 10,
                },
              },
            },
            x: {
              border: {
                display: false,
              },
              grid: {
                display: false,
                drawBorder: false,
              },
              ticks: {
                beginAtZero: false,
                autoSkip: true,
                maxTicksLimit: 7,
                color: "#6B778C",
                font: {
                  size: 10,
                },
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
          },
        },
        plugins: [
          {
            afterDatasetUpdate: function (chart, args, options) {
              const chartId = chart.canvas.id;
              var i;
              const legendId = `${chartId}-legend`;
              const ul = document.createElement("ul");
              for (i = 0; i < chart.data.datasets.length; i++) {
                ul.innerHTML += `
                <li>
                  <span style="background-color: ${chart.data.datasets[i].borderColor}"></span>
                  ${chart.data.datasets[i].label}
                </li>
              `;
              }
              return document.getElementById(legendId).appendChild(ul);
            },
          },
        ],
      });
    }
    if ($("#performanceLine1").length) {
      const ctx = document.getElementById("performanceLine1");

      chart1 = new Chart(ctx, {
        type: "line",
        data: {
          labels: [],
          datasets: [],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          elements: {
            line: {
              tension: 0.4,
            },
          },

          scales: {
            y: {
              border: {
                display: false,
              },
              grid: {
                display: true,
                color: "#F0F0F0",
                drawBorder: false,
              },
              ticks: {
                beginAtZero: false,
                autoSkip: true,
                maxTicksLimit: 4,
                color: "#6B778C",
                font: {
                  size: 10,
                },
              },
            },
            x: {
              border: {
                display: false,
              },
              grid: {
                display: false,
                drawBorder: false,
              },
              ticks: {
                beginAtZero: false,
                autoSkip: true,
                maxTicksLimit: 7,
                color: "#6B778C",
                font: {
                  size: 10,
                },
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
          },
        },
      });
    }

    if ($("#performanceLine2").length) {
      const ctx = document.getElementById("performanceLine2");

      chart2 = new Chart(ctx, {
        type: "line",
        data: {
          labels: [],
          datasets: [],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          elements: {
            line: {
              tension: 0.4,
            },
          },

          scales: {
            y: {
              border: {
                display: false,
              },
              grid: {
                display: true,
                color: "#F0F0F0",
                drawBorder: false,
              },
              ticks: {
                beginAtZero: false,
                autoSkip: true,
                maxTicksLimit: 4,
                color: "#6B778C",
                font: {
                  size: 10,
                },
              },
            },
            x: {
              border: {
                display: false,
              },
              grid: {
                display: false,
                drawBorder: false,
              },
              ticks: {
                beginAtZero: false,
                autoSkip: true,
                maxTicksLimit: 7,
                color: "#6B778C",
                font: {
                  size: 10,
                },
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
          },
        },
      });
    }
  });
})(jQuery);
