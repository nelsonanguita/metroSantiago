import { geojsonData } from './dataGeo.js';
console.log(geojsonData)
// Inicializar el mapa centrado en Santiago
const map = L.map('map').setView([-33.45, -70.65], 11);

// Capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Definir colores para cada línea
const lineColors = {
    'Linea 1': '#e6001f',
    'Linea 2': '#ffb81c',
    'Linea 3': '#935b0c',
    'Linea 4': '#032981',
    'Linea 4A': '#42b6c4',
    'Linea 5': '#07f426',
    'Linea 6': '#850fc1'
};

// Función para obtener el nombre limpio de la línea
function getLineName(lineProperty) {
    if (!lineProperty)
        return 'Linea 1';

    // Normalizar el nombre de la línea
    let lineName = lineProperty.trim().toLowerCase();

    // Extraer el número de línea
    const match = lineName.match(/linea\s*(\d+)([a-z]*)/);
    if (match) {
        const lineNumber = match[1];
        const suffix = match[2] ? match[2].toUpperCase() : '';
        return `Linea ${lineNumber}${suffix}`;
    }

    return 'Linea 1';
}

const metroData = fetch('/test/estaciones').then(response => response.json()).then(data => {

    //  console.log('Estado del Metro de Santiago:', data);
    // Aquí puedes agregar código para actualizar la interfaz de usuario con los datos obtenidos
    contarEstaciones(data);
    return data;

}
).catch(error => {
    console.error('Error al obtener el estado del Metro:', error);
}
);

// Datos del estado de las estaciones
function contarEstaciones(metroData) {
    console.log(metroData)
    const estaciones = metroData.estaciones.l1.estaciones.concat(metroData.estaciones.l2.estaciones).concat(metroData.estaciones.l3.estaciones).concat(metroData.estaciones.l4.estaciones).concat(metroData.estaciones.l4a.estaciones).concat(metroData.estaciones.l5.estaciones).concat(metroData.estaciones.l6.estaciones);

    const total = estaciones.length;
    const habilitadas = estaciones.filter(e => e.descripcion_app === "Habilitada").length;
    const deshabilitadas = total - habilitadas;

    document.getElementById('estaciones_habilitadas').textContent = `${habilitadas} estaciones habilitadas`;
    document.getElementById('estaciones_problemas').textContent = `${deshabilitadas} estaciones con problemas`;

    let mensaje = []

    mensaje.push(metroData.estaciones.l1.mensaje)
    mensaje.push(metroData.estaciones.l2.mensaje)
    mensaje.push(metroData.estaciones.l3.mensaje)
    mensaje.push(metroData.estaciones.l4.mensaje)
    mensaje.push(metroData.estaciones.l4a.mensaje)
    mensaje.push(metroData.estaciones.l5.mensaje)
    mensaje.push(metroData.estaciones.l6.mensaje)

    const mensajesUnicos = [...new Set(mensaje)];

    document.getElementById('estaciones_mensajes').textContent = mensajesUnicos

}

// Crear clusters de marcadores para cada línea
const lineGroups = {};

// Crear un grupo para cada línea
Object.keys(lineColors).forEach(lineName => {
    lineGroups[lineName] = L.layerGroup().addTo(map);
}
);

// Función para normalizar nombres de estaciones
function normalizeStationName(name) {
    return name.trim().toUpperCase().replace('L1', '').replace('L2', '').replace('L3', '').replace('L4', '').replace('L5', '').replace('L6', '').replace('L4A', '').replace('L 4A', '').replace('ESTACION', '').replace(/Á/g, 'A').replace(/É/g, 'E').replace(/Í/g, 'I').replace(/Ó/g, 'O').replace(/Ú/g, 'U').replace(/Ñ/g, 'N').replace(/\s+/g, ' ').trim();
}

// Función para encontrar el estado de una estación
function findStationStatus(stationName, lineName) {
    // Normalizar el nombre de la estación
    const normalizedStationName = normalizeStationName(stationName);

    // Buscar en los datos de metroData
    const lineKey = lineName.toLowerCase().replace('linea ', 'l').replace('a', '');
let station ={}
    if (metroData[lineKey] && metroData[lineKey].estaciones) {
        for (const station of metroData[lineKey].estaciones) {
            const normalizedDataName = normalizeStationName(station.nombre);

            // Comprobar si los nombres coinciden o son muy similares
            if (normalizedDataName.includes(normalizedStationName) || normalizedStationName.includes(normalizedDataName)) {
                station.descripcion_app;
                station.mensaje;
                return station
            }
        }
    }

        station.status = "Habilitada";
        station.mensaje = '';
    return station;
}

// Función para determinar si una estación es de transferencia
function isTransferStation(stationName, lineName) {
    const normalizedStationName = normalizeStationName(stationName);
    const lineKey = lineName.toLowerCase().replace('linea ', 'l').replace('a', '');

    if (metroData[lineKey] && metroData[lineKey].estaciones) {
        for (const station of metroData[lineKey].estaciones) {
            const normalizedDataName = normalizeStationName(station.nombre);

            if (normalizedDataName.includes(normalizedStationName) || normalizedStationName.includes(normalizedDataName)) {
                return !!station.combinacion;
            }
        }
    }

    return false;
}

// Agregar marcadores para cada estación
geojsonData.features.forEach(feature => {
    const { properties, geometry } = feature;
    const { nombre, linea } = properties;
    const [lng, lat] = geometry.coordinates;

    // Obtener el nombre normalizado de la línea
    const lineName = getLineName(linea);

    // Obtener el color de la línea
    const color = lineColors[lineName] || '#333';

    // Obtener el estado de la estación
    const {status, mensaje} = findStationStatus(nombre, lineName);
console.log(status)
    // Determinar si es una estación de transferencia
    const isTransfer = isTransferStation(nombre, lineName);

    // Crear el marcador
    const marker = L.circleMarker([lat, lng], {
        radius: isTransfer ? 7 : 6,
        fillColor: status === "Habilitada" ? color : "#888",
        color: isTransfer ? "#FF6F00" : "#FFF",
        weight: isTransfer ? 2 : 1,
        opacity: 1,
        fillOpacity: status === "Habilitada" ? 1 : 0.6,
        className: 'station-marker'
    });

    // Crear el popup
    const popupContent = `
        <strong>${nombre}</strong><br>
        Línea: ${lineName}<br>
        Estado: <span style="color: ${status === "Habilitada" ? '#2e7d32' : '#d32f2f'}">${status}</span><br>
        <span style="display: ${status === "Habilitada" ? 'none' : 'block'}">Mensaje: ${mensaje}</span><br>
      `;

    marker.bindPopup(popupContent);

    // Añadir el marcador al grupo de su línea
    if (lineGroups[lineName]) {
        lineGroups[lineName].addLayer(marker);
    } else {
        // Si la línea no existe en lineGroups, crear un nuevo grupo
        lineGroups[lineName] = L.layerGroup().addTo(map);
        lineGroups[lineName].addLayer(marker);
    }
}
);

// Crear control de capas para las líneas
const overlays = {};
Object.keys(lineGroups).forEach(lineName => {
    overlays[lineName] = lineGroups[lineName];
}
);

// Añadir control de capas al mapa
L.control.layers(null, overlays).addTo(map);

// Añadir escala al mapa
L.control.scale().addTo(map);
