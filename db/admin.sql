-- Administradores do painel admin (pasta admin).
--
-- Importação (depois de db/caminho-estrutura.sql):
--   mysql -uroot < db/admin.sql
--
-- Acesso inicial: usuário admin, senha admin (guardada como hash, nunca em texto).
-- Troque a senha antes de publicar o projeto: o painel tem a opção "Alterar senha".

SET NAMES utf8mb4;

USE ecoleta;

CREATE TABLE IF NOT EXISTS administradores (
    id INT NOT NULL AUTO_INCREMENT,
    usuario VARCHAR(50) NOT NULL,
    -- password_hash() do PHP
    senha VARCHAR(255) NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_administradores_usuario (usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Não sobrescreve a senha se o admin já existir.
INSERT IGNORE INTO administradores (usuario, senha) VALUES
('admin', '$2y$12$0b4S3dLjlGur5WnPJPrqHOg8eoOV3cFXQGzHeQW0yWROJ83p.8E6W');
