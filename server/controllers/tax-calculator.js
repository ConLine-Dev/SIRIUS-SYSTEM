const { executeQuery } = require('../connect/mysql');

const getCollaboratorId = (req) => {
    try {
        if (req.headers['x-user']) {
            const user = JSON.parse(req.headers['x-user']);
    
            return (user && user.system_collaborator_id) ? user.system_collaborator_id : null;
        }
    } catch (error) {
        console.error('Falha ao parsear o cabeçalho x-user:', error);
    }
    return 1; // Fallback para ID 1 se o cabeçalho não existir ou falhar
};

// Obter histórico de cálculos do banco de dados
exports.getHistory = async (req, res) => {
    try {
        const sql = `
            SELECT 
                h.*,
                CONCAT(c.name, ' ', c.family_name) AS authorName
            FROM tax_calc_history h
            JOIN collaborators c ON h.collaborator_id = c.id
            ORDER BY h.id DESC
        `;
        const history = await executeQuery(sql);
        res.json(history);
    } catch (error) {
        console.error('Erro ao buscar histórico de cálculos:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar o histórico.' });
    }
};

// Salvar um novo cálculo no banco de dados
exports.saveCalculation = async (req, res) => {
    const { type, productValue, rate, taxAmount, totalAmount, notes, reducedBase } = req.body;
    const collaboratorId = getCollaboratorId(req);

    // Validação básica
    if (!type || productValue === undefined || rate === undefined || taxAmount === undefined || totalAmount === undefined) {
        return res.status(400).json({ message: 'Dados do cálculo inválidos.' });
    }

    try {
        const sql = `
            INSERT INTO tax_calc_history 
            (collaborator_id, type, productValue, rate, reducedBase, taxAmount, totalAmount, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [collaboratorId, type, productValue, rate, reducedBase, taxAmount, totalAmount, notes];
        
        const result = await executeQuery(sql, params);

        res.status(201).json({ message: 'Cálculo salvo com sucesso!', id: result.insertId });
    } catch (error) {
        console.error('Erro ao salvar cálculo:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao salvar o cálculo.' });
    }
};

// Limpar o histórico de cálculos do banco de dados
exports.clearHistory = async (req, res) => {
    try {
        await executeQuery('DELETE FROM tax_calc_history');
        res.json({ message: 'Histórico de cálculos limpo com sucesso.' });
    } catch (error) {
        console.error('Erro ao limpar histórico:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao limpar o histórico.' });
    }
};

// Deletar um registro de histórico específico
exports.deleteHistoryEntry = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await executeQuery('DELETE FROM tax_calc_history WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Registro não encontrado.' });
        }
        res.json({ message: 'Registro de histórico deletado com sucesso.' });
    } catch (error) {
        console.error(`Erro ao deletar o registro de histórico ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao deletar o registro.' });
    }
};

// Obter as configurações do usuário
exports.getSettings = async (req, res) => {
    const collaboratorId = getCollaboratorId(req);

    try {
        const sql = 'SELECT defaultAdValoremRate, defaultIcmsRate, defaultIcmsReducedBase FROM tax_calc_settings WHERE collaborator_id = ?';
        const settings = await executeQuery(sql, [collaboratorId]);

        if (settings.length > 0) {
            res.json(settings[0]);
        } else {
            // Retorna configurações padrão se o usuário ainda não tiver salvo nenhuma
            res.json({
                defaultAdValoremRate: 0.13,
                defaultIcmsRate: 12.00,
                defaultIcmsReducedBase: 88.00
            });
        }
    } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar as configurações.' });
    }
};

// Salvar (criar/atualizar) as configurações do usuário
exports.saveSettings = async (req, res) => {
    const collaboratorId = getCollaboratorId(req);
    const { defaultAdValoremRate, defaultIcmsRate, defaultIcmsReducedBase } = req.body;

    if (defaultAdValoremRate === undefined || defaultIcmsRate === undefined || defaultIcmsReducedBase === undefined) {
        return res.status(400).json({ message: 'Dados de configurações inválidos.' });
    }

    try {
        const sql = `
            INSERT INTO tax_calc_settings (collaborator_id, defaultAdValoremRate, defaultIcmsRate, defaultIcmsReducedBase)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                defaultAdValoremRate = VALUES(defaultAdValoremRate),
                defaultIcmsRate = VALUES(defaultIcmsRate),
                defaultIcmsReducedBase = VALUES(defaultIcmsReducedBase)
        `;
        const params = [collaboratorId, defaultAdValoremRate, defaultIcmsRate, defaultIcmsReducedBase];

        await executeQuery(sql, params);

        res.json({ message: 'Configurações salvas com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao salvar as configurações.' });
    }
}; 