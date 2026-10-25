// ── Capa de Acceso a Datos y Persistencia (DAO / Repositorio) ──

import {
  Documento,
  ETIQUETA_SUBSIDIO,
  EtapaComite,
  EstadoSolicitud,
  ParametrosSistema,
  SolicitudBeca,
  TipoSubsidio,
  UsuarioSistema,
} from "../domain/models";
import { ServicioAuditoria } from "../business/aprobacion/ChainOfResponsibility";
import { SolicitudBecaBuilder } from "../business/builders/SolicitudBecaBuilder";

const STORAGE_KEY = "uniremington_becas_uraba_v2";
const PARAMS_KEY = "uniremington_becas_params_v1";
const USERS_KEY = "uniremington_becas_users_v1";

export const PARAMETROS_POR_DEFECTO: ParametrosSistema = {
  semestreActivo: "2026-II",
  convocatoriaAbierta: true,
  fechaCierre: "2026-11-15",
  presupuestoTotalMillones: 120,
  umbralPuntajeMinimo: 65,
  promedioMinimoRequerido: 3.0,
  pesoIngresos: 40,
  pesoDependientes: 20,
  pesoEstrato: 25,
  pesoDistancia: 15,
};

export const USUARIOS_INICIALES: UsuarioSistema[] = [
  {
    id: "USR-01",
    nombre: "M. Restrepo",
    correo: "m.restrepo@uniremington.edu.co",
    rol: "comite",
    cargo: "Analista de Validación Documental",
    etapaAsignada: "Validación Documental",
    activo: true,
  },
  {
    id: "USR-02",
    nombre: "Marta Lucía Jiménez Torres",
    correo: "marta.jimenez@uniremington.edu.co",
    rol: "comite",
    cargo: "Coordinadora Comité Socioeconómico",
    etapaAsignada: "Comité Socioeconómico",
    activo: true,
  },
  {
    id: "USR-03",
    nombre: "Carlos E. Gaviria",
    correo: "c.gaviria@uniremington.edu.co",
    rol: "comite",
    cargo: "Delegado Comité Financiero",
    etapaAsignada: "Comité Financiero",
    activo: true,
  },
  {
    id: "USR-04",
    nombre: "Dra. Elena Arango",
    correo: "rectoria.uraba@uniremington.edu.co",
    rol: "comite",
    cargo: "Comité de Aprobación Final",
    etapaAsignada: "Aprobación Final",
    activo: true,
  },
  {
    id: "USR-05",
    nombre: "H. Robledo Suárez",
    correo: "bienestar.uraba@uniremington.edu.co",
    rol: "administrador",
    cargo: "Administrador General del Sistema",
    activo: true,
  },
];

function crearDocumentosBase(todosAdjuntos = true, validados = true): Documento[] {
  return [
    {
      id: "doc-cedula",
      tipo: "Copia del documento de identidad",
      archivo: todosAdjuntos ? "documento_identidad.pdf" : "",
      requerido: true,
      adjuntado: todosAdjuntos,
      estadoValidacion: todosAdjuntos && validados,
    },
    {
      id: "doc-sisben",
      tipo: "Certificado de ingresos del hogar (SISBEN o declaración juramentada)",
      archivo: "certificado_sisben_uraba.pdf",
      requerido: true,
      adjuntado: true,
      estadoValidacion: validados,
    },
    {
      id: "doc-matricula",
      tipo: "Certificado de matrícula vigente",
      archivo: todosAdjuntos ? "constancia_matricula_2026_II.pdf" : "",
      requerido: true,
      adjuntado: todosAdjuntos,
      estadoValidacion: todosAdjuntos && validados,
    },
    {
      id: "doc-servicios",
      tipo: "Recibo de servicios públicos (dirección de residencia)",
      archivo: "epm_servicio_energia.pdf",
      requerido: false,
      adjuntado: true,
      estadoValidacion: validados,
    },
    {
      id: "doc-especial",
      tipo: "Carta de situación especial (discapacidad, victimización u otro)",
      archivo: "",
      requerido: false,
      adjuntado: false,
      estadoValidacion: false,
    },
  ];
}

