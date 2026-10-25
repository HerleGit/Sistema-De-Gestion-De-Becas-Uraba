# Sistema de Gestión de Becas y Apoyo Estudiantil Universitario Regional (Región de Urabá)

**Corporación Universitaria Remington — Facultad de Ingenierías (Distancia)**  
- **Asignatura:** Lenguaje de Programación 3  
- **Docente:** Marta Lucía Jiménez Torres  
- **Estudiante Responsable:** Herledinson Alberto Robledo Suárez  
- **Proyecto N.° 8:** Software de gestión de becas y apoyo estudiantil universitario regional  

---

## Arquitectura y Estructura del Repositorio

El proyecto implementa una solución completa en capas que integra **Java 17 + Hibernate ORM + Conector JDBC MySQL + Principios SOLID + Consumo de API Externa**, junto con un **Prototipo Web Interactivo en React + TypeScript**:

```text
├── database/
│   └── schema_becas_uraba.sql               # Script DDL + DML MySQL (7 tablas con PK y FK)
├── backend-java/                            # Proyecto Maven (Mapeo ORM Hibernate + Operaciones CRUD)
│   ├── pom.xml                              # Dependencias: mysql-connector-j 8.3.0 y hibernate-core 6.4.4
│   └── src/main/
│       ├── resources/
│       │   └── hibernate.cfg.xml            # Configuración JDBC MySQL + Mapeo de las 7 entidades
│       └── java/co/edu/uniremington/becas/
│           ├── MainCrudApp.java             # Clase Main de prueba CRUD (Create, Read, Update, Delete)
│           ├── config/
│           │   └── HibernateUtil.java       # Inicializador Singleton de SessionFactory
│           ├── modelo/                      # 7 Clases de Entidad ORM (@Entity, @Table, @Id, @ManyToOne)
│           │   ├── Institucion.java
│           │   ├── Usuario.java
│           │   ├── Estudiante.java
│           │   ├── SolicitudBeca.java
│           │   ├── TipoSubsidioSolicitud.java
│           │   ├── DocumentoAdjunto.java
│           │   └── RegistroAuditoria.java
│           ├── dao/                         # Capa de Acceso a Datos CRUD con Hibernate
│           │   ├── IGenericCrudDAO.java
│           │   ├── UsuarioDAO.java
│           │   ├── EstudianteDAO.java
│           │   ├── SolicitudBecaDAO.java
│           │   ├── DocumentoAdjuntoDAO.java
│           │   └── InstitucionDAO.java
│           ├── servicios/                   # Lógica de Negocio con Principios SOLID
│           │   ├── ICalculadoraVulnerabilidad.java
│           │   ├── CalculadoraVulnerabilidadUraba.java
│           │   └── GestionBecasCrudService.java
│           └── external/                    # Consumo de API Externa (Datos Abiertos Colombia)
│               └── MunicipiosColombiaApiService.java
└── src/                                     # Aplicativo Web Frontend (React 19 + TypeScript + Tailwind CSS)
```

---

## Fase II: Mapeo ORM con Hibernate y Operaciones CRUD (`ING-PROY-3`)

1. **Clases de Entidad (`paquete modelo`):**
   Mapeo completo de las 7 tablas relacionales de `becas_uraba_db` mediante anotaciones JPA/Hibernate (`@Entity`, `@Table`, `@Id`, `@GeneratedValue`, `@Column`, `@OneToOne`, `@ManyToOne`, `@OneToMany`).
2. **Operaciones CRUD (`paquete dao`):**
   Implementación de los métodos `crear` (`session.persist`), `buscarPorId` (`session.find`), `listarTodos` (`session.createQuery`), `actualizar` (`session.merge`) y `eliminarPorId` (`session.remove`) para las entidades clave:
   - `UsuarioDAO` (`usuarios`)
   - `EstudianteDAO` (`estudiantes`)
   - `SolicitudBecaDAO` (`solicitudes_beca`)
   - `DocumentoAdjuntoDAO` (`documentos_adjuntos`)
3. **Ejecución de Pruebas CRUD:**
   La clase [`MainCrudApp.java`](backend-java/src/main/java/co/edu/uniremington/becas/MainCrudApp.java) ejecuta de principio a fin las operaciones **CREATE, READ, UPDATE y DELETE** contra la base de datos MySQL `becas_uraba_db`.

