import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import ReporteDetalle from "../components/ReporteDetalle";
import { ToastProvider } from "../components/Toast";

vi.mock("../services/reportes", () => ({
  cambiarEstadoReporte: vi.fn(async () => ({ ok: true })),
}));

const { cambiarEstadoReporte } = await import("../services/reportes");

const detalle = {
  reporte: {
    id_reporte: 1,
    folio: "SP-2026-0001",
    titulo: "Poste sin luz",
    estado: "PENDIENTE",
    categoria: { nombre: "Alumbrado público" },
    prioridad: "MEDIA",
    descripcion: "Sin iluminación",
    latitud: 25.79,
    longitud: -108.98,
    fecha_registro: "2026-11-20T12:00:00Z",
    fotos: [],
  },
  historial: [],
};

function renderDetalle(onEstadoActualizado = vi.fn()) {
  return render(
    <ToastProvider>
      <ReporteDetalle
        detalle={detalle}
        token="token-de-prueba"
        onCerrar={vi.fn()}
        onEstadoActualizado={onEstadoActualizado}
      />
    </ToastProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Fase 5 — cambio de estado", () => {
  it("pide el motivo antes de confirmar un rechazo", async () => {
    renderDetalle();

    fireEvent.change(screen.getByLabelText("Nuevo estado"), {
      target: { value: "RECHAZADO" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambio" }));

    expect(
      await screen.findByText("Agrega el motivo del rechazo (al menos 5 caracteres)."),
    ).toBeTruthy();
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(cambiarEstadoReporte).not.toHaveBeenCalled();
  });

  it("muestra la confirmación al rechazar con motivo y guarda tras confirmar", async () => {
    const onEstadoActualizado = vi.fn();
    renderDetalle(onEstadoActualizado);

    fireEvent.change(screen.getByLabelText("Nuevo estado"), {
      target: { value: "RECHAZADO" },
    });
    fireEvent.change(screen.getByLabelText(/Comentario/), {
      target: { value: "No corresponde a un servicio público." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambio" }));

    expect(screen.getByRole("alertdialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(cambiarEstadoReporte).toHaveBeenCalledWith(1, {
        estado: "RECHAZADO",
        comentario: "No corresponde a un servicio público.",
      }, "token-de-prueba");
    });
    expect(onEstadoActualizado).toHaveBeenCalledWith({ ok: true });
  });
});
