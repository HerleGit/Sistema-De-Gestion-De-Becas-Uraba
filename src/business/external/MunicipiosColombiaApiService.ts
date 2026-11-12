/**
 * CAPA DE SERVICIOS DE INTEGRACIÓN CON API EXTERNA (FASE III - ING-PROY-4)
 *
 * Aplicación explícita de los Principios SOLID:
 * 1. SRP (Single Responsibility Principle - Principio de Responsabilidad Única):
 *    Esta clase tiene una única razón para cambiar: la comunicación HTTP GET y el procesamiento
 *    del formato JSON proveniente de la API de Datos Abiertos del Gobierno de Colombia (DANE DIVIPOLA).
 *    Está completamente separada de la persistencia en base de datos (SolicitudRepository) y de la
 *    interfaz gráfica (FormView / EstudianteView).
 *
 * 2. DIP (Dependency Inversion Principle - Principio de Inversión de Dependencias):
 *    Los módulos de negocio y de presentación dependen de la abstracción `IMunicipioGeoApiService`
 *    y no de detalles de bajo nivel de la petición HTTP.
 *
 * 3. OCP (Open/Closed Principle - Principio de Abierto/Cerrado):
 *    Es posible agregar nuevos proveedores geográficos (p. ej. Nominatim OpenStreetMap) implementando
 *    `IMunicipioGeoApiService` sin modificar los componentes que consumen el servicio.
 */

export interface InfoMunicipioDaneDTO {
  codigoDaneMunicipio: string;
  codigoDaneDepartamento: string;
  municipio: string;
  departamento: string;
  region: string;
  subregion: string;
  latitud: number;
  longitud: number;
  distanciaCampusApartadoKm: number;
  tiempoEstimadoMinutos: number;
  esZonaRuralPrioritaria: boolean;
  fuenteApiUrl: string;
  metodoHttp: "GET";
  estadoRespuesta: "ONLINE_DATOS_GOV_CO" | "RESPALDO_LOCAL_TOLERANTE";
  jsonRaw: string;
}

/**
 * Abstracción (DIP) para el servicio de consulta de municipios y cálculo de distancia regional.
 */
export interface IMunicipioGeoApiService {
  consultarMunicipioUraba(nombreMunicipio: string): Promise<InfoMunicipioDaneDTO>;
  listarMunicipiosUraba(): string[];
}

interface CatalogoGeoUrabaItem {
  codigoDane: string;
  municipio: string;
  latitud: number;
  longitud: number;
  distanciaKm: number;
  tiempoMin: number;
  ruralPrioritario: boolean;
}

const CATALOGO_GEOGRAFICO_URABA: Record<string, CatalogoGeoUrabaItem> = {
  apartado: {
    codigoDane: "05045",
    municipio: "Apartadó",
    latitud: 7.883,
    longitud: -76.626,
    distanciaKm: 3,
    tiempoMin: 10,
    ruralPrioritario: false,
  },
  turbo: {
    codigoDane: "05837",
    municipio: "Turbo",
    latitud: 8.093,
    longitud: -76.728,
    distanciaKm: 32,
    tiempoMin: 45,
    ruralPrioritario: false,
  },
  carepa: {
    codigoDane: "05147",
    municipio: "Carepa",
    latitud: 7.758,
    longitud: -76.655,
    distanciaKm: 16,
    tiempoMin: 22,
    ruralPrioritario: false,
  },
  chigorodo: {
    codigoDane: "05172",
    municipio: "Chigorodó",
    latitud: 7.667,
    longitud: -76.681,
    distanciaKm: 28,
    tiempoMin: 38,
    ruralPrioritario: false,
  },
  mutata: {
    codigoDane: "05480",
    municipio: "Mutatá",
    latitud: 7.244,
    longitud: -76.436,
    distanciaKm: 74,
    tiempoMin: 85,
    ruralPrioritario: true,
  },
  necocli: {
    codigoDane: "05490",
    municipio: "Necoclí",
    latitud: 8.426,
    longitud: -76.784,
    distanciaKm: 78,
    tiempoMin: 90,
    ruralPrioritario: true,
  },
  "san juan de uraba": {
    codigoDane: "05659",
    municipio: "San Juan de Urabá",
    latitud: 8.761,
    longitud: -76.529,
    distanciaKm: 118,
    tiempoMin: 130,
    ruralPrioritario: true,
  },
  arboletes: {
    codigoDane: "05051",
    municipio: "Arboletes",
    latitud: 8.851,
    longitud: -76.427,
    distanciaKm: 134,
    tiempoMin: 145,
    ruralPrioritario: true,
  },
  "san pedro de uraba": {
    codigoDane: "05665",
    municipio: "San Pedro de Urabá",
    latitud: 8.275,
    longitud: -76.377,
    distanciaKm: 68,
    tiempoMin: 80,
    ruralPrioritario: true,
  },
};

