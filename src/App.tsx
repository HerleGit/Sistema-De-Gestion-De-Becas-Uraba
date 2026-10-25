import { useState } from "react";
import {
  ParametrosSistema,
  RolUsuario,
  SolicitudBeca,
  UsuarioSesion,
  UsuarioSistema,
} from "./domain/models";
import {
  PARAMETROS_POR_DEFECTO,
  SolicitudRepository,
  USUARIOS_INICIALES,
} from "./data/SolicitudRepository";
import { ModuloCalculoVulnerabilidad } from "./business/builders/SolicitudBecaBuilder";
import { Screen, Sidebar } from "./presentation/components/Sidebar";
import { AuditModal } from "./presentation/components/AuditModal";
import {
  LoginView,
  PERFILES_PREDETERMINADOS,
} from "./presentation/views/LoginView";
import { EstudianteView } from "./presentation/views/EstudianteView";
import { FormView } from "./presentation/views/FormView";
import { ComiteView } from "./presentation/views/ComiteView";
import { AdministradorView } from "./presentation/views/AdministradorView";

const PANTALLA_INICIAL_POR_ROL: Record<RolUsuario, Screen> = {
  estudiante: "est_solicitudes",
  comite: "com_bandeja",
  administrador: "adm_parametros",
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [usuario, setUsuario] = useState<UsuarioSesion>(
    PERFILES_PREDETERMINADOS.estudiante
  );
  const [solicitudes, setSolicitudes] = useState<SolicitudBeca[]>(() =>
    SolicitudRepository.obtenerTodas()
  );
  const [parametros, setParametros] = useState<ParametrosSistema>(() =>
    SolicitudRepository.obtenerParametros()
  );
  const [usuariosSistema, setUsuariosSistema] = useState<UsuarioSistema[]>(() =>
    SolicitudRepository.obtenerUsuarios()
  );
  const [solicitudSeleccionada, setSolicitudSeleccionada] =
    useState<SolicitudBeca | null>(null);

  const handleLogin = (sesion: UsuarioSesion) => {
    setUsuario(sesion);
    setScreen(PANTALLA_INICIAL_POR_ROL[sesion.rol]);
  };

  if (screen === "login") {
    return <LoginView onLogin={handleLogin} />;
  }

  const handleCrearSolicitud = (nueva: SolicitudBeca) => {
    const actualizadas = SolicitudRepository.agregar(nueva);
    setSolicitudes(actualizadas);
  };

  const handleActualizarSolicitud = (actualizada: SolicitudBeca) => {
    const actualizadas = SolicitudRepository.actualizar(actualizada);
    setSolicitudes(actualizadas);
    if (
      solicitudSeleccionada &&
      solicitudSeleccionada.id === actualizada.id
    ) {
      setSolicitudSeleccionada(actualizada);
    }
  };

  const handleGuardarParametros = (nuevos: ParametrosSistema) => {
    SolicitudRepository.guardarParametros(nuevos);
    setParametros(nuevos);

    // Recalcular dinámicamente los puntajes de las solicitudes en revisión con los nuevos pesos RF2
    const recalculadas = solicitudes.map((sol) => {
      if (sol.estado === "Aprobada") return sol;
      const vars = sol.variablesSocioeconomicas;
      const nuevoPuntaje = ModuloCalculoVulnerabilidad.calcularPuntaje(
        {
          ingresos: vars.ingresos?.valor ?? 750000,
          dependientes: vars.dependientes?.valor ?? 2,
          estrato: vars.estrato?.valor ?? 1,
          distancia: vars.distancia?.valor ?? 20,
        },
        nuevos
      );
      return {
        ...sol,
        puntajeVulnerabilidad: nuevoPuntaje,
      };
    });
    SolicitudRepository.guardarTodas(recalculadas);
    setSolicitudes(recalculadas);
  };

  const handleGuardarUsuarios = (nuevos: UsuarioSistema[]) => {
    SolicitudRepository.guardarUsuarios(nuevos);
    setUsuariosSistema(nuevos);
  };

  const handleResetDemo = () => {
    const restauradas = SolicitudRepository.restablecerSemilla();
    SolicitudRepository.guardarParametros(PARAMETROS_POR_DEFECTO);
    SolicitudRepository.guardarUsuarios(USUARIOS_INICIALES);
    setSolicitudes(restauradas);
    setParametros({ ...PARAMETROS_POR_DEFECTO });
    setUsuariosSistema([...USUARIOS_INICIALES]);
    setSolicitudSeleccionada(null);
  };

  const siguienteId = SolicitudRepository.generarSiguienteId(solicitudes);

  return (
    <div className="flex flex-col md:flex-row h-full min-h-screen bg-[#F5F2EC]">
      <Sidebar
        active={screen}
        usuario={usuario}
        onNav={setScreen}
        onLogout={() => {
          setSolicitudSeleccionada(null);
          setScreen("login");
        }}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 1. VISTAS EXCLUSIVAS DEL ESTUDIANTE */}
        {usuario.rol === "estudiante" && screen === "est_solicitudes" && (
          <EstudianteView
            usuario={usuario}
            solicitudes={solicitudes}
            parametros={parametros}
            onNuevaPostulacion={() => setScreen("est_postular")}
            onUpdateSolicitud={handleActualizarSolicitud}
            onVerDetalle={setSolicitudSeleccionada}
          />
        )}
        {usuario.rol === "estudiante" && screen === "est_postular" && (
          <FormView
            usuario={usuario}
            parametros={parametros}
            siguienteId={siguienteId}
            onCreateSolicitud={handleCrearSolicitud}
            onGoToDashboard={() => setScreen("est_solicitudes")}
          />
        )}

        {/* 2. VISTAS EXCLUSIVAS DEL COMITÉ */}
        {usuario.rol === "comite" &&
          (screen === "com_bandeja" || screen === "com_actas") && (
            <ComiteView
              modo={screen === "com_bandeja" ? "bandeja" : "actas"}
              usuario={usuario}
              solicitudes={solicitudes}
              parametros={parametros}
              onSelectSolicitud={setSolicitudSeleccionada}
            />
          )}

        {/* 3. VISTAS EXCLUSIVAS DEL ADMINISTRADOR */}
        {usuario.rol === "administrador" &&
          (screen === "adm_parametros" ||
            screen === "adm_usuarios" ||
            screen === "adm_auditoria") && (
            <AdministradorView
              modulo={
                screen === "adm_parametros"
                  ? "parametros"
                  : screen === "adm_usuarios"
                  ? "usuarios"
                  : "auditoria"
              }
              parametros={parametros}
              usuarios={usuariosSistema}
              solicitudes={solicitudes}
              onSaveParametros={handleGuardarParametros}
              onSaveUsuarios={handleGuardarUsuarios}
              onSelectSolicitud={setSolicitudSeleccionada}
              onResetDemo={handleResetDemo}
            />
          )}
      </main>

      {solicitudSeleccionada && (
        <AuditModal
          solicitud={solicitudSeleccionada}
          usuario={usuario}
          parametros={parametros}
          onClose={() => setSolicitudSeleccionada(null)}
          onUpdateSolicitud={handleActualizarSolicitud}
        />
      )}
    </div>
  );
}
