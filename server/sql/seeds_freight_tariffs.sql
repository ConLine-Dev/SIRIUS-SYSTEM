-- =====================================================================
-- SEED SCRIPT PARA O MÓDULO FREIGHT TARIFFS
-- Este script popula as tabelas de apoio com dados iniciais.
-- Ele é projetado para ser executado múltiplas vezes sem causar erros.
-- =====================================================================

-- Limpa os dados existentes para evitar duplicatas e reseta os contadores de ID (autoincrement)
-- Desabilita a verificação de chaves estrangeiras para permitir o TRUNCATE em qualquer ordem.
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE ft_tariffs_surcharges;
TRUNCATE TABLE ft_tariffs;
TRUNCATE TABLE ft_container_types;
TRUNCATE TABLE ft_locations;
TRUNCATE TABLE ft_agents;
TRUNCATE TABLE ft_modalities;
TRUNCATE TABLE ft_currencies;

-- Reabilita a verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- 1. MODALIDADES (ft_modalities)
-- =====================================================================
INSERT INTO ft_modalities (id, name, description) VALUES
(1, 'Marítimo', 'Transporte via navios.'),
(2, 'Aéreo', 'Transporte via aeronaves.'),
(3, 'Rodoviário', 'Transporte via caminhões e estradas.'),
(4, 'Ferroviário', 'Transporte via trens e ferrovias.');

-- =====================================================================
-- 2. AGENTES / ARMADORES (ft_agents)
-- =====================================================================
INSERT INTO ft_agents (name, contact_person, contact_email) VALUES
('Maersk Line', 'Ana Silva', 'contato@br.maersk.com'),
('MSC (Mediterranean Shipping Co.)', 'Bruno Costa', 'contato@msc.com'),
('CMA CGM', 'Carla Dias', 'contato@cma-cgm.com'),
('COSCO Shipping Lines', 'Daniel Evans', 'contato@coscoshipping.com'),
('Hapag-Lloyd', 'Eduarda Lima', 'contato@hlag.com'),
('ONE (Ocean Network Express)', 'Fabio Rocha', 'contato@one-line.com'),
('Evergreen Line', 'Gabriela Martins', 'contato@evergreen-marine.com'),
('HMM (Hyundai Merchant Marine)', 'Heitor Souza', 'contato@hmm21.com'),
('Yang Ming Marine Transport', 'Isabela Castro', 'contato@yangming.com'),
('ZIM Integrated Shipping', 'João Almeida', 'contato@zim.com');

-- =====================================================================
-- 3. TIPOS DE CONTAINER (ft_container_types)
-- =====================================================================
-- Nota: 'applicable_modalities' refere-se aos IDs da tabela ft_modalities.
-- 1: Marítimo, 2: Aéreo, 3: Rodoviário, 4: Ferroviário
INSERT INTO ft_container_types (name, applicable_modalities) VALUES
('20'' Standard Dry Van (DV)', '1,3,4'),
('40'' Standard Dry Van (DV)', '1,3,4'),
('40'' High Cube (HC)', '1,3,4'),
('20'' Reefer (RF)', '1,3,4'),
('40'' High Cube Reefer (HCRF)', '1,3,4'),
('20'' Open Top (OT)', '1,3,4'),
('40'' Open Top (OT)', '1,3,4'),
('20'' Flat Rack (FR)', '1,3,4'),
('40'' Flat Rack (FR)', '1,3,4'),
('LCL (Less than Container Load)', '1'),
('Carga Aérea Geral', '2'),
('Carga Solta (Bulk)', '1,3');