function crearSemillaInicial(): SolicitudBeca[] {
  const builder = new SolicitudBecaBuilder();

  const armarSemilla = (cfg: {
    id: string;
    fecha: string;
    cedula: string;
    nombre: string;
    correo?: string;
    municipio: string;
    programa: string;
    semestre: number;
    promedio: number;
    subsidios: TipoSubsidio[];
    ingresos: number;
    dependientes: number;
    estrato: number;
    distancia: number;
    puntajeFijo: number;
    etapa: EtapaComite;
    estado: EstadoSolicitud;
    docsCompletos: boolean;
    pasosAuditoria: {
      timestamp: string;
      actor: string;
      rol: string;
      etapa: EtapaComite;
      accion: string;
      comentario: string;
    }[];
  }): SolicitudBeca => {
    builder
      .reset(cfg.id, cfg.fecha)
      .setDatosPersonales({
        id: cfg.cedula,
        nombre: cfg.nombre,
        telefono: "312 458 9012",
        correo:
          cfg.correo ||
          `${cfg.nombre.split(" ")[0].toLowerCase()}@uniremington.edu.co`,
        municipio: cfg.municipio,
      })
      .setDatosAcademicos({
        programa: cfg.programa,
        semestre: cfg.semestre,
        promedio: cfg.promedio,
        institucion: {
          nombre: "Corporación Universitaria Remington",
          sede: "Apartadó · Urabá",
        },
      })
      .setTipoSubsidio(cfg.subsidios)
      .setVariablesSocioeconomicas(
        cfg.ingresos,
        cfg.dependientes,
        cfg.estrato,
        cfg.distancia
      )
      .setEstadoYEtapa(cfg.estado, cfg.etapa);

    const docs = crearDocumentosBase(
      cfg.docsCompletos,
      cfg.etapa !== "Validación Documental"
    );
    docs.forEach((d) => builder.adjuntarDocumento(d));

    const sol = builder.build();
    sol.puntajeVulnerabilidad = cfg.puntajeFijo;
    sol.historialAuditoria = [];

    for (const p of cfg.pasosAuditoria) {
      ServicioAuditoria.registrarDecision(
        sol,
        p.actor,
        p.rol,
        p.etapa,
        p.accion,
        p.comentario
      );
      sol.historialAuditoria[sol.historialAuditoria.length - 1].timestamp =
        p.timestamp;
    }

    return sol;
  };

  return [
    armarSemilla({
      id: "BEC-2026-001",
      fecha: "2026-08-12",
      cedula: "1027890451",
      nombre: "Yulieth Córdoba Palacios",
      correo: "yulieth.cordoba@uniremington.edu.co",
      municipio: "Turbo",
      programa: "Ingeniería de Sistemas",
      semestre: 6,
      promedio: 4.3,
      subsidios: ["ALIMENTACION", "TRANSPORTE"],
      ingresos: 650000,
      dependientes: 3,
      estrato: 1,
      distancia: 32,
      puntajeFijo: 87,
      etapa: "Aprobación Final",
      estado: "Aprobada",
      docsCompletos: true,
      pasosAuditoria: [
        {
          timestamp: "2026-08-12 09:15:22",
          actor: "Yulieth Córdoba Palacios",
          rol: "Estudiante",
          etapa: "Validación Documental",
          accion: "Radicación de postulación en línea",
          comentario: "Formulario enviado con 4 documentos de soporte.",
        },
        {
          timestamp: "2026-08-14 11:40:10",
          actor: "M. Restrepo",
          rol: "Analista Documental",
          etapa: "Validación Documental",
          accion: "Validación Documental Aprobada",
          comentario: "Certificado SISBEN A3 y matrícula verificados.",
        },
        {
          timestamp: "2026-08-16 15:20:05",
          actor: "Comité Socioeconómico",
          rol: "Comité",
          etapa: "Comité Socioeconómico",
          accion: "Aval Socioeconómico Otorgado",
          comentario: "Puntaje 87/100 supera ampliamente el umbral regional.",
        },
        {
          timestamp: "2026-08-18 10:05:44",
          actor: "Comité Financiero",
          rol: "Comité",
          etapa: "Comité Financiero",
          accion: "Viabilidad Presupuestal Aprobada",
          comentario: "Rubro disponible para auxilio combinado Alimentación + Transporte.",
        },
        {
          timestamp: "2026-08-19 16:30:00",
          actor: "Dra. Elena Arango",
          rol: "Comité de Aprobación Final",
          etapa: "Aprobación Final",
          accion: "Resolución Final: Beca Aprobada",
          comentario: "Aprobado según Acta N.° 014-2026.",
        },
      ],
    }),
    armarSemilla({
      id: "BEC-2026-002",
      fecha: "2026-08-18",
      cedula: "1028012394",
      nombre: "Edilberto Martínez Úsuga",
      municipio: "Carepa",
      programa: "Administración de Empresas",
      semestre: 4,
      promedio: 3.9,
      subsidios: ["MATRICULA"],
      ingresos: 850000,
      dependientes: 2,
      estrato: 2,
      distancia: 18,
      puntajeFijo: 74,
      etapa: "Comité Socioeconómico",
      estado: "En revisión",
      docsCompletos: true,
      pasosAuditoria: [
        {
          timestamp: "2026-08-18 14:12:09",
          actor: "Edilberto Martínez Úsuga",
          rol: "Estudiante",
          etapa: "Validación Documental",
          accion: "Radicación de postulación en línea",
          comentario: "Solicitud de apoyo de matrícula radicada.",
        },
        {
          timestamp: "2026-08-19 08:50:30",
          actor: "M. Restrepo",
          rol: "Analista Documental",
          etapa: "Validación Documental",
          accion: "Validación Documental Aprobada",
          comentario: "Documentación completa. Pasa a Comité Socioeconómico.",
        },
      ],
    }),
    armarSemilla({
      id: "BEC-2026-003",
      fecha: "2026-08-20",
      cedula: "1027890451",
      nombre: "Yulieth Córdoba Palacios",
      correo: "yulieth.cordoba@uniremington.edu.co",
      municipio: "Turbo",
      programa: "Ingeniería de Sistemas",
      semestre: 6,
      promedio: 4.3,
      subsidios: ["MATRICULA"],
      ingresos: 650000,
      dependientes: 3,
      estrato: 1,
      distancia: 32,
      puntajeFijo: 91,
      etapa: "Validación Documental",
      estado: "Pendiente docs.",
      docsCompletos: false,
      pasosAuditoria: [
        {
          timestamp: "2026-08-20 10:22:18",
          actor: "Yulieth Córdoba Palacios",
          rol: "Estudiante",
          etapa: "Validación Documental",
          accion: "Radicación parcial",
          comentario: "Postulación enviada para apoyo de matrícula con puntaje 91/100.",
        },
        {
          timestamp: "2026-08-21 09:05:11",
          actor: "M. Restrepo",
          rol: "Analista Documental",
          etapa: "Validación Documental",
          accion: "Solicitud de Subsanación Documental",
          comentario: "Pendiente adjuntar copia legible de documento de identidad y certificado de matrícula.",
        },
      ],
    }),
    armarSemilla({
      id: "BEC-2026-004",
      fecha: "2026-08-22",
      cedula: "1028445120",
      nombre: "Kevin Andrés Palacio Mena",
      municipio: "Apartadó",
      programa: "Contaduría Pública",
      semestre: 5,
      promedio: 2.8,
      subsidios: ["TRANSPORTE"],
      ingresos: 1450000,
      dependientes: 1,
      estrato: 3,
      distancia: 5,
      puntajeFijo: 62,
      etapa: "Comité Financiero",
      estado: "Rechazada",
      docsCompletos: true,
      pasosAuditoria: [
        {
          timestamp: "2026-08-22 16:40:00",
          actor: "Kevin Andrés Palacio Mena",
          rol: "Estudiante",
          etapa: "Validación Documental",
          accion: "Radicación de postulación en línea",
          comentario: "Solicitud de auxilio de transporte.",
        },
        {
          timestamp: "2026-08-24 11:10:00",
          actor: "Comité Financiero",
          rol: "Comité",
          etapa: "Comité Financiero",
          accion: "Rechazo en Comité Financiero",
          comentario: "Puntaje (62 pts) y promedio académico (2.8) por debajo de los umbrales de asignación.",
        },
      ],
    }),
    armarSemilla({
      id: "BEC-2026-005",
      fecha: "2026-09-01",
      cedula: "1027998123",
      nombre: "Sandra Milena Zapata Torres",
      municipio: "Necoclí",
      programa: "Derecho",
      semestre: 7,
      promedio: 4.1,
      subsidios: ["MATRICULA", "ALIMENTACION"],
      ingresos: 720000,
      dependientes: 3,
      estrato: 1,
      distancia: 45,
      puntajeFijo: 83,
      etapa: "Comité Socioeconómico",
      estado: "En revisión",
      docsCompletos: true,
      pasosAuditoria: [
        {
          timestamp: "2026-09-01 08:30:12",
          actor: "Sandra Milena Zapata Torres",
          rol: "Estudiante",
          etapa: "Validación Documental",
          accion: "Radicación de postulación en línea",
          comentario: "Solicitud radicada desde sede Urabá.",
        },
        {
          timestamp: "2026-09-02 14:15:40",
          actor: "M. Restrepo",
          rol: "Analista Documental",
          etapa: "Validación Documental",
          accion: "Validación Documental Aprobada",
          comentario: "Soportes validados. Remitida al Comité Socioeconómico.",
        },
      ],
    }),
    armarSemilla({
      id: "BEC-2026-006",
      fecha: "2026-09-03",
      cedula: "1028331098",
      nombre: "Jhon Alexander Restrepo Gil",
      municipio: "Mutatá",
      programa: "Ingeniería de Sistemas",
      semestre: 2,
      promedio: 4.0,
      subsidios: ["TRANSPORTE"],
      ingresos: 780000,
      dependientes: 2,
      estrato: 2,
      distancia: 50,
      puntajeFijo: 78,
      etapa: "Comité Financiero",
      estado: "En revisión",
      docsCompletos: true,
      pasosAuditoria: [
        {
          timestamp: "2026-09-03 11:00:00",
          actor: "Jhon Alexander Restrepo Gil",
          rol: "Estudiante",
          etapa: "Validación Documental",
          accion: "Radicación de postulación en línea",
          comentario: "Solicitud radicada.",
        },
        {
          timestamp: "2026-09-04 09:20:00",
          actor: "M. Restrepo",
          rol: "Analista Documental",
          etapa: "Validación Documental",
          accion: "Validación Documental Aprobada",
          comentario: "Soportes completos.",
        },
        {
          timestamp: "2026-09-05 14:10:00",
          actor: "Marta Lucía Jiménez Torres",
          rol: "Comité Socioeconómico",
          etapa: "Comité Socioeconómico",
          accion: "Aval Socioeconómico Otorgado",
          comentario: "Vulnerabilidad comprobada por desplazamiento desde Mutatá. Pasa a Comité Financiero.",
        },
      ],
    }),
  ];
}

