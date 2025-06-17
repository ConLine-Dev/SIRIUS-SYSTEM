const { executeQuery } = require('../connect/mysql');
// const { logActivity } = require('./log-controller'); // Removido temporariamente

// Função auxiliar para obter o ID do colaborador a partir do header x-user.
const getCollaboratorIdFromHeader = (req) => {
    try {
        if (req.headers['x-user']) {
            const user = JSON.parse(req.headers['x-user']);
            if (user && user.system_collaborator_id) {
                return user.system_collaborator_id;
            }
        }
    } catch (error) {
        console.error('Falha ao parsear o cabeçalho x-user para obter o ID do colaborador:', error);
    }
    // Retorna um ID de fallback (ex: usuário "Sistema") caso o header não seja encontrado ou falhe.
    return 1;
};

// Obter todos os itens de patrimônio
exports.getItems = async (req, res) => {
    try {
        // A consulta será aprimorada para incluir filtros, ordenação e paginação.
        const query = `
            SELECT 
                p.id,
                p.code,
                p.description,
                l.name AS location,
                p.current_status AS status,
                DATE_FORMAT(p.acquisition_date, '%d/%m/%Y') AS acquisition_date,
                p.notes
            FROM pat_items p
            LEFT JOIN pat_locations l ON p.location_id = l.id
            ORDER BY p.updated_at DESC
        `;
        const items = await executeQuery(query);
        
        res.json(items);
    } catch (error) {
        console.error('Erro ao buscar itens de patrimônio:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar itens de patrimônio.' });
    }
};

// Obter um item de patrimônio por ID
exports.getItemById = async (req, res) => {
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
                a.*, 
                CONCAT(c.name, ' ', c.family_name) as employee_name,
                c.job_position as employee_job_position
            FROM pat_assignments a
            JOIN collaborators c ON a.user_id = c.id
            WHERE a.item_id = ? 
            ORDER BY a.start_date DESC
        `;
        item.assignment_history = await executeQuery(historyQuery, [id]);

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
                CONCAT(c.name, ' ', c.family_name) as user_name 
            FROM pat_events e
            JOIN collaborators c ON e.user_id = c.id
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
exports.createItem = async (req, res) => {
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
exports.updateItem = async (req, res) => {
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
        
        res.json({ message: 'Item atualizado com sucesso!' });
    } catch (error) {
        console.error(`Erro ao atualizar item ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar o item.' });
    }
};

