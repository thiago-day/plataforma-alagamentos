const token = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJtZXV2aXN1YWxpemFkb3JAZ21haWwuY29tIiwidXNlcklkIjoiMGI4OGE5ZDAtMzVkNC0xMWYwLTk2NjQtZmYxM2VjY2I0N2ZmIiwic2NvcGVzIjpbIkNVU1RPTUVSX1VTRVIiXSwic2Vzc2lvbklkIjoiOTU0MGRkZTktYTgxNS00NmY0LTk2ZjMtYWUwY2NhN2Q5ZTA1IiwiZXhwIjoxNzUzMTI1NTQ4LCJpc3MiOiJ0aGluZ3Nib2FyZC5pbyIsImlhdCI6MTc1MTMyNTU0OCwiZW5hYmxlZCI6dHJ1ZSwicHJpdmFjeVBvbGljeUFjY2VwdGVkIjpmYWxzZSwiaXNQdWJsaWMiOmZhbHNlLCJ0ZW5hbnRJZCI6IjA3YTIxYjgwLTA5MGItMTFmMC05ODFkLTU3ZDYxMWI4MDczNCIsImN1c3RvbWVySWQiOiJiOTE5ZTkyMC0zNWQzLTExZjAtOTY2NC1mZjEzZWNjYjQ3ZmYifQ.YbE7BH1RyuRI-XEBDfjcjbhLLuM31q_j35Z4gqGcxkna4m8UaEkoK-4i42modJ8OEt9h0bNzpnMTIgSYIOOq-A";
const deviceId = "bccae870-090b-11f0-981d-57d611b80734";
let configSensores = {};
let mapa = null;
let marcadores = {};

fetch("config-sensores.json")
  .then(response => response.json())
  .then(config => {
    configSensores = config;
    const chaves = Object.keys(configSensores).join(",");

    // Inicializa o mapa
    mapa = L.map('map').setView([-23.5505, -46.6333], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; OpenStreetMap contributors'
    }).addTo(mapa);

    atualizarSensores(chaves);
    setInterval(() => atualizarSensores(chaves), 30000); // Atualiza a cada 30s
  });

function atualizarSensores(chaves) {
  fetch(`https://demo.thingsboard.io/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${chaves}`, {
    headers: {
      "X-Authorization": `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .then(telemetria => {
      for (let chave in telemetria) {
        const ponto = configSensores[chave];
        if (!ponto) continue;

        const valorNivel = parseFloat(telemetria[chave][0].value);
        const { status, cor } = classificarNivel(
          valorNivel,
          ponto.limite_atencao,
          ponto.limite_critico
        );

        // Remove marcador anterior, se existir
        if (marcadores[chave]) {
          mapa.removeLayer(marcadores[chave]);
        }

        const marcador = L.circleMarker([ponto.latitude, ponto.longitude], {
          radius: 10,
          color: cor,
          fillColor: cor,
          fillOpacity: 0.8
        }).addTo(mapa);

        marcador.bindPopup(`
          <b>${ponto.nome}</b><br>
          Nível: ${valorNivel.toFixed(2)} m<br>
          Estado: ${status}
        `);

        marcadores[chave] = marcador;
      }
    });
}

function classificarNivel(nivel, limiteAtencao, limiteCritico) {
  if (nivel < limiteAtencao) return { status: "Normal", cor: "green" };
  if (nivel < limiteCritico) return { status: "Atenção", cor: "orange" };
  return { status: "Crítico", cor: "red" };
}
