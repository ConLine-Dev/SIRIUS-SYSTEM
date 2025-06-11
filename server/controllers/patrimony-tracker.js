const { executeQuery } = require('../connect/mysql');

// Dados mockados para desenvolvimento inicial
const mockItems = [
    {
        id: 1,
        code: 'PAT001',
        description: 'Notebook Dell Latitude 5420',
        location: 'Sede Principal',
        status: 'in_use',
        acquisition_date: '2022-05-15',
        notes: 'Equipamento em bom estado, com carregador original.',
        current_assignment: {
            employee_id: 101,
            employee_name: 'João Silva',
            employee_department: 'TI',
            assignment_date: '2022-06-01',
            notes: 'Entregue com mouse, teclado e monitor adicional.'
        }
    },
    {
        id: 2,
        code: 'PAT002',
        description: 'Monitor LG Ultrawide 34"',
        location: 'Sede Principal',
        status: 'available',
        acquisition_date: '2021-11-10',
        notes: 'Monitor com suporte ajustável de altura.',
        current_assignment: null
    },
    {
        id: 3,
        code: 'PAT003',
        description: 'Impressora HP LaserJet Pro M428',
        location: 'Filial Sul',
        status: 'in_maintenance',
        acquisition_date: '2020-08-22',
        notes: 'Equipamento com problema no fusor, enviado para assistência.',
        current_assignment: null
    },
    {
        id: 4,
        code: 'PAT004',
        description: 'Cadeira Ergonômica Herman Miller',
        location: 'Sede Principal',
        status: 'in_use',
        acquisition_date: '2022-01-05',
        notes: 'Cadeira de alto padrão para diretoria.',
        current_assignment: {
            employee_id: 102,
            employee_name: 'Maria Souza',
            employee_department: 'Diretoria',
            assignment_date: '2022-01-10',
            notes: 'Atribuída à diretora financeira.'
        }
    },
    {
        id: 5,
        code: 'PAT005',
        description: 'Projetor Epson PowerLite 107',
        location: 'Filial Norte',
        status: 'damaged',
        acquisition_date: '2019-03-18',
        notes: 'Problema na lâmpada, aguardando orçamento para reparo.',
        current_assignment: null
    }
];

const mockAssignmentHistory = [
    {
        id: 1,
        item_id: 1,
        employee_id: 103,
        employee_name: 'Pedro Santos',
        employee_department: 'Marketing',
        assignment_date: '2022-05-20',
        return_date: '2022-05-30',
        notes: 'Empréstimo temporário durante campanha de marketing.'
    },
    {
        id: 2,
        item_id: 1,
        employee_id: 101,
        employee_name: 'João Silva',
        employee_department: 'TI',
        assignment_date: '2022-06-01',
        return_date: null,
        notes: 'Entregue com mouse, teclado e monitor adicional.'
    },
    {
        id: 3,
        item_id: 4,
        employee_id: 102,
        employee_name: 'Maria Souza',
        employee_department: 'Diretoria',
        assignment_date: '2022-01-10',
        return_date: null,
        notes: 'Atribuída à diretora financeira.'
    }
];

const mockEventLog = [
    {
        id: 1,
        item_id: 1,
        event_type: 'created',
        event_date: '2022-05-15T10:30:00',
        details: 'Item cadastrado no sistema.',
        user_name: 'Admin'
    },
    {
        id: 2,
        item_id: 1,
        event_type: 'assigned',
        event_date: '2022-05-20T14:15:00',
        details: 'Item atribuído a Pedro Santos (Marketing).',
        user_name: 'Ana Paula'
    },
    {
        id: 3,
        item_id: 1,
        event_type: 'returned',
        event_date: '2022-05-30T16:45:00',
        details: 'Item devolvido por Pedro Santos.',
        user_name: 'Ana Paula'
    },
    {
        id: 4,
        item_id: 1,
        event_type: 'assigned',
        event_date: '2022-06-01T09:20:00',
        details: 'Item atribuído a João Silva (TI).',
        user_name: 'Ana Paula'
    },
    {
        id: 5,
        item_id: 3,
        event_type: 'created',
        event_date: '2020-08-22T11:10:00',
        details: 'Item cadastrado no sistema.',
        user_name: 'Admin'
    },
    {
        id: 6,
        item_id: 3,
        event_type: 'sent_to_maintenance',
        event_date: '2023-02-10T08:30:00',
        details: 'Enviado para manutenção devido a problema no fusor.',
        user_name: 'Carlos Alberto'
    }
];

