import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const ToastContext = createContext(null);
const TIEMPO_VIDA = 4200;

export function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([]);
  const contador = useRef(0);

  const cerrar = useCallback((id) => {
    setAvisos((actuales) => actuales.filter((aviso) => aviso.id !== id));
  }, []);

  const notificar = useCallback((mensaje, tipo = "info") => {
    contador.current += 1;
    const id = contador.current;
    setAvisos((actuales) => [...actuales.slice(-2), { id, mensaje, tipo }]);
    return id;
  }, []);

  useEffect(() => {
    if (avisos.length === 0) return undefined;

    const temporizadores = avisos.map((aviso) =>
      window.setTimeout(() => cerrar(aviso.id), TIEMPO_VIDA),
    );

    return () => temporizadores.forEach((id) => window.clearTimeout(id));
  }, [avisos, cerrar]);

  const valor = useMemo(() => ({ notificar, cerrar }), [notificar, cerrar]);

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="toast-viewport" aria-live="polite">
        {avisos.map((aviso) => (
          <div
            key={aviso.id}
            className={`toast toast-${aviso.tipo}`}
            role={aviso.tipo === "error" ? "alert" : "status"}
          >
            <span className="toast-icono" aria-hidden="true">
              {aviso.tipo === "exito" ? "✓" : aviso.tipo === "error" ? "!" : "i"}
            </span>
            <span className="toast-mensaje">{aviso.mensaje}</span>
            <button
              type="button"
              className="toast-cerrar"
              onClick={() => cerrar(aviso.id)}
              aria-label="Cerrar aviso"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const contexto = useContext(ToastContext);

  if (!contexto) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }

  return contexto;
}