// Obter opções para formulários (localizações, categorias, funcionários, status)
exports.getOptions = async (req, res) => {
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

exports.assignItem = async (req, res) => {
    const { id } = req.params;
    const { userIdToAssign, notes } = req.body;
    const requesterId = getCollaboratorIdFromHeader(req);

    try {
        const itemResult = await executeQuery('SELECT * FROM pat_items WHERE id = ?', [id]);
        if (itemResult.length === 0) {
            return res.status(404).json({ message: "Item não encontrado." });
        }
        const item = itemResult[0];

        if (item.current_status !== 'available') {
            return res.status(400).json({ message: `Item não está disponível para atribuição. Status atual: ${item.current_status}` });
        }

        const assignmentQuery = 'INSERT INTO pat_assignments (item_id, user_id, notes, created_by, status) VALUES (?, ?, ?, ?, "active")';
        await executeQuery(assignmentQuery, [id, userIdToAssign, notes, requesterId]);

        await changeItemStatus(id, 'in_use');
        await logEvent(id, 'assigned', requesterId, notes, { assigned_to: userIdToAssign });
        
        res.json({ message: 'Item atribuído com sucesso.' });
    } catch (error) {
        console.error(`Erro ao atribuir item ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao atribuir o item.' });
    }
};

exports.returnItem = async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    const requesterId = getCollaboratorIdFromHeader(req);

    try {
        const returnQuery = 'UPDATE pat_assignments SET end_date = CURRENT_TIMESTAMP, status = "returned" WHERE item_id = ? AND status = "active"';
        const result = await executeQuery(returnQuery, [id]);

        if (result.affectedRows === 0) {
            return res.status(400).json({ message: 'Nenhuma atribuição ativa encontrada para este item.' });
        }

        await changeItemStatus(id, 'available');
        await logEvent(id, 'returned', requesterId, notes);
        
        res.json({ message: 'Item devolvido com sucesso.' });
    } catch (error) {
        console.error(`Erro ao devolver item ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao devolver o item.' });
    }
};

exports.sendToMaintenance = async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    const requesterId = getCollaboratorIdFromHeader(req);
    try {
        await changeItemStatus(id, 'maintenance');
        await logEvent(id, 'maintenance_start', requesterId, notes);
        res.json({ message: 'Item enviado para manutenção.' });
    } catch (error) {
        console.error(`Erro ao enviar item ${id} para manutenção:`, error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

exports.returnFromMaintenance = async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    const requesterId = getCollaboratorIdFromHeader(req);
    try {
        await changeItemStatus(id, 'available');
        await logEvent(id, 'maintenance_end', requesterId, notes);
        res.json({ message: 'Item retornou da manutenção.' });
    } catch (error) {
        console.error(`Erro ao retornar item ${id} da manutenção:`, error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

exports.markAsDamaged = async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    const requesterId = getCollaboratorIdFromHeader(req);
    try {
        await changeItemStatus(id, 'damaged');
        await logEvent(id, 'damaged', requesterId, notes);
        res.json({ message: 'Item marcado como danificado.' });
    } catch (error) {
        console.error(`Erro ao marcar item ${id} como danificado:`, error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

exports.discardItem = async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    const requesterId = getCollaboratorIdFromHeader(req);

    try {
        // Adicionar verificação de permissão aqui se necessário
        await changeItemStatus(id, 'discarded');
        await logEvent(id, 'discarded', requesterId, notes);
        res.json({ message: 'Item descartado com sucesso.' });
    } catch (error) {
        console.error(`Erro ao descartar item ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// Função de auditoria ainda a ser detalhada
exports.auditItem = async (req, res) => {
    const { id } = req.params;
    // const requesterId = req.user.id;
    const requesterId = getCollaboratorIdFromHeader(req);
    try {
        // Lógica de auditoria (pode ser complexa)
        await logEvent(id, 'audited', requesterId, 'Auditoria de IA realizada no item.');
        res.json({ message: 'Auditoria do item realizada.' });
    } catch (error) {
        console.error(`Erro ao auditar item ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// --- Gerenciamento de Localizações ---
exports.getLocations = async (req, res) => {
    try {
        const locations = await executeQuery('SELECT * FROM pat_locations ORDER BY name');
        res.json(locations);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar localizações.' });
    }
};

exports.createLocation = async (req, res) => {
    const { name, description } = req.body;
    try {
        const result = await executeQuery('INSERT INTO pat_locations (name, description) VALUES (?, ?)', [name, description]);
        res.status(201).json({ id: result.insertId, name, description });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar localização.' });
    }
};

exports.updateLocation = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    try {
        await executeQuery('UPDATE pat_locations SET name = ?, description = ? WHERE id = ?', [name, description, id]);
        res.json({ message: 'Localização atualizada com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar localização.' });
    }
};

exports.deleteLocation = async (req, res) => {
    const { id } = req.params;
    try {
        // Adicionar verificação se a localização está em uso antes de deletar
        await executeQuery('DELETE FROM pat_locations WHERE id = ?', [id]);
        res.json({ message: 'Localização deletada com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar localização. Verifique se ela não está em uso.' });
    }
};

// --- Gerenciamento de Categorias ---
exports.getCategories = async (req, res) => {
    try {
        const categories = await executeQuery('SELECT * FROM pat_categories ORDER BY name');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar categorias.' });
    }
};

exports.createCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        const result = await executeQuery('INSERT INTO pat_categories (name, description) VALUES (?, ?)', [name, description]);
        res.status(201).json({ id: result.insertId, name, description });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar categoria.' });
    }
};

exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    try {
        await executeQuery('UPDATE pat_categories SET name = ?, description = ? WHERE id = ?', [name, description, id]);
        res.json({ message: 'Categoria atualizada com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar categoria.' });
    }
};

exports.deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        // Adicionar verificação se a categoria está em uso antes de deletar
        await executeQuery('DELETE FROM pat_categories WHERE id = ?', [id]);
        res.json({ message: 'Categoria deletada com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar categoria. Verifique se ela não está em uso.' });
    }
}; 