-- =====================================================================
-- 4. LOCALIZAÇÕES / PORTOS (ft_locations)
-- =====================================================================
INSERT INTO ft_locations (name, type) VALUES
-- Portos da América do Sul
('Porto de Santos, Brasil', 'Ambos'),
('Porto de Paranaguá, Brasil', 'Ambos'),
('Porto de Itajaí, Brasil', 'Ambos'),
('Porto de Itapoá, Brasil', 'Ambos'),
('Porto de Rio Grande, Brasil', 'Ambos'),
('Porto de Suape, Brasil', 'Ambos'),
('Porto do Rio de Janeiro, Brasil', 'Ambos'),
('Porto de Salvador, Brasil', 'Ambos'),
('Porto de Pecém, Brasil', 'Ambos'),
('Porto de Manaus, Brasil', 'Ambos'),
('Porto de Vitória, Brasil', 'Ambos'),
('Porto de Buenos Aires, Argentina', 'Ambos'),
('Porto de Bahía Blanca, Argentina', 'Ambos'),
('Porto de Rosário, Argentina', 'Ambos'),
('Porto de Ushuaia, Argentina', 'Ambos'),
('Porto de Callao, Peru', 'Ambos'),
('Porto de Matarani, Peru', 'Ambos'),
('Porto de Paita, Peru', 'Ambos'),
('Porto de San Antonio, Chile', 'Ambos'),
('Porto de Valparaíso, Chile', 'Ambos'),
('Porto de Arica, Chile', 'Ambos'),
('Porto de Iquique, Chile', 'Ambos'),
('Porto de Antofagasta, Chile', 'Ambos'),
('Porto de Guayaquil, Equador', 'Ambos'),
('Porto de Manta, Equador', 'Ambos'),
('Porto de Esmeraldas, Equador', 'Ambos'),
('Porto de Cartagena, Colômbia', 'Ambos'),
('Porto de Barranquilla, Colômbia', 'Ambos'),
('Porto de Buenaventura, Colômbia', 'Ambos'),
('Porto de Montevidéu, Uruguai', 'Ambos'),
('Porto de La Guaira, Venezuela', 'Ambos'),
('Porto de Puerto Cabello, Venezuela', 'Ambos'),
('Porto de Paramaribo, Suriname', 'Ambos'),
('Porto de Georgetown, Guiana', 'Ambos'),

-- Portos da América do Norte
('Porto de Los Angeles, EUA', 'Ambos'),
('Porto de Long Beach, EUA', 'Ambos'),
('Porto de Nova York e Nova Jersey, EUA', 'Ambos'),
('Porto de Savannah, EUA', 'Ambos'),
('Porto de Houston, EUA', 'Ambos'),
('Porto de Oakland, EUA', 'Ambos'),
('Porto de Miami, EUA', 'Ambos'),
('Porto de Charleston, EUA', 'Ambos'),
('Porto de Seattle, EUA', 'Ambos'),
('Porto de Tacoma, EUA', 'Ambos'),
('Porto de Baltimore, EUA', 'Ambos'),
('Porto de New Orleans, EUA', 'Ambos'),
('Porto de Vancouver, Canadá', 'Ambos'),
('Porto de Montreal, Canadá', 'Ambos'),
('Porto de Halifax, Canadá', 'Ambos'),
('Porto de Prince Rupert, Canadá', 'Ambos'),
('Porto de Manzanillo, México', 'Ambos'),
('Porto de Veracruz, México', 'Ambos'),
('Porto de Lázaro Cárdenas, México', 'Ambos'),
('Porto de Altamira, México', 'Ambos'),
('Porto de Colón, Panamá', 'Ambos'),
('Porto de Balboa, Panamá', 'Ambos'),
('Porto de Kingston, Jamaica', 'Ambos'),
('Porto de Freeport, Bahamas', 'Ambos'),

