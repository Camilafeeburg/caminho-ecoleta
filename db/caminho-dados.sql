-- Dados das rotas dos caminhões, gerados a partir de app/caminhao.json.
--
-- Importe depois de db/caminho-estrutura.sql:
--   mysql -uroot < db/caminho-dados.sql
--
-- Pode ser importado de novo: apaga as rotas atuais e grava as do arquivo.
-- Coordenadas nulas: ruas que não foram localizadas no mapa.

SET NAMES utf8mb4;

USE ecoleta;

START TRANSACTION;

DELETE FROM rota_pontos;
DELETE FROM rota_bairros;
DELETE FROM rotas;

INSERT INTO rotas (id, descricao, tipo, horario_inicio, horario_fim, cidade, uf) VALUES
(1, 'São Geraldo / Humaitá', 'Coleta Seletiva', '18:00:00', '21:00:00', 'Porto Alegre', 'RS'),
(2, 'Moinhos de Vento', 'Coleta Seletiva', '18:00:00', '21:00:00', 'Porto Alegre', 'RS'),
(3, 'Centro Histórico / Farroupilha', 'Coleta Seletiva', '18:00:00', '21:00:00', 'Porto Alegre', 'RS'),
(4, 'Higienópolis / Cristo Redentor', 'Coleta Seletiva', '18:00:00', '21:00:00', 'Porto Alegre', 'RS');

INSERT INTO rota_bairros (rota_id, bairro) VALUES
(1, 'São Geraldo'),
(1, 'Humaitá'),
(2, 'Moinhos de Vento'),
(3, 'Centro Histórico'),
(3, 'Farroupilha'),
(4, 'Higienópolis'),
(4, 'Cristo Redentor');

INSERT INTO rota_pontos (rota_id, ordem, rua, numero, cep, latitude, longitude) VALUES
(1, 1, 'Rua São Pedro', NULL, '90240005', -30.010539, -51.201981),
(1, 2, 'Avenida Pernambuco', NULL, '90240000', -29.998482, -51.196729),
(1, 3, 'Rua Dona Margarida', NULL, '90240610', -29.998955, -51.197514),
(1, 4, 'Avenida A. J. Renner', NULL, '90245000', -29.991892, -51.195803),
(1, 5, 'Rua Monsenhor Felipe Diehl', NULL, '90250000', -29.995687, -51.196586),
(1, 6, 'Rua Simão Kappel', NULL, '90240210', -29.993556, -51.198431),
(1, 7, 'Rua São Jorge', NULL, '90240550', -29.994343, -51.200892),
(1, 8, 'Rua Frederico Mentz', NULL, '90240110', -29.99073, -51.200409),
(1, 9, 'Rua General Marcos Kruchin', NULL, '90240000', -29.985335, -51.196355),
(1, 10, 'Avenida A. J. Renner', NULL, '90250000', -29.986351, -51.193917),
(1, 11, 'Rua Padre Maximiliano Kolbe', NULL, '90250210', -29.982018, -51.191243),
(1, 12, 'Avenida Palmira Gobbi', NULL, '90250210', -29.987012, -51.191732),
(2, 1, 'Rua Voluntários da Pátria', NULL, '90230010', -30.009653, -51.209913),
(2, 2, 'Rua Comendador Álvaro Guaspari', NULL, '90035020', -30.023231, -51.21674),
(2, 3, 'Rua João Adão Pacheco Dornelles', NULL, '90035024', NULL, NULL),
(2, 4, 'Rua Walmor Paulo Sauter', NULL, '90035022', NULL, NULL),
(2, 5, 'Rua Santo Antônio', NULL, '90220010', -30.031428, -51.214209),
(2, 6, 'Rua Irmão José Otão', NULL, NULL, -30.031144, -51.21455),
(2, 7, 'Rua Vasco da Gama', NULL, NULL, -30.032183, -51.20683),
(2, 8, 'Rua Mariante', NULL, NULL, -30.02815, -51.204399),
(2, 9, 'Avenida Goethe', NULL, NULL, -30.025058, -51.200375),
(2, 10, 'Rua Mostardeiro', NULL, NULL, -30.028738, -51.205095),
(2, 11, 'Rua Mostardeiro', '820', '90010380', -30.028598, -51.198825),
(3, 1, 'Rua dos Andradas', NULL, '90020000', -30.032754, -51.238029),
(3, 2, 'Avenida Borges de Medeiros', NULL, '90020020', -30.033737, -51.227975),
(3, 3, 'Praça Dom Feliciano', NULL, '90020160', -30.02987, -51.223129),
(3, 4, 'Avenida Independência', NULL, NULL, -30.029602, -51.221763),
(3, 5, 'Avenida Osvaldo Aranha', NULL, NULL, -30.032543, -51.219882),
(3, 6, 'Avenida José Bonifácio', NULL, NULL, -30.039449, -51.215784),
(3, 7, 'Rua Santana', NULL, NULL, -30.039317, -51.214228),
(3, 8, 'Rua Vieira de Castro', '215', '90040320', -30.039594, -51.212137),
(4, 1, 'Rua Dom Pedro II', NULL, '90560002', -30.015958, -51.186729),
(4, 2, 'Avenida Cristóvão Colombo', NULL, '90560003', -30.016996, -51.182407),
(4, 3, 'Travessa São Jacó', NULL, NULL, -30.015718, -51.181835),
(4, 4, 'Rua Doutor Eduardo Chartier', NULL, NULL, -30.013967, -51.180493),
(4, 5, 'Rua Ari Marinho', NULL, NULL, -30.013254, -51.179584),
(4, 6, 'Rua Marechal José Inácio da Silva', NULL, NULL, -30.014177, -51.178511),
(4, 7, 'Rua Pistóia', NULL, NULL, -30.011872, -51.176505),
(4, 8, 'Avenida Brasiliano Índio de Moraes', NULL, NULL, -30.011554, -51.173397),
(4, 9, 'Avenida Assis Brasil', NULL, NULL, -30.011771, -51.167662),
(4, 10, 'Avenida do Forte', '290', '91360000', -30.01092, -51.153251);

COMMIT;
