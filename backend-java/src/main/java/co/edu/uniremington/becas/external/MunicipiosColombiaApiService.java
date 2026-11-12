package co.edu.uniremington.becas.external;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Servicio que consume una API Externa gratuita y de acceso público:
 * API de Datos Abiertos del Gobierno de Colombia (DANE DIVIPOLA - Socrata Open Data API)
 * Endpoint: https://www.datos.gov.co/resource/xdk5-pm3f.json?departamento=Antioquia
 *
 * Principios SOLID aplicados:
 * - SRP (Single Responsibility Principle): Su única responsabilidad es realizar la petición HTTP GET
 *   a la API externa, procesar la respuesta JSON y devolver un objeto InfoMunicipioDaneDTO.
 * - DIP (Dependency Inversion Principle): Implementa la interfaz IMunicipioGeoApiService inyectada
 *   en la capa de servicios de negocio.
 */
public class MunicipiosColombiaApiService implements IMunicipioGeoApiService {

    private static final String API_DATOS_ABIERTOS_URL =
            "https://www.datos.gov.co/resource/xdk5-pm3f.json";

    private final HttpClient httpClient;

    // Catálogo georreferenciado de la subregión de Urabá para cálculo de distancia vial al Campus Apartadó
    private static final Map<String, double[]> GEO_URABA = new HashMap<>();
    private static final Map<String, String> CODIGO_DANE_RESPALDO = new HashMap<>();

    static {
        // { latitud, longitud, distanciaVialCampusApartadoKm, esRuralPrioritario(1=Sí, 0=No) }
        GEO_URABA.put("apartadó", new double[]{7.883, -76.626, 3.0, 0});
        GEO_URABA.put("carepa", new double[]{7.758, -76.655, 16.0, 0});
        GEO_URABA.put("chigorodó", new double[]{7.667, -76.681, 28.0, 0});
        GEO_URABA.put("turbo", new double[]{8.093, -76.728, 32.0, 0});
        GEO_URABA.put("mutatá", new double[]{7.244, -76.436, 74.0, 1});
        GEO_URABA.put("necoclí", new double[]{8.426, -76.784, 78.0, 1});
        GEO_URABA.put("san juan de urabá", new double[]{8.761, -76.529, 118.0, 1});
        GEO_URABA.put("arboletes", new double[]{8.851, -76.427, 134.0, 1});
        GEO_URABA.put("san pedro de urabá", new double[]{8.275, -76.377, 68.0, 1});

        CODIGO_DANE_RESPALDO.put("apartadó", "05045");
        CODIGO_DANE_RESPALDO.put("carepa", "05147");
        CODIGO_DANE_RESPALDO.put("chigorodó", "05172");
        CODIGO_DANE_RESPALDO.put("turbo", "05837");
        CODIGO_DANE_RESPALDO.put("mutatá", "05480");
        CODIGO_DANE_RESPALDO.put("necoclí", "05490");
        CODIGO_DANE_RESPALDO.put("san juan de urabá", "05659");
        CODIGO_DANE_RESPALDO.put("arboletes", "05051");
        CODIGO_DANE_RESPALDO.put("san pedro de urabá", "05665");
    }

    public MunicipiosColombiaApiService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(6))
                .build();
    }

    @Override
    public InfoMunicipioDaneDTO obtenerInfoMunicipio(String nombreMunicipio) {
        String limpio = (nombreMunicipio == null || nombreMunicipio.isBlank())
                ? "Apartadó"
                : nombreMunicipio.trim();
        String clave = limpio.toLowerCase(Locale.ROOT);

        double[] geo = GEO_URABA.getOrDefault(clave, new double[]{7.883, -76.626, 20.0, 0});
        String codigoPorDefecto = CODIGO_DANE_RESPALDO.getOrDefault(clave, "05045");
        String urlConsulta = API_DATOS_ABIERTOS_URL + "?departamento=Antioquia&municipio="
                + URLEncoder.encode(limpio, StandardCharsets.UTF_8);

        String jsonRaw = consultarMunicipioDane(limpio);

        String codigoDane = extraerCampoJson(jsonRaw, "c_digo_dane_del_municipio", codigoPorDefecto);
        String depto = extraerCampoJson(jsonRaw, "departamento", "Antioquia");
        String region = extraerCampoJson(jsonRaw, "region", "Región Eje Cafetero - Antioquia");

        return new InfoMunicipioDaneDTO(
                codigoDane,
                limpio,
                depto,
                region,
                "Urabá Antioqueño",
                geo[0],
                geo[1],
                geo[2],
                geo[3] == 1.0,
                urlConsulta,
                jsonRaw
        );
    }

    public String consultarMunicipioDane(String nombreMunicipio) {
        try {
            String param = URLEncoder.encode(nombreMunicipio.trim(), StandardCharsets.UTF_8);
            String url = API_DATOS_ABIERTOS_URL + "?departamento=Antioquia&municipio=" + param;
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(6))
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200 && response.body() != null && response.body().length() > 5) {
                return response.body();
            }
        } catch (Exception ignored) {
            // Respaldo tolerante a desconexión regional (RNF Disponibilidad)
        }
        String clave = nombreMunicipio.trim().toLowerCase(Locale.ROOT);
        String cod = CODIGO_DANE_RESPALDO.getOrDefault(clave, "05045");
        return String.format(
                "[{\"region\":\"Región Eje Cafetero - Antioquia\",\"c_digo_dane_del_departamento\":\"5\",\"departamento\":\"Antioquia\",\"c_digo_dane_del_municipio\":\"%s\",\"municipio\":\"%s\"}]",
                cod, nombreMunicipio.trim()
        );
    }

    private String extraerCampoJson(String json, String campo, String valorPorDefecto) {
        if (json == null || json.isBlank()) return valorPorDefecto;
        Pattern pattern = Pattern.compile("\"" + Pattern.quote(campo) + "\"\\s*:\\s*\"([^\"]+)\"");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return valorPorDefecto;
    }
}
