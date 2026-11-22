import React from "react";
import { useTema } from "../hooks/useTema";

export default function BotonTema({ className = "" }) {
  const { tema, alternarTema } = useTema();
  const oscuro = tema === "oscuro";
  const etiqueta = oscuro ? "Activar modo claro" : "Activar modo oscuro";

  return (
    <button
      type="button"
      className={`tema-toggle ${className}`.trim()}
      onClick={alternarTema}
      aria-pressed={oscuro}
      aria-label={etiqueta}
      title={etiqueta}
    >
      <span aria-hidden="true">{oscuro ? "☀" : "☾"}</span>
      <span className="tema-toggle-texto">{oscuro ? "Modo claro" : "Modo oscuro"}</span>
    </button>
  );
}
