const token = "fu1yw9ap56e2bkhnx81l";
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
