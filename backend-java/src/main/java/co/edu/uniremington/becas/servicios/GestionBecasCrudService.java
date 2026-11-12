package co.edu.uniremington.becas.servicios;

import co.edu.uniremington.becas.dao.IGenericCrudDAO;
import co.edu.uniremington.becas.external.IMunicipioGeoApiService;
import co.edu.uniremington.becas.external.InfoMunicipioDaneDTO;
import co.edu.uniremington.becas.external.MunicipiosColombiaApiService;
import co.edu.uniremington.becas.modelo.DocumentoAdjunto;
import co.edu.uniremington.becas.modelo.Estudiante;
import co.edu.uniremington.becas.modelo.SolicitudBeca;
import co.edu.uniremington.becas.modelo.Usuario;

import java.math.BigDecimal;

/**
 * Capa de Servicios de Negocio que coordina la persistencia CRUD (Hibernate/MySQL),
 * el cálculo algorítmico de vulnerabilidad (RF2) y el enriquecimiento geográfico mediante API Externa.
 *
 * Principios SOLID aplicados explícitamente:
 * 1. SRP (Single Responsibility Principle): Coordina las reglas de negocio de postulación y evaluación
 *    de becas, delegando el acceso a datos a los DAOs, el cálculo matemático a ICalculadoraVulnerabilidad
 *    y las peticiones HTTP externas a IMunicipioGeoApiService.
 * 2. DIP (Dependency Inversion Principle): Depende exclusivamente de abstracciones (interfaces
 *    IGenericCrudDAO, ICalculadoraVulnerabilidad e IMunicipioGeoApiService) inyectadas por constructor.
 * 3. OCP (Open/Closed Principle): Permite inyectar distintas estrategias de cálculo socioeconómico
 *    (urbana o rural prioritaria) o distintos proveedores de API externa sin modificar esta clase.
 */
public class GestionBecasCrudService {

    private final IGenericCrudDAO<Usuario, Integer> usuarioDAO;
    private final IGenericCrudDAO<Estudiante, Integer> estudianteDAO;
    private final IGenericCrudDAO<SolicitudBeca, Integer> solicitudBecaDAO;
    private final IGenericCrudDAO<DocumentoAdjunto, Integer> documentoDAO;
    private final ICalculadoraVulnerabilidad calculadora;
    private final IMunicipioGeoApiService municipioGeoApiService;

    public GestionBecasCrudService(
            IGenericCrudDAO<Usuario, Integer> usuarioDAO,
            IGenericCrudDAO<Estudiante, Integer> estudianteDAO,
            IGenericCrudDAO<SolicitudBeca, Integer> solicitudBecaDAO,
            IGenericCrudDAO<DocumentoAdjunto, Integer> documentoDAO,
            ICalculadoraVulnerabilidad calculadora
    ) {
        this(usuarioDAO, estudianteDAO, solicitudBecaDAO, documentoDAO, calculadora, new MunicipiosColombiaApiService());
    }

    public GestionBecasCrudService(
            IGenericCrudDAO<Usuario, Integer> usuarioDAO,
            IGenericCrudDAO<Estudiante, Integer> estudianteDAO,
            IGenericCrudDAO<SolicitudBeca, Integer> solicitudBecaDAO,
            IGenericCrudDAO<DocumentoAdjunto, Integer> documentoDAO,
            ICalculadoraVulnerabilidad calculadora,
            IMunicipioGeoApiService municipioGeoApiService
    ) {
        this.usuarioDAO = usuarioDAO;
        this.estudianteDAO = estudianteDAO;
        this.solicitudBecaDAO = solicitudBecaDAO;
        this.documentoDAO = documentoDAO;
        this.calculadora = calculadora;
        this.municipioGeoApiService = municipioGeoApiService;
    }

    /**
     * Registra una solicitud de beca enriqueciendo automáticamente la distancia al Campus Apartadó
     * mediante la API Externa (Datos Abiertos Colombia - DANE DIVIPOLA) si el estudiante tiene municipio
     * registrado, calcula el puntaje de vulnerabilidad (RF2) y persiste en MySQL vía Hibernate ORM.
     */
    public SolicitudBeca registrarSolicitudConPuntaje(SolicitudBeca solicitud) {
        if (solicitud.getEstudiante() != null && solicitud.getEstudiante().getMunicipioResidencia() != null) {
            InfoMunicipioDaneDTO infoGeo = municipioGeoApiService.obtenerInfoMunicipio(
                    solicitud.getEstudiante().getMunicipioResidencia()
            );
            if (solicitud.getDistanciaCampusKm() == null || solicitud.getDistanciaCampusKm().doubleValue() <= 0) {
                solicitud.setDistanciaCampusKm(BigDecimal.valueOf(infoGeo.getDistanciaCampusApartadoKm()));
            }
        }
        int puntaje = calculadora.calcularPuntaje(solicitud);
        solicitud.setPuntajeVulnerabilidad(puntaje);
        return solicitudBecaDAO.crear(solicitud);
    }

    /**
     * Consulta la API externa oficial para validar el municipio del estudiante y obtener su código DANE
     * y distancia vial al campus Apartadó.
     */
    public InfoMunicipioDaneDTO validarMunicipioConApiExterna(String municipio) {
        return municipioGeoApiService.obtenerInfoMunicipio(municipio);
    }

    public IGenericCrudDAO<Usuario, Integer> getUsuarioDAO() { return usuarioDAO; }
    public IGenericCrudDAO<Estudiante, Integer> getEstudianteDAO() { return estudianteDAO; }
    public IGenericCrudDAO<SolicitudBeca, Integer> getSolicitudBecaDAO() { return solicitudBecaDAO; }
    public IGenericCrudDAO<DocumentoAdjunto, Integer> getDocumentoDAO() { return documentoDAO; }
}
