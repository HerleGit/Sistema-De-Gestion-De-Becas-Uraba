package co.edu.uniremington.becas.dao;

import co.edu.uniremington.becas.config.HibernateUtil;
import co.edu.uniremington.becas.modelo.DocumentoAdjunto;
import org.hibernate.Session;
import org.hibernate.Transaction;

import java.util.List;
import java.util.Optional;

/**
 * Implementación CRUD con Hibernate ORM para la Entidad Clave #4: DocumentoAdjunto (tabla 'documentos_adjuntos').
 */
public class DocumentoAdjuntoDAO implements IGenericCrudDAO<DocumentoAdjunto, Integer> {

    @Override
    public DocumentoAdjunto crear(DocumentoAdjunto documento) {
        Transaction tx = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            tx = session.beginTransaction();
            session.persist(documento);
            tx.commit();
            return documento;
        } catch (Exception e) {
            if (tx != null) tx.rollback();
            throw new RuntimeException("Error en CREATE DocumentoAdjunto: " + e.getMessage(), e);
        }
    }

    @Override
    public Optional<DocumentoAdjunto> buscarPorId(Integer id) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return Optional.ofNullable(session.find(DocumentoAdjunto.class, id));
        }
    }

    @Override
    public List<DocumentoAdjunto> listarTodos() {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return session.createQuery("FROM DocumentoAdjunto ORDER BY idDocumento ASC", DocumentoAdjunto.class)
                    .getResultList();
        }
    }

    @Override
    public DocumentoAdjunto actualizar(DocumentoAdjunto documento) {
        Transaction tx = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            tx = session.beginTransaction();
            DocumentoAdjunto actualizado = session.merge(documento);
            tx.commit();
            return actualizado;
        } catch (Exception e) {
            if (tx != null) tx.rollback();
            throw new RuntimeException("Error en UPDATE DocumentoAdjunto: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean eliminarPorId(Integer id) {
        Transaction tx = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            tx = session.beginTransaction();
            DocumentoAdjunto existente = session.find(DocumentoAdjunto.class, id);
            if (existente != null) {
                session.remove(existente);
                tx.commit();
                return true;
            }
            tx.commit();
            return false;
        } catch (Exception e) {
            if (tx != null) tx.rollback();
            throw new RuntimeException("Error en DELETE DocumentoAdjunto: " + e.getMessage(), e);
        }
    }
}