-- Portos da Ásia
('Porto de Shanghai, China', 'Ambos'),
('Porto de Ningbo-Zhoushan, China', 'Ambos'),
('Porto de Shenzhen, China', 'Ambos'),
('Porto de Guangzhou, China', 'Ambos'),
('Porto de Qingdao, China', 'Ambos'),
('Porto de Tianjin, China', 'Ambos'),
('Porto de Xiamen, China', 'Ambos'),
('Porto de Dalian, China', 'Ambos'),
('Porto de Hong Kong, Hong Kong', 'Ambos'),
('Porto de Singapura, Singapura', 'Ambos'),
('Porto de Busan, Coreia do Sul', 'Ambos'),
('Porto de Gwangyang, Coreia do Sul', 'Ambos'),
('Porto de Incheon, Coreia do Sul', 'Ambos'),
('Porto de Tóquio, Japão', 'Ambos'),
('Porto de Yokohama, Japão', 'Ambos'),
('Porto de Nagoya, Japão', 'Ambos'),
('Porto de Kobe, Japão', 'Ambos'),
('Porto de Osaka, Japão', 'Ambos'),
('Porto de Kaohsiung, Taiwan', 'Ambos'),
('Porto de Keelung, Taiwan', 'Ambos'),
('Porto de Taichung, Taiwan', 'Ambos'),
('Porto de Laem Chabang, Tailândia', 'Ambos'),
('Porto de Bangkok, Tailândia', 'Ambos'),
('Porto de Port Klang, Malásia', 'Ambos'),
('Porto de Tanjung Pelepas, Malásia', 'Ambos'),
('Porto de Ho Chi Minh (Saigon), Vietnã', 'Ambos'),
('Porto de Haiphong, Vietnã', 'Ambos'),
('Porto de Cai Mep, Vietnã', 'Ambos'),
('Porto de Tanjung Priok (Jacarta), Indonésia', 'Ambos'),
('Porto de Surabaya, Indonésia', 'Ambos'),
('Porto de Manila, Filipinas', 'Ambos'),
('Porto de Cebu, Filipinas', 'Ambos'),
('Porto de Jebel Ali (Dubai), EAU', 'Ambos'),
('Porto de Abu Dhabi (Khalifa), EAU', 'Ambos'),
('Porto de Sharjah, EAU', 'Ambos'),
('Porto de Jeddah, Arábia Saudita', 'Ambos'),
('Porto de Dammam, Arábia Saudita', 'Ambos'),
('Porto de Salalah, Omã', 'Ambos'),
('Porto de Doha (Hamad), Catar', 'Ambos'),
('Porto de Colombo, Sri Lanka', 'Ambos'),
('Porto de Nhava Sheva (Mumbai), Índia', 'Ambos'),
('Porto de Mundra, Índia', 'Ambos'),
('Porto de Chennai, Índia', 'Ambos'),
('Porto de Kolkata, Índia', 'Ambos'),
('Porto de Karachi, Paquistão', 'Ambos'),

-- Portos da Europa
('Porto de Rotterdam, Holanda', 'Ambos'),
('Porto de Antuérpia, Bélgica', 'Ambos'),
('Porto de Hamburgo, Alemanha', 'Ambos'),
('Porto de Bremerhaven, Alemanha', 'Ambos'),
('Porto de Wilhelmshaven, Alemanha', 'Ambos'),
('Porto de Le Havre, França', 'Ambos'),
('Porto de Marselha-Fos, França', 'Ambos'),
('Porto de Dunkerque, França', 'Ambos'),
('Porto de Valência, Espanha', 'Ambos'),
('Porto de Algeciras, Espanha', 'Ambos'),
('Porto de Barcelona, Espanha', 'Ambos'),
('Porto de Bilbao, Espanha', 'Ambos'),
('Porto de Felixstowe, Reino Unido', 'Ambos'),
('Porto de Southampton, Reino Unido', 'Ambos'),
('Porto de Londres, Reino Unido', 'Ambos'),
('Porto de Liverpool, Reino Unido', 'Ambos'),
('Porto de Gioia Tauro, Itália', 'Ambos'),
('Porto de Gênova, Itália', 'Ambos'),
('Porto de La Spezia, Itália', 'Ambos'),
('Porto de Pireu, Grécia', 'Ambos'),
('Porto de Tessalônica, Grécia', 'Ambos'),
('Porto de Istambul (Ambarli), Turquia', 'Ambos'),
('Porto de Mersin, Turquia', 'Ambos'),
('Porto de Gdansk, Polônia', 'Ambos'),
('Porto de Gotemburgo, Suécia', 'Ambos'),
('Porto de Aarhus, Dinamarca', 'Ambos'),
('Porto de Copenhague, Dinamarca', 'Ambos'),
('Porto de Oslo, Noruega', 'Ambos'),
('Porto de Helsinque, Finlândia', 'Ambos'),
('Porto de São Petersburgo, Rússia', 'Ambos'),
('Porto de Novorossiysk, Rússia', 'Ambos'),
('Porto de Dublin, Irlanda', 'Ambos'),
('Porto de Lisboa, Portugal', 'Ambos'),
('Porto de Sines, Portugal', 'Ambos'),
('Porto de Constança, Romênia', 'Ambos'),

