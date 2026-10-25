package co.edu.uniremington.becas.dao;

import co.edu.uniremington.becas.config.HibernateUtil;
import co.edu.uniremington.becas.modelo.SolicitudBeca;
import org.hibernate.Session;
import org.hibernate.Transaction;

import java.util.List;
import java.util.Optional;

/**
 * Implementación CRUD con Hibernate ORM para la Entidad Clave #3: SolicitudBeca (tabla 'solicitudes_beca').
 */
public class SolicitudBecaDAO implements IGenericCrudDAO<SolicitudBeca, Integer> {

    @Override
    public SolicitudBeca crear(SolicitudBeca solicitud) {
        Transaction tx = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            tx = session.beginTransaction();
            session.persist(solicitud);
            tx.commit();
            return solicitud;
        } catch (Exception e) {
            if (tx != null) tx.rollback();
            throw new RuntimeException("Error en CREATE SolicitudBeca: " + e.getMessage(), e);
        }
    }

    @Override
    public Optional<SolicitudBeca> buscarPorId(Integer id) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return Optional.ofNullable(session.find(SolicitudBeca.class, id));
        }
    }

    public Optional<SolicitudBeca> buscarPorCodigoRadicado(String codigo) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return session.createQuery(
                    "FROM SolicitudBeca s WHERE s.codigoRadicado = :codigo",
                    SolicitudBeca.class
            ).setParameter("codigo", codigo).uniqueResultOptional();
        }
    }

    @Override
    public List<SolicitudBeca> listarTodos() {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return session.createQuery("FROM SolicitudBeca ORDER BY idSolicitud ASC", SolicitudBeca.class)
                    .getResultList();
        }
    }

    @Override
    public SolicitudBeca actualizar(SolicitudBeca solicitud) {
        Transaction tx = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            tx = session.beginTransaction();
            SolicitudBeca actualizada = session.merge(solicitud);
            tx.commit();
            return actualizada;
        } catch (Exception e) {
            if (tx != null) tx.rollback();
            throw new RuntimeException("Error en UPDATE SolicitudBeca: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean eliminarPorId(Integer id) {
        Transaction tx = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            tx = session.beginTransaction();
            SolicitudBeca existente = session.find(SolicitudBeca.class, id);
            if (existente != null) {
                session.remove(existente);
                tx.commit();
                return true;
            }
            tx.commit();
            return false;
        } catch (Exception e) {
            if (tx != null) tx.rollback();
            throw new RuntimeException("Error en DELETE SolicitudBeca: " + e.getMessage(), e);
        }
    }
}

