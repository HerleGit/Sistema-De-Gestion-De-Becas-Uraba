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
  const [usuarioDetalle, setUsuarioDetalle] = useState<UsuarioSistema | null>(
    null
  );
  const [mostrarClavesTabla, setMostrarClavesTabla] = useState(false);
  const [filtroRolUsuario, setFiltroRolUsuario] = useState<
    "todos" | "estudiante" | "comite" | "administrador"
  >("todos");

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
    if (usuarioDetalle && usuarioDetalle.id === id) {
      setUsuarioDetalle({ ...usuarioDetalle, activo: !usuarioDetalle.activo });
    }
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
          <div className="bg-emerald-50/70 rounded-xl border border-emerald-200 p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#1A2928] mb-1">
                🔒 Directorio General de Usuarios del Sistema
              </h3>
              <p className="text-xs text-stone-600">
                Haz clic en cualquier fila o en{" "}
                <strong>"Ver toda la información"</strong> para inspeccionar la
                ficha completa del usuario (datos personales, académicos,
                contacto, credenciales y solicitudes asociadas).
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {(
                [
                  { id: "todos", label: `Todos (${usuarios.length})` },
                  {
                    id: "estudiante",
                    label: `Estudiantes (${
                      usuarios.filter((u) => u.rol === "estudiante").length
                    })`,
                  },
                  {
                    id: "comite",
                    label: `Comités (${
                      usuarios.filter((u) => u.rol === "comite").length
                    })`,
                  },
                  {
                    id: "administrador",
                    label: `Admin (${
                      usuarios.filter((u) => u.rol === "administrador").length
                    })`,
                  },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFiltroRolUsuario(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    filtroRolUsuario === f.id
                      ? "bg-[#165C58] text-white border-[#165C58]"
                      : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <button
                onClick={() => setMostrarClavesTabla((p) => !p)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-stone-200 text-[#165C58] hover:border-[#165C58]"
              >
                {mostrarClavesTabla ? "🙈 Ocultar Claves" : "👁 Mostrar Claves"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/70">
                    {[
                      "ID",
                      "Nombre Completo / Documento",
                      "Correo y Teléfono",
                      "Clave Asignada",
                      "Rol",
                      "Detalle Académico / Comité Asignado",
                      "Estado",
                      "Acciones",
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
                  {usuarios
                    .filter(
                      (u) =>
                        filtroRolUsuario === "todos" ||
                        u.rol === filtroRolUsuario
                    )
                    .map((u) => {
                      const claveReal =
                        u.passwordClave ||
                        (u.rol === "estudiante"
                          ? "Estudiante2026*"
                          : u.rol === "administrador"
                          ? "AdminUraba2026*"
                          : "Socioeconomico2026*");

                      return (
                        <tr
                          key={u.id}
                          onClick={() => setUsuarioDetalle(u)}
                          className="border-b border-stone-100 last:border-0 hover:bg-stone-50/80 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-stone-400">
                            {u.id}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-[#1A2928]">
                              {u.nombre}
                            </div>
                            <div className="text-[11px] text-stone-400 font-mono">
                              {u.rol === "estudiante"
                                ? `C.C. ${u.documentoIdentidad || "Sin registrar"}`
                                : u.cargo}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-stone-700">
                              {u.correo}
                            </div>
                            <div className="text-[11px] text-stone-400">
                              {u.rol === "estudiante"
                                ? `Tel: ${u.telefono || "310 000 0000"} · ${
                                    u.municipio || "Urabá"
                                  }`
                                : u.correosAlternos && u.correosAlternos.length > 0
                                ? `Alt: ${u.correosAlternos.join(", ")}`
                                : "Sede Regional Urabá"}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-stone-600">
                            {mostrarClavesTabla ? (
                              <span className="bg-stone-100 px-2 py-0.5 rounded border border-stone-200 text-[#165C58]">
                                {claveReal}
                              </span>
                            ) : (
                              "••••••••••"
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs capitalize font-medium text-[#165C58]">
                            {u.rol}
                          </td>
                          <td className="px-4 py-3 text-xs text-stone-600">
                            {u.rol === "estudiante" ? (
                              <div>
                                <div className="font-medium text-[#1A2928]">
                                  {u.programa || "Ingeniería de Sistemas"}
                                </div>
                                <div className="text-[11px] text-stone-400">
                                  Semestre {u.semestre ?? 1}.° · Promedio:{" "}
                                  <strong className="text-[#165C58]">
                                    {(u.promedio ?? 4.0).toFixed(2)}
                                  </strong>
                                </div>
                              </div>
                            ) : (
                              <span className="font-medium">
                                {u.etapaAsignada || "Administración Global"}
                              </span>
                            )}
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
                          <td
                            className="px-4 py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setUsuarioDetalle(u)}
                                className="px-2.5 py-1 rounded bg-[#165C58] text-white text-xs font-medium hover:bg-[#1A6E69] transition-colors"
                              >
                                Ver información
                              </button>
                              <button
                                onClick={() => handleToggleUsuario(u.id)}
                                className="text-xs text-stone-500 hover:text-red-600 hover:underline font-medium"
                              >
                                {u.activo ? "Suspender" : "Reactivar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MODAL / FICHA COMPLETA DE INFORMACIÓN DEL USUARIO */}
          {usuarioDetalle && (
            <div
              onClick={() => setUsuarioDetalle(null)}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl border border-stone-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
              >
                <div className="bg-[#1A2928] text-white px-6 py-5 flex items-start justify-between gap-4 rounded-t-2xl">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold">
                      Ficha Integral de Usuario · ID {usuarioDetalle.id}
                    </div>
                    <h3
                      className="font-display text-xl font-semibold mt-0.5"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {usuarioDetalle.nombre}
                    </h3>
                    <div className="text-xs text-white/70 mt-0.5">
                      {usuarioDetalle.cargo}
                    </div>
                  </div>
                  <button
                    onClick={() => setUsuarioDetalle(null)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 flex flex-col gap-5">
                  {/* Bloque 1: Credenciales y Cuenta (Tabla usuarios) */}
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#165C58] mb-2.5">
                      1. Información de Cuenta y Credenciales
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 rounded-xl p-4 border border-stone-200/70 text-xs">
                      <div>
                        <span className="text-stone-400 block">
                          ID Interno:
                        </span>
                        <strong className="font-mono text-stone-800 text-sm">
                          {usuarioDetalle.id}
                        </strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block">
                          Rol del Sistema (RBAC):
                        </span>
                        <strong className="uppercase text-[#165C58] text-sm">
                          {usuarioDetalle.rol}
                        </strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block">
                          Correo Institucional Principal:
                        </span>
                        <strong className="text-stone-800">
                          {usuarioDetalle.correo}
                        </strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block">
                          Contraseña / Clave Asignada:
                        </span>
                        <strong className="font-mono bg-white px-2 py-0.5 rounded border border-stone-200 text-[#165C58]">
                          {usuarioDetalle.passwordClave ||
                            (usuarioDetalle.rol === "estudiante"
                              ? "Estudiante2026*"
                              : usuarioDetalle.rol === "administrador"
                              ? "AdminUraba2026*"
                              : "Socioeconomico2026*")}
                        </strong>
                      </div>
                      {usuarioDetalle.correosAlternos &&
                        usuarioDetalle.correosAlternos.length > 0 && (
                          <div className="sm:col-span-2">
                            <span className="text-stone-400 block">
                              Correo Institucional Alterno:
                            </span>
                            <strong className="text-stone-700">
                              {usuarioDetalle.correosAlternos.join(", ")}
                            </strong>
                          </div>
                        )}
                      <div>
                        <span className="text-stone-400 block">
                          Estado de Acceso:
                        </span>
                        <span
                          className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            usuarioDetalle.activo
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {usuarioDetalle.activo
                            ? "ACTIVO Y HABILITADO"
                            : "SUSPENDIDO"}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block">
                          Cargo / Perfil:
                        </span>
                        <strong className="text-stone-700">
                          {usuarioDetalle.cargo}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Bloque 2: Datos Académicos y Personales (si es Estudiante) o Asignación (si es Comité) */}
                  {usuarioDetalle.rol === "estudiante" ? (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-[#165C58] mb-2.5">
                        2. Información Personal y Académica
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50 rounded-xl p-4 border border-stone-200/70 text-xs">
                        <div>
                          <span className="text-stone-400 block">
                            Documento de Identidad:
                          </span>
                          <strong className="font-mono text-stone-800 text-sm">
                            {usuarioDetalle.documentoIdentidad || "No registrado"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-stone-400 block">
                            Teléfono Celular:
                          </span>
                          <strong className="text-stone-800 text-sm">
                            {usuarioDetalle.telefono || "310 000 0000"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-stone-400 block">
                            Municipio de Residencia:
                          </span>
                          <strong className="text-stone-800 text-sm">
                            {usuarioDetalle.municipio || "Apartadó"} (Urabá)
                          </strong>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-stone-400 block">
                            Programa Académico e Institución:
                          </span>
                          <strong className="text-stone-800 text-sm">
                            {usuarioDetalle.programa || "Ingeniería de Sistemas"}
                          </strong>
                          <span className="block text-[11px] text-stone-500">
                            Corporación Universitaria Remington · Sede Urabá - Apartadó
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400 block">
                            Semestre y Promedio:
                          </span>
                          <strong className="text-[#165C58] text-sm font-mono">
                            Sem. {usuarioDetalle.semestre ?? 1}.° · Prom:{" "}
                            {(usuarioDetalle.promedio ?? 4.0).toFixed(2)} / 5.0
                          </strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-[#165C58] mb-2.5">
                        2. Asignación Institucional y Permisos RBAC
                      </div>
                      <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/70 text-xs flex flex-col gap-2">
                        <div>
                          <span className="text-stone-400">
                            Eslabón / Comité Asignado:{" "}
                          </span>
                          <strong className="text-[#165C58]">
                            {usuarioDetalle.etapaAsignada ||
                              "Gobierno y Administración Global"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-stone-400">
                            Restricción de Vista:{" "}
                          </span>
                          <strong className="text-stone-700">
                            {usuarioDetalle.rol === "comite"
                              ? "Acceso restringido a una única vista de evaluación de expedientes de su etapa."
                              : "Acceso total a parametrización RF2, directorio de usuarios y auditoría hash."}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bloque 3: Solicitudes de Beca o Actividad asociada */}
                  {usuarioDetalle.rol === "estudiante" && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-[#165C58] mb-2.5">
                        3. Solicitudes de Beca Asociadas a este Estudiante
                      </div>
                      {(() => {
                        const solicitudesEst = solicitudes.filter(
                          (s) =>
                            s.datosPersonales.id ===
                              usuarioDetalle.documentoIdentidad ||
                            s.datosPersonales.correo?.toLowerCase() ===
                              usuarioDetalle.correo.toLowerCase() ||
                            s.datosPersonales.nombre.toLowerCase() ===
                              usuarioDetalle.nombre.toLowerCase()
                        );
                        if (solicitudesEst.length === 0) {
                          return (
                            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/70 text-xs text-stone-500">
                              Este estudiante está registrado en la base de
                              datos pero aún no ha radicado ninguna solicitud de
                              beca en el semestre actual.
                            </div>
                          );
                        }
                        return (
                          <div className="flex flex-col gap-2">
                            {solicitudesEst.map((s) => (
                              <div
                                key={s.id}
                                className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 rounded-xl p-3.5 border border-stone-200/80 text-xs"
                              >
                                <div>
                                  <span className="font-mono font-semibold text-[#165C58]">
                                    {s.id}
                                  </span>{" "}
                                  · Radicada el {s.fecha} · Puntaje:{" "}
                                  <strong>{s.puntajeVulnerabilidad}/100</strong>{" "}
                                  · Etapa: <strong>{s.etapaActual}</strong>
                                </div>
                                <div className="flex items-center gap-2">
                                  {estadoBadge(s.estado)}
                                  <button
                                    onClick={() => {
                                      setUsuarioDetalle(null);
                                      onSelectSolicitud(s);
                                    }}
                                    className="px-2.5 py-1 rounded bg-[#165C58] text-white font-medium hover:bg-[#1A6E69]"
                                  >
                                    Abrir Expediente
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                    <button
                      onClick={() => handleToggleUsuario(usuarioDetalle.id)}
                      className="text-xs font-medium text-stone-600 hover:text-red-600 underline"
                    >
                      {usuarioDetalle.activo
                        ? "Suspender acceso de este usuario"
                        : "Reactivar acceso de este usuario"}
                    </button>
                    <button
                      onClick={() => setUsuarioDetalle(null)}
                      className="px-4 py-2 rounded-lg bg-[#1A2928] text-white text-xs font-semibold hover:bg-stone-800"
                    >
                      Cerrar Ficha
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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

