import { useState } from "react";
import {
  EtapaComite,
  ParametrosSistema,
  SolicitudBeca,
  UsuarioSesion,
} from "../../domain/models";
import { ServicioAuditoria } from "../../business/aprobacion/ChainOfResponsibility";
import { SolicitudRepository } from "../../data/SolicitudRepository";
import { estadoBadge } from "../components/Badge";
import { CertificadoBecaModal } from "../components/CertificadoBecaModal";

const ETAPAS: EtapaComite[] = [
  "Validación Documental",
  "Comité Socioeconómico",
  "Comité Financiero",
  "Aprobación Final",
];

export function EstudianteView({
  usuario,
  solicitudes,
  parametros,
  onNuevaPostulacion,
  onUpdateSolicitud,
  onVerDetalle,
}: {
  usuario: UsuarioSesion;
  solicitudes: SolicitudBeca[];
  parametros: ParametrosSistema;
  onNuevaPostulacion: () => void;
  onUpdateSolicitud: (s: SolicitudBeca) => void;
  onVerDetalle: (s: SolicitudBeca) => void;
}) {
  const [certificadoActivo, setCertificadoActivo] =
    useState<SolicitudBeca | null>(null);

  // Filtrar las solicitudes pertenecientes al estudiante autenticado
  const misSolicitudes = solicitudes.filter(
    (s) =>
      s.datosPersonales.id === usuario.idDocumento ||
      s.datosPersonales.correo.toLowerCase() === usuario.correo.toLowerCase() ||
      s.datosPersonales.nombre.toLowerCase() === usuario.nombre.toLowerCase()
  );

  const handleSubsanarDoc = (solicitud: SolicitudBeca, docId: string) => {
    const copia: SolicitudBeca = JSON.parse(JSON.stringify(solicitud));
    const doc = copia.documentosAdjuntos.find((d) => d.id === docId);
    if (!doc) return;

    doc.adjuntado = true;
    doc.archivo = `${doc.id}_subsanado_estudiante.pdf`;

    const faltanObligatorios = copia.documentosAdjuntos.some(
      (d) => d.requerido && !d.adjuntado
    );

    if (!faltanObligatorios && copia.estado === "Pendiente docs.") {
      copia.estado = "En revisión";
    }

    ServicioAuditoria.registrarDecision(
      copia,
      usuario.nombre,
      "Estudiante",
      copia.etapaActual,
      "Subsanación de Soporte por Estudiante",
      `El estudiante cargó el documento pendiente: ${doc.tipo} (${doc.archivo}).`
    );

    onUpdateSolicitud(copia);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F5F2EC] px-4 sm:px-8 py-6 sm:py-8">
      {/* Encabezado del Portal del Estudiante */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#165C58] mb-1">
            Portal Exclusivo del Estudiante
          </div>
          <h2
            className="font-display text-2xl font-semibold text-[#1A2928]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Hola, {usuario.nombre}
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Documento:{" "}
            <span className="font-mono">
              {usuario.idDocumento || "1027890451"}
            </span>{" "}
            · Convocatoria {parametros.semestreActivo} (Cierre:{" "}
            {parametros.fechaCierre})
          </p>
        </div>

        <button
          onClick={onNuevaPostulacion}
          disabled={!parametros.convocatoriaAbierta}
          className="bg-[#165C58] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1A6E69] disabled:opacity-40 transition-colors shadow-xs"
        >
          + Radicar Nueva Solicitud
        </button>
      </div>

      {/* Tarjetas de resumen del estudiante */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
        <div className="bg-white rounded-lg border border-stone-200/80 p-5">
          <div className="text-xs text-stone-400">
            Mis Solicitudes Radicadas
          </div>
          <div className="text-3xl font-semibold text-[#1A2928] mt-1">
            {misSolicitudes.length}
          </div>
          <div className="text-xs text-stone-400 mt-1">
            Semestre {parametros.semestreActivo}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-stone-200/80 p-5">
          <div className="text-xs text-stone-400">Beneficios Aprobados</div>
          <div className="text-3xl font-semibold text-emerald-600 mt-1">
            {misSolicitudes.filter((s) => s.estado === "Aprobada").length}
          </div>
          <div className="text-xs text-stone-400 mt-1">
            Auxilios adjudicados
          </div>
        </div>
        <div className="bg-white rounded-lg border border-stone-200/80 p-5">
          <div className="text-xs text-stone-400">
            Pendientes de Subsanación
          </div>
          <div className="text-3xl font-semibold text-amber-600 mt-1">
            {misSolicitudes.filter((s) => s.estado === "Pendiente docs.").length}
          </div>
          <div className="text-xs text-stone-400 mt-1">
            Soportes por completar
          </div>
        </div>
      </div>

      {/* Listado detallado de las solicitudes del estudiante con línea de tiempo */}
      <div className="flex flex-col gap-5">
        {misSolicitudes.map((sol) => {
          const etapaIdx = ETAPAS.indexOf(sol.etapaActual);
          const docsFaltantes = sol.documentosAdjuntos.filter(
            (d) => d.requerido && !d.adjuntado
          );
          const ultimaDecision =
            sol.historialAuditoria[sol.historialAuditoria.length - 1];

          return (
            <div
              key={sol.id}
              className="bg-white rounded-xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-stone-100">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-semibold text-[#165C58] bg-[#165C58]/10 px-2.5 py-0.5 rounded">
                      {sol.id}
                    </span>
                    <h3 className="text-base font-semibold text-[#1A2928]">
                      Auxilio de{" "}
                      {SolicitudRepository.formatearSubsidios(sol.tipoSubsidio)}
                    </h3>
                    {estadoBadge(sol.estado)}
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    Fecha de radicación:{" "}
                    <span className="font-mono">{sol.fecha}</span> · Puntaje de
                    vulnerabilidad:{" "}
                    <strong className="text-[#165C58]">
                      {sol.puntajeVulnerabilidad}/100 pts
                    </strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {sol.estado === "Aprobada" && (
                    <button
                      onClick={() => setCertificadoActivo(sol)}
                      className="text-xs font-semibold bg-emerald-600 text-white px-3.5 py-1.5 rounded hover:bg-emerald-700 transition-colors"
                    >
                      ⎙ Descargar Resolución de Adjudicación
                    </button>
                  )}
                  <button
                    onClick={() => onVerDetalle(sol)}
                    className="text-xs font-medium text-[#165C58] border border-[#165C58]/30 px-3.5 py-1.5 rounded hover:bg-[#165C58]/5 transition-colors"
                  >
                    Ver expediente y desglose →
                  </button>
                </div>
              </div>

              {/* Línea de tiempo del progreso por comités */}
              <div className="my-5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-3">
                  Progreso de tu solicitud en los Comités Evaluadores
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {ETAPAS.map((etapa, idx) => {
                    const superada =
                      sol.estado === "Aprobada" || idx < etapaIdx;
                    const actual =
                      sol.estado !== "Aprobada" && idx === etapaIdx;

                    return (
                      <div
                        key={etapa}
                        className={`p-3 rounded-lg border text-xs ${
                          superada
                            ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                            : actual
                            ? sol.estado === "Pendiente docs."
                              ? "bg-amber-50 border-amber-300 text-amber-900 font-semibold"
                              : sol.estado === "Rechazada"
                              ? "bg-red-50 border-red-200 text-red-800 font-semibold"
                              : "bg-sky-50 border-sky-200 text-sky-900 font-semibold"
                            : "bg-stone-50 border-stone-200 text-stone-400"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span>Paso {idx + 1}</span>
                          <span>
                            {superada
                              ? "✓ Aprobado"
                              : actual
                              ? "● Etapa actual"
                              : "Pendiente"}
                          </span>
                        </div>
                        <div className="truncate">{etapa}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Alerta interactiva de Subsanación si faltan documentos */}
              {docsFaltantes.length > 0 && (
                <div className="bg-amber-50/90 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="text-xs font-semibold text-amber-900 mb-1">
                    ⚠ Acción requerida: Tienes {docsFaltantes.length} soporte(s)
                    pendiente(s) por subsanar
                  </div>
                  <p className="text-xs text-amber-800 mb-3">
                    Adjunta los documentos faltantes para que tu solicitud pase
                    automáticamente a estado <strong>En revisión</strong>:
                  </p>
                  <div className="flex flex-col gap-2">
                    {docsFaltantes.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between bg-white px-3 py-2 rounded border border-amber-200 text-xs"
                      >
                        <span className="font-medium text-[#1A2928]">
                          {doc.tipo}
                        </span>
                        <button
                          onClick={() => handleSubsanarDoc(sol, doc.id)}
                          className="bg-[#165C58] text-white px-3 py-1 rounded text-[11px] font-medium hover:bg-[#1A6E69] transition-colors shrink-0 ml-2"
                        >
                          + Adjuntar PDF ahora
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Última notificación del comité */}
              {ultimaDecision && (
                <div className="bg-stone-50 rounded-lg px-4 py-2.5 text-xs text-stone-600 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <strong className="text-[#1A2928]">
                      Última actualización ({ultimaDecision.etapa}):
                    </strong>{" "}
                    {ultimaDecision.comentario}
                  </div>
                  <span className="font-mono text-[10px] text-stone-400">
                    {ultimaDecision.timestamp}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {misSolicitudes.length === 0 && (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
            <div className="text-base font-semibold text-[#1A2928] mb-1">
              Aún no tienes solicitudes radicadas en este semestre
            </div>
            <p className="text-xs text-stone-500 mb-5">
              Puedes postularte en línea para los subsidios de Alimentación,
              Transporte o Matrícula.
            </p>
            <button
              onClick={onNuevaPostulacion}
              className="bg-[#165C58] text-white px-5 py-2.5 rounded text-sm font-semibold hover:bg-[#1A6E69] transition-colors"
            >
              Radicar mi primera solicitud →
            </button>
          </div>
        )}
      </div>

      {certificadoActivo && (
        <CertificadoBecaModal
          solicitud={certificadoActivo}
          semestreActivo={parametros.semestreActivo}
          onClose={() => setCertificadoActivo(null)}
        />
      )}
    </div>
  );
}
