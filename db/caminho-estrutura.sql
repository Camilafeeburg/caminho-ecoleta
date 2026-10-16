-- Estrutura das rotas dos caminhões de coleta (base: app/caminhao.json).
--
-- Importação (depois de api/database.sql, que cria a tabela usuarios):
--   mysql -uroot < db/caminho-estrutura.sql
--   mysql -uroot < db/caminho-dados.sql
--
-- Consulta da rota de um usuário, em ordem de passagem do caminhão:
--   SELECT * FROM vw_usuario_rota_pontos WHERE UsuarioID = 12 ORDER BY ordem;

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS ecoleta CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE ecoleta;

-- Um registro por caminhão do caminhao.json; o id é o mesmo do arquivo.
CREATE TABLE IF NOT EXISTS rotas (
    id INT NOT NULL,
    -- Descrição exibida no app (ex.: "São Geraldo / Humaitá")
    descricao VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    cidade VARCHAR(120) NOT NULL DEFAULT 'Porto Alegre',
    uf CHAR(2) NOT NULL DEFAULT 'RS',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Bairros atendidos por cada rota (a descrição "São Geraldo / Humaitá" vira duas linhas).
CREATE TABLE IF NOT EXISTS rota_bairros (
    rota_id INT NOT NULL,
    bairro VARCHAR(120) NOT NULL,
    PRIMARY KEY (rota_id, bairro),
    KEY idx_rota_bairros_bairro (bairro),
    CONSTRAINT fk_rota_bairros_rota FOREIGN KEY (rota_id) REFERENCES rotas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Pontos do trajeto, na ordem em que o caminhão passa.
CREATE TABLE IF NOT EXISTS rota_pontos (
    id INT NOT NULL AUTO_INCREMENT,
    rota_id INT NOT NULL,
    ordem SMALLINT NOT NULL,
    rua VARCHAR(200) NOT NULL,
    -- Preenchido quando o ponto é um endereço com número (ex.: "Rua Mostardeiro, 820")
    numero VARCHAR(10) NULL,
    -- Só números, como usuarios.CEP (ex.: 90240005)
    cep CHAR(8) NULL,
    -- Nulas quando a rua não foi localizada no mapa
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_rota_pontos_ordem (rota_id, ordem),
    KEY idx_rota_pontos_cep (cep),
    KEY idx_rota_pontos_rua (rua),
    CONSTRAINT fk_rota_pontos_rota FOREIGN KEY (rota_id) REFERENCES rotas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Rota de cada usuário, a partir do CEP e do endereço cadastrados em usuarios.
-- Critérios, do mais forte para o mais fraco (vale o primeiro que encontrar uma rota):
--   1. cep         - o CEP do usuário é o CEP de um ponto da rota
--   2. logradouro  - a rua do usuário é uma rua da rota (na mesma cidade)
--   3. bairro      - o bairro do usuário é atendido pela rota
--   4. regiao_cep  - os 5 primeiros dígitos do CEP coincidem com os de um ponto da rota
-- Empate no mesmo critério: prefere a rota que atende o bairro do usuário, depois o menor id.
-- ordem_ponto: nos critérios cep e logradouro, o ponto da rota que é o endereço do usuário (o primeiro,
-- se a rua aparece mais de uma vez); é onde o trajeto do usuário termina. Nos outros critérios, NULL.
-- A collation utf8mb4_general_ci ignora acentos e maiúsculas ("Humaita" = "Humaitá").
-- Usuários sem nenhuma rota correspondente não aparecem na view.
CREATE OR REPLACE VIEW vw_usuario_rota AS
WITH enderecos AS (
    SELECT
        UsuarioID,
        REPLACE(CEP, '-', '') AS cep,
        NULLIF(TRIM(Bairro), '') AS bairro,
        NULLIF(TRIM(Cidade), '') AS cidade,
        -- Rua sem o número: "Av. José Aloisio Filho, 1185" -> "Av. José Aloisio Filho"
        NULLIF(TRIM(SUBSTRING_INDEX(Logradouro, ',', 1)), '') AS logradouro
    FROM usuarios
),
usuarios_normalizados AS (
    SELECT
        UsuarioID, cep, bairro, cidade,
        -- Abreviações comuns, para comparar com os nomes por extenso do catálogo
        CASE
            WHEN logradouro LIKE 'Av. %' THEN CONCAT('Avenida ', TRIM(SUBSTRING(logradouro, 4)))
            WHEN logradouro LIKE 'R. %' THEN CONCAT('Rua ', TRIM(SUBSTRING(logradouro, 3)))
            WHEN logradouro LIKE 'Tv. %' THEN CONCAT('Travessa ', TRIM(SUBSTRING(logradouro, 4)))
            WHEN logradouro LIKE 'Al. %' THEN CONCAT('Alameda ', TRIM(SUBSTRING(logradouro, 4)))
            WHEN logradouro LIKE 'Pç. %' THEN CONCAT('Praça ', TRIM(SUBSTRING(logradouro, 4)))
            WHEN logradouro LIKE 'Pça. %' THEN CONCAT('Praça ', TRIM(SUBSTRING(logradouro, 5)))
            ELSE logradouro
        END AS rua
    FROM enderecos
),
candidatos AS (
    SELECT DISTINCT u.UsuarioID, u.bairro, p.rota_id, 1 AS prioridade, 'cep' AS criterio, p.ordem AS ordem_ponto
    FROM usuarios_normalizados u
    JOIN rota_pontos p ON p.cep = u.cep

    UNION ALL

    SELECT DISTINCT u.UsuarioID, u.bairro, p.rota_id, 2, 'logradouro', p.ordem
    FROM usuarios_normalizados u
    JOIN rotas r ON r.cidade = u.cidade
    JOIN rota_pontos p ON p.rota_id = r.id AND p.rua = u.rua

    UNION ALL

    SELECT u.UsuarioID, u.bairro, b.rota_id, 3, 'bairro', NULL
    FROM usuarios_normalizados u
    JOIN rota_bairros b ON b.bairro = u.bairro
    JOIN rotas r ON r.id = b.rota_id AND r.cidade = u.cidade

    UNION ALL

    SELECT DISTINCT u.UsuarioID, u.bairro, p.rota_id, 4, 'regiao_cep', NULL
    FROM usuarios_normalizados u
    JOIN rota_pontos p ON LEFT(p.cep, 5) = LEFT(u.cep, 5)
    WHERE CHAR_LENGTH(u.cep) = 8
),
classificados AS (
    SELECT
        c.UsuarioID, c.rota_id, c.criterio, c.ordem_ponto,
        ROW_NUMBER() OVER (
            PARTITION BY c.UsuarioID
            ORDER BY
                c.prioridade,
                EXISTS (SELECT 1 FROM rota_bairros b WHERE b.rota_id = c.rota_id AND b.bairro = c.bairro) DESC,
                c.rota_id,
                c.ordem_ponto
        ) AS posicao
    FROM candidatos c
)
SELECT UsuarioID, rota_id, criterio, ordem_ponto
FROM classificados
WHERE posicao = 1;

-- Rota completa do usuário: dados do caminhão e pontos do trajeto.
CREATE OR REPLACE VIEW vw_usuario_rota_pontos AS
SELECT
    ur.UsuarioID,
    ur.criterio,
    ur.ordem_ponto AS ordem_ponto_usuario,
    r.id AS rota_id,
    r.descricao,
    r.tipo,
    r.horario_inicio,
    r.horario_fim,
    p.ordem,
    p.rua,
    p.numero,
    p.cep,
    p.latitude,
    p.longitude
FROM vw_usuario_rota ur
JOIN rotas r ON r.id = ur.rota_id
JOIN rota_pontos p ON p.rota_id = r.id;
