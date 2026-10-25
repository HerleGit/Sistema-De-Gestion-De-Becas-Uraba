// ── Capa de Dominio: Entidades principales (Figura 2 del Documento Arquitectónico) ──

export type RolUsuario = "estudiante" | "comite" | "administrador";

export type TipoSubsidio = "ALIMENTACION" | "TRANSPORTE" | "MATRICULA";

export const ETIQUETA_SUBSIDIO: Record<TipoSubsidio, string> = {
  ALIMENTACION: "Alimentación",
  TRANSPORTE: "Transporte",
  MATRICULA: "Matrícula",
};

export type EstadoSolicitud =
  | "Aprobada"
  | "En revisión"
  | "Pendiente docs."
  | "Rechazada";

export type EtapaComite =
  | "Validación Documental"
  | "Comité Socioeconómico"
  | "Comité Financiero"
  | "Aprobación Final";

export interface Institucion {
  nombre: string;
  sede: string;
}

export interface DatosPersonales {
  id: string; // Cédula
  nombre: string;
  telefono: string;
  correo: string;
  municipio: string;
}

export interface DatosAcademicos {
  programa: string;
  semestre: number;
  promedio: number;
  institucion: Institucion;
}

export interface Documento {
  id: string;
  tipo: string;
  archivo: string;
  requerido: boolean;
  adjuntado: boolean;
  estadoValidacion: boolean;
}

export interface VariableSocioeconomica {
  nombre: string;
  valor: number;
  peso: number;
}

export interface RegistroAuditoria {
  id: string;
  timestamp: string;
  actor: string;
  rol: string;
  etapa: EtapaComite;
  accion: string;
  comentario: string;
  hashAnterior: string;
  hashActual: string;
}

export interface SolicitudBeca {
  id: string;
  fecha: string;
  datosPersonales: DatosPersonales;
  datosAcademicos: DatosAcademicos;
  tipoSubsidio: TipoSubsidio[];
  variablesSocioeconomicas: Record<string, VariableSocioeconomica>;
  documentosAdjuntos: Documento[];
  puntajeVulnerabilidad: number;
  etapaActual: EtapaComite;
  estado: EstadoSolicitud;
  historialAuditoria: RegistroAuditoria[];
}

export interface UsuarioSesion {
  idDocumento?: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  cargo: string;
  comiteAsignado?: EtapaComite | "Todos";
}

export interface ParametrosSistema {
  semestreActivo: string;
  convocatoriaAbierta: boolean;
  fechaCierre: string;
  presupuestoTotalMillones: number;
  umbralPuntajeMinimo: number;
  promedioMinimoRequerido: number;
  pesoIngresos: number; // % (ej. 40)
  pesoDependientes: number; // % (ej. 20)
  pesoEstrato: number; // % (ej. 25)
  pesoDistancia: number; // % (ej. 15)
}

export interface UsuarioSistema {
  id: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  cargo: string;
  etapaAsignada?: EtapaComite;
  activo: boolean;
}
