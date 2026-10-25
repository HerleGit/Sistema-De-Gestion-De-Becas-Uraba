package co.edu.uniremington.becas;

import co.edu.uniremington.becas.config.HibernateUtil;
import co.edu.uniremington.becas.dao.*;
import co.edu.uniremington.becas.modelo.*;
import co.edu.uniremington.becas.servicios.CalculadoraVulnerabilidadUraba;
import co.edu.uniremington.becas.servicios.GestionBecasCrudService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * ACTIVIDAD EVALUATIVA - FASE II (ING-PROY-3 · 15%)
 * Clase Main de prueba que demuestra las operaciones CRUD (Crear, Leer, Actualizar, Eliminar)
 * utilizando Hibernate ORM y MySQL sobre al menos 3 entidades claves del sistema:
 *   1. Entidad Usuario       (tabla 'usuarios')
 *   2. Entidad Estudiante    (tabla 'estudiantes')
 *   3. Entidad SolicitudBeca (tabla 'solicitudes_beca')
 *   4. Entidad DocumentoAdjunto (tabla 'documentos_adjuntos')
 */
public class MainCrudApp {

    public static void main(String[] args) {
        System.out.println("==========================================================================");
        System.out.println("   PRUEBA INTEGRAL DE MAPEO ORM Y OPERACIONES CRUD CON HIBERNATE Y MYSQL  ");
        System.out.println("   Proyecto N.° 8: Gestión de Becas y Apoyo Estudiantil - Región de Urabá ");
        System.out.println("==========================================================================\n");

        InstitucionDAO institucionDAO = new InstitucionDAO();
        UsuarioDAO usuarioDAO = new UsuarioDAO();
        EstudianteDAO estudianteDAO = new EstudianteDAO();
        SolicitudBecaDAO solicitudDAO = new SolicitudBecaDAO();
        DocumentoAdjuntoDAO documentoDAO = new DocumentoAdjuntoDAO();

        GestionBecasCrudService servicio = new GestionBecasCrudService(
                usuarioDAO,
                estudianteDAO,
                solicitudDAO,
                documentoDAO,
                new CalculadoraVulnerabilidadUraba()
        );

        try {
            // Obtener la institución sede Apartadó (ID = 1)
            Institucion uniremington = institucionDAO.buscarPorId(1)
                    .orElseThrow(() -> new IllegalStateException("Institución ID 1 no encontrada en MySQL"));

            // =========================================================================
            // 1. PRUEBA CRUD SOBRE ENTIDAD CLAVE #1: USUARIO (tabla 'usuarios')
            // =========================================================================
            System.out.println("--- [1] OPERACIONES CRUD ENTIDAD: USUARIO ---");

            // CREATE
            Usuario nuevoUsuario = new Usuario(
                    "Carlos Andrés Mena Córdoba",
                    "carlos.mena@uniremington.edu.co",
                    "SHA256_MENA_2026",
                    "ESTUDIANTE",
                    "Estudiante Ingeniería de Sistemas"
            );
            usuarioDAO.crear(nuevoUsuario);
            System.out.println("[CREATE Usuario] Registro insertado con ID: " + nuevoUsuario.getIdUsuario());

            // READ
            Optional<Usuario> usuarioLeido = usuarioDAO.buscarPorId(nuevoUsuario.getIdUsuario());
            System.out.println("[READ Usuario] Consulta por ID: " + usuarioLeido.orElse(null));

            // UPDATE
            nuevoUsuario.setCargo("Estudiante Representante · Semestre 7");
            usuarioDAO.actualizar(nuevoUsuario);
            System.out.println("[UPDATE Usuario] Cargo actualizado a: " + nuevoUsuario.getCargo());

            // =========================================================================
            // 2. PRUEBA CRUD SOBRE ENTIDAD CLAVE #2: ESTUDIANTE (tabla 'estudiantes')
            // =========================================================================
            System.out.println("\n--- [2] OPERACIONES CRUD ENTIDAD: ESTUDIANTE ---");

            // CREATE
            Estudiante nuevoEstudiante = new Estudiante(
                    nuevoUsuario,
                    uniremington,
                    "1027955800",
                    "3147896541",
                    "Chigorodó",
                    "Ingeniería de Sistemas",
                    7,
                    new BigDecimal("4.20")
            );
            estudianteDAO.crear(nuevoEstudiante);
            System.out.println("[CREATE Estudiante] Registro insertado con ID: " + nuevoEstudiante.getIdEstudiante());

            // READ
            Optional<Estudiante> estudianteLeido = estudianteDAO.buscarPorId(nuevoEstudiante.getIdEstudiante());
            System.out.println("[READ Estudiante] Consulta por ID: " + estudianteLeido.orElse(null));

            // UPDATE
            nuevoEstudiante.setPromedioAcumulado(new BigDecimal("4.45"));
            estudianteDAO.actualizar(nuevoEstudiante);
            System.out.println("[UPDATE Estudiante] Promedio actualizado a: " + nuevoEstudiante.getPromedioAcumulado());

            // =========================================================================
            // 3. PRUEBA CRUD SOBRE ENTIDAD CLAVE #3: SOLICITUD_BECA (tabla 'solicitudes_beca')
            // =========================================================================
            System.out.println("\n--- [3] OPERACIONES CRUD ENTIDAD: SOLICITUD_BECA ---");

            // CREATE (con cálculo automático de puntaje mediante el servicio SOLID)
            SolicitudBeca nuevaSolicitud = new SolicitudBeca(
                    "BEC-2026-099",
                    nuevoEstudiante,
                    new BigDecimal("600000.00"),
                    3,
                    1,
                    new BigDecimal("28.00"),
                    0
            );
            servicio.registrarSolicitudConPuntaje(nuevaSolicitud);
            System.out.println("[CREATE SolicitudBeca] Radicado creado: " + nuevaSolicitud.getCodigoRadicado()
                    + " | Puntaje calculado: " + nuevaSolicitud.getPuntajeVulnerabilidad() + "/100 pts");

            // READ (listar todas las solicitudes en la base de datos)
            List<SolicitudBeca> todasLasSolicitudes = solicitudDAO.listarTodos();
            System.out.println("[READ SolicitudBeca] Total de solicitudes en MySQL: " + todasLasSolicitudes.size());
            todasLasSolicitudes.forEach(s -> System.out.println("   -> " + s));

            // UPDATE (avanzar etapa del comité y aprobar la solicitud)
            nuevaSolicitud.setEtapaActual("APROBACION_FINAL");
            nuevaSolicitud.setEstadoSolicitud("APROBADA");
            solicitudDAO.actualizar(nuevaSolicitud);
            System.out.println("[UPDATE SolicitudBeca] Estado actualizado a: " + nuevaSolicitud.getEstadoSolicitud());

            // =========================================================================
            // 4. DEMOSTRACIÓN DE OPERACIÓN DELETE (ELIMINAR) EN CASCADA / CONTROLADA
            // =========================================================================
            System.out.println("\n--- [4] DEMOSTRACIÓN DE OPERACIÓN DELETE (ELIMINAR REGISTROS DE PRUEBA) ---");

            boolean solEliminada = solicitudDAO.eliminarPorId(nuevaSolicitud.getIdSolicitud());
            System.out.println("[DELETE SolicitudBeca] Solicitud ID " + nuevaSolicitud.getIdSolicitud() + " eliminada: " + solEliminada);

            boolean estEliminado = estudianteDAO.eliminarPorId(nuevoEstudiante.getIdEstudiante());
            System.out.println("[DELETE Estudiante] Estudiante ID " + nuevoEstudiante.getIdEstudiante() + " eliminado: " + estEliminado);

            boolean usrEliminado = usuarioDAO.eliminarPorId(nuevoUsuario.getIdUsuario());
            System.out.println("[DELETE Usuario] Usuario ID " + nuevoUsuario.getIdUsuario() + " eliminado: " + usrEliminado);

            System.out.println("\n==========================================================================");
            System.out.println("   CICLO CRUD (CREATE, READ, UPDATE, DELETE) COMPLETADO EXITOSAMENTE      ");
            System.out.println("==========================================================================");

        } finally {
            HibernateUtil.shutdown();
        }
    }
}

