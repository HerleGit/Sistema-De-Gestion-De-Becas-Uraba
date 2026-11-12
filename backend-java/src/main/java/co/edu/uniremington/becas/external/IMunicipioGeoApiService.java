package co.edu.uniremington.becas.external;

/**
 * Contrato de abstracción para el consumo de servicios externos de información geográfica y DANE.
 *
 * Principios SOLID aplicados:
 * - DIP (Dependency Inversion Principle): La capa de negocio (GestionBecasCrudService) depende
 *   de esta interfaz y no de la implementación concreta con HttpClient.
 * - OCP (Open/Closed Principle): Permite cambiar el proveedor de la API externa (por ejemplo,
 *   de Datos Abiertos Colombia a Google Maps API o Nominatim) sin modificar la lógica de negocio.
 */
public interface IMunicipioGeoApiService {

    /**
     * Consulta la API externa oficial y retorna los datos estructurados del municipio en Urabá,
     * incluyendo su código DANE y la distancia estimada al campus Uniremington Apartadó.
     */
    InfoMunicipioDaneDTO obtenerInfoMunicipio(String nombreMunicipio);
}
