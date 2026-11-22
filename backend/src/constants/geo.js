/**
 * Alcance geográfico del proyecto: únicamente Los Mochis, Sinaloa.
 *
 * Los límites son configurables. Si se cuenta con el polígono oficial
 * de la ciudad, se puede reemplazar esta validación por una geometría.
 */
const LOS_MOCHIS = {
  center: {
    lat: 25.7904,
    lng: -108.9858,
  },
  zoom: 13,
  bounds: {
    latMin: 25.70,
    latMax: 25.88,
    lngMin: -109.06,
    lngMax: -108.91,
  },
};

const dentroDeLosMochis = (latitud, longitud) => {
  const lat = Number(latitud);
  const lng = Number(longitud);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }

  const { latMin, latMax, lngMin, lngMax } = LOS_MOCHIS.bounds;

  return lat >= latMin && lat <= latMax && lng >= lngMin && lng <= lngMax;
};

module.exports = {
  LOS_MOCHIS,
  dentroDeLosMochis,
};
