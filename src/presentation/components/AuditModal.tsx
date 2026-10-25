import { useState } from "react";
import {
  EtapaComite,
  ParametrosSistema,
  SolicitudBeca,
  UsuarioSesion,
} from "../../domain/models";
import {
  crearCadenaAprobacion,
  ServicioAuditoria,
} from "../../business/aprobacion/ChainOfResponsibility";
import { ModuloCalculoVulnerabilidad } from "../../business/builders/SolicitudBecaBuilder";
import { SolicitudRepository } from "../../data/SolicitudRepository";
import { estadoBadge } from "./Badge";

const ORDEN_ETAPAS: EtapaComite[] = [
  "Validación Documental",
  "Comité Socioeconómico",
  "Comité Financiero",
  "Aprobación Final",
];

export function AuditModal({
  solicitud,
  usuario,
  parametros,
  onClose,
  onUpdateSolicitud,
}: {
  solicitud: SolicitudBeca;
  usuario: UsuarioSesion;
  parametros: ParametrosSistema;
  onClose: () => void;
  onUpdateSolicitud: (actualizada: SolicitudBeca) => void;
}) {
  const [comentario, setComentario] = useState("");
  const [mensajeFeedback, setMensajeFeedback] = useState<string | null>(null);

  const puedeEvaluar = usuario.rol === "comite";
  const puedeSubsanar = usuario.rol === "estudiante";

  const indiceEtapaActual = ORDEN_ETAPAS.indexOf(solicitud.etapaActual);

  // Calcular desglose explicable a partir de las variables socioeconómicas de la solicitud
  const vars = solicitud.variablesSocioeconomicas;
  const desglose = ModuloCalculoVulnerabilidad.calcularDesglose(
    {
      ingresos: vars.ingresos?.valor ?? 750000,
      dependientes: vars.dependientes?.valor ?? 2,
      estrato: vars.estrato?.valor ?? 1,
      distancia: vars.distancia?.valor ?? 20,
    },
    parametros
  );

  // Ejecutar el eslabón actual del patrón Chain of Responsibility con los parámetros del Administrador
  const handleAvanzarCadena = () => {
    const copia: SolicitudBeca = JSON.parse(JSON.stringify(solicitud));
    const cadena = crearCadenaAprobacion(parametros);
    const resultado = cadena.procesarPasoActual(
      copia,
      usuario.nombre,
      usuario.cargo,
      comentario.trim() || undefined
    );

    setComentario("");
    setMensajeFeedback(resultado.mensaje);
    onUpdateSolicitud(copia);
  };

  // Devolver para subsanación documental
  const handleDevolverSubsanacion = () => {
    const copia: SolicitudBeca = JSON.parse(JSON.stringify(solicitud));
    copia.estado = "Pendiente docs.";
    copia.etapaActual = "Validación Documental";
    const obs =
      comentario.trim() ||
      "Se devuelve solicitud al estudiante para subsanación de soportes.";

    ServicioAuditoria.registrarDecision(
      copia,
      usuario.nombre,
      usuario.cargo,
      solicitud.etapaActual,
      "Devolución para Subsanación",
      obs
    );

    setComentario("");
    setMensajeFeedback(obs);
    onUpdateSolicitud(copia);
  };

  // Rechazar solicitud manualmente
  const handleRechazar = () => {
    const copia: SolicitudBeca = JSON.parse(JSON.stringify(solicitud));
    copia.estado = "Rechazada";
    const obs =
      comentario.trim() ||
      `Solicitud rechazada en etapa de ${solicitud.etapaActual}.`;

    ServicioAuditoria.registrarDecision(
      copia,
      usuario.nombre,
      usuario.cargo,
      solicitud.etapaActual,
      "Rechazo por Comité",
      obs
    );

    setComentario("");
    setMensajeFeedback(obs);
    onUpdateSolicitud(copia);
  };

  // Subsanar / Adjuntar documento pendiente (exclusivo Estudiante)
  const handleSubsanarDocumento = (docId: string) => {
    const copia: SolicitudBeca = JSON.parse(JSON.stringify(solicitud));
    const doc = copia.documentosAdjuntos.find((d) => d.id === docId);
    if (!doc) return;

    doc.adjuntado = true;
    doc.archivo = `${doc.id}_subsanado_2026.pdf`;

    const obligatoriosPendientes = copia.documentosAdjuntos.some(
      (d) => d.requerido && !d.adjuntado
    );
    if (!obligatoriosPendientes && copia.estado === "Pendiente docs.") {
      copia.estado = "En revisión";
    }

    ServicioAuditoria.registrarDecision(
      copia,
      usuario.nombre,
      usuario.cargo,
      copia.etapaActual,
      "Subsanación de Documento",
      `Se adjuntó soporte: ${doc.tipo} (${doc.archivo}).`
    );

    setMensajeFeedback(
      `Documento "${doc.tipo}" adjuntado y registrado en auditoría.`
    );
    onUpdateSolicitud(copia);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-stone-200 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#165C58] text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs bg-white/15 px-2 py-0.5 rounded">
                {solicitud.id}
              </span>
              <h3
                className="font-display text-lg font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {solicitud.datosPersonales.nombre}
              </h3>
            </div>
            <p className="text-xs text-white/70 mt-0.5">
              {solicitud.datosAcademicos.programa} · Semestre{" "}
              {solicitud.datosAcademicos.semestre} · Municipio:{" "}
              {solicitud.datosPersonales.municipio}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-sm px-2.5 py-1 rounded hover:bg-white/10 transition-colors"
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {/* Resumen Superior */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F5F2EC] p-4 rounded-lg border border-stone-200/70">
            <div>
              <div className="text-[11px] text-stone-500">
                Subsidio Solicitado
              </div>
              <div className="text-xs font-semibold text-[#1A2928] mt-0.5">
                {SolicitudRepository.formatearSubsidios(solicitud.tipoSubsidio)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-stone-500">
                Puntaje Vulnerabilidad
              </div>
              <div className="text-base font-mono font-semibold text-[#165C58]">
                {solicitud.puntajeVulnerabilidad}
                <span className="text-xs font-normal text-stone-400">
                  /100 (Mín. {parametros.umbralPuntajeMinimo})
                </span>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-stone-500">
                Promedio Académico
              </div>
              <div className="text-sm font-semibold text-[#1A2928] mt-0.5">
                {solicitud.datosAcademicos.promedio.toFixed(1)} / 5.0{" "}
                <span className="text-[10px] font-normal text-stone-400">
                  (Mín. {parametros.promedioMinimoRequerido.toFixed(1)})
                </span>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-stone-500">Estado Actual</div>
              <div className="mt-0.5">{estadoBadge(solicitud.estado)}</div>
            </div>
          </div>

          {/* Desglose Explicable del Puntaje de Vulnerabilidad (RF2 Transparencia) */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-lg p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-[#1A2928] uppercase tracking-wider">
                Desglose Auditable de Vulnerabilidad (Algoritmo Parametrizado RF2)
              </span>
              <span className="text-[11px] font-mono text-[#165C58] font-semibold">
                Puntaje registrado: {solicitud.puntajeVulnerabilidad} / 100 pts
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-white p-2.5 rounded border border-stone-200/70">
                <div className="text-[10px] text-stone-400">
                  Ingresos (${(vars.ingresos?.valor ?? 0).toLocaleString("es-CO")})
                </div>
                <div className="font-mono font-semibold text-[#1A2928] mt-0.5">
                  +{desglose.ptsIngresos} / {desglose.maxIngresos} pts
                </div>
              </div>
              <div className="bg-white p-2.5 rounded border border-stone-200/70">
                <div className="text-[10px] text-stone-400">
                  Estrato Socioeconómico ({vars.estrato?.valor ?? 1})
                </div>
                <div className="font-mono font-semibold text-[#1A2928] mt-0.5">
                  +{desglose.ptsEstrato} / {desglose.maxEstrato} pts
                </div>
              </div>
              <div className="bg-white p-2.5 rounded border border-stone-200/70">
                <div className="text-[10px] text-stone-400">
                  Dependientes ({vars.dependientes?.valor ?? 0} personas)
                </div>
                <div className="font-mono font-semibold text-[#1A2928] mt-0.5">
                  +{desglose.ptsDependientes} / {desglose.maxDependientes} pts
                </div>
              </div>
              <div className="bg-white p-2.5 rounded border border-stone-200/70">
                <div className="text-[10px] text-stone-400">
                  Distancia al Campus ({vars.distancia?.valor ?? 0} km)
                </div>
                <div className="font-mono font-semibold text-[#1A2928] mt-0.5">
                  +{desglose.ptsDistancia} / {desglose.maxDistancia} pts
                </div>
              </div>
            </div>
          </div>

          {/* Flujo Chain of Responsibility Visual */}
          <div>
            <div className="text-xs font-semibold text-[#1A2928] uppercase tracking-wider mb-3">
              Cadena de Responsabilidad (Chain of Responsibility)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ORDEN_ETAPAS.map((etapa, idx) => {
                const completada =
                  solicitud.estado === "Aprobada" || idx < indiceEtapaActual;
                const esActual =
                  solicitud.estado !== "Aprobada" && idx === indiceEtapaActual;
                return (
                  <div
                    key={etapa}
                    className={`p-3 rounded-lg border text-xs flex flex-col gap-1 ${
                      completada
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                        : esActual
                        ? "bg-[#165C58]/10 border-[#165C58] text-[#1A2928] font-semibold"
                        : "bg-stone-50 border-stone-200 text-stone-400"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span>Eslabón {idx + 1}</span>
                      <span>
                        {completada
                          ? "✓ Superado"
                          : esActual
                          ? "● Activo"
                          : "Pendiente"}
                      </span>
                    </div>
                    <div className="truncate">{etapa}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Soportes Documentales y Subsanación */}
          <div>
            <div className="text-xs font-semibold text-[#1A2928] uppercase tracking-wider mb-2.5">
              Soportes Documentales (Patrón Builder · Subsanación Progresiva)
            </div>
            <div className="flex flex-col gap-2">
              {solicitud.documentosAdjuntos.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded border border-stone-200 bg-stone-50/50 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        doc.adjuntado ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                    <span className="font-medium text-[#1A2928]">
                      {doc.tipo}
                    </span>
                    {doc.requerido && (
                      <span className="text-[10px] text-red-500 font-semibold">
                        (Obligatorio)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.adjuntado ? (
                      <span className="font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ {doc.archivo || "adjunto.pdf"}
                      </span>
                    ) : puedeSubsanar ? (
                      <button
                        onClick={() => handleSubsanarDocumento(doc.id)}
                        className="text-[11px] bg-amber-500 text-white px-2.5 py-1 rounded font-medium hover:bg-amber-600 transition-colors"
                      >
                        + Subsanar / Adjuntar ahora
                      </button>
                    ) : (
                      <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Pendiente por el estudiante
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel de Decisión del Comité (Chain of Responsibility) */}
          {puedeEvaluar && solicitud.estado !== "Aprobada" && (
            <div className="bg-[#165C58]/5 border border-[#165C58]/20 rounded-lg p-4">
              <div className="text-xs font-semibold text-[#165C58] mb-2">
                Panel de Evaluación del Comité — Etapa actual:{" "}
                <span className="underline">{solicitud.etapaActual}</span>
              </div>
              <textarea
                rows={2}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Escribe el concepto u observación de auditoría para esta etapa (opcional)..."
                className="w-full border border-stone-200 rounded p-2.5 text-xs bg-white focus:outline-none focus:border-[#165C58] mb-3"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleAvanzarCadena}
                  className="bg-[#165C58] text-white px-3.5 py-2 rounded text-xs font-semibold hover:bg-[#1A6E69] transition-colors"
                >
                  ✓ Evaluar y Avanzar Eslabón ({solicitud.etapaActual})
                </button>
                <button
                  onClick={handleDevolverSubsanacion}
                  className="bg-amber-50 text-amber-800 border border-amber-300 px-3 py-2 rounded text-xs font-medium hover:bg-amber-100 transition-colors"
                >
                  ↺ Solicitar Subsanación Documental
                </button>
                <button
                  onClick={handleRechazar}
                  className="bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded text-xs font-medium hover:bg-red-100 transition-colors"
                >
                  ✕ Rechazar Solicitud
                </button>
              </div>
            </div>
          )}

          {mensajeFeedback && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded text-xs">
              <strong>Resultado del motor de reglas:</strong> {mensajeFeedback}
            </div>
          )}

          {/* Historial de Auditoría Inmutable */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-[#1A2928] uppercase tracking-wider">
                Registro Inmutable de Auditoría (Habeas Data · Ley 1581/2012)
              </span>
              <span className="text-[11px] text-stone-400 font-mono">
                {solicitud.historialAuditoria.length} eventos encadenados
              </span>
            </div>

            <div className="border border-stone-200 rounded-lg divide-y divide-stone-100 overflow-hidden">
              {solicitud.historialAuditoria.map((reg, index) => (
                <div key={reg.id || index} className="p-3.5 bg-white text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="font-semibold text-[#1A2928]">
                      {index + 1}. {reg.accion}{" "}
                      <span className="font-normal text-stone-500">
                        ({reg.etapa})
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-stone-400">
                      {reg.timestamp}
                    </span>
                  </div>
                  <p className="text-stone-600 mb-2">{reg.comentario}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-stone-400 font-mono bg-stone-50 px-2.5 py-1 rounded">
                    <span>
                      Actor: {reg.actor} ({reg.rol})
                    </span>
                    <span>
                      PrevHash: {reg.hashAnterior.slice(0, 8)}… → Hash:{" "}
                      <strong className="text-[#165C58]">
                        {reg.hashActual}
                      </strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