-- Portos da África
('Porto de Durban, África do Sul', 'Ambos'),
('Porto de Cape Town, África do Sul', 'Ambos'),
('Porto de Port Elizabeth, África do Sul', 'Ambos'),
('Porto de Richards Bay, África do Sul', 'Ambos'),
('Porto de Lagos (Apapa), Nigéria', 'Ambos'),
('Porto de Tema, Gana', 'Ambos'),
('Porto de Abidjan, Costa do Marfim', 'Ambos'),
('Porto de Dakar, Senegal', 'Ambos'),
('Porto de Lomé, Togo', 'Ambos'),
('Porto de Cotonou, Benin', 'Ambos'),
('Porto de Mombasa, Quênia', 'Ambos'),
('Porto de Dar es Salaam, Tanzânia', 'Ambos'),
('Porto de Luanda, Angola', 'Ambos'),
('Porto de Walvis Bay, Namíbia', 'Ambos'),
('Porto de Maputo, Moçambique', 'Ambos'),
('Porto de Beira, Moçambique', 'Ambos'),
('Porto de Djibouti, Djibouti', 'Ambos'),
('Porto de Port Sudan, Sudão', 'Ambos'),
('Porto de Alexandria, Egito', 'Ambos'),
('Porto de Port Said, Egito', 'Ambos'),
('Porto de Damietta, Egito', 'Ambos'),
('Porto de Tânger Med, Marrocos', 'Ambos'),
('Porto de Casablanca, Marrocos', 'Ambos'),
('Porto de Argel, Argélia', 'Ambos'),
('Porto de Túnis, Tunísia', 'Ambos'),

-- Portos da Oceania
('Porto de Melbourne, Austrália', 'Ambos'),
('Porto de Sydney, Austrália', 'Ambos'),
('Porto de Brisbane, Austrália', 'Ambos'),
('Porto de Fremantle (Perth), Austrália', 'Ambos'),
('Porto de Adelaide, Austrália', 'Ambos'),
('Porto de Auckland, Nova Zelândia', 'Ambos'),
('Porto de Tauranga, Nova Zelândia', 'Ambos'),
('Porto de Lyttelton, Nova Zelândia', 'Ambos'),
('Porto de Suva, Fiji', 'Ambos'),
('Porto de Port Moresby, Papua-Nova Guiné', 'Ambos');

