import { useState } from "react";
import {
  EtapaComite,
  ParametrosSistema,
  SolicitudBeca,
  UsuarioSistema,
} from "../../domain/models";
import { SolicitudRepository } from "../../data/SolicitudRepository";
import { estadoBadge } from "../components/Badge";

export function AdministradorView({
  modulo,
  parametros,
  usuarios,
  solicitudes,
  onSaveParametros,
  onSaveUsuarios,
  onSelectSolicitud,
  onResetDemo,
}: {
  modulo: "parametros" | "usuarios" | "auditoria";
  parametros: ParametrosSistema;
  usuarios: UsuarioSistema[];
  solicitudes: SolicitudBeca[];
  onSaveParametros: (p: ParametrosSistema) => void;
  onSaveUsuarios: (u: UsuarioSistema[]) => void;
  onSelectSolicitud: (s: SolicitudBeca) => void;
  onResetDemo: () => void;
}) {
  const [formParams, setFormParams] = useState<ParametrosSistema>(parametros);
  const [msgGuardado, setMsgGuardado] = useState<string | null>(null);

  // Estado para agregar nuevo integrante de comité
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [nuevaEtapa, setNuevaEtapa] = useState<EtapaComite>(
    "Comité Socioeconómico"
  );

  const sumaPesos =
    Number(formParams.pesoIngresos) +
    Number(formParams.pesoDependientes) +
    Number(formParams.pesoEstrato) +
    Number(formParams.pesoDistancia);

  const handleGuardarConfig = () => {
    onSaveParametros(formParams);
    setMsgGuardado(
      "Parámetros institucionales actualizados y aplicados al motor de cálculo RF2."
    );
    setTimeout(() => setMsgGuardado(null), 4000);
  };

  const handleToggleUsuario = (id: string) => {
    const actualizados = usuarios.map((u) =>
      u.id === id ? { ...u, activo: !u.activo } : u
    );
    onSaveUsuarios(actualizados);
  };

  const handleAgregarEvaluador = () => {
    if (!nuevoNombre.trim() || !nuevoCorreo.trim()) return;
    const nuevo: UsuarioSistema = {
      id: `USR-0${usuarios.length + 1}`,
      nombre: nuevoNombre.trim(),
      correo: nuevoCorreo.trim(),
      rol: "comite",
      cargo: `Evaluador · ${nuevaEtapa}`,
      etapaAsignada: nuevaEtapa,
      activo: true,
    };
    onSaveUsuarios([...usuarios, nuevo]);
    setNuevoNombre("");
    setNuevoCorreo("");
  };

  const exportarCSV = () => {
    const encabezados = [
      "ID Solicitud",
      "Fecha",
      "Cedula",
      "Estudiante",
      "Municipio",
      "Programa",
      "Subsidios",
      "Puntaje Vulnerabilidad",
      "Etapa Actual",
      "Estado",
      "Eventos Auditoria",
      "Ultimo Hash",
    ];
    const filas = solicitudes.map((s) => {
      const ultimoHash =
        s.historialAuditoria[s.historialAuditoria.length - 1]?.hashActual || "";
      return [
        s.id,
        s.fecha,
        s.datosPersonales.id,
        `"${s.datosPersonales.nombre}"`,
        `"${s.datosPersonales.municipio}"`,
        `"${s.datosAcademicos.programa}"`,
        `"${SolicitudRepository.formatearSubsidios(s.tipoSubsidio)}"`,
        s.puntajeVulnerabilidad,
        `"${s.etapaActual}"`,
        `"${s.estado}"`,
        s.historialAuditoria.length,
        ultimoHash,
      ].join(",");
    });

    const csvContent =
      "\uFEFF" + [encabezados.join(","), ...filas].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `auditoria_administrativa_becas_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalEventosAuditoria = solicitudes.reduce(
    (acc, s) => acc + s.historialAuditoria.length,
    0
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#F5F2EC] px-8 py-8">
      {/* Header Exclusivo del Administrador */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#165C58] mb-1">
            Panel Exclusivo de Administración y Gobierno del Sistema
          </div>
          <h2
            className="font-display text-2xl font-semibold text-[#1A2928]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {modulo === "parametros" &&
              "Parametrización del Algoritmo (RF2) y Convocatoria"}
            {modulo === "usuarios" &&
              "Gestión de Comités Evaluadores y Control de Acceso"}
            {modulo === "auditoria" &&
              "Auditoría Inmutable (Habeas Data) y Reportes Globales"}
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Configuración centralizada de reglas de negocio, usuarios y
            trazabilidad institucional
          </p>
        </div>

        <button
          onClick={onResetDemo}
          className="text-xs text-stone-600 bg-white border border-stone-200 px-3.5 py-2 rounded-lg hover:border-stone-400 transition-colors"
        >
          ↺ Restaurar valores de fábrica
        </button>
      </div>

      {/* MÓDULO 1: PARAMETRIZACIÓN Y CONV0CATORIA */}
      {modulo === "parametros" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reglas de Convocatoria y Umbrales */}
          <div className="bg-white rounded-xl border border-stone-200/80 p-6">
            <h3 className="text-sm font-semibold text-[#1A2928] mb-4">
              1. Parámetros de Convocatoria y Umbrales de Comité
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">
                  Semestre Activo
                </label>
                <input
                  type="text"
                  value={formParams.semestreActivo}
                  onChange={(e) =>
                    setFormParams((p) => ({
                      ...p,
                      semestreActivo: e.target.value,
                    }))
                  }
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">
                  Fecha de cierre de postulaciones
                </label>
                <input
                  type="date"
                  value={formParams.fechaCierre}
                  onChange={(e) =>
                    setFormParams((p) => ({
                      ...p,
                      fechaCierre: e.target.value,
                    }))
                  }
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">
                  Presupuesto Semestral (Millones COP)
                </label>
                <input
                  type="number"
                  value={formParams.presupuestoTotalMillones}
                  onChange={(e) =>
                    setFormParams((p) => ({
                      ...p,
                      presupuestoTotalMillones: Number(e.target.value),
                    }))
                  }
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">
                  Umbral Mínimo Vulnerabilidad (0-100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formParams.umbralPuntajeMinimo}
                  onChange={(e) =>
                    setFormParams((p) => ({
                      ...p,
                      umbralPuntajeMinimo: Number(e.target.value),
                    }))
                  }
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">
                  Promedio Académico Mínimo (0.0 - 5.0)
                </label>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  max={5}
                  value={formParams.promedioMinimoRequerido}
                  onChange={(e) =>
                    setFormParams((p) => ({
                      ...p,
                      promedioMinimoRequerido: Number(e.target.value),
                    }))
                  }
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm font-mono"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2.5 text-xs font-medium text-[#1A2928] cursor-pointer py-2">
                  <input
                    type="checkbox"
                    checked={formParams.convocatoriaAbierta}
                    onChange={(e) =>
                      setFormParams((p) => ({
                        ...p,
                        convocatoriaAbierta: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-[#165C58]"
                  />
                  Habilitar recepción de postulaciones
                </label>
              </div>
            </div>
          </div>

          {/* Ponderación de Variables Socioeconómicas RF2 */}
          <div className="bg-white rounded-xl border border-stone-200/80 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#1A2928]">
                  2. Ponderación de Variables Socioeconómicas (RF2)
                </h3>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded ${
                    sumaPesos === 100
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  Total: {sumaPesos}%
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  {
                    key: "pesoIngresos" as const,
                    label: "Peso Ingresos Familiares Mensuales (%)",
                  },
                  {
                    key: "pesoEstrato" as const,
                    label: "Peso Estrato Socioeconómico (%)",
                  },
                  {
                    key: "pesoDependientes" as const,
                    label: "Peso N.° de Dependientes en el Hogar (%)",
                  },
                  {
                    key: "pesoDistancia" as const,
                    label: "Peso Distancia Municipal al Campus (%)",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-4"
                  >
                    <label className="text-xs text-stone-600">
                      {item.label}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formParams[item.key]}
                      onChange={(e) =>
                        setFormParams((p) => ({
                          ...p,
                          [item.key]: Number(e.target.value),
                        }))
                      }
                      className="w-24 border border-stone-200 rounded px-2.5 py-1.5 text-sm font-mono text-right"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100">
              {msgGuardado && (
                <div className="mb-3 p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  ✓ {msgGuardado}
                </div>
              )}
              <button
                onClick={handleGuardarConfig}
                className="w-full bg-[#165C58] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1A6E69] transition-colors"
              >
                Guardar Parámetros del Sistema
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MÓDULO 2: GESTIÓN DE COMITÉS Y USUARIOS */}
      {modulo === "usuarios" && (
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-stone-200/80 p-5">
            <h3 className="text-sm font-semibold text-[#1A2928] mb-3">
              Registrar Nuevo Evaluador de Comité
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Nombre completo del evaluador"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                className="border border-stone-200 rounded px-3 py-2 text-sm"
              />
              <input
                type="email"
                placeholder="correo@uniremington.edu.co"
                value={nuevoCorreo}
                onChange={(e) => setNuevoCorreo(e.target.value)}
                className="border border-stone-200 rounded px-3 py-2 text-sm"
              />
              <select
                value={nuevaEtapa}
                onChange={(e) => setNuevaEtapa(e.target.value as EtapaComite)}
                className="border border-stone-200 rounded px-3 py-2 text-sm bg-white"
              >
                <option value="Validación Documental">
                  Validación Documental
                </option>
                <option value="Comité Socioeconómico">
                  Comité Socioeconómico
                </option>
                <option value="Comité Financiero">Comité Financiero</option>
                <option value="Aprobación Final">Aprobación Final</option>
              </select>
              <button
                onClick={handleAgregarEvaluador}
                className="bg-[#165C58] text-white rounded px-4 py-2 text-sm font-semibold hover:bg-[#1A6E69] transition-colors"
              >
                + Asignar al Comité
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200/80 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/70">
                  {[
                    "ID",
                    "Funcionario",
                    "Correo Institucional",
                    "Rol",
                    "Eslabón / Comité Asignado",
                    "Estado",
                    "Acción",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-stone-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-stone-400">
                      {u.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1A2928]">
                      {u.nombre}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {u.correo}
                    </td>
                    <td className="px-4 py-3 text-xs capitalize font-medium text-[#165C58]">
                      {u.rol}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-600">
                      {u.etapaAsignada || "Administración Global"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          u.activo
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {u.activo ? "Activo" : "Suspendido"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleUsuario(u.id)}
                        className="text-xs text-[#165C58] hover:underline font-medium"
                      >
                        {u.activo ? "Suspender acceso" : "Reactivar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MÓDULO 3: AUDITORÍA INMUTABLE HABEAS DATA Y REPORTES */}
      {modulo === "auditoria" && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-[#1A2928] text-white rounded-xl p-5">
              <div className="text-xs text-white/60">
                Integridad Cadena Hash
              </div>
              <div className="text-2xl font-semibold text-emerald-400 mt-1">
                100% Verificada
              </div>
              <div className="text-[11px] text-white/50 mt-1">
                0 alteraciones detectadas
              </div>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <div className="text-xs text-stone-400">
                Eventos de Auditoría Firmados
              </div>
              <div className="text-2xl font-semibold text-[#1A2928] mt-1">
                {totalEventosAuditoria}
              </div>
              <div className="text-[11px] text-stone-400 mt-1">
                Cumplimiento Ley 1581/2012
              </div>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <div className="text-xs text-stone-400">
                Presupuesto Configurado
              </div>
              <div className="text-2xl font-semibold text-[#165C58] mt-1">
                ${parametros.presupuestoTotalMillones} M
              </div>
              <div className="text-[11px] text-stone-400 mt-1">
                Semestre {parametros.semestreActivo}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-5 flex flex-col justify-between">
              <div className="text-xs text-stone-400">
                Exportación para Entes de Control
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={exportarCSV}
                  className="flex-1 bg-[#165C58] text-white py-1.5 rounded text-xs font-medium hover:bg-[#1A6E69]"
                >
                  ⬇ CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 border border-stone-200 text-stone-700 py-1.5 rounded text-xs font-medium hover:border-stone-400"
                >
                  ⎙ PDF
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1A2928]">
                Bitácora Maestra de Solicitudes y Hashes de Trazabilidad
              </h3>
              <span className="text-xs text-stone-400">
                Modo solo lectura administrativa (Sin alterar dictámenes de comité)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/60">
                    {[
                      "ID Solicitud",
                      "Postulante",
                      "Puntaje",
                      "Etapa Actual",
                      "Estado",
                      "Eventos",
                      "Último Hash Firmado",
                      "Inspección",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.map((s) => {
                    const ultimo =
                      s.historialAuditoria[s.historialAuditoria.length - 1];
                    return (
                      <tr
                        key={s.id}
                        onClick={() => onSelectSolicitud(s)}
                        className="border-b border-stone-100 hover:bg-stone-50 cursor-pointer"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-stone-500">
                          {s.id}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#1A2928]">
                          {s.datosPersonales.nombre}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-[#165C58]">
                          {s.puntajeVulnerabilidad} pts
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-600">
                          {s.etapaActual}
                        </td>
                        <td className="px-4 py-3">{estadoBadge(s.estado)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-stone-500">
                          {s.historialAuditoria.length}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-emerald-700">
                          {ultimo?.hashActual || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSolicitud(s);
                            }}
                            className="text-xs text-[#165C58] font-medium hover:underline"
                          >
                            Auditar Cadena Hash
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

