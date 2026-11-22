import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import BotonTema from "../components/BotonTema";
import EstadoVacio from "../components/EstadoVacio";
import { SkeletonTabla } from "../components/Skeleton";
import { ToastProvider, useToast } from "../components/Toast";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  delete document.documentElement.dataset.tema;
});

function LanzadorAvisos() {
  const { notificar } = useToast();

  return (
    <button type="button" onClick={() => notificar("CSV descargado", "exito")}>
      Avisar
    </button>
  );
}

describe("Fase 5 — componentes de UX", () => {
  it("muestra y cierra un toast accesible", () => {
    render(
      <ToastProvider>
        <LanzadorAvisos />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Avisar" }));

    const aviso = screen.getByRole("status");
    expect(aviso.textContent).toContain("CSV descargado");

    fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }));
    expect(screen.queryByText("CSV descargado")).toBeNull();
  });

  it("expone skeletons con etiqueta para lectores de pantalla", () => {
    render(<SkeletonTabla filas={2} />);
    expect(screen.getByRole("status", { name: "Cargando reportes" })).toBeTruthy();
  });

  it("permite actuar desde un estado vacío", () => {
    const accion = vi.fn();
    render(
      <EstadoVacio
        titulo="Sin reportes"
        descripcion="Aún no hay reportes con este filtro."
        accion={{ etiqueta: "Limpiar filtros", onClick: accion }}
      />,
    );

    expect(screen.getByText("Sin reportes")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(accion).toHaveBeenCalledTimes(1);
  });

  it("alterna el tema y lo refleja en el documento", () => {
    render(<BotonTema />);
    const boton = screen.getByRole("button", { name: "Activar modo oscuro" });

    expect(boton.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(boton);

    expect(document.documentElement.dataset.tema).toBe("oscuro");
    expect(screen.getByRole("button", { name: "Activar modo claro" })).toBeTruthy();
  });
});