-- =====================================================================
-- 5. MOEDAS (ft_currencies)
-- =====================================================================
INSERT INTO ft_currencies (code, name, symbol) VALUES
('USD', 'Dólar Americano', '$'),
('EUR', 'Euro', '€'),
('BRL', 'Real Brasileiro', 'R$'),
('JPY', 'Iene Japonês', '¥'),
('GBP', 'Libra Esterlina', '£'),
('CNY', 'Yuan Chinês', 'CN¥'),
('AED', 'Dirham dos Emirados Árabes Unidos', 'AED'),
('AFN', 'Afegane Afegão', 'Af'),
('ALL', 'Lek Albanês', 'ALL'),
('AMD', 'Dram Armênio', 'AMD'),
('ARS', 'Peso Argentino', 'AR$'),
('AUD', 'Dólar Australiano', 'AU$'),
('AZN', 'Manat Azerbaijano', 'man.'),
('BAM', 'Marco Conversível da Bósnia e Herzegovina', 'KM'),
('BDT', 'Taka de Bangladesh', 'Tk'),
('BGN', 'Lev Búlgaro', 'BGN'),
('BHD', 'Dinar Bareinita', 'BD'),
('BIF', 'Franco Burundiano', 'FBu'),
('BND', 'Dólar de Brunei', 'BN$'),
('BOB', 'Boliviano', 'Bs'),
('BWP', 'Pula de Botswana', 'BWP'),
('BYN', 'Rublo Bielorrusso', 'Br'),
('BZD', 'Dólar de Belize', 'BZ$'),
('CAD', 'Dólar Canadense', 'CA$'),
('CDF', 'Franco Congolês', 'CDF'),
('CHF', 'Franco Suíço', 'CHF'),
('CLP', 'Peso Chileno', 'CL$'),
('COP', 'Peso Colombiano', 'CO$'),
('CRC', 'Colón Costarriquenho', '₡'),
('CVE', 'Escudo Cabo-Verdiano', 'CV$'),
('CZK', 'Coroa Checa', 'Kč'),
('DJF', 'Franco Djibutiano', 'Fdj'),
('DKK', 'Coroa Dinamarquesa', 'Dkr'),
('DOP', 'Peso Dominicano', 'RD$'),
('DZD', 'Dinar Argelino', 'DA'),
('EGP', 'Libra Egípcia', 'EGP'),
('ERN', 'Nakfa Eritreia', 'Nfk'),
('ETB', 'Birr Etíope', 'Br'),
('GEL', 'Lari Georgiano', 'GEL'),
('GHS', 'Cedi Ganês', 'GH₵'),
('GNF', 'Franco Guineense', 'FG'),
('GTQ', 'Quetzal Guatemalteco', 'GTQ'),
('HKD', 'Dólar de Hong Kong', 'HK$'),
('HNL', 'Lempira Hondurenha', 'HNL'),
('HUF', 'Forint Húngaro', 'Ft'),
('IDR', 'Rupia Indonésia', 'Rp'),
('ILS', 'Novo Shekel Israelense', '₪'),
('INR', 'Rupia Indiana', 'Rs'),
('IQD', 'Dinar Iraquiano', 'IQD'),
('IRR', 'Rial Iraniano', 'IRR'),
('ISK', 'Coroa Islandesa', 'Ikr'),
('JMD', 'Dólar Jamaicano', 'J$'),
('JOD', 'Dinar Jordaniano', 'JD'),
('KES', 'Xelim Queniano', 'Ksh'),
('KHR', 'Riel Cambojano', 'KHR'),
('KMF', 'Franco Comoriano', 'CF'),
('KRW', 'Won Sul-Coreano', '₩'),
('KWD', 'Dinar Kuwaitiano', 'KD'),
('KZT', 'Tenge Cazaque', 'KZT'),
('LBP', 'Libra Libanesa', 'L.L.'),
('LKR', 'Rupia do Sri Lanka', 'SLRs'),
('LYD', 'Dinar Líbio', 'LD'),
('MAD', 'Dirham Marroquino', 'MAD'),
('MDL', 'Leu Moldavo', 'MDL'),
('MGA', 'Ariary Malgaxe', 'MGA'),
('MKD', 'Dinar Macedônio', 'MKD'),
('MMK', 'Kyat de Mianmar', 'MMK'),
('MOP', 'Pataca de Macau', 'MOP$'),
('MUR', 'Rupia Mauriciana', 'MURs'),
('MXN', 'Peso Mexicano', 'MX$'),
('MYR', 'Ringgit Malaio', 'RM'),
('MZN', 'Metical Moçambicano', 'MTn'),
('NAD', 'Dólar Namibiano', 'N$'),
('NGN', 'Naira Nigeriana', '₦'),
('NIO', 'Córdoba Nicaraguense', 'C$'),
('NOK', 'Coroa Norueguesa', 'Nkr'),
('NPR', 'Rupia Nepalesa', 'NPRs'),
('NZD', 'Dólar da Nova Zelândia', 'NZ$'),
('OMR', 'Rial Omani', 'OMR'),
('PAB', 'Balboa Panamenho', 'B/.'),
('PEN', 'Sol Peruano', 'S/.'),
('PHP', 'Peso Filipino', '₱'),
('PKR', 'Rupia Paquistanesa', 'PKRs'),
('PLN', 'Zloty Polonês', 'zł'),
('PYG', 'Guarani Paraguaio', '₲'),
('QAR', 'Rial Catariano', 'QR'),
('RON', 'Leu Romeno', 'RON'),
('RSD', 'Dinar Sérvio', 'din.'),
('RUB', 'Rublo Russo', 'RUB'),
('RWF', 'Franco Ruandês', 'RWF'),
('SAR', 'Riyal Saudita', 'SR'),
('SDG', 'Libra Sudanesa', 'SDG'),
('SEK', 'Coroa Sueca', 'Skr'),
('SGD', 'Dólar de Cingapura', 'S$'),
('SOS', 'Xelim Somali', 'Ssh'),
('SYP', 'Libra Síria', 'SY£'),
('THB', 'Baht Tailandês', '฿'),
('TND', 'Dinar Tunisiano', 'DT'),
('TOP', 'Pa''anga Tonganesa', 'T$'),
('TRY', 'Lira Turca', 'TL'),
('TTD', 'Dólar de Trinidad e Tobago', 'TT$'),
('TWD', 'Novo Dólar de Taiwan', 'NT$'),
('TZS', 'Xelim Tanzaniano', 'TSh'),
('UAH', 'Hryvnia Ucraniano', '₴'),
('UGX', 'Xelim Ugandense', 'USh'),
('UYU', 'Peso Uruguaio', '$U'),
('UZS', 'Som Uzbeque', 'UZS'),
('VEF', 'Bolívar Venezuelano', 'Bs.F.'),
('VND', 'Dong Vietnamita', '₫'),
('XAF', 'Franco CFA de BEAC', 'FCFA'),
('XOF', 'Franco CFA de BCEAO', 'CFA'),
('YER', 'Rial Iemenita', 'YR'),
('ZAR', 'Rand Sul-Africano', 'R'),
('ZMK', 'Kwacha Zambiano', 'ZK');

