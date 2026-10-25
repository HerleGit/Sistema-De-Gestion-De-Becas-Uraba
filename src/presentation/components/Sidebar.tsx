import { useState } from "react";
import { RolUsuario, UsuarioSesion } from "../../domain/models";

export type Screen =
  | "login"
  // Vistas exclusivas del Estudiante
  | "est_solicitudes"
  | "est_postular"
  // Vistas exclusivas del Comité
  | "com_bandeja"
  | "com_actas"
  // Vistas exclusivas del Administrador
  | "adm_parametros"
  | "adm_usuarios"
  | "adm_auditoria";

export const MENU_POR_ROL: Record<
  RolUsuario,
  { id: Screen; icon: string; label: string; desc: string }[]
> = {
  estudiante: [
    {
      id: "est_solicitudes",
      icon: "⊞",
      label: "Mis Solicitudes",
      desc: "Estado en línea y subsanación",
    },
    {
      id: "est_postular",
      icon: "✎",
      label: "Radicar Postulación",
      desc: "Nuevo auxilio socioeconómico",
    },
  ],
  comite: [
    {
      id: "com_bandeja",
      icon: "⚖",
      label: "Bandeja de Evaluación",
      desc: "Revisión y dictamen por etapa",
    },
    {
      id: "com_actas",
      icon: "◫",
      label: "Historial de Dictámenes",
      desc: "Solicitudes evaluadas y actas",
    },
  ],
  administrador: [
    {
      id: "adm_parametros",
      icon: "⚙",
      label: "Parametrización y Reglas",
      desc: "Pesos RF2, umbrales y presupuesto",
    },
    {
      id: "adm_usuarios",
      icon: "👥",
      label: "Gestión de Comités",
      desc: "Usuarios, roles y permisos",
    },
    {
      id: "adm_auditoria",
      icon: "🛡",
      label: "Auditoría y Reportes",
      desc: "Trazabilidad hash y exportación",
    },
  ],
};

const ETIQUETA_PORTAL: Record<
  RolUsuario,
  { titulo: string; badge: string; colorSidebar: string }
> = {
  estudiante: {
    titulo: "Portal del Estudiante",
    badge: "Módulo de Postulación y Consulta",
    colorSidebar: "bg-[#165C58]",
  },
  comite: {
    titulo: "Consola de Comité",
    badge: "Evaluación Institucional",
    colorSidebar: "bg-[#1D4B49]",
  },
  administrador: {
    titulo: "Gobierno del Sistema",
    badge: "Administración y Auditoría",
    colorSidebar: "bg-[#1A2928]",
  },
};

export function Sidebar({
  active,
  usuario,
  onNav,
  onLogout,
}: {
  active: Screen;
  usuario: UsuarioSesion;
  onNav: (s: Screen) => void;
  onLogout: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = MENU_POR_ROL[usuario.rol];
  const portal = ETIQUETA_PORTAL[usuario.rol];

  const handleSelectNav = (id: Screen) => {
    onNav(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Barra superior compacta para dispositivos móviles (< 768px) */}
      <header
        className={`md:hidden flex items-center justify-between px-4 py-3 ${portal.colorSidebar} text-white shrink-0 print:hidden`}
      >
        <div>
          <div className="text-[9px] uppercase tracking-widest text-white/60">
            Uniremington · Urabá
          </div>
          <div
            className="font-display text-sm font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {portal.titulo}
          </div>
        </div>
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="px-3 py-1.5 rounded bg-white/10 border border-white/15 text-xs font-medium"
        >
          {mobileOpen ? "✕ Cerrar" : "☰ Menú"}
        </button>
      </header>

      {/* Fondo oscuro móvil cuando el menú está desplegado */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      {/* Menú Lateral (Fijo en escritorio, desplegable en móvil) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-[248px] shrink-0 ${
          portal.colorSidebar
        } text-white h-full min-h-screen transition-transform duration-200 print:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Header del Portal según Rol */}
        <div className="px-5 pt-7 pb-5 border-b border-white/10">
          <div className="text-[10px] font-semibold tracking-widest uppercase text-white/50 mb-1">
            Uniremington · Urabá
          </div>
          <div
            className="font-display text-[17px] font-semibold leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {portal.titulo}
          </div>
          <div className="mt-2 inline-block text-[10px] bg-white/10 text-white/80 px-2 py-0.5 rounded border border-white/10">
            {portal.badge}
          </div>
        </div>

        {/* Navegación exclusiva del rol */}
        <div className="px-5 pt-4 pb-1 text-[10px] uppercase tracking-wider text-white/40 font-semibold">
          Módulos habilitados
        </div>
        <nav className="flex-1 py-2 px-3 flex flex-col gap-1.5">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectNav(item.id)}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors w-full ${
                active === item.id
                  ? "bg-white/15 text-white shadow-xs"
                  : "text-white/65 hover:bg-white/8 hover:text-white"
              }`}
            >
              <span className="text-base leading-none mt-0.5">{item.icon}</span>
              <div>
                <div className="text-sm font-medium leading-tight">
                  {item.label}
                </div>
                <div className="text-[10px] text-white/50 mt-0.5">
                  {item.desc}
                </div>
              </div>
            </button>
          ))}

          {/* Aviso de control de acceso RBAC */}
          <div className="mt-auto mb-3 mx-2 p-3 rounded-lg bg-black/15 border border-white/10 text-[11px] text-white/65 leading-relaxed">
            <div className="font-semibold text-white/85 mb-1">
              🔒 Acceso Segmentado (RBAC)
            </div>
            {usuario.rol === "estudiante" && (
              <span>
                Vista restringida a tus solicitudes propias y radicación en
                línea.
              </span>
            )}
            {usuario.rol === "comite" && (
              <span>
                Vista exclusiva para dictamen técnico y revisión de soportes.
              </span>
            )}
            {usuario.rol === "administrador" && (
              <span>
                Vista exclusiva de configuración de parámetros, usuarios y
                auditoría.
              </span>
            )}
          </div>
        </nav>

        {/* Usuario autenticado */}
        <div className="px-4 pb-5 border-t border-white/10 pt-4">
          <div className="text-[11px] text-white/40 mb-0.5">Sesión activa</div>
          <div className="text-sm font-medium text-white/95 truncate">
            {usuario.nombre}
          </div>
          <div className="text-[11px] text-white/55 truncate">
            {usuario.cargo}
          </div>
          <button
            onClick={onLogout}
            className="mt-3 text-[11px] text-white/60 hover:text-white transition-colors flex items-center gap-1"
          >
            Cerrar sesión →
          </button>
        </div>
      </aside>
    </>
  );
}
