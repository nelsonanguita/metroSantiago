// netlify/functions/metro.js
// Esta función actúa como proxy HTTPS hacia tu backend HTTP


exports.handler = async (event) => {

  const apiKey = process.env.BACKEND_URL;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "BACKEND_URL no definido" }),
    };
  }

  // Extrae el sub-path: /api/metro/estaciones → /test/estaciones
  const path = event.path.replace('/.netlify/functions/metro', '') || '/test/estaciones';

  try {
    const response = await fetch(`${apiKey}${path}`);

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Error del backend: ${response.statusText}` }),
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'No se pudo conectar al backend', detalle: error.message }),
    };
  }
};
