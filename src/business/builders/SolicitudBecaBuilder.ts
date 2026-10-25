// ── Capa de Lógica de Negocio: Patrón Creacional Builder (Sección 3.1 · Figura 3) ──
// y Módulo de Parametrización y Cálculo de Vulnerabilidad Explicable (RF2)

import {
  DatosAcademicos,
  DatosPersonales,
  Documento,
  EtapaComite,
  EstadoSolicitud,
  ParametrosSistema,
  RegistroAuditoria,
  SolicitudBeca,
  TipoSubsidio,
} from "../../domain/models";
import { ServicioAuditoria } from "../aprobacion/ChainOfResponsibility";

export interface DesglosePuntaje {
  ptsIngresos: number;
  maxIngresos: number;
  ptsDependientes: number;
  maxDependientes: number;
  ptsEstrato: number;
  maxEstrato: number;
  ptsDistancia: number;
  maxDistancia: number;
  total: number;
}

export class ModuloCalculoVulnerabilidad {
  /**
   * Calcula el desglose auditable y el puntaje total de vulnerabilidad (0 a 100)
   * aplicando los pesos dinámicos configurados por el Administrador.
   */
  public static calcularDesglose(
    params: {
      ingresos?: number | string;
      dependientes?: number | string;
      estrato?: number | string;
      distancia?: number | string;
    },
    pesos?: Pick<
      ParametrosSistema,
      "pesoIngresos" | "pesoDependientes" | "pesoEstrato" | "pesoDistancia"
    >
  ): DesglosePuntaje {
    const maxIngresos = pesos?.pesoIngresos ?? 40;
    const maxDependientes = pesos?.pesoDependientes ?? 20;
    const maxEstrato = pesos?.pesoEstrato ?? 25;
    const maxDistancia = pesos?.pesoDistancia ?? 15;

    const ingresosNum = Number(params.ingresos);
    const depNum = Number(params.dependientes);
    const estratoNum = Number(params.estrato);
    const distNum = Number(params.distancia);

    const tieneAlgunDato =
      (params.ingresos !== "" &&
        params.ingresos !== undefined &&
        !isNaN(ingresosNum)) ||
      (params.dependientes !== "" &&
        params.dependientes !== undefined &&
        !isNaN(depNum)) ||
      (params.estrato !== "" &&
        params.estrato !== undefined &&
        !isNaN(estratoNum) &&
        estratoNum > 0) ||
      (params.distancia !== "" &&
        params.distancia !== undefined &&
        !isNaN(distNum));

    if (!tieneAlgunDato) {
      return {
        ptsIngresos: 0,
        maxIngresos,
        ptsDependientes: 0,
        maxDependientes,
        ptsEstrato: 0,
        maxEstrato,
        ptsDistancia: 0,
        maxDistancia,
        total: 0,
      };
    }

    // 1. Factor Ingresos (0 a 1): 0 COP = 100% del peso, >= 1.500.000 COP = 0%
    const factorIngresos =
      params.ingresos !== "" && !isNaN(ingresosNum)
        ? Math.min(1, Math.max(0, (1500000 - ingresosNum) / 1500000))
        : 0;
    const ptsIngresos = Math.round(factorIngresos * maxIngresos);

    // 2. Factor Dependientes (0 a 1): 4 o más dependientes = 100% del peso
    const factorDep =
      params.dependientes !== "" && !isNaN(depNum)
        ? Math.min(1, Math.max(0, depNum / 4))
        : 0;
    const ptsDependientes = Math.round(factorDep * maxDependientes);

    // 3. Factor Estrato (0 a 1): Estrato 1 = 100%, Estrato 6 = 16.6%
    const factorEstrato =
      params.estrato !== "" &&
      !isNaN(estratoNum) &&
      estratoNum >= 1 &&
      estratoNum <= 6
        ? (7 - estratoNum) / 6
        : 0;
    const ptsEstrato = Math.round(factorEstrato * maxEstrato);

    // 4. Factor Distancia (0 a 1): >= 40 km al campus = 100% del peso
    const factorDist =
      params.distancia !== "" && !isNaN(distNum)
        ? Math.min(1, Math.max(0, distNum / 40))
        : 0;
    const ptsDistancia = Math.round(factorDist * maxDistancia);

    const total = Math.min(
      100,
      Math.max(
        0,
        ptsIngresos + ptsDependientes + ptsEstrato + ptsDistancia
      )
    );

    return {
      ptsIngresos,
      maxIngresos,
      ptsDependientes,
      maxDependientes,
      ptsEstrato,
      maxEstrato,
      ptsDistancia,
      maxDistancia,
      total,
    };
  }

