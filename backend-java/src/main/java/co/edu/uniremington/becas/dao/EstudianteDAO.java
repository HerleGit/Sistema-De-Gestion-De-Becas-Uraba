package co.edu.uniremington.becas.dao;

import co.edu.uniremington.becas.config.HibernateUtil;
import co.edu.uniremington.becas.modelo.Estudiante;
import org.hibernate.Session;
import org.hibernate.Transaction;

import java.util.List;
import java.util.Optional;

/**
 * Implementación CRUD con Hibernate ORM para la Entidad Clave #2: Estudiante (tabla 'estudiantes').
 */
public class EstudianteDAO implements IGenericCrudDAO<Estudiante, Integer> {

    @Override
    public Estudiante crear(Estudiante estudiante) {
        Transaction tx = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            tx = session.beginTransaction();
            session.persist(estudiante);
            tx.commit();
            return estudiante;
        } catch (Exception e) {
            if (tx != null) tx.rollback();
            throw new RuntimeException("Error en CREATE Estudiante: " + e.getMessage(), e);
        }
    }

    @Override
    public Optional<Estudiante> buscarPorId(Integer id) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return Optional.ofNullable(session.find(Estudiante.class, id));
        }
    }

    public Optional<Estudiante> buscarPorDocumento(String documento) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return session.createQuery(
                    "FROM Estudiante e WHERE e.documentoIdentidad = :doc",
                    Estudiante.class
            ).setParameter("doc", documento).uniqueResultOptional();
        }
    }

    @Override
    public List<Estudiante> listarTodos() {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return session.createQuery("FROM Estudiante ORDER BY idEstudiante ASC", Estudiante.class)
                    .getResultList();
        }
    }

    @Override
    public Estudiante actualizar(Estudiante estudiante) {
        Transaction tx = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            tx = session.beginTransaction();
            Estudiante actualizado = session.merge(estudiante);
            tx.commit();
            return actualizado;
        } catch (Exception e) {
            if (tx != null) tx.rollback();
            throw new RuntimeException("Error en UPDATE Estudiante: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean eliminarPorId(Integer id) {
        Transaction tx = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            tx = session.beginTransaction();
            Estudiante existente = session.find(Estudiante.class, id);
            if (existente != null) {
                session.remove(existente);
                tx.commit();
                return true;
            }
            tx.commit();
            return false;
        } catch (Exception e) {
            if (tx != null) tx.rollback();
            throw new RuntimeException("Error en DELETE Estudiante: " + e.getMessage(), e);
        }
    }
}

