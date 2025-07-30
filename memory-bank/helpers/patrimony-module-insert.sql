-- Inserir a nova categoria 'Administrativo' se ela não existir.
-- Usaremos o ID 9 para manter a consistência, assumindo que não está em uso.
INSERT INTO `module_categories` (`id`, `name`)
SELECT 9, 'Administrativo'
WHERE NOT EXISTS (SELECT 1 FROM `module_categories` WHERE `id` = 9);

-- Inserir o novo módulo de 'Gerenciamento de Patrimônio'.
-- Assumimos que o próximo ID de módulo disponível é 10.
-- O ícone 'ri-wallet-3-line' é do Remix Icon, que parece ser o padrão do tema.
INSERT INTO `modules` (`id`, `name`, `description`, `link`, `icon`, `searchable`)
VALUES
(10, 'Patrimônio', 'Gerenciamento de Patrimônio', '/app/administration/patrimony-tracker', 'ri-wallet-3-line', 1);

-- Associar o novo módulo à categoria 'Administrativo'.
INSERT INTO `module_category_relations` (`module_id`, `category_id`)
VALUES
(10, 9);

-- Conceder acesso inicial ao módulo para um usuário específico (ex: admin, user ID 1).
-- Você precisará ajustar o user_id para os usuários/grupos que devem ter acesso.
INSERT INTO `modules_acess` (`user_id`, `modules_id`)
VALUES
(1, 10); 