const mockEmployees = [
    { id: 101, name: 'João Silva', department: 'TI' },
    { id: 102, name: 'Maria Souza', department: 'Diretoria' },
    { id: 103, name: 'Pedro Santos', department: 'Marketing' },
    { id: 104, name: 'Ana Paula', department: 'RH' },
    { id: 105, name: 'Carlos Alberto', department: 'Operações' }
];

const mockLocations = [
    { id: 1, name: 'Sede Principal' },
    { id: 2, name: 'Filial Norte' },
    { id: 3, name: 'Filial Sul' },
    { id: 4, name: 'Depósito Central' },
    { id: 5, name: 'Escritório Remoto' }
];

const mockStatuses = [
    { id: 'available', name: 'Disponível' },
    { id: 'in_use', name: 'Em Uso' },
    { id: 'in_maintenance', name: 'Em Manutenção' },
    { id: 'damaged', name: 'Danificado' },
    { id: 'discarded', name: 'Baixado/Descartado' }
];

// Funções auxiliares
function formatDate(dateString) {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Obter todos os itens de patrimônio
exports.getItems = async (req, res) => {
    try {
        // No futuro, isso seria uma consulta real ao banco de dados
        // const items = await executeQuery('SELECT * FROM pat_items ORDER BY updated_at DESC');
        
        // Por enquanto, usamos os dados mockados
        const items = mockItems.map(item => ({
            ...item,
            acquisition_date: formatDate(item.acquisition_date)
        }));
        
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
        // No futuro, seria uma consulta real
        // const itemResult = await executeQuery('SELECT * FROM pat_items WHERE id = ?', [id]);
        
        // Usando dados mockados
        const item = mockItems.find(item => item.id === parseInt(id));
        
        if (!item) {
            return res.status(404).json({ message: 'Item não encontrado.' });
        }
        
        // Adicionar histórico de atribuições e log de eventos
        const assignmentHistory = mockAssignmentHistory.filter(a => a.item_id === parseInt(id))
            .map(a => ({
                ...a,
                assignment_date: formatDate(a.assignment_date),
                return_date: formatDate(a.return_date)
            }));
            
        const eventLog = mockEventLog.filter(e => e.item_id === parseInt(id))
            .map(e => ({
                ...e,
                event_date: new Date(e.event_date).toLocaleString('pt-BR')
            }))
            .sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
            
        // Formatar a data no objeto item
        const formattedItem = {
            ...item,
            acquisition_date: formatDate(item.acquisition_date),
            assignment_history: assignmentHistory,
            event_log: eventLog
        };
        
        if (formattedItem.current_assignment) {
            formattedItem.current_assignment.assignment_date = formatDate(formattedItem.current_assignment.assignment_date);
        }
        
        res.json(formattedItem);
    } catch (error) {
        console.error(`Erro ao buscar item ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar o item.' });
    }
};

// Criar um novo item de patrimônio
exports.createItem = async (req, res) => {
    const { 
        code, 
        description, 
        location, 
        acquisition_date, 
        notes,
        assignToEmployee,
        employee,
        assignmentDate,
        assignmentNotes
    } = req.body;
    
    try {
        // Em um ambiente real, isso seria uma transação no banco de dados
        
        // 1. Criar o novo item (mockado)
        const newItem = {
            id: mockItems.length + 1,
            code,
            description,
            location,
            status: assignToEmployee ? 'in_use' : 'available',
            acquisition_date,
            notes,
            current_assignment: null
        };
        
        // 2. Se estiver atribuindo a um funcionário
        if (assignToEmployee && employee) {
            const employeeData = mockEmployees.find(e => e.id === parseInt(employee)) || 
                                { id: parseInt(employee), name: "Funcionário " + employee, department: "Não especificado" };
                                
            newItem.current_assignment = {
                employee_id: employeeData.id,
                employee_name: employeeData.name,
                employee_department: employeeData.department,
                assignment_date: assignmentDate || new Date().toISOString().split('T')[0],
                notes: assignmentNotes || ''
            };
            
            // Adicionar ao histórico de atribuições (mockado)
            mockAssignmentHistory.push({
                id: mockAssignmentHistory.length + 1,
                item_id: newItem.id,
                employee_id: employeeData.id,
                employee_name: employeeData.name,
                employee_department: employeeData.department,
                assignment_date: assignmentDate || new Date().toISOString().split('T')[0],
                return_date: null,
                notes: assignmentNotes || ''
            });
        }
        
        // Adicionar ao registro de eventos (mockado)
        mockEventLog.push({
            id: mockEventLog.length + 1,
            item_id: newItem.id,
            event_type: 'created',
            event_date: new Date().toISOString(),
            details: 'Item cadastrado no sistema.',
            user_name: 'Usuário do Sistema'
        });
        
        if (assignToEmployee && employee) {
            mockEventLog.push({
                id: mockEventLog.length + 1,
                item_id: newItem.id,
                event_type: 'assigned',
                event_date: new Date().toISOString(),
                details: `Item atribuído a ${newItem.current_assignment.employee_name} (${newItem.current_assignment.employee_department}).`,
                user_name: 'Usuário do Sistema'
            });
        }
        
        // Adicionar à lista mockada
        mockItems.push(newItem);
        
        res.status(201).json({ 
            message: 'Item cadastrado com sucesso!', 
            id: newItem.id 
        });
    } catch (error) {
        console.error('Erro ao criar item de patrimônio:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao criar o item.' });
    }
};

// Atualizar um item de patrimônio existente
exports.updateItem = async (req, res) => {
    const { id } = req.params;
    const { code, description, location, acquisition_date, notes } = req.body;
    
    try {
        // Encontrar o item na lista mockada
        const itemIndex = mockItems.findIndex(item => item.id === parseInt(id));
        
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item não encontrado.' });
        }
        
        // Guardar valores antigos para o log
        const oldItem = { ...mockItems[itemIndex] };
        
        // Atualizar apenas os campos permitidos, mantendo os outros
        mockItems[itemIndex] = {
            ...mockItems[itemIndex],
            code,
            description,
            location,
            acquisition_date,
            notes
        };
        
        // Adicionar ao registro de eventos
        mockEventLog.push({
            id: mockEventLog.length + 1,
            item_id: parseInt(id),
            event_type: 'updated',
            event_date: new Date().toISOString(),
            details: 'Informações básicas do item atualizadas.',
            old_value: JSON.stringify({
                code: oldItem.code,
                description: oldItem.description,
                location: oldItem.location,
                acquisition_date: oldItem.acquisition_date,
                notes: oldItem.notes
            }),
            new_value: JSON.stringify({
                code,
                description,
                location,
                acquisition_date,
                notes
            }),
            user_name: 'Usuário do Sistema'
        });
        
        res.json({ message: 'Item atualizado com sucesso!' });
    } catch (error) {
        console.error(`Erro ao atualizar item ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar o item.' });
    }
};

// Buscar opções para dropdowns
exports.getOptions = async (req, res) => {
    try {
        // No futuro, isso seria uma busca real no banco de dados
        
        res.json({
            locations: mockLocations,
            statuses: mockStatuses,
            employees: mockEmployees
        });
    } catch (error) {
        console.error('Erro ao buscar opções:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar opções.' });
    }
};

// Atribuir item a um colaborador
exports.assignItem = async (req, res) => {
    const { id } = req.params;
    const { employee_id, assignment_date, notes } = req.body;
    
    try {
        // Encontrar o item na lista mockada
        const itemIndex = mockItems.findIndex(item => item.id === parseInt(id));
        
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item não encontrado.' });
        }
        
        // Verificar se o item já está atribuído
        if (mockItems[itemIndex].status === 'in_use' && mockItems[itemIndex].current_assignment) {
            return res.status(400).json({ 
                message: 'Este item já está atribuído a um colaborador. Registre a devolução antes de atribuir a outro colaborador.' 
            });
        }
        
        // Verificar se o item está disponível
        if (mockItems[itemIndex].status !== 'available') {
            return res.status(400).json({ 
                message: `Este item está com o status "${mockItems[itemIndex].status}" e não pode ser atribuído no momento.` 
            });
        }
        
        // Buscar dados do colaborador
        const employee = mockEmployees.find(e => e.id === parseInt(employee_id));
        
        if (!employee) {
            return res.status(404).json({ message: 'Colaborador não encontrado.' });
        }
        
        // Atualizar o item
        mockItems[itemIndex].status = 'in_use';
        mockItems[itemIndex].current_assignment = {
            employee_id: employee.id,
            employee_name: employee.name,
            employee_department: employee.department,
            assignment_date: assignment_date || new Date().toISOString().split('T')[0],
            notes: notes || ''
        };
        
        // Adicionar ao histórico de atribuições
        mockAssignmentHistory.push({
            id: mockAssignmentHistory.length + 1,
            item_id: parseInt(id),
            employee_id: employee.id,
            employee_name: employee.name,
            employee_department: employee.department,
            assignment_date: assignment_date || new Date().toISOString().split('T')[0],
            return_date: null,
            notes: notes || ''
        });
        
        // Adicionar ao registro de eventos
        mockEventLog.push({
            id: mockEventLog.length + 1,
            item_id: parseInt(id),
            event_type: 'assigned',
            event_date: new Date().toISOString(),
            details: `Item atribuído a ${employee.name} (${employee.department}).`,
            user_name: 'Usuário do Sistema'
        });
        
        res.json({ 
            message: 'Item atribuído com sucesso!',
            current_assignment: mockItems[itemIndex].current_assignment
        });
    } catch (error) {
        console.error(`Erro ao atribuir item ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao atribuir o item.' });
    }
};

// Registrar devolução de item
exports.returnItem = async (req, res) => {
    const { id } = req.params;
    const { return_date, return_status, notes } = req.body;
    
    try {
        // Encontrar o item na lista mockada
        const itemIndex = mockItems.findIndex(item => item.id === parseInt(id));
        
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item não encontrado.' });
        }
        
        // Verificar se o item está atribuído
        if (mockItems[itemIndex].status !== 'in_use' || !mockItems[itemIndex].current_assignment) {
            return res.status(400).json({ 
                message: 'Este item não está atribuído a nenhum colaborador atualmente.' 
            });
        }
        
        // Guardar informações da atribuição atual para o log
        const currentAssignment = { ...mockItems[itemIndex].current_assignment };
        
        // Atualizar o status do item conforme solicitado
        mockItems[itemIndex].status = return_status || 'available';
        
        // Remover a atribuição atual
        mockItems[itemIndex].current_assignment = null;
        
        // Atualizar o histórico de atribuições
        const assignmentIndex = mockAssignmentHistory.findIndex(
            a => a.item_id === parseInt(id) && a.employee_id === currentAssignment.employee_id && !a.return_date
        );
        
        if (assignmentIndex !== -1) {
            mockAssignmentHistory[assignmentIndex].return_date = return_date || new Date().toISOString().split('T')[0];
        }
        
        // Adicionar ao registro de eventos
        mockEventLog.push({
            id: mockEventLog.length + 1,
            item_id: parseInt(id),
            event_type: 'returned',
            event_date: new Date().toISOString(),
            details: `Item devolvido por ${currentAssignment.employee_name}. Novo status: ${return_status || 'available'}`,
            user_name: 'Usuário do Sistema'
        });
        
        res.json({ message: 'Devolução registrada com sucesso!' });
    } catch (error) {
        console.error(`Erro ao registrar devolução do item ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao registrar a devolução.' });
    }
};

// Enviar item para manutenção
exports.sendToMaintenance = async (req, res) => {
    const { id } = req.params;
    const { maintenance_notes } = req.body;
    
    try {
        // Encontrar o item na lista mockada
        const itemIndex = mockItems.findIndex(item => item.id === parseInt(id));
        
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item não encontrado.' });
        }
        
        // Se o item estiver atribuído, registrar a devolução automaticamente
        if (mockItems[itemIndex].status === 'in_use' && mockItems[itemIndex].current_assignment) {
            const currentAssignment = { ...mockItems[itemIndex].current_assignment };
            
            // Remover a atribuição atual
            mockItems[itemIndex].current_assignment = null;
            
            // Atualizar o histórico de atribuições
            const assignmentIndex = mockAssignmentHistory.findIndex(
                a => a.item_id === parseInt(id) && a.employee_id === currentAssignment.employee_id && !a.return_date
            );
            
            if (assignmentIndex !== -1) {
                mockAssignmentHistory[assignmentIndex].return_date = new Date().toISOString().split('T')[0];
            }
            
            // Adicionar ao registro de eventos a devolução automática
            mockEventLog.push({
                id: mockEventLog.length + 1,
                item_id: parseInt(id),
                event_type: 'returned',
                event_date: new Date().toISOString(),
                details: `Item automaticamente registrado como devolvido por ${currentAssignment.employee_name} devido ao envio para manutenção.`,
                user_name: 'Usuário do Sistema'
            });
        }
        
        // Atualizar o status do item
        mockItems[itemIndex].status = 'in_maintenance';
        
        // Adicionar ao registro de eventos
        mockEventLog.push({
            id: mockEventLog.length + 1,
            item_id: parseInt(id),
            event_type: 'sent_to_maintenance',
            event_date: new Date().toISOString(),
            details: `Item enviado para manutenção. Motivo: ${maintenance_notes || 'Não especificado'}`,
            user_name: 'Usuário do Sistema'
        });
        
        res.json({ message: 'Item enviado para manutenção com sucesso!' });
    } catch (error) {
        console.error(`Erro ao enviar item ${id} para manutenção:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao enviar o item para manutenção.' });
    }
};

// Registrar retorno de manutenção
exports.returnFromMaintenance = async (req, res) => {
    const { id } = req.params;
    const { return_status, maintenance_result } = req.body;
    
    try {
        // Encontrar o item na lista mockada
        const itemIndex = mockItems.findIndex(item => item.id === parseInt(id));
        
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item não encontrado.' });
        }
        
        // Verificar se o item está em manutenção
        if (mockItems[itemIndex].status !== 'in_maintenance') {
            return res.status(400).json({ 
                message: 'Este item não está registrado como "Em Manutenção" atualmente.' 
            });
        }
        
        // Atualizar o status do item
        mockItems[itemIndex].status = return_status || 'available';
        
        // Adicionar ao registro de eventos
        mockEventLog.push({
            id: mockEventLog.length + 1,
            item_id: parseInt(id),
            event_type: 'returned_from_maintenance',
            event_date: new Date().toISOString(),
            details: `Item retornou da manutenção. Resultado: ${maintenance_result || 'Não especificado'}. Novo status: ${return_status || 'available'}`,
            user_name: 'Usuário do Sistema'
        });
        
        res.json({ message: 'Retorno da manutenção registrado com sucesso!' });
    } catch (error) {
        console.error(`Erro ao registrar retorno de manutenção do item ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao registrar o retorno da manutenção.' });
    }
};

// Marcar item como danificado
exports.markAsDamaged = async (req, res) => {
    const { id } = req.params;
    const { damage_notes } = req.body;
    
    try {
        // Encontrar o item na lista mockada
        const itemIndex = mockItems.findIndex(item => item.id === parseInt(id));
        
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item não encontrado.' });
        }
        
        // Se o item estiver atribuído, registrar a devolução automaticamente
        if (mockItems[itemIndex].status === 'in_use' && mockItems[itemIndex].current_assignment) {
            const currentAssignment = { ...mockItems[itemIndex].current_assignment };
            
            // Remover a atribuição atual
            mockItems[itemIndex].current_assignment = null;
            
            // Atualizar o histórico de atribuições
            const assignmentIndex = mockAssignmentHistory.findIndex(
                a => a.item_id === parseInt(id) && a.employee_id === currentAssignment.employee_id && !a.return_date
            );
            
            if (assignmentIndex !== -1) {
                mockAssignmentHistory[assignmentIndex].return_date = new Date().toISOString().split('T')[0];
            }
            
            // Adicionar ao registro de eventos a devolução automática
            mockEventLog.push({
                id: mockEventLog.length + 1,
                item_id: parseInt(id),
                event_type: 'returned',
                event_date: new Date().toISOString(),
                details: `Item automaticamente registrado como devolvido por ${currentAssignment.employee_name} devido à marcação como danificado.`,
                user_name: 'Usuário do Sistema'
            });
        }
        
        // Atualizar o status do item
        mockItems[itemIndex].status = 'damaged';
        
        // Adicionar ao registro de eventos
        mockEventLog.push({
            id: mockEventLog.length + 1,
            item_id: parseInt(id),
            event_type: 'marked_damaged',
            event_date: new Date().toISOString(),
            details: `Item marcado como danificado. Detalhes: ${damage_notes || 'Não especificado'}`,
            user_name: 'Usuário do Sistema'
        });
        
        res.json({ message: 'Item marcado como danificado com sucesso!' });
    } catch (error) {
        console.error(`Erro ao marcar item ${id} como danificado:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao marcar o item como danificado.' });
    }
};

// Dar baixa/descartar item
exports.discardItem = async (req, res) => {
    const { id } = req.params;
    const { discard_reason } = req.body;
    
    try {
        // Encontrar o item na lista mockada
        const itemIndex = mockItems.findIndex(item => item.id === parseInt(id));
        
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item não encontrado.' });
        }
        
        // Se o item estiver atribuído, registrar a devolução automaticamente
        if (mockItems[itemIndex].status === 'in_use' && mockItems[itemIndex].current_assignment) {
            const currentAssignment = { ...mockItems[itemIndex].current_assignment };
            
            // Remover a atribuição atual
            mockItems[itemIndex].current_assignment = null;
            
            // Atualizar o histórico de atribuições
            const assignmentIndex = mockAssignmentHistory.findIndex(
                a => a.item_id === parseInt(id) && a.employee_id === currentAssignment.employee_id && !a.return_date
            );
            
            if (assignmentIndex !== -1) {
                mockAssignmentHistory[assignmentIndex].return_date = new Date().toISOString().split('T')[0];
            }
            
            // Adicionar ao registro de eventos a devolução automática
            mockEventLog.push({
                id: mockEventLog.length + 1,
                item_id: parseInt(id),
                event_type: 'returned',
                event_date: new Date().toISOString(),
                details: `Item automaticamente registrado como devolvido por ${currentAssignment.employee_name} devido à baixa/descarte.`,
                user_name: 'Usuário do Sistema'
            });
        }
        
        // Atualizar o status do item
        mockItems[itemIndex].status = 'discarded';
        
        // Adicionar ao registro de eventos
        mockEventLog.push({
            id: mockEventLog.length + 1,
            item_id: parseInt(id),
            event_type: 'discarded',
            event_date: new Date().toISOString(),
            details: `Item dado como baixa/descartado. Motivo: ${discard_reason || 'Não especificado'}`,
            user_name: 'Usuário do Sistema'
        });
        
        res.json({ message: 'Item dado como baixa/descartado com sucesso!' });
    } catch (error) {
        console.error(`Erro ao dar baixa no item ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao dar baixa no item.' });
    }
};

// Executar auditoria inteligente
exports.auditItem = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Encontrar o item na lista mockada
        const itemIndex = mockItems.findIndex(item => item.id === parseInt(id));
        
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item não encontrado.' });
        }
        
        const item = mockItems[itemIndex];
        
        // Simular uma análise inteligente com base nos dados do item
        let diagnosis = '';
        let recommendation = '';
        let needsAttention = false;
        
        // Lógica simples para simular análise
        const acquisitionDate = new Date(item.acquisition_date);
        const today = new Date();
        const itemAgeYears = (today - acquisitionDate) / (1000 * 60 * 60 * 24 * 365);
        
        if (itemAgeYears > 3 && (item.status === 'in_use' || item.status === 'available')) {
            diagnosis = 'Este equipamento tem mais de 3 anos de uso, o que pode indicar possível obsolescência técnica.';
            recommendation = 'Considere programar uma avaliação técnica para verificar se o equipamento ainda atende às necessidades atuais.';
            needsAttention = true;
        } else if (item.status === 'damaged') {
            diagnosis = 'Este item está registrado como danificado e não está em processo de manutenção.';
            recommendation = 'Recomenda-se avaliar se vale a pena o reparo ou se é mais viável dar baixa no item.';
            needsAttention = true;
        } else if (item.status === 'in_maintenance') {
            // Verificar quanto tempo está em manutenção
            const maintenanceEvent = mockEventLog
                .filter(e => e.item_id === parseInt(id) && e.event_type === 'sent_to_maintenance')
                .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))[0];
                
            if (maintenanceEvent) {
                const maintenanceDate = new Date(maintenanceEvent.event_date);
                const daysInMaintenance = Math.floor((today - maintenanceDate) / (1000 * 60 * 60 * 24));
                
                if (daysInMaintenance > 30) {
                    diagnosis = `Este item está em manutenção há ${daysInMaintenance} dias, o que excede o tempo esperado.`;
                    recommendation = 'Entre em contato com o serviço de manutenção para verificar o status e possível previsão de retorno.';
                    needsAttention = true;
                }
            }
        }
        
        // Se não encontrou nenhum problema específico
        if (!needsAttention) {
            diagnosis = 'Este item não apresenta sinais de problemas com base nos dados disponíveis.';
            recommendation = 'Continue com o monitoramento regular.';
        }
        
        // Adicionar ao registro de eventos
        mockEventLog.push({
            id: mockEventLog.length + 1,
            item_id: parseInt(id),
            event_type: 'audited',
            event_date: new Date().toISOString(),
            details: `Auditoria inteligente realizada. Resultado: ${needsAttention ? 'Requer atenção' : 'Normal'}`,
            user_name: 'Usuário do Sistema'
        });
        
        res.json({
            message: 'Auditoria realizada com sucesso!',
            audit_result: {
                diagnosis,
                recommendation,
                needs_attention: needsAttention,
                audit_date: new Date().toLocaleString('pt-BR')
            }
        });
    } catch (error) {
        console.error(`Erro ao realizar auditoria do item ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao realizar a auditoria.' });
    }
}; 