-- =====================================================================
-- 6. TARIFAS DE EXEMPLO (ft_tariffs)
-- =====================================================================
-- Tarifa 1: Marítimo, 20' DV, Santos -> Shanghai, com Maersk
INSERT INTO ft_tariffs (id, origin_id, destination_id, modality_id, container_type_id, agent_id, validity_start_date, validity_end_date, freight_cost, freight_currency, transit_time, route_type)
VALUES (1, 
    (SELECT id FROM ft_locations WHERE name = 'Porto de Santos, Brasil'), 
    (SELECT id FROM ft_locations WHERE name = 'Porto de Shanghai, China'), 
    1, -- Marítimo
    (SELECT id FROM ft_container_types WHERE name = '20'' Standard Dry Van (DV)'), 
    (SELECT id FROM ft_agents WHERE name = 'Maersk Line'), 
    '2024-01-01', '2024-06-30', 1200.00, 'USD', '35 dias', 'Direto');

-- Tarifa 2: Marítimo, 40' HC, Itajaí -> Rotterdam, com MSC
INSERT INTO ft_tariffs (id, origin_id, destination_id, modality_id, container_type_id, agent_id, validity_start_date, validity_end_date, freight_cost, freight_currency, transit_time, route_type)
VALUES (2, 
    (SELECT id FROM ft_locations WHERE name = 'Porto de Itajaí, Brasil'), 
    (SELECT id FROM ft_locations WHERE name = 'Porto de Rotterdam, Holanda'), 
    1, -- Marítimo
    (SELECT id FROM ft_container_types WHERE name = '40'' High Cube (HC)'), 
    (SELECT id FROM ft_agents WHERE name = 'MSC (Mediterranean Shipping Co.)'), 
    '2024-03-15', '2024-09-15', 2100.00, 'USD', '28 dias', 'Com transbordo em Algeciras');

-- =====================================================================
-- 7. SOBRETAXAS DE EXEMPLO (ft_tariffs_surcharges)
-- =====================================================================
-- Sobretaxas para a Tarifa 1
INSERT INTO ft_tariffs_surcharges (tariff_id, name, value, currency) VALUES
(1, 'Terminal Handling Charge (THC) na Origem', 950.00, 'BRL'),
(1, 'Terminal Handling Charge (THC) no Destino', 180.00, 'USD'),
(1, 'Bunker Adjustment Factor (BAF)', 250.00, 'USD'),
(1, 'ISPS (International Ship and Port Facility Security Code)', 15.00, 'USD');

-- Sobretaxas para a Tarifa 2
INSERT INTO ft_tariffs_surcharges (tariff_id, name, value, currency) VALUES
(2, 'Taxa de Liberação de BL (Bill of Lading)', 200.00, 'BRL'),
(2, 'GRI (General Rate Increase)', 300.00, 'USD'),
(2, 'Emergency Bunker Surcharge (EBS)', 150.00, 'USD'); 