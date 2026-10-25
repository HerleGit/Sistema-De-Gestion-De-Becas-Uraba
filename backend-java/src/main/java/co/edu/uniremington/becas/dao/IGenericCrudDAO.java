package co.edu.uniremington.becas.dao;

import java.util.List;
import java.util.Optional;

/**
 * Interfaz genérica para operaciones CRUD (Crear, Leer, Actualizar, Eliminar) con Hibernate ORM.
 * Aplica los principios SOLID de Segregación de Interfaces (ISP) e Inversión de Dependencias (DIP).
 *
 * @param <T>  Tipo de la Entidad ORM (@Entity)
 * @param <ID> Tipo de la Clave Primaria (@Id)
 */
public interface IGenericCrudDAO<T, ID> {

    /**
     * CREATE: Persiste una nueva entidad en la base de datos MySQL.
     */
    T crear(T entidad);

    /**
     * READ (por ID): Busca una entidad por su clave primaria usando session.find().
     */
    Optional<T> buscarPorId(ID id);

    /**
     * READ (todos): Lista todos los registros de la tabla usando HQL.
     */
    List<T> listarTodos();

    /**
     * UPDATE: Actualiza los datos de una entidad existente usando session.merge().
     */
    T actualizar(T entidad);

    /**
     * DELETE: Elimina un registro de la base de datos por su ID usando session.remove().
     */
    boolean eliminarPorId(ID id);
}

