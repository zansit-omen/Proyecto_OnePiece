-- =====================================================================
-- Módulo de avistamientos y reportes ciudadanos
-- Requiere que exista la tabla criminales(id_criminal).
-- Si todavía no la tienes, descomenta el bloque de abajo (solo pruebas).
-- =====================================================================
-- CREATE TABLE IF NOT EXISTS criminales (
--   id_criminal INT AUTO_INCREMENT PRIMARY KEY,
--   nombre VARCHAR(120) NOT NULL
-- );

-- Reportes enviados por ciudadanos o informantes (RF15)
CREATE TABLE IF NOT EXISTS reportes_ciudadanos (
  id_reporte         INT AUTO_INCREMENT PRIMARY KEY,
  id_criminal        INT NOT NULL,
  nombre_informante  VARCHAR(120) NOT NULL,
  contacto           VARCHAR(120) NULL,
  fecha_avistamiento DATETIME NOT NULL,
  zona               VARCHAR(120) NOT NULL,
  ubicacion          VARCHAR(255) NOT NULL,
  descripcion        TEXT NULL,
  estado             ENUM('PENDIENTE','VERIFICADO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
  fecha_reporte      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_revision     DATETIME NULL,
  revisado_por       VARCHAR(120) NULL,
  motivo_rechazo     VARCHAR(255) NULL,
  id_avistamiento    INT NULL,
  CONSTRAINT fk_reporte_criminal FOREIGN KEY (id_criminal) REFERENCES criminales(id_criminal),
  INDEX idx_reporte_estado (estado),
  INDEX idx_reporte_criminal (id_criminal)
);

-- Avistamientos oficiales (RF14, RF16, RF17)
CREATE TABLE IF NOT EXISTS avistamientos (
  id_avistamiento     INT AUTO_INCREMENT PRIMARY KEY,
  id_criminal         INT NOT NULL,
  fecha_avistamiento  DATETIME NOT NULL,
  zona                VARCHAR(120) NOT NULL,
  ubicacion           VARCHAR(255) NOT NULL,
  testigo             VARCHAR(120) NOT NULL,
  descripcion         TEXT NULL,
  estado_verificacion ENUM('SIN_VERIFICAR','VERIFICADO','DESCARTADO') NOT NULL DEFAULT 'SIN_VERIFICAR',
  origen              ENUM('REGISTRO_DIRECTO','REPORTE_CIUDADANO') NOT NULL DEFAULT 'REGISTRO_DIRECTO',
  id_reporte          INT NULL,
  fecha_registro      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_avist_criminal FOREIGN KEY (id_criminal) REFERENCES criminales(id_criminal),
  CONSTRAINT fk_avist_reporte  FOREIGN KEY (id_reporte)  REFERENCES reportes_ciudadanos(id_reporte),
  INDEX idx_avist_criminal (id_criminal),
  INDEX idx_avist_zona (zona),
  INDEX idx_avist_fecha (fecha_avistamiento),
  INDEX idx_avist_estado (estado_verificacion)
);

ALTER TABLE reportes_ciudadanos
  ADD CONSTRAINT fk_reporte_avistamiento
  FOREIGN KEY (id_avistamiento) REFERENCES avistamientos(id_avistamiento);