  public static calcularPuntaje(
    params: {
      ingresos?: number | string;
      dependientes?: number | string;
      estrato?: number | string;
      distancia?: number | string;
      promedio?: number | string;
    },
    pesos?: Pick<
      ParametrosSistema,
      "pesoIngresos" | "pesoDependientes" | "pesoEstrato" | "pesoDistancia"
    >
  ): number {
    return this.calcularDesglose(params, pesos).total;
  }
}

/**
 * Interfaz ISolicitudBecaBuilder (Figura 3 del Documento Arquitectónico)
 */
export interface ISolicitudBecaBuilder {
  reset(id: string, fecha?: string): this;
  setDatosPersonales(datos: DatosPersonales): this;
  setDatosAcademicos(datos: DatosAcademicos): this;
  setTipoSubsidio(subsidios: TipoSubsidio[]): this;
  setVariablesSocioeconomicas(
    ingresos: number,
    dependientes: number,
    estrato: number,
    distancia: number,
    pesos?: Pick<
      ParametrosSistema,
      "pesoIngresos" | "pesoDependientes" | "pesoEstrato" | "pesoDistancia"
    >
  ): this;
  adjuntarDocumento(documento: Documento): this;
  setEstadoYEtapa(estado: EstadoSolicitud, etapa: EtapaComite): this;
  setHistorialAuditoria(historial: RegistroAuditoria[]): this;
  build(): SolicitudBeca;
}

/**
 * Implementación Concreta: SolicitudBecaBuilder
 */
export class SolicitudBecaBuilder implements ISolicitudBecaBuilder {
  private solicitud!: SolicitudBeca;

  constructor(id = "BEC-2026-000") {
    this.reset(id);
  }

  public reset(id: string, fecha?: string): this {
    this.solicitud = {
      id,
      fecha: fecha || new Date().toISOString().slice(0, 10),
      datosPersonales: {
        id: "",
        nombre: "",
        telefono: "",
        correo: "",
        municipio: "Apartadó",
      },
      datosAcademicos: {
        programa: "",
        semestre: 1,
        promedio: 0,
        institucion: {
          nombre: "Corporación Universitaria Remington",
          sede: "Apartadó · Urabá",
        },
      },
      tipoSubsidio: [],
      variablesSocioeconomicas: {},
      documentosAdjuntos: [],
      puntajeVulnerabilidad: 0,
      etapaActual: "Validación Documental",
      estado: "En revisión",
      historialAuditoria: [],
    };
    return this;
  }

  public setDatosPersonales(datos: DatosPersonales): this {
    this.solicitud.datosPersonales = { ...datos };
    return this;
  }

  public setDatosAcademicos(datos: DatosAcademicos): this {
    this.solicitud.datosAcademicos = { ...datos };
    return this;
  }

  public setTipoSubsidio(subsidios: TipoSubsidio[]): this {
    this.solicitud.tipoSubsidio = [...subsidios];
    return this;
  }

