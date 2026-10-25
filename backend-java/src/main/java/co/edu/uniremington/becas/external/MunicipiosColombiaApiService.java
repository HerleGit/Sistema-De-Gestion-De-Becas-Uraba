package co.edu.uniremington.becas.external;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Servicio que consume una API Externa (Datos Abiertos del Gobierno de Colombia - DIVIPOLA DANE)
 * para validar y enriquecer la información geográfica de los municipios de la subregión de Urabá.
 */
public class MunicipiosColombiaApiService {

    private static final String API_DATOS_ABIERTOS_URL =
            "https://www.datos.gov.co/resource/xdk5-pm3f.json?departamento=Antioquia";

    private final HttpClient httpClient;

    public MunicipiosColombiaApiService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(8))
                .build();
    }

    public String consultarMunicipioDane(String nombreMunicipio) {
        try {
            String url = API_DATOS_ABIERTOS_URL + "&municipio=" + nombreMunicipio;
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return response.body();
            }
            return "[]";
        } catch (Exception e) {
            return "{\"estado\":\"MODO_OFFLINE_TOLERANTE\",\"municipio\":\"" + nombreMunicipio + "\"}";
        }
    }
}

