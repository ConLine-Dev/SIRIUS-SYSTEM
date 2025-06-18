module.exports = (io) => {
    const controller = {};
    const { executeQuery } = require('../connect/mysql');
    const ExcelJS = require('exceljs');
    // const { logActivity } = require('./log-controller'); // Removido temporariamente

    // Função auxiliar para notificar clientes sobre a atualização de um item
    const notifyItemUpdate = async (itemId) => {
        if (!io) return;
        try {
            // Lógica reutilizada de getItemById para garantir consistência de dados
            const itemQuery = `
                SELECT 
                    p.id, p.code, p.description, p.category_id,
                    DATE_FORMAT(p.acquisition_date, '%d/%m/%Y') as acquisition_date,
                    p.acquisition_value, p.current_status, p.location_id, p.notes,
                    p.technical_info, p.created_at, p.updated_at, p.deleted_at,
                    l.name AS location_name,
                    c.name AS category_name
                FROM pat_items p
                LEFT JOIN pat_locations l ON p.location_id = l.id
                LEFT JOIN pat_categories c ON p.category_id = c.id
                WHERE p.id = ?
            `;
            const itemResult = await executeQuery(itemQuery, [itemId]);
            if (itemResult.length === 0) return;
            const item = itemResult[0];

            const historyQuery = `
                SELECT 
                    a.id, a.item_id, a.user_id,
                    DATE_FORMAT(a.start_date, '%d/%m/%Y %H:%i') as assignment_date,
                    DATE_FORMAT(a.end_date, '%d/%m/%Y %H:%i') as return_date,
                    a.notes, a.status,
                    CONCAT(c.name, ' ', c.family_name) as employee_name,
                    c.job_position as employee_job_position
                FROM pat_assignments a
                JOIN collaborators c ON a.user_id = c.id
                WHERE a.item_id = ? 
                ORDER BY a.start_date DESC
            `;
            item.assignment_history = await executeQuery(historyQuery, [itemId]);
            item.current_assignment = item.assignment_history.find(a => a.status === 'active') || null;

            const eventsQuery = `
                SELECT 
                    e.id, e.item_id, e.event_type,
                    DATE_FORMAT(e.event_date, '%d/%m/%Y %H:%i:%s') as event_date,
                    e.user_id, e.description as details, e.metadata,
                    CONCAT(u.name, ' ', u.family_name) as user_name 
                FROM pat_events e
                LEFT JOIN collaborators u ON e.user_id = u.id
                WHERE e.item_id = ? 
                ORDER BY e.event_date DESC
            `;
            item.event_log = await executeQuery(eventsQuery, [itemId]);
            
            io.emit('patrimony:item_updated', item);
        } catch (error) {
            console.error(`Falha ao emitir atualização via socket para o item ${itemId}:`, error);
        }
    };

    // Função auxiliar para obter o ID do colaborador a partir do header x-user.
    const getUserIdFromHeader = (req) => {
        try {
            if (req.headers['x-user']) {
                const user = JSON.parse(req.headers['x-user']);
                // O objeto do usuário no header deve conter o ID do usuário logado
                if (user && user.id) {
                    return user.id;
                }
            }
        } catch (error) {
            console.error('Falha ao analisar o cabeçalho x-user para obter o ID do usuário:', error);
        }
        // IMPORTANTE: Retornar um ID de fallback fixo é arriscado se esse ID não existir.
        // Isso deve ser substituído por um middleware de autenticação adequado que garanta um ID de usuário válido.
        return 1; // Assumindo que '1' é um ID de usuário válido para "Sistema" ou um admin padrão
    };

    // Obter todos os itens de patrimônio
    controller.getItems = async (req, res) => {
        try {
            const query = `
                SELECT 
                    p.id,
                    p.code,
                    p.description,
                    l.name AS location,
                    p.current_status AS status,
                    p.acquisition_value,
                    DATE_FORMAT(p.acquisition_date, '%d/%m/%Y') AS acquisition_date,
                    p.notes,
                    a.user_id as employee_id,
                    CONCAT(c.name, ' ', c.family_name) as employee_name
                FROM pat_items p
                LEFT JOIN pat_locations l ON p.location_id = l.id
                LEFT JOIN pat_assignments a ON p.id = a.item_id AND a.status = 'active'
                LEFT JOIN collaborators c ON a.user_id = c.id
                ORDER BY p.updated_at DESC
            `;
            const items = await executeQuery(query);

            // Mapeia os resultados para criar o objeto aninhado current_assignment, que o frontend espera
            const formattedItems = items.map(item => {
                const { employee_id, employee_name, ...restOfItem } = item;
                return {
                    ...restOfItem,
                    current_assignment: employee_id ? { employee_id, employee_name } : null
                };
            });
            
            res.json(formattedItems);
        } catch (error) {
            console.error('Erro ao buscar itens de patrimônio:', error);
            res.status(500).json({ message: 'Erro interno do servidor ao buscar itens de patrimônio.' });
        }
    };

    // Obter um item de patrimônio por ID
    controller.getItemById = async (req, res) => {
        const { id } = req.params;
        try {
            // Busca o item principal
            const itemQuery = `
                SELECT 
                    p.id, p.code, p.description, p.category_id,
                    DATE_FORMAT(p.acquisition_date, '%d/%m/%Y') as acquisition_date,
                    p.acquisition_value, p.current_status, p.location_id, p.notes,
                    p.technical_info, p.created_at, p.updated_at, p.deleted_at,
                    l.name AS location_name,
                    c.name AS category_name
                FROM pat_items p
                LEFT JOIN pat_locations l ON p.location_id = l.id
                LEFT JOIN pat_categories c ON p.category_id = c.id
                WHERE p.id = ?
            `;
            const itemResult = await executeQuery(itemQuery, [id]);
            
            if (itemResult.length === 0) {
                return res.status(404).json({ message: 'Item não encontrado.' });
            }
            const item = itemResult[0];

            // Busca o histórico de atribuições
            const historyQuery = `
                SELECT 
                    a.id,
                    a.item_id,
                    a.user_id,
                    DATE_FORMAT(a.start_date, '%d/%m/%Y %H:%i') as assignment_date,
                    DATE_FORMAT(a.end_date, '%d/%m/%Y %H:%i') as return_date,
                    a.notes,
                    a.status,
                    CONCAT(c.name, ' ', c.family_name) as employee_name,
                    c.job_position as employee_job_position
                FROM pat_assignments a
                JOIN collaborators c ON a.user_id = c.id
                WHERE a.item_id = ? 
                ORDER BY a.start_date DESC
            `;
            const assignmentHistory = await executeQuery(historyQuery, [id]);
            item.assignment_history = assignmentHistory;

            // Encontra a atribuição atual (status = 'active')
            item.current_assignment = assignmentHistory.find(a => a.status === 'active') || null;

            // Busca o log de eventos
            const eventsQuery = `
                SELECT 
                    e.id,
                    e.item_id,
                    e.event_type,
                    DATE_FORMAT(e.event_date, '%d/%m/%Y %H:%i:%s') as event_date,
                    e.user_id,
                    e.description as details,
                    e.metadata,
                    CONCAT(u.name, ' ', u.family_name) as user_name 
                FROM pat_events e
                LEFT JOIN collaborators u ON e.user_id = u.id
                WHERE e.item_id = ? 
                ORDER BY e.event_date DESC
            `;
            item.event_log = await executeQuery(eventsQuery, [id]);
            
            res.json(item);
        } catch (error) {
            console.error(`Erro ao buscar item ${id}:`, error);
            res.status(500).json({ message: 'Erro interno do servidor ao buscar o item.' });
        }
    };

    // Criar um novo item de patrimônio
    controller.createItem = async (req, res) => {
        const { code, description, category_id, acquisition_date, acquisition_value, location_id, notes } = req.body;
        // const userId = req.user.id; // Adicionar quando o middleware de autenticação for confirmado

        if (!code || !description || !acquisition_date) {
            return res.status(400).json({ message: 'Código, descrição e data de aquisição são obrigatórios.' });
        }

        try {
            const query = `
                INSERT INTO pat_items (code, description, category_id, acquisition_date, acquisition_value, location_id, notes, current_status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 'available')
            `;
            const result = await executeQuery(query, [code, description, category_id, acquisition_date, acquisition_value, location_id, notes]);
            const newItemId = result.insertId;

            // await logActivity('pat_events', newItemId, 'created', userId, 'Item criado no sistema', {});
            io.emit('patrimony:list_changed'); // Notifica os clientes para atualizarem a lista
            res.status(201).json({ id: newItemId, message: 'Item criado com sucesso!' });
        } catch (error) {
            console.error('Erro ao criar item:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Já existe um item com este código.' });
            }
            res.status(500).json({ message: 'Erro interno do servidor ao criar o item.' });
        }
    };

    // Atualizar um item de patrimônio
    controller.updateItem = async (req, res) => {
        const { id } = req.params;
        const { code, description, category_id, acquisition_date, acquisition_value, location_id, notes } = req.body;
        // const userId = req.user.id;

        try {
            const query = `
                UPDATE pat_items 
                SET code = ?, description = ?, category_id = ?, acquisition_date = ?, acquisition_value = ?, location_id = ?, notes = ?
                WHERE id = ?
            `;
            await executeQuery(query, [code, description, category_id, acquisition_date, acquisition_value, location_id, notes, id]);
            
            // await logActivity('pat_events', id, 'updated', userId, 'Dados do item atualizados.', req.body);
            await notifyItemUpdate(id);
            
            res.json({ message: 'Item atualizado com sucesso!' });
        } catch (error) {
            console.error(`Erro ao atualizar item ${id}:`, error);
            res.status(500).json({ message: 'Erro interno do servidor ao atualizar o item.' });
        }
    };

    // Obter opções para formulários (localizações, categorias, funcionários, status)
    controller.getOptions = async (req, res) => {
        try {
            const locationsQuery = 'SELECT id, name FROM pat_locations ORDER BY name';
            const locations = await executeQuery(locationsQuery);

            const categoriesQuery = 'SELECT id, name FROM pat_categories ORDER BY name';
            const categories = await executeQuery(categoriesQuery);

            const employeesQuery = `
                SELECT 
                    c.id, 
                    CONCAT(c.name, ' ', c.family_name) as name, 
                    c.job_position 
                FROM collaborators c
                WHERE c.resignation_date IS NULL
                GROUP BY c.id, name, c.job_position
                ORDER BY name
            `;
            const employees = await executeQuery(employeesQuery);

            const statuses = [
                { id: 'available', name: 'Disponível' },
                { id: 'in_use', name: 'Em Uso' },
                { id: 'in_maintenance', name: 'Em Manutenção' },
                { id: 'damaged', name: 'Danificado' },
                { id: 'discarded', name: 'Baixado/Descartado' }
            ];

            res.json({ locations, categories, employees, statuses });
        } catch (error) {
            console.error('Erro ao buscar opções para formulários:', error);
            res.status(500).json({ message: 'Erro interno do servidor ao buscar opções.' });
        }
    };

    // Ações específicas sobre itens
    async function changeItemStatus(itemId, newStatus) {
        const updateQuery = 'UPDATE pat_items SET current_status = ? WHERE id = ?';
        await executeQuery(updateQuery, [newStatus, itemId]);
    }

    async function logEvent(itemId, eventType, userId, description, metadata = {}) {
        const metaString = Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null;
        const query = 'INSERT INTO pat_events (item_id, event_type, user_id, description, metadata) VALUES (?, ?, ?, ?, ?)';
        await executeQuery(query, [itemId, eventType, userId, description || null, metaString]);
    }

    controller.assignItem = async (req, res) => {
        const { id } = req.params;
        // Corresponder ao payload do frontend: { employee_id, assignment_date, notes }
        const { employee_id, assignment_date, notes } = req.body;
        const requesterId = getUserIdFromHeader(req);

        if (!employee_id || !assignment_date) {
            return res.status(400).json({ message: "ID do colaborador e data de atribuição são obrigatórios." });
        }

        try {
            const itemResult = await executeQuery('SELECT * FROM pat_items WHERE id = ?', [id]);
            if (itemResult.length === 0) {
                return res.status(404).json({ message: "Item não encontrado." });
            }
            const item = itemResult[0];

            if (item.current_status !== 'available') {
                return res.status(400).json({ message: `Item não está disponível para atribuição. Status atual: ${item.current_status}` });
            }

            // Usar assignment_date para start_date
            const assignmentQuery = 'INSERT INTO pat_assignments (item_id, user_id, start_date, notes, created_by, status) VALUES (?, ?, ?, ?, ?, "active")';
            await executeQuery(assignmentQuery, [id, employee_id, assignment_date, notes, requesterId]);

            await changeItemStatus(id, 'in_use');
            await logEvent(id, 'assigned', requesterId, `Atribuído ao colaborador ID: ${employee_id}. ${notes || ''}`, { assigned_to: employee_id });
            
            await notifyItemUpdate(id);
            res.json({ message: 'Item atribuído com sucesso.' });
        } catch (error) {
            console.error(`Erro ao atribuir item ${id}:`, error);
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                 return res.status(400).json({ message: `Falha ao atribuir item. Verifique se o colaborador (ID: ${employee_id}) e o usuário solicitante (ID: ${requesterId}) existem no sistema.` });
            }
            res.status(500).json({ message: 'Erro interno do servidor ao atribuir o item.' });
        }
    };

    controller.returnItem = async (req, res) => {
        const { id } = req.params;
        const { return_date, notes } = req.body;
        const requesterId = getUserIdFromHeader(req);

        if (!return_date) {
            return res.status(400).json({ message: "Data de devolução é obrigatória." });
        }

        try {
            const activeAssignment = await executeQuery('SELECT id FROM pat_assignments WHERE item_id = ? AND status = "active"', [id]);
            if (activeAssignment.length === 0) {
                return res.status(400).json({ message: "Item não está atualmente atribuído." });
            }
            const assignmentId = activeAssignment[0].id;

            const returnQuery = 'UPDATE pat_assignments SET end_date = ?, notes = ?, status = "returned" WHERE id = ?';
            await executeQuery(returnQuery, [return_date, notes, assignmentId]);

            await changeItemStatus(id, 'available');
            await logEvent(id, 'returned', requesterId, `Item devolvido. ${notes || ''}`, { notes });

            await notifyItemUpdate(id);
            res.json({ message: 'Item devolvido com sucesso.' });
        } catch (error) {
            console.error(`Erro ao devolver item ${id}:`, error);
            res.status(500).json({ message: 'Erro interno do servidor ao devolver o item.' });
        }
    };

    // Função interna para devolução automática
    async function performAutomaticReturn(itemId, requesterId, reason) {
        const activeAssignmentResult = await executeQuery(
            'SELECT id, user_id FROM pat_assignments WHERE item_id = ? AND status = "active"',
            [itemId]
        );

        if (activeAssignmentResult.length > 0) {
            const assignment = activeAssignmentResult[0];
            const returnQuery = 'UPDATE pat_assignments SET end_date = NOW(), status = "returned", notes = ? WHERE id = ?';
            const returnNotes = `Devolvido automaticamente: ${reason}.`;
            await executeQuery(returnQuery, [returnNotes, assignment.id]);

            await logEvent(itemId, 'returned', requesterId, `Devolução automática do item devido a: ${reason}.`, { returned_from: assignment.user_id });
            console.log(`Item ${itemId} devolvido automaticamente do colaborador ${assignment.user_id}.`);
            await notifyItemUpdate(itemId);
            return true; // Indica que a devolução ocorreu
        }
        return false; // Indica que não havia atribuição ativa
    }

    // Marcar um item para manutenção
    controller.markAsMaintenance = async (req, res) => {
        const { id } = req.params;
        const { notes } = req.body;
        const requesterId = getUserIdFromHeader(req);

        try {
            // Primeiro, executa a devolução automática
            await performAutomaticReturn(id, requesterId, "Item enviado para manutenção");

            // Em seguida, atualiza o status do item
            await changeItemStatus(id, 'maintenance');
            await logEvent(id, 'maintenance_start', requesterId, `Item enviado para manutenção. ${notes || ''}`, { notes });

            await notifyItemUpdate(id);
            res.json({ message: 'Item marcado para manutenção e devolvido automaticamente (se aplicável).' });
        } catch (error) {
            console.error(`Erro ao marcar item ${id} para manutenção:`, error);
            res.status(500).json({ message: 'Erro interno do servidor.' });
        }
    };

    // Marcar um item como danificado
    controller.markAsDamaged = async (req, res) => {
        const { id } = req.params;
        const { notes } = req.body;
        const requesterId = getUserIdFromHeader(req);

        try {
            // Primeiro, executa a devolução automática
            await performAutomaticReturn(id, requesterId, "Item marcado como danificado");

            // Em seguida, atualiza o status do item
            await changeItemStatus(id, 'damaged');
            await logEvent(id, 'damaged', requesterId, `Item marcado como danificado. ${notes || ''}`, { notes });

            await notifyItemUpdate(id);
            res.json({ message: 'Item marcado como danificado e devolvido automaticamente (se aplicável).' });
        } catch (error) {
            console.error(`Erro ao marcar item ${id} como danificado:`, error);
            res.status(500).json({ message: 'Erro interno do servidor.' });
        }
    };

    controller.returnFromMaintenance = async (req, res) => {
        const { id } = req.params;
        const { notes } = req.body;
        const requesterId = getUserIdFromHeader(req);

        try {
            // Altera o status do item para 'available'
            await changeItemStatus(id, 'available');
            // Registra o evento de finalização da manutenção
            await logEvent(id, 'maintenance_end', requesterId, `Item retornou da manutenção. ${notes || ''}`, { notes });

            await notifyItemUpdate(id);
            res.json({ message: 'Item retornado da manutenção com sucesso e agora está disponível.' });
        } catch (error) {
            console.error(`Erro ao retornar item ${id} da manutenção:`, error);
            res.status(500).json({ message: 'Erro interno do servidor.' });
        }
    };

    controller.discardItem = async (req, res) => {
        const { id } = req.params;
        const { notes } = req.body;
        const requesterId = getUserIdFromHeader(req);

        if (!notes || notes.trim() === '') {
            return res.status(400).json({ message: 'A justificativa para o descarte é obrigatória.' });
        }

        try {
            await changeItemStatus(id, 'discarded');
            await logEvent(id, 'discarded', requesterId, notes);
            await notifyItemUpdate(id);
            res.json({ message: 'Item descartado com sucesso.' });
        } catch (error) {
            console.error(`Erro ao descartar item ${id}:`, error);
            res.status(500).json({ message: 'Erro interno do servidor.' });
        }
    };

    controller.performAudit = async (req, res) => {
        const { id } = req.params;
        const requesterId = getUserIdFromHeader(req);
        const auditPrompt = `
            Analise o seguinte item de patrimônio e seu histórico. Forneça uma breve auditoria sobre seu estado, 
            uso e possíveis ações recomendadas (como substituição, manutenção preventiva, etc.).
            Seja conciso e direto ao ponto.

            Dados do Item:
            {item_data}

            Histórico de Eventos:
            {events_data}

            Histórico de Atribuições:
            {assignments_data}
        `;
        
        try {
            // Obter todos os dados do item, similar ao getItemById
            const itemQuery = 'SELECT * FROM pat_items WHERE id = ?';
            const item = (await executeQuery(itemQuery, [id]))[0];
            
            const historyQuery = 'SELECT * FROM pat_assignments WHERE item_id = ? ORDER BY start_date DESC';
            const assignments = await executeQuery(historyQuery, [id]);
            
            const eventsQuery = 'SELECT * FROM pat_events WHERE item_id = ? ORDER BY event_date DESC';
            const events = await executeQuery(eventsQuery, [id]);

            // Simulação de chamada de IA (substituir pela chamada real)
            const audit_result = `Auditoria simulada para o item ${item.code}: O item está atualmente ${item.current_status}. Com base no seu histórico, recomendamos verificar o estado da bateria.`;

            await logEvent(id, 'audited', requesterId, 'Auditoria de IA realizada.', { result: audit_result });

            res.json({ audit_result });
        } catch (error) {
            console.error(`Erro na auditoria do item ${id}:`, error);
            res.status(500).json({ message: 'Erro interno do servidor ao realizar auditoria.' });
        }
    };

    // --- Gerenciamento de Localizações ---
    controller.getLocations = async (req, res) => {
        try {
            const locations = await executeQuery('SELECT * FROM pat_locations ORDER BY name');
            res.json(locations);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar localizações.' });
        }
    };

    controller.getLocationById = async (req, res) => {
        const { id } = req.params;
        try {
            const results = await executeQuery('SELECT * FROM pat_locations WHERE id = ?', [id]);
            if (results.length > 0) {
                res.json(results[0]);
            } else {
                res.status(404).json({ message: 'Localização não encontrada.' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar a localização.' });
        }
    };

    controller.createLocation = async (req, res) => {
        const { name, description } = req.body;
        try {
            const result = await executeQuery('INSERT INTO pat_locations (name, description) VALUES (?, ?)', [name, description]);
            io.emit('patrimony:options_changed');
            res.status(201).json({ id: result.insertId, name, description });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao criar localização.' });
        }
    };

    controller.updateLocation = async (req, res) => {
        const { id } = req.params;
        const { name, description } = req.body;
        try {
            await executeQuery('UPDATE pat_locations SET name = ?, description = ? WHERE id = ?', [name, description, id]);
            io.emit('patrimony:options_changed');
            res.json({ message: 'Localização atualizada com sucesso.' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao atualizar localização.' });
        }
    };

    controller.deleteLocation = async (req, res) => {
        const { id } = req.params;
        try {
            // Adicionar verificação se a localização está em uso antes de deletar
            const itemsInLocation = await executeQuery('SELECT COUNT(*) as count FROM pat_items WHERE location_id = ?', [id]);
            if (itemsInLocation[0].count > 0) {
                return res.status(400).json({ message: `Esta localização não pode ser excluída pois está associada a ${itemsInLocation[0].count} item(ns).` });
            }
            await executeQuery('DELETE FROM pat_locations WHERE id = ?', [id]);
            io.emit('patrimony:options_changed');
            res.json({ message: 'Localização deletada com sucesso.' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao deletar localização. Verifique se ela não está em uso.' });
        }
    };

    // --- Gerenciamento de Categorias ---
    controller.getCategories = async (req, res) => {
        try {
            const categories = await executeQuery('SELECT * FROM pat_categories ORDER BY name');
            res.json(categories);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar categorias.' });
        }
    };

    controller.getCategoryById = async (req, res) => {
        const { id } = req.params;
        try {
            const results = await executeQuery('SELECT * FROM pat_categories WHERE id = ?', [id]);
            if (results.length > 0) {
                res.json(results[0]);
            } else {
                res.status(404).json({ message: 'Categoria não encontrada.' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar a categoria.' });
        }
    };

    controller.createCategory = async (req, res) => {
        const { name, description } = req.body;
        try {
            const result = await executeQuery('INSERT INTO pat_categories (name, description) VALUES (?, ?)', [name, description]);
            io.emit('patrimony:options_changed');
            res.status(201).json({ id: result.insertId, name, description });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao criar categoria.' });
        }
    };

    controller.updateCategory = async (req, res) => {
        const { id } = req.params;
        const { name, description } = req.body;
        try {
            await executeQuery('UPDATE pat_categories SET name = ?, description = ? WHERE id = ?', [name, description, id]);
            io.emit('patrimony:options_changed');
            res.json({ message: 'Categoria atualizada com sucesso.' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao atualizar categoria.' });
        }
    };

    controller.deleteCategory = async (req, res) => {
        const { id } = req.params;
        try {
            // Adicionar verificação se a categoria está em uso antes de deletar
            const itemsInCategory = await executeQuery('SELECT COUNT(*) as count FROM pat_items WHERE category_id = ?', [id]);
            if (itemsInCategory[0].count > 0) {
                return res.status(400).json({ message: `Esta categoria não pode ser excluída pois está associada a ${itemsInCategory[0].count} item(ns).` });
            }
            await executeQuery('DELETE FROM pat_categories WHERE id = ?', [id]);
            io.emit('patrimony:options_changed');
            res.json({ message: 'Categoria deletada com sucesso.' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao deletar categoria. Verifique se ela não está em uso.' });
        }
    };

    controller.exportItems = async (req, res) => {
        try {
            const query = `
                SELECT 
                    p.id,
                    p.code AS 'Código',
                    p.description AS 'Descrição',
                    cat.name AS 'Categoria',
                    l.name AS 'Localização',
                    p.current_status AS 'Status',
                    DATE_FORMAT(p.acquisition_date, '%d/%m/%Y') AS 'Data de Aquisição',
                    p.acquisition_value AS 'Valor de Aquisição',
                    CONCAT(c.name, ' ', c.family_name) AS 'Colaborador Atual',
                    DATE_FORMAT(a.start_date, '%d/%m/%Y %H:%i') as 'Data da Atribuição',
                    p.notes AS 'Observações'
                FROM pat_items p
                LEFT JOIN pat_locations l ON p.location_id = l.id
                LEFT JOIN pat_categories cat ON p.category_id = cat.id
                LEFT JOIN pat_assignments a ON p.id = a.item_id AND a.status = 'active'
                LEFT JOIN collaborators c ON a.user_id = c.id
                ORDER BY p.id
            `;
            const items = await executeQuery(query);

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Patrimônio');

            // Definir cabeçalhos
            worksheet.columns = Object.keys(items[0] || {}).map(key => ({
                header: key,
                key: key,
                width: key === 'Descrição' ? 40 : (key === 'Observações' ? 50 : 20)
            }));

            // Adicionar linhas
            worksheet.addRows(items);
            
            // Estilizar cabeçalho
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFF' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF007BFF' }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=' + 'Relatorio_Patrimonio.xlsx'
            );

            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error('Erro ao exportar itens para Excel:', error);
            res.status(500).json({ message: 'Erro interno do servidor ao gerar o relatório.' });
        }
    };

    return controller;
}; 