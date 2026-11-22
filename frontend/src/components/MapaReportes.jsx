import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";

const SIMBOLOS_ESTADO = {
  PENDIENTE: "!",
  EN_PROCESO: "~",
  COMPLETADO: "✓",
  RECHAZADO: "×",
  ARCHIVADO: "–",
};

const crearIcono = (color, estado, seleccionado) =>
  L.divIcon({
    className: "marker-leaflet",
    html: `<div class="marker-punto${seleccionado ? " marker-seleccionado" : ""}" style="--marker-color:${color || "#0f766e"}">
             <span>${SIMBOLOS_ESTADO[estado] || "•"}</span>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 30],
    popupAnchor: [0, -28],
  });

const crearIconoCluster = (cluster) =>
  L.divIcon({
    className: "cluster-leaflet",
    html: `<div class="cluster-punto"><span>${cluster.getChildCount()}</span></div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });

/** Mantiene el mapa dentro de Los Mochis y enfoca el reporte seleccionado. */
function AjustarVista({ geo, seleccionado }) {
  const mapa = useMap();

  useEffect(() => {
    if (!geo?.centro || !geo?.limites) return;

    const { latMin, latMax, lngMin, lngMax } = geo.limites;
    mapa.setMaxBounds(L.latLngBounds([latMin, lngMin], [latMax, lngMax]));
    mapa.fitBounds(
      L.latLngBounds([latMin, lngMin], [latMax, lngMax]),
      { padding: [24, 24] },
    );
  }, [mapa, geo]);

  useEffect(() => {
    if (!seleccionado) return;

    mapa.flyTo(
      [Number(seleccionado.latitud), Number(seleccionado.longitud)],
      Math.max(mapa.getZoom(), 16),
      { duration: 0.8 },
    );
  }, [mapa, seleccionado]);

  return null;
}

export default function MapaReportes({
  geo,
  reportes,
  seleccionado,
  onSeleccionar,
  agrupar = false,
}) {
  const centro = useMemo(
    () => [geo?.centro?.lat ?? 25.7904, geo?.centro?.lng ?? -108.9858],
    [geo],
  );

  const marcadores = reportes.map((reporte) => (
    <Marker
      key={reporte.id_reporte}
      position={[Number(reporte.latitud), Number(reporte.longitud)]}
      icon={crearIcono(
        reporte.categoria?.color,
        reporte.estado,
        seleccionado?.id_reporte === reporte.id_reporte,
      )}
      eventHandlers={{
        click: () => onSeleccionar(reporte),
      }}
    >
      <Popup>
        <div className="popup-reporte">
          <strong>{reporte.folio}</strong>
          <span>{reporte.titulo}</span>
          <small>
            {reporte.categoria?.nombre} · {reporte.estado.replaceAll("_", " ")}
          </small>
        </div>
      </Popup>
    </Marker>
  ));

  if (!geo) {
    return (
      <div className="mapa-vacio">
        <div className="spinner" />
        <span>Cargando mapa de Los Mochis...</span>
      </div>
    );
  }

  return (
    <div className="mapa-contenedor">
      <MapContainer
        center={centro}
        zoom={geo.zoom || 13}
        minZoom={12}
        maxZoom={18}
        maxBoundsViscosity={1}
        scrollWheelZoom
        className="mapa-leaflet"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <AjustarVista geo={geo} seleccionado={seleccionado} />

        {agrupar ? (
          <MarkerClusterGroup
            chunkedLoading
            showCoverageOnHover={false}
            spiderfyOnMaxZoom
            maxClusterRadius={55}
            iconCreateFunction={crearIconoCluster}
          >
            {marcadores}
          </MarkerClusterGroup>
        ) : (
          marcadores
        )}
      </MapContainer>

      <div className="mapa-leyenda">
        <span className="mapa-leyenda-titulo">Estados</span>
        <span><i className="leyenda-punto leyenda-pendiente" />Pendiente</span>
        <span><i className="leyenda-punto leyenda-proceso" />En proceso</span>
        <span><i className="leyenda-punto leyenda-completado" />Completado</span>
        <span><i className="leyenda-punto leyenda-rechazado" />Rechazado</span>
      </div>
    </div>
  );
}
