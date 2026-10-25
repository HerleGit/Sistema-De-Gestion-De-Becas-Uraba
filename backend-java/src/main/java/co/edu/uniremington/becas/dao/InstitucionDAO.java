package co.edu.uniremington.becas.dao;

import co.edu.uniremington.becas.config.HibernateUtil;
import co.edu.uniremington.becas.modelo.Institucion;
import org.hibernate.Session;

import java.util.Optional;

public class InstitucionDAO {

    public Optional<Institucion> buscarPorId(Integer id) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return Optional.ofNullable(session.find(Institucion.class, id));
        }
    }
}

