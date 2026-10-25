-- =====================================================================================
-- CORPORACIÓN UNIVERSITARIA REMINGTON - FACULTAD DE INGENIERÍAS
-- Asignatura: Lenguaje de Programación 3 | Profesora: Marta Lucía Jiménez Torres
-- Proyecto N.° 8: Software de Gestión de Becas y Apoyo Estudiantil Universitario Regional
-- Estudiante: Herledinson Alberto Robledo Suárez
-- Script DDL + DML para MySQL 8.0+ (Mínimo 5 tablas con PK y FK -> 7 tablas creadas)
-- =====================================================================================

DROP DATABASE IF EXISTS becas_uraba_db;
CREATE DATABASE becas_uraba_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE becas_uraba_db;

-- -------------------------------------------------------------------------------------
-- TABLA 1: instituciones
-- Almacena las sedes e instituciones regionales vinculadas al programa de becas.
-- -------------------------------------------------------------------------------------
CREATE TABLE instituciones (
    id_institucion INT AUTO_INCREMENT PRIMARY KEY,
    nit VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    sede VARCHAR(100) NOT NULL,
    municipio VARCHAR(80) NOT NULL,
    codigo_dane_municipio VARCHAR(10) NOT NULL,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -------------------------------------------------------------------------------------
-- TABLA 2: usuarios
-- Almacena las credenciales y roles (ESTUDIANTE, COMITE, ADMINISTRADOR) bajo RBAC.
-- -------------------------------------------------------------------------------------
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(120) NOT NULL,
    correo_institucional VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('ESTUDIANTE', 'COMITE', 'ADMINISTRADOR') NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    etapa_comite_asignada ENUM(
        'VALIDACION_DOCUMENTAL',
        'COMITE_SOCIOECONOMICO',
        'COMITE_FINANCIERO',
        'APROBACION_FINAL',
        'NINGUNA'
    ) NOT NULL DEFAULT 'NINGUNA',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -------------------------------------------------------------------------------------
-- TABLA 3: estudiantes
-- Perfil académico y demográfico del estudiante solicitante (Relación con usuarios e instituciones).
-- -------------------------------------------------------------------------------------
CREATE TABLE estudiantes (
    id_estudiante INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    id_institucion INT NOT NULL,
    documento_identidad VARCHAR(20) NOT NULL UNIQUE,
    telefono VARCHAR(25) NOT NULL,
    municipio_residencia VARCHAR(80) NOT NULL,
    programa_academico VARCHAR(120) NOT NULL,
    semestre_actual INT NOT NULL,
    promedio_acumulado DECIMAL(3, 2) NOT NULL,
    CONSTRAINT fk_estudiante_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_estudiante_institucion
        FOREIGN KEY (id_institucion) REFERENCES instituciones (id_institucion)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------------------------------
-- TABLA 4: solicitudes_beca
-- Entidad central que registra la postulación, variables socioeconómicas y puntaje RF2.
-- -------------------------------------------------------------------------------------
CREATE TABLE solicitudes_beca (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    codigo_radicado VARCHAR(20) NOT NULL UNIQUE,
    id_estudiante INT NOT NULL,
    semestre_convocatoria VARCHAR(15) NOT NULL DEFAULT '2026-II',
    fecha_radicacion DATE NOT NULL,
    ingresos_mensuales_cop DECIMAL(12, 2) NOT NULL,
    numero_dependientes INT NOT NULL DEFAULT 0,
    estrato_socioeconomico INT NOT NULL,
    distancia_campus_km DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    puntaje_vulnerabilidad INT NOT NULL,
    etapa_actual ENUM(
        'VALIDACION_DOCUMENTAL',
        'COMITE_SOCIOECONOMICO',
        'COMITE_FINANCIERO',
        'APROBACION_FINAL'
    ) NOT NULL DEFAULT 'VALIDACION_DOCUMENTAL',
    estado_solicitud ENUM(
        'EN_REVISION',
        'PENDIENTE_DOCS',
        'APROBADA',
        'RECHAZADA'
    ) NOT NULL DEFAULT 'EN_REVISION',
    autorizacion_habeas_data BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_solicitud_estudiante
        FOREIGN KEY (id_estudiante) REFERENCES estudiantes (id_estudiante)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------------------------------
-- TABLA 5: tipos_subsidio_solicitud
-- Relación 1:N con solicitudes_beca (permite solicitar Alimentación, Transporte y/o Matrícula).
-- -------------------------------------------------------------------------------------
CREATE TABLE tipos_subsidio_solicitud (
    id_subsidio_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud INT NOT NULL,
    tipo_subsidio ENUM('ALIMENTACION', 'TRANSPORTE', 'MATRICULA') NOT NULL,
    monto_estimado_cop DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_subsidio_solicitud
        FOREIGN KEY (id_solicitud) REFERENCES solicitudes_beca (id_solicitud)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_solicitud_tipo (id_solicitud, tipo_subsidio)
) ENGINE=InnoDB;

-- -------------------------------------------------------------------------------------
-- TABLA 6: documentos_adjuntos
-- Soportes PDF cargados por el estudiante y validados en la etapa documental.
-- -------------------------------------------------------------------------------------
CREATE TABLE documentos_adjuntos (
    id_documento INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud INT NOT NULL,
    tipo_documento VARCHAR(150) NOT NULL,
    nombre_archivo VARCHAR(200) NOT NULL,
    es_obligatorio BOOLEAN NOT NULL DEFAULT TRUE,
    adjuntado BOOLEAN NOT NULL DEFAULT FALSE,
    estado_validacion BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_carga DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_documento_solicitud
        FOREIGN KEY (id_solicitud) REFERENCES solicitudes_beca (id_solicitud)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------------------------------
-- TABLA 7: registros_auditoria
-- Bitácora inmutable con hash encadenado para cumplimiento de Habeas Data y trazabilidad.
-- -------------------------------------------------------------------------------------
CREATE TABLE registros_auditoria (
    id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud INT NOT NULL,
    id_usuario_actor INT NOT NULL,
    fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    etapa_evaluacion ENUM(
        'VALIDACION_DOCUMENTAL',
        'COMITE_SOCIOECONOMICO',
        'COMITE_FINANCIERO',
        'APROBACION_FINAL'
    ) NOT NULL,
    accion_realizada VARCHAR(150) NOT NULL,
    comentario_dictamen TEXT NOT NULL,
    hash_anterior VARCHAR(64) NOT NULL,
    hash_actual VARCHAR(64) NOT NULL,
    CONSTRAINT fk_auditoria_solicitud
        FOREIGN KEY (id_solicitud) REFERENCES solicitudes_beca (id_solicitud)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_auditoria_usuario
        FOREIGN KEY (id_usuario_actor) REFERENCES usuarios (id_usuario)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================================
-- DATOS SEMILLA INICIALES (DML) PARA VERIFICACIÓN EN MYSQL WORKBENCH
-- =====================================================================================

INSERT INTO instituciones (nit, nombre, sede, municipio, codigo_dane_municipio)
VALUES ('890902922-6', 'Corporación Universitaria Remington', 'Sede Urabá - Apartadó', 'Apartadó', '05045');

INSERT INTO usuarios (nombre_completo, correo_institucional, password_hash, rol, cargo, etapa_comite_asignada)
VALUES
('Yulieth Córdoba Palacios', 'yulieth.cordoba@uniremington.edu.co', 'SHA256_EST_01', 'ESTUDIANTE', 'Estudiante Ingeniería de Sistemas', 'NINGUNA'),
('Edilberto Martínez Úsuga', 'edilberto.martinez@uniremington.edu.co', 'SHA256_EST_02', 'ESTUDIANTE', 'Estudiante Administración de Empresas', 'NINGUNA'),
('Marta Lucía Jiménez Torres', 'marta.jimenez@uniremington.edu.co', 'SHA256_COM_01', 'COMITE', 'Coordinadora Comité Socioeconómico', 'COMITE_SOCIOECONOMICO'),
('Herledinson Alberto Robledo Suárez', 'bienestar.uraba@uniremington.edu.co', 'SHA256_ADM_01', 'ADMINISTRADOR', 'Administrador General del Sistema', 'NINGUNA');

INSERT INTO estudiantes (id_usuario, id_institucion, documento_identidad, telefono, municipio_residencia, programa_academico, semestre_actual, promedio_acumulado)
VALUES
(1, 1, '1027890451', '3124589012', 'Turbo', 'Ingeniería de Sistemas', 6, 4.30),
(2, 1, '1028012394', '3109876543', 'Carepa', 'Administración de Empresas', 4, 3.90);

INSERT INTO solicitudes_beca (codigo_radicado, id_estudiante, semestre_convocatoria, fecha_radicacion, ingresos_mensuales_cop, numero_dependientes, estrato_socioeconomico, distancia_campus_km, puntaje_vulnerabilidad, etapa_actual, estado_solicitud, autorizacion_habeas_data)
VALUES
('BEC-2026-001', 1, '2026-II', '2026-08-12', 650000.00, 3, 1, 32.00, 87, 'APROBACION_FINAL', 'APROBADA', TRUE),
('BEC-2026-002', 2, '2026-II', '2026-08-18', 850000.00, 2, 2, 18.00, 74, 'COMITE_SOCIOECONOMICO', 'EN_REVISION', TRUE);

INSERT INTO tipos_subsidio_solicitud (id_solicitud, tipo_subsidio, monto_estimado_cop)
VALUES
(1, 'ALIMENTACION', 600000.00),
(1, 'TRANSPORTE', 500000.00),
(2, 'MATRICULA', 1400000.00);

INSERT INTO documentos_adjuntos (id_solicitud, tipo_documento, nombre_archivo, es_obligatorio, adjuntado, estado_validacion)
VALUES
(1, 'Copia del documento de identidad', 'cedula_yulieth.pdf', TRUE, TRUE, TRUE),
(1, 'Certificado SISBEN IV', 'sisben_yulieth.pdf', TRUE, TRUE, TRUE),
(1, 'Certificado de matrícula vigente', 'matricula_2026_II.pdf', TRUE, TRUE, TRUE),
(2, 'Copia del documento de identidad', 'cedula_edilberto.pdf', TRUE, TRUE, TRUE);

INSERT INTO registros_auditoria (id_solicitud, id_usuario_actor, etapa_evaluacion, accion_realizada, comentario_dictamen, hash_anterior, hash_actual)
VALUES
(1, 1, 'VALIDACION_DOCUMENTAL', 'Radicación en línea + Habeas Data', 'Solicitud radicada con puntaje 87/100.', '0000000000000000', 'A9F4E218812EF49A'),
(1, 3, 'COMITE_SOCIOECONOMICO', 'Aval Socioeconómico Otorgado', 'Supera umbral regional de vulnerabilidad.', 'A9F4E218812EF49A', 'C7B1049339401B7C');