  public setVariablesSocioeconomicas(
    ingresos: number,
    dependientes: number,
    estrato: number,
    distancia: number,
    pesos?: Pick<
      ParametrosSistema,
      "pesoIngresos" | "pesoDependientes" | "pesoEstrato" | "pesoDistancia"
    >
  ): this {
    const pIng = (pesos?.pesoIngresos ?? 40) / 100;
    const pDep = (pesos?.pesoDependientes ?? 20) / 100;
    const pEst = (pesos?.pesoEstrato ?? 25) / 100;
    const pDis = (pesos?.pesoDistancia ?? 15) / 100;

    this.solicitud.variablesSocioeconomicas = {
      ingresos: {
        nombre: "Ingresos mensuales (COP)",
        valor: ingresos,
        peso: pIng,
      },
      dependientes: {
        nombre: "N.° de dependientes",
        valor: dependientes,
        peso: pDep,
      },
      estrato: {
        nombre: "Estrato socioeconómico",
        valor: estrato,
        peso: pEst,
      },
      distancia: {
        nombre: "Distancia al campus (km)",
        valor: distancia,
        peso: pDis,
      },
    };

    this.solicitud.puntajeVulnerabilidad =
      ModuloCalculoVulnerabilidad.calcularPuntaje(
        {
          ingresos,
          dependientes,
          estrato,
          distancia,
        },
        pesos
      );

    return this;
  }

  public adjuntarDocumento(documento: Documento): this {
    this.solicitud.documentosAdjuntos.push({ ...documento });
    return this;
  }

  public setEstadoYEtapa(estado: EstadoSolicitud, etapa: EtapaComite): this {
    this.solicitud.estado = estado;
    this.solicitud.etapaActual = etapa;
    return this;
  }

  public setHistorialAuditoria(historial: RegistroAuditoria[]): this {
    this.solicitud.historialAuditoria = [...historial];
    return this;
  }

  public build(): SolicitudBeca {
    // Verificar si todos los documentos obligatorios están adjuntos
    const obligatoriosPendientes = this.solicitud.documentosAdjuntos.some(
      (d) => d.requerido && !d.adjuntado
    );

    if (
      obligatoriosPendientes &&
      this.solicitud.historialAuditoria.length === 0
    ) {
      this.solicitud.estado = "Pendiente docs.";
      this.solicitud.etapaActual = "Validación Documental";
    }

    if (this.solicitud.historialAuditoria.length === 0) {
      const registroInicial = ServicioAuditoria.crearRegistro({
        actor:
          this.solicitud.datosPersonales.nombre || "Estudiante Solicitante",
        rol: "Estudiante",
        etapa: "Validación Documental",
        accion: obligatoriosPendientes
          ? "Radicación parcial + Autorización Habeas Data (Ley 1581)"
          : "Radicación completa en línea + Consentimiento Habeas Data (Ley 1581)",
        comentario: `Solicitud construida con puntaje de vulnerabilidad auditable de ${this.solicitud.puntajeVulnerabilidad}/100 pts. Autorización expresa de tratamiento de datos sensibles firmada digitalmente.`,
        hashAnterior: "0000000000000000",
      });
      this.solicitud.historialAuditoria.push(registroInicial);
    }

    return { ...this.solicitud };
  }
}

/**
 * Clase DirectorPostulacion (Figura 3 del Documento Arquitectónico)
 * Orquesta la construcción completa o parcial (con subsanación progresiva) de SolicitudBeca.
 */
export class DirectorPostulacion {
  private builder: ISolicitudBecaBuilder;

  constructor(builder: ISolicitudBecaBuilder) {
    this.builder = builder;
  }

  public construirSolicitudCompleta(params: {
    id: string;
    datosPersonales: DatosPersonales;
    datosAcademicos: DatosAcademicos;
    subsidios: TipoSubsidio[];
    ingresos: number;
    dependientes: number;
    estrato: number;
    distancia: number;
    documentos: Documento[];
    pesos?: Pick<
      ParametrosSistema,
      "pesoIngresos" | "pesoDependientes" | "pesoEstrato" | "pesoDistancia"
    >;
  }): SolicitudBeca {
    this.builder
      .reset(params.id)
      .setDatosPersonales(params.datosPersonales)
      .setDatosAcademicos(params.datosAcademicos)
      .setTipoSubsidio(params.subsidios)
      .setVariablesSocioeconomicas(
        params.ingresos,
        params.dependientes,
        params.estrato,
        params.distancia,
        params.pesos
      );

    for (const doc of params.documentos) {
      this.builder.adjuntarDocumento(doc);
    }

    return this.builder.build();
  }
}
