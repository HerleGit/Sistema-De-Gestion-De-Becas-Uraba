package co.edu.uniremington.becas.dao;

import co.edu.uniremington.becas.config.HibernateUtil;
import co.edu.uniremington.becas.modelo.Usuario;
import org.hibernate.Session;
import org.hibernate.Transaction;

import java.util.List;
import java.util.Optional;

/**
 * Implementación CRUD con Hibernate ORM para la Entidad Clave #1: Usuario (tabla 'usuarios').
 */
public class UsuarioDAO implements IGenericCrudDAO<Usuario, Integer> {

    @Override
    public Usuario crear(Usuario usuario) {
        Transaction tx = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            tx = session.beginTransaction();
            session.persist(usuario);
            tx.commit();
            return usuario;
        } catch (Exception e) {
            if (tx != null) tx.rollback();
            throw new RuntimeException("Error en CREATE Usuario: " + e.getMessage(), e);
        }
    }

    @Override
    public Optional<Usuario> buscarPorId(Integer id) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return Optional.ofNullable(session.find(Usuario.class, id));
        }
    }

    public Optional<Usuario> buscarPorCorreo(String correo) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return session.createQuery(
                    "FROM Usuario u WHERE u.correoInstitucional = :correo",
                    Usuario.class
            ).setParameter("correo", correo).uniqueResultOptional();
        }
    }

    @Override
    public List<Usuario> listarTodos() {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return session.createQuery("FROM Usuario ORDER BY idUsuario ASC", Usuario.class)
                    .getResultList();
        }
    }

    @Override
    public Usuario actualizar(Usuario usuario) {
        Transaction tx = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            tx = session.beginTransaction();
            Usuario actualizado = session.merge(usuario);
            tx.commit();
            return actualizado;
        } catch (Exception e) {
            if (tx != null) tx.rollback();
            throw new RuntimeException("Error en UPDATE Usuario: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean eliminarPorId(Integer id) {
        Transaction tx = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            tx = session.beginTransaction();
            Usuario existente = session.find(Usuario.class, id);
            if (existente != null) {
                session.remove(existente);
                tx.commit();
                return true;
            }
            tx.commit();
            return false;
        } catch (Exception e) {
            if (tx != null) tx.rollback();
            throw new RuntimeException("Error en DELETE Usuario: " + e.getMessage(), e);
        }
    }
}

