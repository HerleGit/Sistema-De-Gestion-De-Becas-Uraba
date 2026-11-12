package co.edu.uniremington.becas;

import co.edu.uniremington.becas.config.HibernateUtil;
import co.edu.uniremington.becas.dao.*;
import co.edu.uniremington.becas.external.IMunicipioGeoApiService;
import co.edu.uniremington.becas.external.InfoMunicipioDaneDTO;
import co.edu.uniremington.becas.external.MunicipiosColombiaApiService;
import co.edu.uniremington.becas.modelo.*;
import co.edu.uniremington.becas.servicios.CalculadoraVulnerabilidadRuralPrioritaria;
import co.edu.uniremington.becas.servicios.CalculadoraVulnerabilidadUraba;
import co.edu.uniremington.becas.servicios.GestionBecasCrudService;
import co.edu.uniremington.becas.servicios.ICalculadoraVulnerabilidad;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * ACTIVIDAD EVALUATIVA - FASE II & FASE III (ING-PROY-3 / ING-PROY-4)
 * Clase principal que integra:
 *   1. Principios SOLID (SRP, OCP, LSP, ISP, DIP) con Inyección de Dependencias por constructor.
 *   2. Consumo de API Externa (Datos Abiertos de Colombia - DANE DIVIPOLA en formato JSON).
 *   3. Persistencia completa CRUD con Hibernate ORM y MySQL sobre las entidades claves:
 *      - Usuario ('usuarios')
 *      - Estudiante ('estudiantes')
 *      - SolicitudBeca ('solicitudes_beca')
 *      - DocumentoAdjunto ('documentos_adjuntos')
 */
public class MainCrudApp {

