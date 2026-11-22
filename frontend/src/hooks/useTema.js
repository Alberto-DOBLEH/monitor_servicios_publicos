import { useCallback, useEffect, useState } from "react";

const CLAVE = "msp_tema";

function leerTemaGuardado() {
  if (typeof window === "undefined") return "claro";

  try {
    return window.localStorage.getItem(CLAVE) === "oscuro" ? "oscuro" : "claro";
  } catch {
    return "claro";
  }
}

export function useTema() {
  const [tema, setTema] = useState(leerTemaGuardado);

  useEffect(() => {
    document.documentElement.dataset.tema = tema;

    try {
      window.localStorage.setItem(CLAVE, tema);
    } catch {
      // Almacenamiento no disponible (modo privado): el tema sigue funcionando.
    }
  }, [tema]);

  const alternarTema = useCallback(() => {
    setTema((actual) => (actual === "claro" ? "oscuro" : "claro"));
  }, []);

  return { tema, alternarTema };
}
