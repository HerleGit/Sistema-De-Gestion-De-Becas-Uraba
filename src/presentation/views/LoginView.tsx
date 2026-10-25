import { useState } from "react";
import {
  EtapaComite,
  RolUsuario,
  UsuarioSesion,
} from "../../domain/models";

export const PERFILES_PREDETERMINADOS: Record<RolUsuario, UsuarioSesion> = {
  estudiante: {
    idDocumento: "1027890451",
    nombre: "Yulieth Córdoba Palacios",
    correo: "yulieth.cordoba@uniremington.edu.co",
    rol: "estudiante",
    cargo: "Estudiante · Ing. de Sistemas (6.° Semestre)",
  },
  comite: {
    nombre: "Marta Lucía Jiménez Torres",
    correo: "marta.jimenez@uniremington.edu.co",
    rol: "comite",
    cargo: "Comité Evaluador Institucional",
    comiteAsignado: "Todos",
  },
  administrador: {
    nombre: "H. Robledo Suárez",
    correo: "bienestar.uraba@uniremington.edu.co",
    rol: "administrador",
    cargo: "Administrador General · Bienestar Institucional",
  },
};

const CONTEXTO_ROL: Record<
  RolUsuario,
  {
    tituloPortal: string;
    subtitulo: string;
    colorPanel: string;
    permisos: string[];
    botonTexto: string;
  }
> = {
  estudiante: {
    tituloPortal: "Portal de Postulación y Consulta Estudiantil",
    subtitulo:
      "Espacio personal para radicar solicitudes de beca, consultar el avance en cada comité y subsanar documentos pendientes.",
    colorPanel: "bg-[#165C58]",
    permisos: [
      "Consulta en tiempo real del estado de tus solicitudes",
      "Línea de tiempo de las 4 etapas de evaluación",
      "Bandeja de subsanación rápida de soportes PDF",
      "Formulario para radicar nuevas postulaciones",
    ],
    botonTexto: "Ingresar al Portal del Estudiante",
  },
  comite: {
    tituloPortal: "Consola Exclusiva de Comités Evaluadores",
    subtitulo:
      "Acceso reservado a los miembros de Validación Documental, Comité Socioeconómico, Financiero y Aprobación Final.",
    colorPanel: "bg-[#1D4B49]",
    permisos: [
      "Cola de evaluación filtrada por etapa del comité",
      "Revisión de soportes documentales y puntaje de vulnerabilidad",
      "Emisión de dictamen (Avalar, Devolver para subsanación o Rechazar)",
      "Firma en registro de auditoría con hash inalterable",
    ],
    botonTexto: "Ingresar a la Consola del Comité",
  },
  administrador: {
    tituloPortal: "Panel de Gobierno y Configuración del Sistema",
    subtitulo:
      "Consola administrativa para parametrizar pesos socioeconómicos, gestionar comités y auditar el cumplimiento de Habeas Data.",
    colorPanel: "bg-[#1A2928]",
    permisos: [
      "Parametrización de pesos y umbrales del algoritmo RF2",
      "Configuración de presupuesto semestral y fechas de convocatoria",
      "Gestión de integrantes de comités y control de roles",
      "Verificación de integridad de hashes y exportación oficial CSV/PDF",
    ],
    botonTexto: "Ingresar al Panel Administrativo",
  },
};