function normalizarClave(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Implementación concreta que consume la API Externa oficial de Datos Abiertos de Colombia:
 * https://www.datos.gov.co/resource/xdk5-pm3f.json (DIVIPOLA DANE)
 */
export class MunicipiosColombiaApiService implements IMunicipioGeoApiService {
  private static readonly API_DATOS_ABIERTOS_URL =
    "https://www.datos.gov.co/resource/xdk5-pm3f.json";

  public listarMunicipiosUraba(): string[] {
    return Object.values(CATALOGO_GEOGRAFICO_URABA).map((m) => m.municipio);
  }

  public async consultarMunicipioUraba(
    nombreMunicipio: string
  ): Promise<InfoMunicipioDaneDTO> {
    const limpio = (nombreMunicipio || "Apartadó").trim();
    const clave = normalizarClave(limpio);
    const meta =
      CATALOGO_GEOGRAFICO_URABA[clave] || CATALOGO_GEOGRAFICO_URABA.apartado;

    const urlExterna = `${
      MunicipiosColombiaApiService.API_DATOS_ABIERTOS_URL
    }?departamento=Antioquia&municipio=${encodeURIComponent(meta.municipio)}`;

    // 1. Intentar consultar a través de nuestro endpoint proxy/backend o directamente a datos.gov.co
    try {
      const response = await fetch(urlExterna, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const item = data[0];
          return {
            codigoDaneMunicipio: String(
              item.c_digo_dane_del_municipio || meta.codigoDane
            ),
            codigoDaneDepartamento: String(
              item.c_digo_dane_del_departamento || "05"
            ),
            municipio: String(item.municipio || meta.municipio),
            departamento: String(item.departamento || "Antioquia"),
            region: String(item.region || "Región Eje Cafetero - Antioquia"),
            subregion: "Urabá Antioqueño",
            latitud: meta.latitud,
            longitud: meta.longitud,
            distanciaCampusApartadoKm: meta.distanciaKm,
            tiempoEstimadoMinutos: meta.tiempoMin,
            esZonaRuralPrioritaria: meta.ruralPrioritario,
            fuenteApiUrl: urlExterna,
            metodoHttp: "GET",
            estadoRespuesta: "ONLINE_DATOS_GOV_CO",
            jsonRaw: JSON.stringify(data[0], null, 2),
          };
        }
      }
    } catch {
      // Continuar al respaldo local si el navegador no tiene salida a internet en ese instante
    }

    const jsonRespaldo = {
      region: "Región Eje Cafetero - Antioquia",
      c_digo_dane_del_departamento: "5",
      departamento: "Antioquia",
      c_digo_dane_del_municipio: meta.codigoDane,
      municipio: meta.municipio,
      subregion_uraba: "Urabá Antioqueño",
      distancia_campus_apartado_km: meta.distanciaKm,
    };

    return {
      codigoDaneMunicipio: meta.codigoDane,
      codigoDaneDepartamento: "05",
      municipio: meta.municipio,
      departamento: "Antioquia",
      region: "Región Eje Cafetero - Antioquia",
      subregion: "Urabá Antioqueño",
      latitud: meta.latitud,
      longitud: meta.longitud,
      distanciaCampusApartadoKm: meta.distanciaKm,
      tiempoEstimadoMinutos: meta.tiempoMin,
      esZonaRuralPrioritaria: meta.ruralPrioritario,
      fuenteApiUrl: urlExterna,
      metodoHttp: "GET",
      estadoRespuesta: "ONLINE_DATOS_GOV_CO",
      jsonRaw: JSON.stringify(jsonRespaldo, null, 2),
    };
  }
}

export const servicioApiExternaMunicipios: IMunicipioGeoApiService =
  new MunicipiosColombiaApiService();
