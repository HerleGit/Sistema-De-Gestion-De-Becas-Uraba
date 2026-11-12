import { useState } from "react";
import {
  RolUsuario,
  UsuarioSesion,
  UsuarioSistema,
} from "../../domain/models";
import {
  SolicitudRepository,
  USUARIOS_INICIALES,
} from "../../data/SolicitudRepository";

export const PERFILES_PREDETERMINADOS: Record<RolUsuario, UsuarioSesion> = {
  estudiante: {
    idDocumento: "1027890451",
    nombre: "Yulieth Córdoba Palacios",
    correo: "yulieth.cordoba@uniremington.edu.co",
    rol: "estudiante",
    cargo: "Estudiante · Ing. de Sistemas (6.° Semestre)",
    telefono: "312 458 9012",
    municipio: "Turbo",
    programa: "Ingeniería de Sistemas",
    semestre: 6,
    promedio: 4.3,
  },
  comite: {
    nombre: "Marta Lucía Jiménez Torres",
    correo: "marta.jimenez@uniremington.edu.co",
    rol: "comite",
    cargo: "Comité Evaluador Institucional",
    comiteAsignado: "Validación Documental",
  },
  administrador: {
    nombre: "H. Robledo Suárez",
    correo: "bienestar.uraba@uniremington.edu.co",
    rol: "administrador",
    cargo: "Administrador General · Bienestar Institucional",
  },
};

type TipoAlertaLogin =
  | "CAMPOS_INCOMPLETOS"
  | "USUARIO_NO_REGISTRADO"
  | "CLAVE_INCORRECTA"
  | "CUENTA_SUSPENDIDA"
  | "BLOQUEO_SEGURIDAD"
  | null;

interface AlertaLoginDetalle {
  tipo: TipoAlertaLogin;
  titulo: string;
  mensaje: string;
  camposConError?: ("correo" | "password")[];
}

