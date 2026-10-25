import { useState } from "react";
import {
  EtapaComite,
  ParametrosSistema,
  SolicitudBeca,
  UsuarioSesion,
} from "../../domain/models";
import { SolicitudRepository } from "../../data/SolicitudRepository";
import { estadoBadge } from "../components/Badge";

const ETAPAS_COMITE: EtapaComite[] = [
  "Validación Documental",
  "Comité Socioeconómico",
  "Comité Financiero",
  "Aprobación Final",
];

export function ComiteView({
  modo,
  usuario,
  solicitudes,
  parametros,
  onSelectSolicitud,
}: {
  modo: "bandeja" | "actas";
  usuario: UsuarioSesion;
  solicitudes: SolicitudBeca[];
  parametros: ParametrosSistema;
  onSelectSolicitud: (s: SolicitudBeca) => void;
}) {
  const [etapaFiltro, setEtapaFiltro] = useState<EtapaComite | "Todas">(
    usuario.comiteAsignado && usuario.comiteAsignado !== "Todos"
      ? usuario.comiteAsignado
      : "Todas"
  );
  const [busqueda, setBusqueda] = useState("");

  // Solicitudes pendientes de dictamen (En revisión o Pendiente docs.)
  const pendientesEvaluacion = solicitudes.filter(
    (s) => s.estado === "En revisión" || s.estado === "Pendiente docs."
  );

  // Solicitudes con dictamen definitivo (Aprobada o Rechazada)
  const dictaminadas = solicitudes.filter(
    (s) => s.estado === "Aprobada" || s.estado === "Rechazada"
  );

  const baseLista = modo === "bandeja" ? pendientesEvaluacion : dictaminadas;

  const filtradas = baseLista.filter((s) => {
    const coincideEtapa =
      etapaFiltro === "Todas" || s.etapaActual === etapaFiltro;
    const coincideTexto =
      s.datosPersonales.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.id.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.datosAcademicos.programa.toLowerCase().includes(busqueda.toLowerCase());
    return coincideEtapa && coincideTexto;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#F5F2EC] px-8 py-8">
      {/* Header exclusivo del Comité */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#165C58] mb-1">
            Consola Exclusiva de Evaluación Institucional · Chain of Responsibility
          </div>
          <h2
            className="font-display text-2xl font-semibold text-[#1A2928]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {modo === "bandeja"
              ? "Bandeja de Evaluación por Etapa"
              : "Historial de Dictámenes y Actas"}
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Evaluador activo: <strong>{usuario.nombre}</strong> · Umbral mínimo
            institucional:{" "}
            <strong className="text-[#165C58]">
              {parametros.umbralPuntajeMinimo}/100 pts
            </strong>{" "}
            · Promedio mín.:{" "}
            <strong>{parametros.promedioMinimoRequerido.toFixed(1)}</strong>
          </p>
        </div>
      </div>

      {/* Tarjetas por Eslabón del Comité */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {ETAPAS_COMITE.map((etapa, idx) => {
          const cantidad = pendientesEvaluacion.filter(
            (s) => s.etapaActual === etapa
          ).length;
          const activa = etapaFiltro === etapa;
          return (
            <button
              key={etapa}
              onClick={() =>
                setEtapaFiltro(activa ? "Todas" : etapa)
              }
              className={`text-left rounded-xl border p-4 transition-all ${
                activa
                  ? "bg-[#165C58] text-white border-[#165C58] shadow-sm"
                  : "bg-white border-stone-200/80 hover:border-stone-400"
              }`}
            >
              <div
                className={`text-[10px] uppercase tracking-wider font-semibold ${
                  activa ? "text-white/70" : "text-stone-400"
                }`}
              >
                Eslabón {idx + 1}
              </div>
              <div
                className={`text-xs font-medium mt-0.5 truncate ${
                  activa ? "text-white" : "text-[#1A2928]"
                }`}
              >
                {etapa}
              </div>
              <div
                className={`text-2xl font-semibold mt-2 ${
                  activa ? "text-white" : "text-[#165C58]"
                }`}
              >
                {cantidad}
              </div>
              <div
                className={`text-[10px] ${
                  activa ? "text-white/65" : "text-stone-400"
                }`}
              >
                en cola para revisión
              </div>
            </button>
          );
        })}
      </div>

      {/* Filtros de etapa y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar expediente por estudiante, programa o ID..."
          className="flex-1 border border-stone-200 rounded-lg px-3.5 py-2 text-sm bg-white focus:outline-none focus:border-[#165C58]"
        />
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setEtapaFiltro("Todas")}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              etapaFiltro === "Todas"
                ? "bg-[#165C58] text-white border-[#165C58]"
                : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
            }`}
          >
            Todas las etapas
          </button>
          {ETAPAS_COMITE.map((et) => (
            <button
              key={et}
              onClick={() => setEtapaFiltro(et)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                etapaFiltro === et
                  ? "bg-[#165C58] text-white border-[#165C58]"
                  : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
              }`}
            >
              {et}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Evaluación del Comité */}
      <div className="bg-white rounded-xl border border-stone-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/60">
                {[
                  "Expediente",
                  "Postulante / Programa",
                  "Subsidios",
                  "Puntaje vs Umbral",
                  "Promedio",
                  "Soportes",
                  "Eslabón Actual",
                  "Estado",
                  "Dictamen",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.map((s) => {
                const obligatorios = s.documentosAdjuntos.filter(
                  (d) => d.requerido
                );
                const adjuntos = obligatorios.filter((d) => d.adjuntado).length;
                const superaUmbral =
                  s.puntajeVulnerabilidad >= parametros.umbralPuntajeMinimo;

                return (
                  <tr
                    key={s.id}
                    onClick={() => onSelectSolicitud(s)}
                    className="border-b border-stone-100 hover:bg-stone-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-stone-500">
                      {s.id}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-[#1A2928]">
                        {s.datosPersonales.nombre}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {s.datosAcademicos.programa} · Sem.{" "}
                        {s.datosAcademicos.semestre} ({s.datosPersonales.municipio})
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-stone-600">
                      {SolicitudRepository.formatearSubsidios(s.tipoSubsidio)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-sm font-semibold ${
                            superaUmbral ? "text-emerald-700" : "text-red-600"
                          }`}
                        >
                          {s.puntajeVulnerabilidad}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          / mín. {parametros.umbralPuntajeMinimo}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-stone-600">
                      {s.datosAcademicos.promedio.toFixed(1)}
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                          adjuntos === obligatorios.length
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {adjuntos}/{obligatorios.length} oblig.
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-medium text-[#1A2928]">
                      {s.etapaActual}
                    </td>
                    <td className="px-4 py-3.5">{estadoBadge(s.estado)}</td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSolicitud(s);
                        }}
                        className="bg-[#165C58] text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-[#1A6E69] transition-colors"
                      >
                        {modo === "bandeja" ? "Evaluar Caso" : "Ver Acta"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtradas.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-stone-400"
                  >
                    No hay expedientes en esta bandeja con el filtro actual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

