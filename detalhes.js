// === CONFIGURAÇÕES ===
const token = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJtZXV2aXN1YWxpemFkb3JAZ21haWwuY29tIiwidXNlcklkIjoiMGI4OGE5ZDAtMzVkNC0xMWYwLTk2NjQtZmYxM2VjY2I0N2ZmIiwic2NvcGVzIjpbIkNVU1RPTUVSX1VTRVIiXSwic2Vzc2lvbklkIjoiMTdiMzVlOTItOGI3MS00NmQ4LWEwYzEtOGY2NzZkMTk2YmZkIiwiZXhwIjoxNzU0MDc5NjQyLCJpc3MiOiJ0aGluZ3Nib2FyZC5pbyIsImlhdCI6MTc1MjI3OTY0MiwiZW5hYmxlZCI6dHJ1ZSwicHJpdmFjeVBvbGljeUFjY2VwdGVkIjpmYWxzZSwiaXNQdWJsaWMiOmZhbHNlLCJ0ZW5hbnRJZCI6IjA3YTIxYjgwLTA5MGItMTFmMC05ODFkLTU3ZDYxMWI4MDczNCIsImN1c3RvbWVySWQiOiJiOTE5ZTkyMC0zNWQzLTExZjAtOTY2NC1mZjEzZWNjYjQ3ZmYifQ.2ZzxvOLFlPECXEIEGEozd_v3cA1GYHJOhgeFIeXg9cQVpz_3umJQgFIYosVO30flwR0YNN1zJCTWOVUCNsmYIg";
const deviceId = "bccae870-090b-11f0-981d-57d611b80734";
let configSensores = {};
let grafico = null;

const params = new URLSearchParams(window.location.search);
const chave = params.get("chave");

if (!chave) {
  alert("Chave de estação não fornecida.");
  window.close();
}

fetch("config-sensores.json")
  .then(res => res.json())
  .then(config => {
    configSensores = config;
    const sensor = configSensores[chave];
    if (!sensor) {
      alert("Estação não encontrada.");
      window.close();
    }

    document.getElementById("tituloEstacao").innerText = sensor.nome;
    document.getElementById("inputAtencao").value = sensor.limite_atencao;
    document.getElementById("inputCritico").value = sensor.limite_critico;

    document.getElementById("btnSalvarSetpoints").onclick = () => {
      sensor.limite_atencao = parseFloat(document.getElementById("inputAtencao").value);
      sensor.limite_critico = parseFloat(document.getElementById("inputCritico").value);
      alert("Setpoints atualizados localmente.");
    };

    buscarNivelAtual();
    buscarHistorico();
  });

function buscarNivelAtual() {
  fetch(`https://demo.thingsboard.io/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${chave}`, {
    headers: { "X-Authorization": `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(dados => {
      const valor = parseFloat(dados[chave][0].value);
      document.getElementById("nivelAtual").innerText = valor.toFixed(2);
    });
}

function buscarHistorico() {
  const agora = Date.now();
  const umDiaAtras = agora - 24 * 60 * 60 * 1000;

  const url = `https://demo.thingsboard.io/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${chave}&startTs=${umDiaAtras}&endTs=${agora}&limit=1000&agg=NONE`;

  fetch(url, {
    headers: { "X-Authorization": `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(dados => {
      const historico = dados[chave];
      const labels = historico.map(p => new Date(p.ts).toLocaleTimeString("pt-BR"));
      const valores = historico.map(p => parseFloat(p.value));
      montarGrafico(labels, valores);
    });
}

function montarGrafico(labels, valores) {
  if (grafico) grafico.destroy();
  const ctx = document.getElementById("graficoHistorico").getContext("2d");
  grafico = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Nível (m)",
        data: valores,
        borderColor: "blue",
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Hora" } },
        y: { title: { display: true, text: "Nível (m)" } }
      }
    }
  });
}
}
