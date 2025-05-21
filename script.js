const token = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJtZXV2aXN1YWxpemFkb3JAZ21haWwuY29tIiwidXNlcklkIjoiMGI4OGE5ZDAtMzVkNC0xMWYwLTk2NjQtZmYxM2VjY2I0N2ZmIiwic2NvcGVzIjpbIkNVU1RPTUVSX1VTRVIiXSwic2Vzc2lvbklkIjoiNTYxZjE5M2UtNzdhOS00MDZkLTliNzktZGVjYWU0MDE2MjhhIiwiZXhwIjoxNzQ5NTg1MjcxLCJpc3MiOiJ0aGluZ3Nib2FyZC5pbyIsImlhdCI6MTc0Nzc4NTI3MSwiZW5hYmxlZCI6dHJ1ZSwicHJpdmFjeVBvbGljeUFjY2VwdGVkIjpmYWxzZSwiaXNQdWJsaWMiOmZhbHNlLCJ0ZW5hbnRJZCI6IjA3YTIxYjgwLTA5MGItMTFmMC05ODFkLTU3ZDYxMWI4MDczNCIsImN1c3RvbWVySWQiOiJiOTE5ZTkyMC0zNWQzLTExZjAtOTY2NC1mZjEzZWNjYjQ3ZmYifQ.e-uZsmd78QjffAvl5mJ3lFxUo-TkAkGBm8Dciy6GbqUjfqNNv_nkGOXxnbyWEdos-NV8XvpTlLcCuyR33PBpTw";
const deviceId = "bccae870-090b-11f0-981d-57d611b80734";
let configSensores = {};
let mapa = null;
let marcadores = {};

fetch("config-sensores.json")
  .then(response => response.json())
  .then(config => {
    configSensores = config;
    const sensorKeys = Object.keys(configSensores).join(",");

    // Inicializa o mapa
    mapa = L.map('map').setView([-23.5505, -46.6333], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; OpenStreetMap contributors'
    }).addTo(mapa);

    // Atualiza os dados pela primeira vez
    atualizarSensores(sensorKeys);

    // Atualiza a cada 30 segundos
    setInterval(() => atualizarSensores(sensorKeys), 30000);
  });

function atualizarSensores(sensorKeys) {
  fetch(`https://demo.thingsboard.io/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${sensorKeys}`, {
    headers: {
      "X-Authorization": `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .then(telemetria => {
      for (let sensor in telemetria) {
        const dadosSensor = configSensores[sensor];
        if (!dadosSensor) continue;

        const valorNivel = parseFloat(telemetria[sensor][0].value);
        const { status, cor } = classificarNivel(valorNivel);

        // Se já existir marcador, remova
        if (marcadores[sensor]) {
          mapa.removeLayer(marcadores[sensor]);
        }

        // Cria novo marcador
        const marker = L.circleMarker([dadosSensor.latitude, dadosSensor.longitude], {
          radius: 10,
          color: cor,
          fillColor: cor,
          fillOpacity: 0.8
        }).addTo(mapa);

        marker.bindPopup(`
          <b>${dadosSensor.nome}</b><br>
          Nível: ${valorNivel.toFixed(2)} m<br>
          Estado: ${status}
        `);

        marcadores[sensor] = marker;
      }
    });
}

function classificarNivel(nivel) {
  if (nivel < 0.5) return { status: "Normal", cor: "green" };
  if (nivel < 1.0) return { status: "Atenção", cor: "orange" };
  return { status: "Crítico", cor: "red" };
}