    public static void main(String[] args) {
        System.out.println("==========================================================================");
        System.out.println("   FASE III (ING-PROY-4): PRINCIPIOS SOLID, API EXTERNA E IMPLEMENTACION  ");
        System.out.println("   Proyecto N.° 8: Gestión de Becas y Apoyo Estudiantil - Región de Urabá ");
        System.out.println("==========================================================================\n");

        // Capas de Acceso a Datos (SRP: cada DAO administra únicamente su entidad)
        InstitucionDAO institucionDAO = new InstitucionDAO();
        UsuarioDAO usuarioDAO = new UsuarioDAO();
        EstudianteDAO estudianteDAO = new EstudianteDAO();
        SolicitudBecaDAO solicitudDAO = new SolicitudBecaDAO();
        DocumentoAdjuntoDAO documentoDAO = new DocumentoAdjuntoDAO();

        // Servicio de consumo de API Externa mediante interfaz (DIP / SRP)
        IMunicipioGeoApiService apiExternaDane = new MunicipiosColombiaApiService();

        // Estrategias de cálculo de vulnerabilidad intercambiables (OCP / LSP / DIP)
        ICalculadoraVulnerabilidad calculadoraEstandar = new CalculadoraVulnerabilidadUraba();
        ICalculadoraVulnerabilidad calculadoraRural = new CalculadoraVulnerabilidadRuralPrioritaria();

        GestionBecasCrudService servicio = new GestionBecasCrudService(
                usuarioDAO,
                estudianteDAO,
                solicitudDAO,
                documentoDAO,
                calculadoraEstandar,
                apiExternaDane
        );

        try {
            // =========================================================================
            // 0. DEMOSTRACIÓN DE CONSUMO DE API EXTERNA (DATOS ABIERTOS COLOMBIA - DANE)
            // =========================================================================
            System.out.println("--- [0] CONSUMO DE API EXTERNA (DANE DIVIPOLA - DATOS ABIERTOS COLOMBIA) ---");
            InfoMunicipioDaneDTO infoChigorodo = servicio.validarMunicipioConApiExterna("Chigorodó");
            System.out.println("[API EXTERNA HTTP GET] URL: " + infoChigorodo.getFuenteApiUrl());
            System.out.println("[API EXTERNA JSON] Respuesta procesada: " + infoChigorodo);
            System.out.println("[API EXTERNA RAW JSON] " + infoChigorodo.getJsonCrudo() + "\n");

            // Obtener la institución sede Apartadó (ID = 1)
            Institucion uniremington = institucionDAO.buscarPorId(1)
                    .orElseThrow(() -> new IllegalStateException("Institución ID 1 no encontrada en MySQL"));

            // =========================================================================
            // 1. PRUEBA CRUD SOBRE ENTIDAD CLAVE #1: USUARIO (tabla 'usuarios')
            // =========================================================================
            System.out.println("--- [1] OPERACIONES CRUD ENTIDAD: USUARIO ---");

            Usuario nuevoUsuario = new Usuario(
                    "Carlos Andrés Mena Córdoba",
                    "carlos.mena@uniremington.edu.co",
                    "SHA256_MENA_2026",
                    "ESTUDIANTE",
                    "Estudiante Ingeniería de Sistemas"
            );
            usuarioDAO.crear(nuevoUsuario);
            System.out.println("[CREATE Usuario] Registro insertado con ID: " + nuevoUsuario.getIdUsuario());

            Optional<Usuario> usuarioLeido = usuarioDAO.buscarPorId(nuevoUsuario.getIdUsuario());
            System.out.println("[READ Usuario] Consulta por ID: " + usuarioLeido.orElse(null));

            nuevoUsuario.setCargo("Estudiante Representante · Semestre 7");
            usuarioDAO.actualizar(nuevoUsuario);
            System.out.println("[UPDATE Usuario] Cargo actualizado a: " + nuevoUsuario.getCargo());

            // =========================================================================
            // 2. PRUEBA CRUD SOBRE ENTIDAD CLAVE #2: ESTUDIANTE (tabla 'estudiantes')
            // =========================================================================
            System.out.println("\n--- [2] OPERACIONES CRUD ENTIDAD: ESTUDIANTE ---");

            Estudiante nuevoEstudiante = new Estudiante(
                    nuevoUsuario,
                    uniremington,
                    "1027955800",
                    "3147896541",
                    infoChigorodo.getNombreMunicipio(),
                    "Ingeniería de Sistemas",
                    7,
                    new BigDecimal("4.20")
            );
            estudianteDAO.crear(nuevoEstudiante);
            System.out.println("[CREATE Estudiante] Registro insertado con ID: " + nuevoEstudiante.getIdEstudiante());

            Optional<Estudiante> estudianteLeido = estudianteDAO.buscarPorId(nuevoEstudiante.getIdEstudiante());
            System.out.println("[READ Estudiante] Consulta por ID: " + estudianteLeido.orElse(null));

            nuevoEstudiante.setPromedioAcumulado(new BigDecimal("4.45"));
            estudianteDAO.actualizar(nuevoEstudiante);
            System.out.println("[UPDATE Estudiante] Promedio actualizado a: " + nuevoEstudiante.getPromedioAcumulado());

            // =========================================================================
            // 3. PRUEBA CRUD Y SOLID SOBRE ENTIDAD CLAVE #3: SOLICITUD_BECA
            // =========================================================================
            System.out.println("\n--- [3] OPERACIONES CRUD + SOLID + API EXTERNA: SOLICITUD_BECA ---");

            // La distancia se autocompleta desde la API Externa (0 -> 28.0 km desde Chigorodó)
            SolicitudBeca nuevaSolicitud = new SolicitudBeca(
                    "BEC-2026-099",
                    nuevoEstudiante,
                    new BigDecimal("600000.00"),
                    3,
                    1,
                    BigDecimal.ZERO,
                    0
            );
            servicio.registrarSolicitudConPuntaje(nuevaSolicitud);
            System.out.println("[CREATE SolicitudBeca] Radicado creado: " + nuevaSolicitud.getCodigoRadicado()
                    + " | Distancia autocompletada por API: " + nuevaSolicitud.getDistanciaCampusKm() + " km"
                    + " | Puntaje RF2 (Estrategia Estándar): " + nuevaSolicitud.getPuntajeVulnerabilidad() + "/100 pts");

            // Demostración explícita de OCP y LSP: cálculo con estrategia rural sin modificar la entidad
            int puntajeRural = calculadoraRural.calcularPuntaje(nuevaSolicitud);
            System.out.println("[SOLID OCP/LSP] Puntaje evaluado con CalculadoraVulnerabilidadRuralPrioritaria: "
                    + puntajeRural + "/100 pts");

            List<SolicitudBeca> todasLasSolicitudes = solicitudDAO.listarTodos();
            System.out.println("[READ SolicitudBeca] Total de solicitudes en MySQL: " + todasLasSolicitudes.size());
            todasLasSolicitudes.forEach(s -> System.out.println("   -> " + s));

            nuevaSolicitud.setEtapaActual("APROBACION_FINAL");
            nuevaSolicitud.setEstadoSolicitud("APROBADA");
            solicitudDAO.actualizar(nuevaSolicitud);
            System.out.println("[UPDATE SolicitudBeca] Estado actualizado a: " + nuevaSolicitud.getEstadoSolicitud());

            // =========================================================================
            // 4. DEMOSTRACIÓN DE OPERACIÓN DELETE (ELIMINAR REGISTROS DE PRUEBA)
            // =========================================================================
            System.out.println("\n--- [4] DEMOSTRACIÓN DE OPERACIÓN DELETE (ELIMINAR REGISTROS DE PRUEBA) ---");

            boolean solEliminada = solicitudDAO.eliminarPorId(nuevaSolicitud.getIdSolicitud());
            System.out.println("[DELETE SolicitudBeca] Solicitud ID " + nuevaSolicitud.getIdSolicitud() + " eliminada: " + solEliminada);

            boolean estEliminado = estudianteDAO.eliminarPorId(nuevoEstudiante.getIdEstudiante());
            System.out.println("[DELETE Estudiante] Estudiante ID " + nuevoEstudiante.getIdEstudiante() + " eliminado: " + estEliminado);

            boolean usrEliminado = usuarioDAO.eliminarPorId(nuevoUsuario.getIdUsuario());
            System.out.println("[DELETE Usuario] Usuario ID " + nuevoUsuario.getIdUsuario() + " eliminado: " + usrEliminado);

            System.out.println("\n==========================================================================");
            System.out.println("   FASE III: SOLID, API EXTERNA Y CRUD COMPLETADOS EXITOSAMENTE           ");
            System.out.println("==========================================================================");

        } finally {
            HibernateUtil.shutdown();
        }
    }
}
