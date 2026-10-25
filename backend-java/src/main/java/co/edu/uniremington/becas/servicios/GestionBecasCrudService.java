package co.edu.uniremington.becas.servicios;

import co.edu.uniremington.becas.dao.IGenericCrudDAO;
import co.edu.uniremington.becas.modelo.DocumentoAdjunto;
import co.edu.uniremington.becas.modelo.Estudiante;
import co.edu.uniremington.becas.modelo.SolicitudBeca;
import co.edu.uniremington.becas.modelo.Usuario;

/**
 * Capa de Servicios que coordina los DAOs de las entidades claves aplicando Inversión de Dependencias (SOLID).
 */
public class GestionBecasCrudService {

    private final IGenericCrudDAO<Usuario, Integer> usuarioDAO;
    private final IGenericCrudDAO<Estudiante, Integer> estudianteDAO;
    private final IGenericCrudDAO<SolicitudBeca, Integer> solicitudBecaDAO;
    private final IGenericCrudDAO<DocumentoAdjunto, Integer> documentoDAO;
    private final ICalculadoraVulnerabilidad calculadora;

    public GestionBecasCrudService(
            IGenericCrudDAO<Usuario, Integer> usuarioDAO,
            IGenericCrudDAO<Estudiante, Integer> estudianteDAO,
            IGenericCrudDAO<SolicitudBeca, Integer> solicitudBecaDAO,
            IGenericCrudDAO<DocumentoAdjunto, Integer> documentoDAO,
            ICalculadoraVulnerabilidad calculadora
    ) {
        this.usuarioDAO = usuarioDAO;
        this.estudianteDAO = estudianteDAO;
        this.solicitudBecaDAO = solicitudBecaDAO;
        this.documentoDAO = documentoDAO;
        this.calculadora = calculadora;
    }

    public SolicitudBeca registrarSolicitudConPuntaje(SolicitudBeca solicitud) {
        int puntaje = calculadora.calcularPuntaje(solicitud);
        solicitud.setPuntajeVulnerabilidad(puntaje);
        return solicitudBecaDAO.crear(solicitud);
    }

    public IGenericCrudDAO<Usuario, Integer> getUsuarioDAO() { return usuarioDAO; }
    public IGenericCrudDAO<Estudiante, Integer> getEstudianteDAO() { return estudianteDAO; }
    public IGenericCrudDAO<SolicitudBeca, Integer> getSolicitudBecaDAO() { return solicitudBecaDAO; }
    public IGenericCrudDAO<DocumentoAdjunto, Integer> getDocumentoDAO() { return documentoDAO; }
}

