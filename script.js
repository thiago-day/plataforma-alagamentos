const pontos = [
    {
      nome: "R. Antônio da Veiga",
      latitude: -26.905573,
      longitude: -49.077119,
      nivel: 0.2
    },
    {
      nome: "Parque das Itoupavas", 
      latitude: -26.860641,
      longitude: -49.081174,
      nivel: 0.6
    },
    {
      nome: "R. Gustavo Zimmermann",
      latitude: -26.847150,
      longitude: -49.084279,
      nivel: 1.2
    }
  ];
  
  function classificarNivel(nivel) {
    if (nivel < 0.5) return { status: "Normal", cor: "green" };
    if (nivel < 1.0) return { status: "Atenção", cor: "orange" };
    return { status: "Crítico", cor: "red" };
  }
  
  const map = L.map('map').setView([-26.8772, -49.0818], 14.3);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; OpenStreetMap contributors'
  }).addTo(map);
  
  pontos.forEach(ponto => {
    const { status, cor } = classificarNivel(ponto.nivel);
    const marker = L.circleMarker([ponto.latitude, ponto.longitude], {
      radius: 10,
      color: cor,
      fillColor: cor,
      fillOpacity: 0.8
    }).addTo(map);
  
    marker.bindPopup(`
      <b>${ponto.nome}</b><br>
      Nível: ${ponto.nivel} m<br>
      Estado: ${status}
    `);
  });
  