// === CONFIGURAÇÕES ===
const token = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJtZXV2aXN1YWxpemFkb3JAZ21haWwuY29tIiwidXNlcklkIjoiMGI4OGE5ZDAtMzVkNC0xMWYwLTk2NjQtZmYxM2VjY2I0N2ZmIiwic2NvcGVzIjpbIkNVU1RPTUVSX1VTRVIiXSwic2Vzc2lvbklkIjoiOTU0MGRkZTktYTgxNS00NmY0LTk2ZjMtYWUwY2NhN2Q5ZTA1IiwiZXhwIjoxNzUzMTI1NTQ4LCJpc3MiOiJ0aGluZ3Nib2FyZC5pbyIsImlhdCI6MTc1MTMyNTU0OCwiZW5hYmxlZCI6dHJ1ZSwicHJpdmFjeVBvbGljeUFjY2VwdGVkIjpmYWxzZSwiaXNQdWJsaWMiOmZhbHNlLCJ0ZW5hbnRJZCI6IjA3YTIxYjgwLTA5MGItMTFmMC05ODFkLTU3ZDYxMWI4MDczNCIsImN1c3RvbWVySWQiOiJiOTE5ZTkyMC0zNWQzLTExZjAtOTY2NC1mZjEzZWNjYjQ3ZmYifQ.YbE7BH1RyuRI-XEBDfjcjbhLLuM31q_j35Z4gqGcxkna4m8UaEkoK-4i42modJ8OEt9h0bNzpnMTIgSYIOOq-A";
const deviceId = "bccae870-090b-11f0-981d-57d611b80734";

// === COLETA DA CHAVE VIA URL ===
const params = new URLSearchParams(window.location.search);
const chave = params.get("chave");

if (!chave) {
  document.getElementById("info").innerText = "Chave não fornecida na URL.";
  throw new Error("Chave ausente");
}

// === OBTÉM CONFIGURAÇÃO DO SENSOR ===
fetch("config-sensores.json")
  .then(res => res.json())
  .then(config => {
    const sensor = config[chave];
    if (!sensor) throw new Error("Chave não encontrada no configurador");

    document.getElementById("titulo").innerText = sensor.nome;
    document.getElementById("info").innerHTML = `
      <p>Localização: ${sensor.latitude}, ${sensor.longitude}</p>
      <p>Classificação:</p>
      <ul>
        <li>Normal: abaixo de ${sensor.limite_atencao} m</li>
        <li>Atenção: ${sensor.limite_atencao} a ${sensor.limite_critico} m</li>
        <li>Crítico: acima de ${sensor.limite_critico} m</li>
      </ul>
    `;

    buscarHistorico(chave);
  });

// === FUNÇÃO PARA BUSCAR DADOS HISTÓRICOS ===
function buscarHistorico(chave) {
  const agora = Date.now();
  const umDiaAtras = agora - 24 * 60 * 60 * 1000;

  const url = `https://demo.thingsboard.io/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${chave}&startTs=${umDiaAtras}&endTs=${agora}&interval=600000&limit=1000&agg=AVG`;

  fetch(url, {
    headers: { "X-Authorization": `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(dados => {
      const historico = dados[chave];
      const labels = historico.map(p => new Date(p.ts).toLocaleTimeString("pt-BR"));
      const valores = historico.map(p => parseFloat(p.value));
      montarGrafico(labels, valores);
    })
    .catch(erro => {
      console.error("Erro ao buscar dados do ThingsBoard:", erro);
      document.getElementById("graficoHistorico").outerHTML = "<p>Erro ao carregar gráfico.</p>";
    });
}

// === FUNÇÃO PARA MONTAR GRÁFICO ===
function montarGrafico(labels, valores) {
  new Chart(document.getElementById("graficoHistorico"), {
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
