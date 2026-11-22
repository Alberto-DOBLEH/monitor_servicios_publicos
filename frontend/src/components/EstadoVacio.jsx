import React from "react";

export default function EstadoVacio({
  titulo = "Sin resultados",
  descripcion = "Prueba con otros filtros para encontrar reportes.",
  accion,
}) {
  return (
    <div className="estado-vacio estado-vacio-ux">
      <span className="estado-vacio-icono" aria-hidden="true">
        ◇
      </span>
      <strong>{titulo}</strong>
      <span>{descripcion}</span>
      {accion?.onClick && (
        <button
          type="button"
          className="btn btn-secondary btn-vacio"
          onClick={accion.onClick}
        >
          {accion.etiqueta || "Reintentar"}
        </button>
      )}
    </div>
  );
}
