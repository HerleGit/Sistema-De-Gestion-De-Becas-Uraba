package co.edu.uniremington.becas.external;

/**
 * DTO que encapsula la respuesta JSON procesada desde la API Externa de Datos Abiertos de Colombia
 * (DANE DIVIPOLA - https://www.datos.gov.co/resource/xdk5-pm3f.json) enriquecida con la distancia
 * vial hacia el Campus Uniremington Sede Apartadó (Urabá).
 *
 * Aplicación de SRP (Single Responsibility Principle): Objeto dedicado exclusivamente a transportar
 * los datos geográficos validados desde el servicio externo hacia la capa de negocio y presentación.
 */
public class InfoMunicipioDaneDTO {

    private final String codigoDaneMunicipio;
    private final String nombreMunicipio;
    private final String departamento;
    private final String region;
    private final String subregion;
    private final double latitud;
    private final double longitud;
    private final double distanciaCampusApartadoKm;
    private final boolean zonaRuralPrioritaria;
    private final String fuenteApiUrl;
    private final String jsonCrudo;

    public InfoMunicipioDaneDTO(
            String codigoDaneMunicipio,
            String nombreMunicipio,
            String departamento,
            String region,
            String subregion,
            double latitud,
            double longitud,
            double distanciaCampusApartadoKm,
            boolean zonaRuralPrioritaria,
            String fuenteApiUrl,
            String jsonCrudo
    ) {
        this.codigoDaneMunicipio = codigoDaneMunicipio;
        this.nombreMunicipio = nombreMunicipio;
        this.departamento = departamento;
        this.region = region;
        this.subregion = subregion;
        this.latitud = latitud;
        this.longitud = longitud;
        this.distanciaCampusApartadoKm = distanciaCampusApartadoKm;
        this.zonaRuralPrioritaria = zonaRuralPrioritaria;
        this.fuenteApiUrl = fuenteApiUrl;
        this.jsonCrudo = jsonCrudo;
    }

    public String getCodigoDaneMunicipio() { return codigoDaneMunicipio; }
    public String getNombreMunicipio() { return nombreMunicipio; }
    public String getDepartamento() { return departamento; }
    public String getRegion() { return region; }
    public String getSubregion() { return subregion; }
    public double getLatitud() { return latitud; }
    public double getLongitud() { return longitud; }
    public double getDistanciaCampusApartadoKm() { return distanciaCampusApartadoKm; }
    public boolean isZonaRuralPrioritaria() { return zonaRuralPrioritaria; }
    public String getFuenteApiUrl() { return fuenteApiUrl; }
    public String getJsonCrudo() { return jsonCrudo; }

    @Override
    public String toString() {
        return String.format(
                "InfoMunicipioDaneDTO{codigoDANE='%s', municipio='%s', depto='%s', subregion='%s', distanciaCampus=%.1f km, ruralPrioritaria=%s}",
                codigoDaneMunicipio, nombreMunicipio, departamento, subregion, distanciaCampusApartadoKm, zonaRuralPrioritaria
        );
    }
}