export class SolicitudRepository {
  public static obtenerTodas(): SolicitudBeca[] {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado) {
        return JSON.parse(guardado) as SolicitudBeca[];
      }
    } catch {
      // Fallback
    }
    const semilla = crearSemillaInicial();
    this.guardarTodas(semilla);
    return semilla;
  }

  public static guardarTodas(solicitudes: SolicitudBeca[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(solicitudes));
    } catch {
      // Ignorar errores de almacenamiento
    }
  }

  public static agregar(nueva: SolicitudBeca): SolicitudBeca[] {
    const actuales = this.obtenerTodas();
    const actualizadas = [nueva, ...actuales];
    this.guardarTodas(actualizadas);
    return actualizadas;
  }

  public static actualizar(solicitudActualizada: SolicitudBeca): SolicitudBeca[] {
    const actuales = this.obtenerTodas();
    const actualizadas = actuales.map((s) =>
      s.id === solicitudActualizada.id ? solicitudActualizada : s
    );
    this.guardarTodas(actualizadas);
    return actualizadas;
  }

  public static restablecerSemilla(): SolicitudBeca[] {
    const semilla = crearSemillaInicial();
    this.guardarTodas(semilla);
    return semilla;
  }

  public static obtenerParametros(): ParametrosSistema {
    try {
      const raw = localStorage.getItem(PARAMS_KEY);
      if (raw) return JSON.parse(raw) as ParametrosSistema;
    } catch {
      // Fallback
    }
    return { ...PARAMETROS_POR_DEFECTO };
  }

  public static guardarParametros(params: ParametrosSistema): void {
    try {
      localStorage.setItem(PARAMS_KEY, JSON.stringify(params));
    } catch {
      // Ignorar
    }
  }

  public static obtenerUsuarios(): UsuarioSistema[] {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      if (raw) return JSON.parse(raw) as UsuarioSistema[];
    } catch {
      // Fallback
    }
    return [...USUARIOS_INICIALES];
  }

  public static guardarUsuarios(usuarios: UsuarioSistema[]): void {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(usuarios));
    } catch {
      // Ignorar
    }
  }

  public static generarSiguienteId(solicitudes: SolicitudBeca[]): string {
    const maxNum = solicitudes.reduce((max, s) => {
      const partes = s.id.split("-");
      const num = parseInt(partes[2] || "0", 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    return `BEC-2026-${String(maxNum + 1).padStart(3, "0")}`;
  }

  public static formatearSubsidios(tipos: TipoSubsidio[]): string {
    if (!tipos || tipos.length === 0) return "Sin especificar";
    return tipos.map((t) => ETIQUETA_SUBSIDIO[t] || t).join(" + ");
  }
}