export function LoginView({
  usuariosRegistrados,
  onLogin,
  onUsuarioCreado,
}: {
  usuariosRegistrados: UsuarioSistema[];
  onLogin: (sesion: UsuarioSesion) => void;
  onUsuarioCreado: (usuariosActualizados: UsuarioSistema[]) => void;
}) {
  const [modoVista, setModoVista] = useState<"login" | "registro">("login");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [err, setErr] = useState("");
  const [alertaLogin, setAlertaLogin] = useState<AlertaLoginDetalle | null>(
    null
  );
  const [okMsg, setOkMsg] = useState("");
  const [guardandoBD, setGuardandoBD] = useState(false);
  const [infoModal, setInfoModal] = useState<string | null>(null);
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const [bloqueadoHasta, setBloqueadoHasta] = useState<number | null>(null);

  // Estado del formulario de creación de cuenta (exclusivo para estudiantes)
  const [regNombre, setRegNombre] = useState("");
  const [regDocumento, setRegDocumento] = useState("");
  const [regTelefono, setRegTelefono] = useState("");
  const [regCorreo, setRegCorreo] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regMunicipio, setRegMunicipio] = useState("Apartadó");
  const [regPrograma, setRegPrograma] = useState("Ingeniería de Sistemas");
  const [regSemestre, setRegSemestre] = useState("5");
  const [regPromedio, setRegPromedio] = useState("4.2");

  const limpiarErrores = () => {
    setErr("");
    setAlertaLogin(null);
  };

  const handle = async () => {
    limpiarErrores();
    setOkMsg("");

    if (bloqueadoHasta && Date.now() < bloqueadoHasta) {
      const segs = Math.ceil((bloqueadoHasta - Date.now()) / 1000);
      setAlertaLogin({
        tipo: "BLOQUEO_SEGURIDAD",
        titulo: "Acceso bloqueado temporalmente",
        mensaje: `Se superó el límite de intentos fallidos. Por seguridad, espera ${segs} segundos antes de volver a intentarlo.`,
      });
      return;
    }

    const correoInput = user.trim().toLowerCase();
    const claveInput = pass.trim();

    // CASO 3: VALIDACIÓN DE CAMPOS INCOMPLETOS
    const camposVacios: ("correo" | "password")[] = [];
    const nombresCamposVacios: string[] = [];

    if (!correoInput) {
      camposVacios.push("correo");
      nombresCamposVacios.push("Usuario o Correo Electrónico");
    }

    if (!claveInput) {
      camposVacios.push("password");
      nombresCamposVacios.push("Contraseña");
    }

    if (camposVacios.length > 0) {
      setAlertaLogin({
        tipo: "CAMPOS_INCOMPLETOS",
        titulo: "Campos incompletos",
        mensaje: `Por favor completa los campos requeridos (${nombresCamposVacios.join(
          " y "
        )}) para iniciar sesión.`,
        camposConError: camposVacios,
      });
      return;
    }

    // Consultar directorio de usuarios
    let listaUsuarios = [...USUARIOS_INICIALES, ...usuariosRegistrados];
    try {
      const resp = await fetch("/api/estudiantes");
      if (resp.ok) {
        const data = await resp.json();
        if (data && Array.isArray(data.estudiantes)) {
          const mapa = new Map(
            listaUsuarios.map((u) => [u.correo.toLowerCase(), u])
          );
          for (const est of data.estudiantes as UsuarioSistema[]) {
            mapa.set(est.correo.toLowerCase(), est);
          }
          listaUsuarios = Array.from(mapa.values());
        }
      }
    } catch {
      // Continuar con el directorio local si el servicio no responde
    }

    // Buscar usuario por correo institucional o nombre de usuario
    const cuenta = listaUsuarios.find(
      (u) =>
        u.correo.toLowerCase() === correoInput ||
        (u.correosAlternos &&
          u.correosAlternos.some((alt) => alt.toLowerCase() === correoInput)) ||
        u.nombre.toLowerCase() === correoInput
    );

    // CASO 1: USUARIO NO REGISTRADO
    if (!cuenta) {
      const nuevosIntentos = intentosFallidos + 1;
      setIntentosFallidos(nuevosIntentos);
      if (nuevosIntentos >= 5) {
        setBloqueadoHasta(Date.now() + 30000);
      }
      setAlertaLogin({
        tipo: "USUARIO_NO_REGISTRADO",
        titulo: "El usuario no está registrado",
        mensaje: `El usuario "${user.trim()}" no se encuentra registrado.`,
        camposConError: ["correo"],
      });
      return;
    }

    if (!cuenta.activo) {
      setAlertaLogin({
        tipo: "CUENTA_SUSPENDIDA",
        titulo: "Usuario suspendido",
        mensaje: `La cuenta de "${cuenta.nombre}" se encuentra inactiva temporalmente.`,
      });
      return;
    }

    // CASO 2: CLAVE INCORRECTA
    const claveEsperada =
      cuenta.passwordClave ||
      (cuenta.rol === "estudiante"
        ? "Estudiante2026*"
        : cuenta.rol === "administrador"
        ? "AdminUraba2026*"
        : "Socioeconomico2026*");

    if (claveInput !== claveEsperada) {
      const nuevosIntentos = intentosFallidos + 1;
      setIntentosFallidos(nuevosIntentos);
      if (nuevosIntentos >= 5) {
        setBloqueadoHasta(Date.now() + 30000);
      }
      setAlertaLogin({
        tipo: "CLAVE_INCORRECTA",
        titulo: "Contraseña incorrecta",
        mensaje: `La contraseña ingresada para "${user.trim()}" es incorrecta. Intentos restantes: ${Math.max(
          0,
          5 - nuevosIntentos
        )}.`,
        camposConError: ["password"],
      });
      return;
    }

    setIntentosFallidos(0);
    setBloqueadoHasta(null);

    // Enrutamiento automático según las credenciales autenticadas
    if (cuenta.rol === "comite") {
      onLogin({
        nombre: cuenta.nombre,
        correo: cuenta.correo,
        rol: "comite",
        cargo: cuenta.cargo,
        comiteAsignado: cuenta.etapaAsignada || "Comité Socioeconómico",
      });
      return;
    }

    if (cuenta.rol === "administrador") {
      onLogin({
        nombre: cuenta.nombre,
        correo: cuenta.correo,
        rol: "administrador",
        cargo: cuenta.cargo,
      });
      return;
    }

    // Rol Estudiante
    onLogin({
      idDocumento: cuenta.documentoIdentidad || "1027890451",
      nombre: cuenta.nombre,
      correo: cuenta.correo,
      rol: "estudiante",
      cargo: cuenta.cargo,
      telefono: cuenta.telefono,
      municipio: cuenta.municipio,
      programa: cuenta.programa,
      semestre: cuenta.semestre,
      promedio: cuenta.promedio,
    });
  };

  const handleCrearEstudiante = async () => {
    setErr("");
    setOkMsg("");
    if (
      !regNombre.trim() ||
      !regDocumento.trim() ||
      !regCorreo.trim() ||
      !regPassword.trim()
    ) {
      setErr(
        "Completa todos los campos obligatorios (Nombre, Documento, Correo y Contraseña)."
      );
      return;
    }

    if (regPassword.trim().length < 6) {
      setErr(
        "Por seguridad, la contraseña del estudiante debe tener al menos 6 caracteres."
      );
      return;
    }

    const correoRegLower = regCorreo.trim().toLowerCase();
    const reservado = USUARIOS_INICIALES.find(
      (u) =>
        u.rol !== "estudiante" &&
        (u.correo.toLowerCase() === correoRegLower ||
          (u.correosAlternos &&
            u.correosAlternos.some((a) => a.toLowerCase() === correoRegLower)))
    );
    if (reservado) {
      setErr(
        "Este correo está reservado para un Comité o Administrador. Solo se permite registrar cuentas de Estudiantes."
      );
      return;
    }

    setGuardandoBD(true);
    const semestreNum = Math.max(1, Math.min(10, Number(regSemestre) || 1));
    const promedioNum = Math.max(
      0,
      Math.min(5, Number(regPromedio.replace(",", ".")) || 4.0)
    );

    const { usuario: creado } =
      await SolicitudRepository.registrarEstudiante({
        nombre: regNombre.trim(),
        documentoIdentidad: regDocumento.trim(),
        telefono: regTelefono.trim() || "310 000 0000",
        correo: regCorreo.trim(),
        password: regPassword,
        municipio: regMunicipio,
        programa: regPrograma,
        semestre: semestreNum,
        promedio: promedioNum,
      });

    setGuardandoBD(false);
    const listaActualizada = SolicitudRepository.obtenerUsuarios();
    onUsuarioCreado(listaActualizada);

    setUser(creado.correo);
    setOkMsg(`✓ Usuario estudiante "${creado.nombre}" registrado exitosamente.`);

    setTimeout(() => {
      onLogin({
        idDocumento: creado.documentoIdentidad,
        nombre: creado.nombre,
        correo: creado.correo,
        rol: "estudiante",
        cargo: creado.cargo,
        telefono: creado.telefono,
        municipio: creado.municipio,
        programa: creado.programa,
        semestre: creado.semestre,
        promedio: creado.promedio,
      });
    }, 900);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#EEEFF3] overflow-hidden flex flex-col lg:flex-row select-none">
      {/* Imagen limpia de fondo a pantalla completa (estudiantes + ondas institucionales) */}
      <img
        src="/login-bg-clean.jpg"
        alt="Fondo institucional Portal de Becas Uniremington"
        className="hidden lg:block absolute inset-0 w-full h-full object-cover object-left-top pointer-events-none select-none z-0"
      />

      {/* Columna izquierda: Textos nítidos en HTML y logo de Uniremington en la esquina superior izquierda */}
      <div className="relative z-10 w-full lg:w-[52%] flex flex-col justify-start pt-6 pl-6 pr-5 sm:pt-8 sm:pl-10 lg:pt-7 lg:pl-11 pointer-events-auto">
        {/* Bloque superior: Logo Uniremington + línea divisoria + SISTEMA DE GESTIÓN DE BECAS ESTUDIANTIL */}
        <div className="flex items-center gap-3.5 max-w-[430px]">
          <img
            src="/logo-uniremington.png"
            alt="Logo Uniremington"
            className="h-10 sm:h-11 xl:h-12 w-auto object-contain shrink-0 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
          />
          <div className="h-11 w-[1.5px] bg-slate-300 shrink-0" />
          <div className="leading-tight">
            <div className="text-[13.5px] sm:text-[15px] xl:text-[16px] font-extrabold tracking-tight text-[#0F172A] uppercase leading-[1.18]">
              SISTEMA DE GESTIÓN
              <br />
              DE BECAS ESTUDIANTIL
            </div>
            <div className="text-[11.5px] sm:text-[12.5px] text-slate-700 font-medium mt-0.5">
              Apartadó - Antioquia
            </div>
          </div>
        </div>

        {/* Bloque Portal de Becas + subtítulo + 3 iconos institucionales */}
        <div className="mt-5 sm:mt-6 max-w-[260px]">
          <h1 className="text-[25px] sm:text-[28px] xl:text-[31px] font-extrabold text-[#0F172A] tracking-tight leading-none">
            Portal de Becas
          </h1>
          <p className="text-[13px] sm:text-[14.5px] text-[#1E293B] leading-[1.32] mt-2 font-normal">
            Accede para gestionar tus
            <br />
            solicitudes y beneficios
          </p>

          {/* 3 iconos en azul institucional Uniremington idénticos al diseño de referencia */}
          <div className="flex items-center gap-3 mt-3.5 text-[#1B3B6F]">
            {/* 1. Mano con corazón (Apoyo / Beneficio estudiantil) */}
            <button
              type="button"
              onClick={() =>
                setInfoModal(
                  "Beneficios estudiantiles: Becas de apoyo socioeconómico, excelencia académica y auxilios regionales en Urabá."
                )
              }
              title="Beneficios y apoyo estudiantil"
              className="hover:scale-110 transition-transform cursor-pointer focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 10.5c-1.5-1.6-3.6-2-4.8-.6-1.2 1.3-.9 3.3.5 4.6L12 18.5l4.3-4c1.4-1.3 1.7-3.3.5-4.6-1.2-1.4-3.3-1-4.8.6Z" />
                <path d="M3 19h13a3 3 0 0 0 2.5-1.3l2.5-3.2" />
                <path d="M3 15h4l2 2" />
              </svg>
            </button>

            {/* 2. Credencial / Certificado estudiantil */}
            <button
              type="button"
              onClick={() =>
                setInfoModal(
                  "Evaluación transparente: Seguimiento en línea por los comités de Validación Documental, Socioeconómico, Financiero y Aprobación Final."
                )
              }
              title="Certificación y seguimiento de solicitud"
              className="hover:scale-110 transition-transform cursor-pointer focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="14" rx="2" />
                <circle cx="8.5" cy="9.5" r="2" />
                <path d="M5.5 15c.6-1.5 1.7-2.2 3-2.2s2.4.7 3 2.2" />
                <path d="M14 8.5h4" />
                <path d="M14 12h4" />
                <path d="m15 18 1.5 3 1.5-1 1.5 1 1.5-3" />
              </svg>
            </button>

            {/* 3. Icono de información (i) */}
            <button
              type="button"
              onClick={() =>
                setInfoModal(
                  "Sistema de Gestión de Becas Estudiantil · Corporación Universitaria Remington Sede Urabá (Apartadó - Antioquia)."
                )
              }
              title="Información del Portal de Becas"
              className="hover:scale-110 transition-transform cursor-pointer focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 16v-4.5" />
                <circle cx="12" cy="8.2" r="0.6" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>

        {/* Vista móvil de la ilustración estudiantil */}
        <div className="lg:hidden mt-4 -mx-6">
          <img
            src="/login-bg-clean.jpg"
            alt="Estudiantes Uniremington"
            className="w-full h-[250px] object-cover object-left-bottom"
          />
        </div>
      </div>

      {/* Columna derecha: Tarjeta blanca de Inicio de Sesión */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-8 lg:py-10 lg:pr-14">
        <div className="w-full max-w-[400px] bg-white rounded-[18px] shadow-[0_14px_40px_rgba(15,23,42,0.09)] border border-slate-200/75 px-8 py-9">
          {modoVista === "login" ? (
            <>
              <h2 className="text-[25px] font-extrabold text-[#0F172A] tracking-tight leading-tight">
                Iniciar Sesión
              </h2>
              <p className="text-[13px] text-[#475569] mt-1 mb-6">
                Ingresa tus datos para acceder al sistema
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handle();
                }}
                className="flex flex-col gap-3.5"
                noValidate
              >
                {/* Campo 1: Usuario o Correo Electrónico */}
                <div>
                  <div
                    className={`flex items-center gap-2.5 border rounded-lg px-3.5 py-2.5 bg-white transition-all ${
                      alertaLogin?.camposConError?.includes("correo")
                        ? "border-[#D97777] ring-2 ring-red-100"
                        : "border-[#CBD5E1] hover:border-slate-400 focus-within:border-[#0D3868] focus-within:ring-2 focus-within:ring-[#0D3868]/15"
                    }`}
                  >
                    <svg
                      className="w-4 h-4 text-slate-500 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                      type="email"
                      value={user}
                      onChange={(e) => {
                        setUser(e.target.value);
                        limpiarErrores();
                      }}
                      placeholder="Usuario o Correo Electrónico"
                      className="w-full text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Campo 2: Contraseña con icono de candado y mostrar/ocultar */}
                <div>
                  <div
                    className={`flex items-center gap-2.5 border rounded-lg px-3.5 py-2.5 bg-white transition-all ${
                      alertaLogin?.camposConError?.includes("password")
                        ? "border-[#D97777] ring-2 ring-red-100"
                        : "border-[#CBD5E1] hover:border-slate-400 focus-within:border-[#0D3868] focus-within:ring-2 focus-within:ring-[#0D3868]/15"
                    }`}
                  >
                    <svg
                      className="w-4 h-4 text-slate-500 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      type={mostrarPass ? "text" : "password"}
                      value={pass}
                      onChange={(e) => {
                        setPass(e.target.value);
                        limpiarErrores();
                      }}
                      placeholder="Contraseña"
                      className="w-full text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPass((p) => !p)}
                      title={
                        mostrarPass
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      className="text-slate-500 hover:text-[#0D3868] focus:outline-none shrink-0 cursor-pointer"
                    >
                      {mostrarPass ? (
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <line x1="2" x2="22" y1="2" y2="22" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Alerta de validación con el diseño exacto de la referencia */}
                {alertaLogin && (
                  <div
                    role="alert"
                    className="rounded-lg border border-[#DF9A9A] bg-[#FBE4E4] px-3.5 py-2.5 text-[12.5px] text-[#3F1D1D] flex items-center gap-2.5"
                  >
                    <svg
                      className="w-4 h-4 text-[#7F2929] shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <path d="M12 9v4" />
                      <path d="M12 17h.01" />
                    </svg>
                    <div className="leading-snug">
                      <span className="font-semibold">
                        {alertaLogin.titulo}:{" "}
                      </span>
                      <span>{alertaLogin.mensaje}</span>
                    </div>
                  </div>
                )}

                {/* Botón azul marino institucional Uniremington */}
                <button
                  type="submit"
                  className="w-full bg-[#0D3868] hover:bg-[#092B52] active:bg-[#072140] text-white font-semibold text-[14px] py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer mt-0.5"
                >
                  Acceder al Portal
                </button>
              </form>

              {/* Enlaces inferiores dentro de la tarjeta */}
              <div className="mt-5 flex items-center justify-between text-[12px] text-[#334155]">
                <button
                  type="button"
                  onClick={() =>
                    setInfoModal(
                      "Para restablecer tu contraseña institucional comunícate con Mesa de Ayuda TI Uniremington o escribe a soporte.uraba@uniremington.edu.co."
                    )
                  }
                  className="hover:text-[#0D3868] hover:underline cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setInfoModal(
                      "Soporte Técnico Uniremington Sede Urabá: Línea (604) 828 1234 · WhatsApp 310 555 2026."
                    )
                  }
                  className="hover:text-[#0D3868] hover:underline cursor-pointer"
                >
                  Soporte técnico
                </button>
              </div>

              {/* Opción de registro para estudiantes */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    limpiarErrores();
                    setModoVista("registro");
                  }}
                  className="text-[12px] text-[#0D3868] hover:underline font-medium cursor-pointer"
                >
                  ¿Eres estudiante nuevo? Regístrate aquí
                </button>
              </div>
            </>
          ) : (
            /* Vista de registro de nuevo estudiante */
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[19px] font-bold text-[#0F172A]">
                  Registro de Estudiante
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setErr("");
                    setOkMsg("");
                    setModoVista("login");
                  }}
                  className="text-xs text-[#0D3868] hover:underline font-medium cursor-pointer"
                >
                  ← Volver al login
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-1">
                Crea tu cuenta estudiantil en Uniremington Sede Urabá.
              </p>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={regNombre}
                  onChange={(e) => setRegNombre(e.target.value)}
                  placeholder="Ej. Andrés Felipe Rivas Mena"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0D3868]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Documento identidad *
                  </label>
                  <input
                    type="text"
                    value={regDocumento}
                    onChange={(e) => setRegDocumento(e.target.value)}
                    placeholder="1027890999"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#0D3868]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Teléfono celular *
                  </label>
                  <input
                    type="text"
                    value={regTelefono}
                    onChange={(e) => setRegTelefono(e.target.value)}
                    placeholder="312 450 8899"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0D3868]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Municipio (Urabá) *
                  </label>
                  <select
                    value={regMunicipio}
                    onChange={(e) => setRegMunicipio(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs bg-white focus:outline-none focus:border-[#0D3868]"
                  >
                    <option value="Apartadó">Apartadó</option>
                    <option value="Turbo">Turbo</option>
                    <option value="Carepa">Carepa</option>
                    <option value="Chigorodó">Chigorodó</option>
                    <option value="Necoclí">Necoclí</option>
                    <option value="Mutatá">Mutatá</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Programa académico *
                  </label>
                  <select
                    value={regPrograma}
                    onChange={(e) => setRegPrograma(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs bg-white focus:outline-none focus:border-[#0D3868]"
                  >
                    <option value="Ingeniería de Sistemas">
                      Ingeniería de Sistemas
                    </option>
                    <option value="Contaduría Pública">
                      Contaduría Pública
                    </option>
                    <option value="Administración de Empresas">
                      Administración de Empresas
                    </option>
                    <option value="Derecho">Derecho</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Semestre actual
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={regSemestre}
                    onChange={(e) => setRegSemestre(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#0D3868]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Promedio acumulado
                  </label>
                  <input
                    type="text"
                    value={regPromedio}
                    onChange={(e) => setRegPromedio(e.target.value)}
                    placeholder="4.2"
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#0D3868]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Correo institucional *
                </label>
                <input
                  type="email"
                  value={regCorreo}
                  onChange={(e) => setRegCorreo(e.target.value)}
                  placeholder="estudiante@uniremington.edu.co"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0D3868]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0D3868]"
                />
              </div>

              {err && (
                <div className="text-xs text-[#3F1D1D] bg-[#FBE4E4] border border-[#DF9A9A] rounded-lg px-3 py-2">
                  ⚠ {err}
                </div>
              )}

              {okMsg && (
                <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  {okMsg}
                </div>
              )}

              <button
                type="button"
                disabled={guardandoBD}
                onClick={handleCrearEstudiante}
                className="w-full bg-[#0D3868] hover:bg-[#092B52] text-white py-2.5 rounded-lg text-xs font-semibold transition-colors mt-1 disabled:opacity-60 cursor-pointer"
              >
                {guardandoBD
                  ? "Registrando cuenta..."
                  : "Registrar Cuenta de Estudiante"}
              </button>
            </div>
          )}

          {infoModal && (
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start justify-between gap-2">
              <span>{infoModal}</span>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Pie de página inferior derecho */}
        <div className="mt-8 lg:absolute lg:bottom-5 text-center text-[11.5px] text-[#334155]">
          © 2026 Una aplicación web desarrollada para Uniremington •{" "}
          <button
            type="button"
            onClick={() =>
              setInfoModal(
                "Tratamiento de datos personales conforme a la Ley Estatutaria 1581 de 2012 (Habeas Data) y políticas de privacidad de Uniremington."
              )
            }
            className="hover:underline text-[#0F172A] cursor-pointer"
          >
            Políticas de Privacidad
          </button>
        </div>
      </div>
    </div>
  );
}
