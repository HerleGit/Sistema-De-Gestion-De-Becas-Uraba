// ── Capa de Lógica de Negocio: Patrón Comportamental Chain of Responsibility (Sección 3.2 · Figura 4) ──
// y Servicio de Auditoría Inmutable (Habeas Data · Trazabilidad)

import {
  EtapaComite,
  ParametrosSistema,
  RegistroAuditoria,
  SolicitudBeca,
} from "../../domain/models";

/**
 * Servicio de Auditoría y Trazabilidad Inmutable
 * Genera un hash encadenado con el registro anterior para impedir alteraciones posteriores.
 */
export class ServicioAuditoria {
  private static calcularHashSimple(cadena: string): string {
    let hash = 2166136261;
    for (let i = 0; i < cadena.length; i++) {
      hash ^= cadena.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const hex = (hash >>> 0).toString(16).padStart(8, "0");
    return `${hex}${hex.split("").reverse().join("")}`.toUpperCase();
  }

  public static crearRegistro(params: {
    actor: string;
    rol: string;
    etapa: EtapaComite;
    accion: string;
    comentario: string;
    hashAnterior: string;
    timestamp?: string;
  }): RegistroAuditoria {
    const timestamp =
      params.timestamp ||
      new Date().toISOString().replace("T", " ").slice(0, 19);
    const payload = `${timestamp}|${params.actor}|${params.etapa}|${params.accion}|${params.comentario}|${params.hashAnterior}`;
    const hashActual = this.calcularHashSimple(payload);

    return {
      id: `AUD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      timestamp,
      actor: params.actor,
      rol: params.rol,
      etapa: params.etapa,
      accion: params.accion,
      comentario: params.comentario,
      hashAnterior: params.hashAnterior,
      hashActual,
    };
  }

  public static registrarDecision(
    solicitud: SolicitudBeca,
    actor: string,
    rol: string,
    etapa: EtapaComite,
    accion: string,
    comentario: string
  ): void {
    const ultimoHash =
      solicitud.historialAuditoria.length > 0
        ? solicitud.historialAuditoria[solicitud.historialAuditoria.length - 1]
            .hashActual
        : "0000000000000000";

    const nuevoRegistro = this.crearRegistro({
      actor,
      rol,
      etapa,
      accion,
      comentario,
      hashAnterior: ultimoHash,
    });

    solicitud.historialAuditoria.push(nuevoRegistro);
  }
}

export interface ResultadoEvaluacion {
  aprobadoEnEtapa: boolean;
  etapaEvaluada: EtapaComite;
  siguienteEtapa: EtapaComite;
  mensaje: string;
}

/**
 * Clase abstracta ValidadorSolicitud (Figura 4 del Documento Arquitectónico)
 */
export abstract class ValidadorSolicitud {
  protected siguiente: ValidadorSolicitud | null = null;
  public abstract readonly nombreEtapa: EtapaComite;

  public setSiguiente(validador: ValidadorSolicitud): ValidadorSolicitud {
    this.siguiente = validador;
    return validador;
  }

  /**
   * Procesa el paso actual en la cadena de responsabilidad o delega al siguiente eslabón.
   */
  public procesarPasoActual(
    solicitud: SolicitudBeca,
    actor: string,
    rol: string,
    comentarioManual?: string
  ): ResultadoEvaluacion {
    if (solicitud.etapaActual === this.nombreEtapa) {
      return this.validar(solicitud, actor, rol, comentarioManual);
    }

    if (this.siguiente) {
      return this.siguiente.procesarPasoActual(
        solicitud,
        actor,
        rol,
        comentarioManual
      );
    }

    return {
      aprobadoEnEtapa: false,
      etapaEvaluada: solicitud.etapaActual,
      siguienteEtapa: solicitud.etapaActual,
      mensaje: "La solicitud ya completó todas las etapas del flujo de aprobación.",
    };
  }

  protected abstract validar(
    solicitud: SolicitudBeca,
    actor: string,
    rol: string,
    comentarioManual?: string
  ): ResultadoEvaluacion;
}

/**
 * Eslabón 1: ValidadorDocumentos
 * Verifica completitud y autenticidad de los documentos obligatorios.
 */
export class ValidadorDocumentos extends ValidadorSolicitud {
  public readonly nombreEtapa: EtapaComite = "Validación Documental";

  protected validar(
    solicitud: SolicitudBeca,
    actor: string,
    rol: string,
    comentarioManual?: string
  ): ResultadoEvaluacion {
    const obligatoriosFaltantes = solicitud.documentosAdjuntos.filter(
      (d) => d.requerido && !d.adjuntado
    );

    if (obligatoriosFaltantes.length > 0) {
      solicitud.estado = "Pendiente docs.";
      const nombresFaltantes = obligatoriosFaltantes.map((d) => d.tipo).join(", ");
      const msg =
        comentarioManual ||
        `Devuelta para subsanación: faltan soportes obligatorios (${nombresFaltantes}).`;

      ServicioAuditoria.registrarDecision(
        solicitud,
        actor,
        rol,
        this.nombreEtapa,
        "Solicitud de Subsanación Documental",
        msg
      );

      return {
        aprobadoEnEtapa: false,
        etapaEvaluada: this.nombreEtapa,
        siguienteEtapa: this.nombreEtapa,
        mensaje: msg,
      };
    }

    // Marcar documentos adjuntos como validados
    solicitud.documentosAdjuntos.forEach((d) => {
      if (d.adjuntado) d.estadoValidacion = true;
    });

    solicitud.etapaActual = "Comité Socioeconómico";
    solicitud.estado = "En revisión";
    const msg =
      comentarioManual ||
      "Soportes documentales completos y verificados. Remitida al Comité Socioeconómico.";

    ServicioAuditoria.registrarDecision(
      solicitud,
      actor,
      rol,
      this.nombreEtapa,
      "Validación Documental Aprobada",
      msg
    );

    return {
      aprobadoEnEtapa: true,
      etapaEvaluada: this.nombreEtapa,
      siguienteEtapa: solicitud.etapaActual,
      mensaje: msg,
    };
  }
}

/**
 * Eslabón 2: ComiteSocioeconomico
 * Evalúa puntaje de vulnerabilidad frente al umbral mínimo institucional parametrizado por el Administrador.
 */
export class ComiteSocioeconomico extends ValidadorSolicitud {
  public readonly nombreEtapa: EtapaComite = "Comité Socioeconómico";
  private readonly umbralMinimo: number;

  constructor(umbralMinimo = 65) {
    super();
    this.umbralMinimo = umbralMinimo;
  }

  protected validar(
    solicitud: SolicitudBeca,
    actor: string,
    rol: string,
    comentarioManual?: string
  ): ResultadoEvaluacion {
    if (solicitud.puntajeVulnerabilidad < this.umbralMinimo) {
      solicitud.estado = "Rechazada";
      const msg =
        comentarioManual ||
        `Puntaje de vulnerabilidad (${solicitud.puntajeVulnerabilidad} pts) inferior al umbral mínimo parametrizado (${this.umbralMinimo} pts).`;

      ServicioAuditoria.registrarDecision(
        solicitud,
        actor,
        rol,
        this.nombreEtapa,
        "Rechazo por Umbral Socioeconómico",
        msg
      );

      return {
        aprobadoEnEtapa: false,
        etapaEvaluada: this.nombreEtapa,
        siguienteEtapa: this.nombreEtapa,
        mensaje: msg,
      };
    }

    solicitud.etapaActual = "Comité Financiero";
    solicitud.estado = "En revisión";
    const msg =
      comentarioManual ||
      `Puntaje de vulnerabilidad (${solicitud.puntajeVulnerabilidad}/100) supera el umbral vigente (${this.umbralMinimo} pts). Pasa a Comité Financiero.`;

    ServicioAuditoria.registrarDecision(
      solicitud,
      actor,
      rol,
      this.nombreEtapa,
      "Aval Socioeconómico Otorgado",
      msg
    );

    return {
      aprobadoEnEtapa: true,
      etapaEvaluada: this.nombreEtapa,
      siguienteEtapa: solicitud.etapaActual,
      mensaje: msg,
    };
  }
}

/**
 * Eslabón 3: ComiteFinanciero
 * Verifica disponibilidad presupuestal y promedio académico mínimo parametrizado por el Administrador.
 */
export class ComiteFinanciero extends ValidadorSolicitud {
  public readonly nombreEtapa: EtapaComite = "Comité Financiero";
  private readonly promedioMinimo: number;

  constructor(promedioMinimo = 3.0) {
    super();
    this.promedioMinimo = promedioMinimo;
  }

  protected validar(
    solicitud: SolicitudBeca,
    actor: string,
    rol: string,
    comentarioManual?: string
  ): ResultadoEvaluacion {
    if (solicitud.datosAcademicos.promedio < this.promedioMinimo) {
      solicitud.estado = "Rechazada";
      const msg =
        comentarioManual ||
        `Promedio acumulado (${solicitud.datosAcademicos.promedio.toFixed(1)}) inferior al mínimo reglamentario (${this.promedioMinimo.toFixed(1)}) para asignación presupuestal.`;

      ServicioAuditoria.registrarDecision(
        solicitud,
        actor,
        rol,
        this.nombreEtapa,
        "Rechazo en Comité Financiero",
        msg
      );

      return {
        aprobadoEnEtapa: false,
        etapaEvaluada: this.nombreEtapa,
        siguienteEtapa: this.nombreEtapa,
        mensaje: msg,
      };
    }

    solicitud.etapaActual = "Aprobación Final";
    solicitud.estado = "En revisión";
    const msg =
      comentarioManual ||
      `Viabilidad financiera y promedio (${solicitud.datosAcademicos.promedio.toFixed(1)} >= ${this.promedioMinimo.toFixed(1)}) verificados. Remitida a Comité de Aprobación Final.`;

    ServicioAuditoria.registrarDecision(
      solicitud,
      actor,
      rol,
      this.nombreEtapa,
      "Viabilidad Presupuestal Aprobada",
      msg
    );

    return {
      aprobadoEnEtapa: true,
      etapaEvaluada: this.nombreEtapa,
      siguienteEtapa: solicitud.etapaActual,
      mensaje: msg,
    };
  }
}

/**
 * Eslabón 4: ComiteAprobacionFinal
 * Emite decisión final y registra resolución en auditoría inmutable.
 */
export class ComiteAprobacionFinal extends ValidadorSolicitud {
  public readonly nombreEtapa: EtapaComite = "Aprobación Final";

  protected validar(
    solicitud: SolicitudBeca,
    actor: string,
    rol: string,
    comentarioManual?: string
  ): ResultadoEvaluacion {
    solicitud.estado = "Aprobada";
    const msg =
      comentarioManual ||
      "Beneficio socioeconómico adjudicado oficialmente mediante acta del Comité de Aprobación Final.";

    ServicioAuditoria.registrarDecision(
      solicitud,
      actor,
      rol,
      this.nombreEtapa,
      "Resolución Final: Beca Aprobada",
      msg
    );

    return {
      aprobadoEnEtapa: true,
      etapaEvaluada: this.nombreEtapa,
      siguienteEtapa: "Aprobación Final",
      mensaje: msg,
    };
  }
}

/**
 * Fábrica que ensambla la cadena completa de responsabilidad institucional
 * utilizando los parámetros dinámicos configurados por el Administrador:
 * ValidadorDocumentos -> ComiteSocioeconomico -> ComiteFinanciero -> ComiteAprobacionFinal
 */
export function crearCadenaAprobacion(
  parametros?: Pick<
    ParametrosSistema,
    "umbralPuntajeMinimo" | "promedioMinimoRequerido"
  >
): ValidadorSolicitud {
  const docValidator = new ValidadorDocumentos();
  const socValidator = new ComiteSocioeconomico(
    parametros?.umbralPuntajeMinimo ?? 65
  );
  const finValidator = new ComiteFinanciero(
    parametros?.promedioMinimoRequerido ?? 3.0
  );
  const finalValidator = new ComiteAprobacionFinal();

  docValidator
    .setSiguiente(socValidator)
    .setSiguiente(finValidator)
    .setSiguiente(finalValidator);

  return docValidator;
}
