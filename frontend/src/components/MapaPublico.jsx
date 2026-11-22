import React, { useEffect, useMemo, useState } from "react";
import { APK_URL } from "../config";
import {
  obtenerCategorias,
  obtenerGeo,
  obtenerReportes,
} from "../services/reportes";
import MapaReportes from "./MapaReportes";
import BotonTema from "./BotonTema";
import EstadoVacio from "./EstadoVacio";
import { SkeletonTabla } from "./Skeleton";
import { useToast } from "./Toast";

const ETIQUETAS_ESTADO = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  COMPLETADO: "Completado",
  RECHAZADO: "Rechazado",
  ARCHIVADO: "Archivado",
};

const formatearFecha = (valor) => {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function MapaPublico() {
  const { notificar } = useToast();
  const [geo, setGeo] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [filtros, setFiltros] = useState({
    categoria_id: "",
    estado: "",
    buscar: "",
  });
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      try {
        const [datosGeo, datosCategorias, datosReportes] = await Promise.all([
          obtenerGeo(),
          obtenerCategorias(),
          obtenerReportes({ limite: 200 }),
        ]);

        if (!activo) return;
        setGeo(datosGeo);
        setCategorias(datosCategorias.categorias || []);
        setReportes(datosReportes.reportes || []);
      } catch (err) {
        if (activo) {
          notificar(err.message || "No se pudo cargar el mapa público", "error");
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargar();
    return () => {
      activo = false;
    };
  }, [notificar]);

  const filtrados = useMemo(
    () =>
      reportes.filter((reporte) => {
        if (
          filtros.categoria_id &&
          String(reporte.id_categoria) !== String(filtros.categoria_id)
        ) {
          return false;
        }
        if (filtros.estado && reporte.estado !== filtros.estado) return false;

        if (filtros.buscar) {
          const termino = filtros.buscar.trim().toLowerCase();
          const texto = `${reporte.folio} ${reporte.titulo}`.toLowerCase();
          if (!texto.includes(termino)) return false;
        }

        return true;
      }),
    [reportes, filtros],
  );

  const resumen = useMemo(
    () => ({
      total: filtrados.length,
      pendientes: filtrados.filter((r) => r.estado === "PENDIENTE").length,
      proceso: filtrados.filter((r) => r.estado === "EN_PROCESO").length,
      completados: filtrados.filter((r) => r.estado === "COMPLETADO").length,
    }),
    [filtrados],
  );

  const actualizarFiltro = (clave, valor) =>
    setFiltros((anteriores) => ({ ...anteriores, [clave]: valor }));

  const limpiarFiltros = () =>
    setFiltros({ categoria_id: "", estado: "", buscar: "" });

  return (
    <main
      className="publico-page"
      id="contenido-principal"
      tabIndex={-1}
      aria-busy={cargando}
    >
      <header className="publico-hero">
        <div className="publico-hero-inner">
          <div className="publico-hero-copy">
            <BotonTema className="tema-toggle-hero" />
            <p className="eyebrow">Consulta ciudadana · Los Mochis, Sinaloa</p>
            <h1>Reportes de servicios públicos en tu ciudad</h1>
            <p>
              Explora en el mapa los reportes de alumbrado, baches, drenaje, agua,
              basura y más. Tu reporte ayuda a mejorar Los Mochis.
            </p>
            <div className="publico-cta">
              <a className="btn btn-primary" href={APK_URL} download>
                Descargar app Android (APK)
              </a>
              <a className="btn btn-hero-outline" href="#/">
                Acceso administrativo
              </a>
            </div>
            <div className="publico-hint">
              <span>Android 8.0 o superior</span>
              <span>·</span>
              <span>Gratis, sin registro para consultar</span>
            </div>
          </div>

          <div className="publico-metricas">
            <div>
              <strong>{resumen.total}</strong>
              <span>reportes visibles</span>
            </div>
            <div>
              <strong className="metrica-amber">{resumen.pendientes}</strong>
              <span>pendientes</span>
            </div>
            <div>
              <strong className="metrica-blue">{resumen.proceso}</strong>
              <span>en proceso</span>
            </div>
            <div>
              <strong className="metrica-green">{resumen.completados}</strong>
              <span>completados</span>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="publico-error" role="alert">
          {error}
        </div>
      )}

      <section className="publico-layout">
        <aside className="publico-sidebar">
          <div className="publico-filtros">
            <h2>Filtrar reportes</h2>
            <label className="filtro-campo">
              <span>Servicio</span>
              <select
                value={filtros.categoria_id}
                onChange={(e) => actualizarFiltro("categoria_id", e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((categoria) => (
                  <option
                    key={categoria.id_categoria}
                    value={categoria.id_categoria}
                  >
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="filtro-campo">
              <span>Estado</span>
              <select
                value={filtros.estado}
                onChange={(e) => actualizarFiltro("estado", e.target.value)}
              >
                <option value="">Todos los estados</option>
                {Object.entries(ETIQUETAS_ESTADO).map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>
                    {etiqueta}
                  </option>
                ))}
              </select>
            </label>

            <label className="filtro-campo">
              <span>Buscar</span>
              <input
                type="search"
                value={filtros.buscar}
                onChange={(e) => actualizarFiltro("buscar", e.target.value)}
                placeholder="Folio o palabra clave"
              />
            </label>
          </div>

          <div className="publico-lista">
            <div className="publico-lista-head">
              <strong>Reportes recientes</strong>
              <span>{filtrados.length}</span>
            </div>

            {cargando ? (
              <SkeletonTabla filas={4} />
            ) : filtrados.length === 0 ? (
              <EstadoVacio
                titulo="Sin reportes"
                descripcion="Prueba con otros filtros para ver más resultados."
                accion={{ etiqueta: "Ver todos los reportes", onClick: limpiarFiltros }}
              />
            ) : (
              <div className="publico-items">
                {filtrados.slice(0, 60).map((reporte) => (
                  <button
                    type="button"
                    key={reporte.id_reporte}
                    className={
                      seleccionado?.id_reporte === reporte.id_reporte
                        ? "publico-item publico-item-activo"
                        : "publico-item"
                    }
                    onClick={() => setSeleccionado(reporte)}
                  >
                    <span className="publico-item-top">
                      <i
                        className="categoria-punto"
                        style={{ background: reporte.categoria?.color || "#94a3b8" }}
                      />
                      {reporte.categoria?.nombre}
                      <small>{formatearFecha(reporte.fecha_registro)}</small>
                    </span>
                    <strong>{reporte.titulo}</strong>
                    <span className="publico-item-bottom">
                      <span className="folio-celda">{reporte.folio}</span>
                      <span
                        className={`badge badge-estado estado-${reporte.estado.toLowerCase()}`}
                      >
                        {ETIQUETAS_ESTADO[reporte.estado] || reporte.estado}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="publico-mapa-wrap">
          <MapaReportes
            geo={geo}
            reportes={filtrados}
            seleccionado={seleccionado}
            onSeleccionar={setSeleccionado}
            agrupar
          />

          {seleccionado && (
            <div className="publico-seleccion">
              <button
                type="button"
                className="icono-cerrar"
                onClick={() => setSeleccionado(null)}
                aria-label="Cerrar"
              >
                ×
              </button>
              <span className="eyebrow">{seleccionado.folio}</span>
              <strong>{seleccionado.titulo}</strong>
              <span>
                {seleccionado.categoria?.nombre} ·{" "}
                {ETIQUETAS_ESTADO[seleccionado.estado] || seleccionado.estado}
              </span>
              <small>{seleccionado.direccion_referencia || "Sin referencia"}</small>
            </div>
          )}
        </section>
      </section>

      <footer className="publico-footer">
        Monitoreo de Servicios Públicos · Los Mochis, Sinaloa · Datos de prueba
      </footer>
    </main>
  );
}
