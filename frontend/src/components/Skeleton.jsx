import React from "react";

function Linea({ ancho = "100%", alto = 13 }) {
  return (
    <span
      className="skeleton-linea"
      style={{ width: ancho, height: alto }}
      aria-hidden="true"
    />
  );
}

function Bloque({ children, label }) {
  return (
    <div className="skeleton-bloque" role="status" aria-label={label}>
      {children}
    </div>
  );
}

export function SkeletonTarjetas({ cantidad = 4 }) {
  return (
    <Bloque label="Cargando indicadores">
      <div className="skeleton-tarjetas">
        {Array.from({ length: cantidad }, (_, indice) => (
          <div className="skeleton-tarjeta" key={indice}>
            <Linea ancho="55%" alto={11} />
            <Linea ancho="35%" alto={26} />
            <Linea ancho="70%" alto={10} />
          </div>
        ))}
      </div>
    </Bloque>
  );
}

export function SkeletonTabla({ filas = 6 }) {
  return (
    <Bloque label="Cargando reportes">
      <div className="skeleton-tabla">
        <div className="skeleton-fila skeleton-fila-cabecera">
          <Linea ancho="70%" alto={10} />
          <Linea ancho="80%" alto={10} />
          <Linea ancho="60%" alto={10} />
          <Linea ancho="50%" alto={10} />
        </div>
        {Array.from({ length: filas }, (_, indice) => (
          <div className="skeleton-fila" key={indice}>
            <Linea ancho="80%" alto={12} />
            <Linea ancho="95%" alto={12} />
            <Linea ancho="65%" alto={12} />
            <Linea ancho={indice % 2 === 0 ? "45%" : "70%"} alto={12} />
          </div>
        ))}
      </div>
    </Bloque>
  );
}

export function SkeletonDetalle() {
  return (
    <Bloque label="Cargando detalle del reporte">
      <div className="skeleton-detalle">
        <Linea ancho="42%" alto={11} />
        <Linea ancho="85%" alto={22} />
        <Linea ancho="30%" alto={11} />
        <div className="skeleton-separador" />
        <Linea ancho="100%" alto={12} />
        <Linea ancho="92%" alto={12} />
        <Linea ancho="74%" alto={12} />
        <div className="skeleton-separador" />
        <Linea ancho="38%" alto={12} />
        <div className="skeleton-caja" />
      </div>
    </Bloque>
  );
}

export function SkeletonMapa() {
  return (
    <Bloque label="Cargando mapa">
      <div className="skeleton-mapa">
        <span className="skeleton-mapa-marca" aria-hidden="true">
          ◎
        </span>
        <span>Cargando mapa de Los Mochis...</span>
      </div>
    </Bloque>
  );
}