export function LoginView({
  onLogin,
}: {
  onLogin: (sesion: UsuarioSesion) => void;
}) {
  const [role, setRole] = useState<RolUsuario>("estudiante");
  const [user, setUser] = useState(PERFILES_PREDETERMINADOS.estudiante.correo);
  const [pass, setPass] = useState("••••••••");
  const [documentoEst, setDocumentoEst] = useState("1027890451");
  const [etapaComite, setEtapaComite] = useState<EtapaComite | "Todos">(
    "Todos"
  );
  const [codigo2FA, setCodigo2FA] = useState("2026- ADMIN");
  const [err, setErr] = useState("");
  const [infoModal, setInfoModal] = useState<string | null>(null);

  const handleRoleSelect = (r: RolUsuario) => {
    setRole(r);
    setUser(PERFILES_PREDETERMINADOS[r].correo);
    setPass("••••••••");
    setErr("");
  };

  const handle = () => {
    if (!user.trim() || !pass.trim()) {
      setErr("Por favor completa tus credenciales institucionales.");
      return;
    }
    const base = PERFILES_PREDETERMINADOS[role];
    onLogin({
      ...base,
      correo: user.trim(),
      idDocumento: role === "estudiante" ? documentoEst.trim() : undefined,
      comiteAsignado: role === "comite" ? etapaComite : undefined,
      cargo:
        role === "comite" && etapaComite !== "Todos"
          ? `Evaluador · ${etapaComite}`
          : base.cargo,
    });
  };

  const ctx = CONTEXTO_ROL[role];

  return (
    <div className="flex h-full min-h-screen">
      {/* Left panel adaptativo según el rol */}
      <div
        className={`hidden lg:flex flex-col justify-between w-[46%] ${ctx.colorPanel} px-14 py-14 text-white transition-colors duration-300`}
      >
        <div>
          <div className="text-[10px] tracking-widest uppercase text-white/45 mb-6">
            Corporación Universitaria Remington · Sede Urabá
          </div>
          <div className="inline-block text-[11px] font-medium bg-white/10 border border-white/15 rounded-full px-3 py-1 mb-4">
            Acceso Segmentado por Rol:{" "}
            <strong className="uppercase">{role}</strong>
          </div>
          <h1
            className="font-display text-3xl font-semibold leading-tight mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {ctx.tituloPortal}
          </h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-md">
            {ctx.subtitulo}
          </p>
        </div>

        {/* Módulos exclusivos habilitados para este rol */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
            Alcance y permisos de este perfil:
          </div>
          <div className="flex flex-col gap-3">
            {ctx.permisos.map((f) => (
              <div
                key={f}
                className="flex items-center gap-3 text-sm text-white/85"
              >
                <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-[10px] shrink-0">
                  ✓
                </span>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-white/35">
          Eje bananero · Región de Urabá · Cumplimiento Ley 1581 de 2012 (Habeas
          Data)
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-[#F5F2EC] px-6 py-10">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden text-center mb-6">
            <div
              className="font-display text-2xl font-semibold text-[#165C58]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Gestión de Becas · Urabá
            </div>
          </div>

          <h2
            className="font-display text-2xl font-semibold text-[#1A2928] mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Iniciar Sesión
          </h2>
          <p className="text-sm text-stone-500 mb-5">
            Selecciona tu perfil para cargar los módulos correspondientes:
          </p>

          {/* Role selector cards */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {(
              [
                { id: "estudiante", icon: "🎓", label: "Estudiante" },
                { id: "comite", icon: "⚖️", label: "Comité" },
                { id: "administrador", icon: "⚙️", label: "Admin" },
              ] as { id: RolUsuario; icon: string; label: string }[]
            ).map((r) => (
              <button
                key={r.id}
                onClick={() => handleRoleSelect(r.id)}
                className={`flex flex-col items-center gap-1 py-2.5 px-2 text-xs font-medium rounded-lg border transition-all ${
                  role === r.id
                    ? "border-[#165C58] bg-[#165C58] text-white shadow-sm"
                    : "border-stone-200 text-stone-600 bg-white hover:border-stone-400"
                }`}
              >
                <span className="text-base">{r.icon}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-white p-6 rounded-xl border border-stone-200/80 shadow-xs flex flex-col gap-4">
            {/* Campo específico según rol */}
            {role === "estudiante" && (
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1.5 block">
                  Documento de identidad del estudiante
                </label>
                <input
                  type="text"
                  value={documentoEst}
                  onChange={(e) => setDocumentoEst(e.target.value)}
                  placeholder="Ej. 1027890451"
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#165C58]/30 focus:border-[#165C58] bg-stone-50/50 font-mono"
                />
              </div>
            )}

            {role === "comite" && (
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1.5 block">
                  Comité evaluador asignado
                </label>
                <select
                  value={etapaComite}
                  onChange={(e) =>
                    setEtapaComite(e.target.value as EtapaComite | "Todos")
                  }
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#165C58]/30 focus:border-[#165C58] bg-stone-50/50 text-stone-700"
                >
                  <option value="Todos">
                    Todos los comités (Vista Coordinador)
                  </option>
                  <option value="Validación Documental">
                    1. Validación Documental
                  </option>
                  <option value="Comité Socioeconómico">
                    2. Comité Socioeconómico
                  </option>
                  <option value="Comité Financiero">
                    3. Comité Financiero
                  </option>
                  <option value="Aprobación Final">
                    4. Comité de Aprobación Final
                  </option>
                </select>
              </div>
            )}

            {role === "administrador" && (
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1.5 block">
                  Token de seguridad administrativa
                </label>
                <input
                  type="text"
                  value={codigo2FA}
                  onChange={(e) => setCodigo2FA(e.target.value)}
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#165C58]/30 focus:border-[#165C58] bg-stone-50/50 font-mono"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-stone-600 mb-1.5 block">
                Correo institucional ({role})
              </label>
              <input
                type="email"
                value={user}
                onChange={(e) => {
                  setUser(e.target.value);
                  setErr("");
                }}
                placeholder="nombre@uniremington.edu.co"
                className="w-full border border-stone-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#165C58]/30 focus:border-[#165C58] bg-white placeholder:text-stone-300"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-stone-600 mb-1.5 block">
                Contraseña
              </label>
              <input
                type="password"
                value={pass}
                onChange={(e) => {
                  setPass(e.target.value);
                  setErr("");
                }}
                placeholder="••••••••"
                className="w-full border border-stone-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#165C58]/30 focus:border-[#165C58] bg-white placeholder:text-stone-300"
              />
            </div>

            {err && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
                ⚠ {err}
              </div>
            )}

            <button
              onClick={handle}
              className="w-full bg-[#165C58] text-white py-2.5 rounded text-sm font-semibold hover:bg-[#1A6E69] transition-colors mt-1"
            >
              {ctx.botonTexto} →
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-stone-500">
            <button
              onClick={() =>
                setInfoModal(
                  "Para restablecer tu clave institucional comunícate con Mesa de Ayuda TI Uniremington o escribe a soporte.uraba@uniremington.edu.co."
                )
              }
              className="hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
            <button
              onClick={() =>
                setInfoModal(
                  "Soporte Técnico Regional Urabá (Sede Apartadó): Línea (604) 828 1234 · WhatsApp 310 555 2026."
                )
              }
              className="hover:underline"
            >
              Soporte técnico
            </button>
          </div>

          {infoModal && (
            <div className="mt-3 p-3 bg-white border border-stone-200 rounded text-xs text-stone-600 flex items-start justify-between gap-2">
              <span>{infoModal}</span>
              <button
                onClick={() => setInfoModal(null)}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
