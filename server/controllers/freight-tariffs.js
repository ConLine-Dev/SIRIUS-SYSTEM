const { executeQuery } = require('../connect/mysql');
const XLSX = require('xlsx');
const multer = require('multer');
const path = require('path');

// Configuração do multer para upload de arquivos
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.xlsx' || ext === '.xls') {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos Excel são permitidos'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limite
    }
});

// Middleware para upload de Excel
exports.uploadExcel = upload.single('excel');

// Helper function to get the author ID from the x-user header.
const getAuthorIdFromHeader = (req) => {
    try {
        if (req.headers['x-user']) {
            const user = JSON.parse(req.headers['x-user']);
            if (user && user.system_collaborator_id) {
                return user.system_collaborator_id;
            }
        }
    } catch (error) {
        console.error('Failed to parse x-user header to get collaborator ID:', error);
    }
    // Fallback ID (e.g., "System" user) if header is not found or fails.
    return 1;
};


//================================================================================================
// Locations Management
//================================================================================================
exports.getLocations = async (req, res) => {
    try {
        const locations = await executeQuery('SELECT * FROM ft_locations ORDER BY name');
        res.status(200).json(locations);
    } catch (error) {
        console.error('Erro ao buscar localizações:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar localizações.' });
    }
};

exports.createLocation = async (req, res) => {
    const { name, type } = req.body;
    if (!name || !type) {
        return res.status(400).json({ message: 'Nome e tipo são obrigatórios.' });
    }

    try {
        const result = await executeQuery('INSERT INTO ft_locations (name, type) VALUES (?, ?)', [name, type]);
        res.status(201).json({ id: result.insertId, name, type });
    } catch (error) {
        console.error('Erro ao criar localização:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao criar localização.' });
    }
};

exports.updateLocation = async (req, res) => {
    const { id } = req.params;
    const { name, type } = req.body;
    if (!name || !type) {
        return res.status(400).json({ message: 'Nome e tipo são obrigatórios.' });
    }

    try {
        const result = await executeQuery('UPDATE ft_locations SET name = ?, type = ? WHERE id = ?', [name, type, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Localização não encontrada.' });
        }
        res.status(200).json({ message: 'Localização atualizada com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar localização:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar localização.' });
    }
};

exports.deleteLocation = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await executeQuery('DELETE FROM ft_locations WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Localização não encontrada.' });
        }
        res.status(200).json({ message: 'Localização excluída com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir localização:', error);
        // Tratar erro de chave estrangeira
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ message: 'Não é possível excluir a localização, pois ela está sendo usada em uma ou mais tarifas.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao excluir localização.' });
    }
};


//================================================================================================
// Agents Management
//================================================================================================
exports.getAgents = async (req, res) => {
    try {
        const agents = await executeQuery('SELECT * FROM ft_agents ORDER BY name');
        res.status(200).json(agents);
    } catch (error) {
        console.error('Erro ao buscar agentes:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar agentes.' });
    }
};

exports.createAgent = async (req, res) => {
    const { name, contact_person, contact_email, contact_phone } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'O nome do agente é obrigatório.' });
    }

    try {
        const result = await executeQuery(
            'INSERT INTO ft_agents (name, contact_person, contact_email, contact_phone) VALUES (?, ?, ?, ?)',
            [name, contact_person, contact_email, contact_phone]
        );
        res.status(201).json({ id: result.insertId, name, contact_person, contact_email, contact_phone });
    } catch (error) {
        console.error('Erro ao criar agente:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao criar agente.' });
    }
};

exports.updateAgent = async (req, res) => {
    const { id } = req.params;
    const { name, contact_person, contact_email, contact_phone } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'O nome do agente é obrigatório.' });
    }

    try {
        const result = await executeQuery(
            'UPDATE ft_agents SET name = ?, contact_person = ?, contact_email = ?, contact_phone = ? WHERE id = ?',
            [name, contact_person, contact_email, contact_phone, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Agente não encontrado.' });
        }
        res.status(200).json({ message: 'Agente atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar agente:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar agente.' });
    }
};

exports.deleteAgent = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await executeQuery('DELETE FROM ft_agents WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Agente não encontrado.' });
        }
        res.status(200).json({ message: 'Agente excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir agente:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ message: 'Não é possível excluir o agente, pois ele está sendo usado em uma ou mais tarifas.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao excluir agente.' });
    }
};


//================================================================================================
// Modalities Management
//================================================================================================
exports.getModalities = async (req, res) => {
    try {
        const modalities = await executeQuery('SELECT * FROM ft_modalities ORDER BY name');
        res.status(200).json(modalities);
    } catch (error) {
        console.error('Erro ao buscar modalidades:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar modalidades.' });
    }
};

exports.createModality = async (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'O nome da modalidade é obrigatório.' });
    }
    try {
        const result = await executeQuery('INSERT INTO ft_modalities (name, description) VALUES (?, ?)', [name, description]);
        res.status(201).json({ id: result.insertId, name, description });
    } catch (error) {
        console.error('Erro ao criar modalidade:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Já existe uma modalidade com este nome.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao criar modalidade.' });
    }
};

exports.updateModality = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'O nome da modalidade é obrigatório.' });
    }
    try {
        const result = await executeQuery('UPDATE ft_modalities SET name = ?, description = ? WHERE id = ?', [name, description, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Modalidade não encontrada.' });
        }
        res.status(200).json({ message: 'Modalidade atualizada com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar modalidade:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Já existe uma modalidade com este nome.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar modalidade.' });
    }
};

exports.deleteModality = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await executeQuery('DELETE FROM ft_modalities WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Modalidade não encontrada.' });
        }
        res.status(200).json({ message: 'Modalidade excluída com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir modalidade:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ message: 'Não é possível excluir a modalidade, pois ela está sendo usada em um ou mais tipos de container ou tarifas.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao excluir modalidade.' });
    }
};


//================================================================================================
// Container Types Management
//================================================================================================
exports.getContainerTypes = async (req, res) => {
    try {
        const query = `
            SELECT ct.*, GROUP_CONCAT(m.name) as modality_names
            FROM ft_container_types ct
            LEFT JOIN ft_modalities m ON FIND_IN_SET(m.id, ct.applicable_modalities)
            GROUP BY ct.id
            ORDER BY ct.name;
        `;
        const types = await executeQuery(query);
        res.status(200).json(types);
    } catch (error) {
        console.error('Erro ao buscar tipos de container:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar tipos de container.' });
    }
};

exports.createContainerType = async (req, res) => {
    const { name, applicable_modalities } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'O nome do tipo de container é obrigatório.' });
    }
    const modalitiesStr = Array.isArray(applicable_modalities) ? applicable_modalities.join(',') : '';
    try {
        const result = await executeQuery(
            'INSERT INTO ft_container_types (name, applicable_modalities) VALUES (?, ?)',
            [name, modalitiesStr]
        );
        res.status(201).json({ id: result.insertId, name, applicable_modalities: modalitiesStr });
    } catch (error) {
        console.error('Erro ao criar tipo de container:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao criar tipo de container.' });
    }
};

exports.updateContainerType = async (req, res) => {
    const { id } = req.params;
    const { name, applicable_modalities } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'O nome do tipo de container é obrigatório.' });
    }
    const modalitiesStr = Array.isArray(applicable_modalities) ? applicable_modalities.join(',') : '';
    try {
        const result = await executeQuery(
            'UPDATE ft_container_types SET name = ?, applicable_modalities = ? WHERE id = ?',
            [name, modalitiesStr, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tipo de container não encontrado.' });
        }
        res.status(200).json({ message: 'Tipo de container atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar tipo de container:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar tipo de container.' });
    }
};

exports.deleteContainerType = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await executeQuery('DELETE FROM ft_container_types WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tipo de container não encontrado.' });
        }
        res.status(200).json({ message: 'Tipo de container excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir tipo de container:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ message: 'Não é possível excluir o tipo, pois ele está sendo usado em uma ou mais tarifas.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao excluir tipo de container.' });
    }
};


//================================================================================================
// Tariffs Management
//================================================================================================
exports.getTariffs = async (req, res) => {
    try {
        const { origin, destination, modality, agent, shipowner, status } = req.query;

        const params = [];
        const whereClauses = [];

        if (origin) {
            whereClauses.push('t.origin_id = ?');
            params.push(origin);
        }
        if (destination) {
            whereClauses.push('t.destination_id = ?');
            params.push(destination);
        }
        if (modality) {
            whereClauses.push('t.modality_id = ?');
            params.push(modality);
        }
        if (agent) {
            whereClauses.push('t.agent_id = ?');
            params.push(agent);
        }
        if (shipowner) {
            whereClauses.push('t.shipowner_id = ?');
            params.push(shipowner);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        
        let havingString = '';
        if (status && status !== 'Todos') {
            const statusValues = status.split(',').map(s => s.trim()).filter(s => s);
            if (statusValues.length > 0) {
                const placeholders = statusValues.map(() => '?').join(',');
                havingString = `HAVING status IN (${placeholders})`;
                params.push(...statusValues);
            }
        }

        const baseQuery = `
            SELECT 
                t.*,
                orig.name AS origin_name,
                dest.name AS destination_name,
                modality.name AS modality_name,
                agent.name AS agent_name,
                shipowner.name AS shipowner_name,
                ct.name AS container_type_name,
                t.free_time,
                t.freight_cost,
                CASE
                    WHEN t.validity_end_date < CURDATE() THEN 'Expirada'
                    WHEN t.validity_end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 15 DAY) THEN 'Expira Breve'
                    ELSE 'Ativa'
                END AS status
            FROM ft_tariffs t
            JOIN ft_locations orig ON t.origin_id = orig.id
            JOIN ft_locations dest ON t.destination_id = dest.id
            JOIN ft_modalities modality ON t.modality_id = modality.id
            JOIN ft_agents agent ON t.agent_id = agent.id
            LEFT JOIN ft_agents shipowner ON t.shipowner_id = shipowner.id
            LEFT JOIN ft_container_types ct ON t.container_type_id = ct.id
            LEFT JOIN ft_tariffs_surcharges s ON t.id = s.tariff_id
            ${whereString}
            GROUP BY t.id
            ${havingString}
            ORDER BY t.validity_start_date DESC;
        `;

        let tariffs = await executeQuery(baseQuery, params);
        
        // Buscar todas as sobretaxas em lote para as tarifas retornadas
        if (tariffs.length > 0) {
            const tariffIds = tariffs.map(t => t.id);
            const placeholders = tariffIds.map(() => '?').join(',');
            const surchargesAll = await executeQuery(
                `SELECT * FROM ft_tariffs_surcharges WHERE tariff_id IN (${placeholders})`,
                tariffIds
            );
            // Agrupar por tariff_id
            const surchargesByTariff = {};
            for (const s of surchargesAll) {
                if (!surchargesByTariff[s.tariff_id]) surchargesByTariff[s.tariff_id] = [];
                surchargesByTariff[s.tariff_id].push({...s, cost: s.value});
            }
            // Atribuir para cada tarifa
            for (const tariff of tariffs) {
                tariff.surcharges = surchargesByTariff[tariff.id] || [];
            }
        }

        res.status(200).json(tariffs);
    } catch (error) {
        console.error('Erro ao buscar tarifas:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar tarifas.' });
    }
};

// Nova função específica para consulta comercial (apenas tarifas ativas)
exports.getCommercialTariffs = async (req, res) => {
    try {
        const { origin, destination, modality, agent, shipowner, container_type } = req.query;

        const params = [];
        const whereClauses = [];

        if (origin) {
            whereClauses.push('t.origin_id = ?');
            params.push(origin);
        }
        if (destination) {
            whereClauses.push('t.destination_id = ?');
            params.push(destination);
        }
        if (modality) {
            whereClauses.push('t.modality_id = ?');
            params.push(modality);
        }
        if (agent) {
            whereClauses.push('t.agent_id = ?');
            params.push(agent);
        }
        if (shipowner) {
            whereClauses.push('t.shipowner_id = ?');
            params.push(shipowner);
        }
        if (container_type) {
            whereClauses.push('t.container_type_id = ?');
            params.push(container_type);
        }

        // Adicionar filtro para apenas tarifas ativas e que não expiraram
        whereClauses.push('t.validity_end_date >= CURDATE()');

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const baseQuery = `
            SELECT 
                t.*,
                orig.name AS origin_name,
                dest.name AS destination_name,
                modality.name AS modality_name,
                agent.name AS agent_name,
                shipowner.name AS shipowner_name,
                ct.name AS container_type_name,
                t.free_time,
                t.freight_cost,
                (
                  SELECT COUNT(*) FROM ft_tariffs_surcharges s WHERE s.tariff_id = t.id
                ) AS surcharge_count
            FROM ft_tariffs t
            JOIN ft_locations orig ON t.origin_id = orig.id
            JOIN ft_locations dest ON t.destination_id = dest.id
            JOIN ft_modalities modality ON t.modality_id = modality.id
            JOIN ft_agents agent ON t.agent_id = agent.id
            LEFT JOIN ft_agents shipowner ON t.shipowner_id = shipowner.id
            LEFT JOIN ft_container_types ct ON t.container_type_id = ct.id
            ${whereString}
            ORDER BY 
                CASE
                    WHEN t.validity_end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 15 DAY) THEN 1
                    ELSE 0
                END,
                t.freight_cost ASC;
        `;

        let tariffs = await executeQuery(baseQuery, params);
        // Removido: busca detalhada de sobretaxas

        res.status(200).json(tariffs);
    } catch (error) {
        console.error('Erro ao buscar tarifas comerciais:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar tarifas comerciais.' });
    }
};

exports.getTariffById = async (req, res) => {
    const { id } = req.params;
    try {
        const tariffQuery = `
            SELECT 
                t.*,
                orig.name AS origin_name,
                dest.name AS destination_name,
                m.name AS modality_name,
                ct.name AS container_type_name,
                a.name AS agent_name,
                s.name AS shipowner_name,
                t.free_time
            FROM ft_tariffs t
            LEFT JOIN ft_locations orig ON t.origin_id = orig.id
            LEFT JOIN ft_locations dest ON t.destination_id = dest.id
            LEFT JOIN ft_modalities m ON t.modality_id = m.id
            LEFT JOIN ft_container_types ct ON t.container_type_id = ct.id
            LEFT JOIN ft_agents a ON t.agent_id = a.id
            LEFT JOIN ft_agents s ON t.shipowner_id = s.id
            WHERE t.id = ?
        `;
        const tariffs = await executeQuery(tariffQuery, [id]);

        if (tariffs.length === 0) {
            return res.status(404).json({ message: 'Tarifa não encontrada.' });
        }

        const tariff = tariffs[0];
        const surcharges = await executeQuery('SELECT * FROM ft_tariffs_surcharges WHERE tariff_id = ?', [id]);
        tariff.surcharges = surcharges;

        res.status(200).json(tariff);
    } catch (error) {
        console.error('Erro ao buscar tarifa por ID:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar a tarifa.' });
    }
};

exports.createTariff = async (req, res, io) => {
    const {
        origin_id, destination_id, modality_id, container_type_id, agent_id, shipowner_id,
        validity_start_date, validity_end_date, freight_cost, freight_currency,
        transit_time, route_type, notes, surcharges, free_time
    } = req.body;

    // Validação básica
    if (!origin_id || !destination_id || !modality_id || !agent_id || !validity_start_date || !validity_end_date || !freight_cost || !freight_currency) {
        return res.status(400).json({ message: 'Campos obrigatórios da tarifa estão faltando.' });
    }

    try {
        const tariffSql = `
            INSERT INTO ft_tariffs (origin_id, destination_id, modality_id, container_type_id, agent_id, shipowner_id, validity_start_date, validity_end_date, freight_cost, freight_currency, transit_time, route_type, notes, free_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const tariffParams = [
            origin_id, destination_id, modality_id, container_type_id || null, agent_id, shipowner_id || null,
            validity_start_date, validity_end_date, freight_cost, freight_currency,
            transit_time || null, route_type || null, notes || null, free_time || null
        ];

        const result = await executeQuery(tariffSql, tariffParams);
        const tariffId = result.insertId;

        if (surcharges && Array.isArray(surcharges) && surcharges.length > 0) {
            const surchargeSql = 'INSERT INTO ft_tariffs_surcharges (tariff_id, name, value, currency) VALUES ?';
            const surchargeValues = surcharges.map(s => [tariffId, s.name, s.value, s.currency]);
            await executeQuery(surchargeSql, [surchargeValues]);
        }

        // Após criar, busca a tarifa completa para emitir via socket
        const createdTariff = await getTariffDataForSocket(tariffId);
        if (createdTariff) {
            io.emit('tariff_created', createdTariff);
        }

        res.status(201).json({ id: tariffId, message: 'Tarifa criada com sucesso!' });

    } catch (error) {
        console.error('Erro ao criar tarifa:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao criar a tarifa.' });
    }
};

exports.updateTariff = async (req, res, io) => {
    const { id } = req.params;
    const {
        origin_id, destination_id, modality_id, container_type_id, agent_id, shipowner_id,
        validity_start_date, validity_end_date, freight_cost, freight_currency,
        transit_time, route_type, notes, surcharges, free_time
    } = req.body;

    if (!origin_id || !destination_id || !modality_id || !agent_id || !validity_start_date || !validity_end_date || !freight_cost || !freight_currency) {
        return res.status(400).json({ message: 'Campos obrigatórios da tarifa estão faltando.' });
    }

    try {
        const tariffSql = `
            UPDATE ft_tariffs SET
                origin_id = ?, destination_id = ?, modality_id = ?, container_type_id = ?, agent_id = ?, shipowner_id = ?,
                validity_start_date = ?, validity_end_date = ?, freight_cost = ?, freight_currency = ?,
                transit_time = ?, route_type = ?, notes = ?, free_time = ?
            WHERE id = ?
        `;
        const tariffParams = [
            origin_id, destination_id, modality_id, container_type_id || null, agent_id, shipowner_id || null,
            validity_start_date, validity_end_date, freight_cost, freight_currency,
            transit_time || null, route_type || null, notes || null, free_time || null,
            id
        ];

        const result = await executeQuery(tariffSql, tariffParams);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tarifa não encontrada para atualização.' });
        }

        // Excluir surcharges existentes
        await executeQuery('DELETE FROM ft_tariffs_surcharges WHERE tariff_id = ?', [id]);

        // Inserir os novos surcharges
        if (surcharges && Array.isArray(surcharges) && surcharges.length > 0) {
            const surchargeSql = 'INSERT INTO ft_tariffs_surcharges (tariff_id, name, value, currency) VALUES ?';
            const surchargeValues = surcharges.map(s => [id, s.name, s.value, s.currency]);
            await executeQuery(surchargeSql, [surchargeValues]);
        }

        // Após atualizar, busca a tarifa completa para emitir via socket
        const updatedTariff = await getTariffDataForSocket(id);
        if (updatedTariff) {
            io.emit('tariff_updated', updatedTariff);
        }

        res.status(200).json({ message: 'Tarifa atualizada com sucesso!' });

    } catch (error) {
        console.error('Erro ao atualizar tarifa:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar a tarifa.' });
    }
};

exports.deleteTariff = async (req, res, io) => {
    const { id } = req.params;
    try {
        const result = await executeQuery('DELETE FROM ft_tariffs WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tarifa não encontrada.' });
        }
        
        // Emite o evento de exclusão para os clientes
        io.emit('tariff_deleted', { id: id });

        res.status(200).json({ message: 'Tarifa excluída com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir tarifa:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao excluir a tarifa.' });
    }
};

// Função auxiliar para buscar os dados completos de uma tarifa para emissão via socket
async function getTariffDataForSocket(tariffId) {
    try {
        const query = `
            SELECT 
                t.*,
                orig.name AS origin_name,
                dest.name AS destination_name,
                modality.name AS modality_name,
                agent.name AS agent_name,
                shipowner.name AS shipowner_name,
                ct.name AS container_type_name,
                t.free_time,
                t.freight_cost,
                CASE
                    WHEN t.validity_end_date < CURDATE() THEN 'Expirada'
                    WHEN t.validity_end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 15 DAY) THEN 'Expira Breve'
                    ELSE 'Ativa'
                END AS status
            FROM ft_tariffs t
            LEFT JOIN ft_locations orig ON t.origin_id = orig.id
            LEFT JOIN ft_locations dest ON t.destination_id = dest.id
            LEFT JOIN ft_modalities modality ON t.modality_id = modality.id
            LEFT JOIN ft_agents agent ON t.agent_id = agent.id
            LEFT JOIN ft_agents shipowner ON t.shipowner_id = shipowner.id
            LEFT JOIN ft_container_types ct ON t.container_type_id = ct.id
            LEFT JOIN ft_tariffs_surcharges s ON t.id = s.tariff_id
            WHERE t.id = ?
            GROUP BY t.id;
        `;
        const tariffs = await executeQuery(query, [tariffId]);
        if (tariffs.length > 0) {
            const tariff = tariffs[0];
            const surcharges = await executeQuery('SELECT * FROM ft_tariffs_surcharges WHERE tariff_id = ?', [tariffId]);
            tariff.surcharges = surcharges.map(s => ({...s, cost: s.value}));
            return tariff;
        }
        return null;
    } catch (error) {
        console.error(`Erro ao buscar dados da tarifa ${tariffId} para socket:`, error);
        return null;
    }
}

//================================================================================================
// Metadata for Forms
//================================================================================================
exports.getFormData = async (req, res) => {
    try {
        const [locations, agents, modalities, container_types, currencies] = await Promise.all([
            executeQuery('SELECT id, name, type FROM ft_locations ORDER BY name'),
            executeQuery('SELECT id, name FROM ft_agents ORDER BY name'),
            executeQuery('SELECT id, name FROM ft_modalities ORDER BY name'),
            executeQuery('SELECT id, name, applicable_modalities FROM ft_container_types ORDER BY name'),
            executeQuery('SELECT code, name, symbol FROM ft_currencies ORDER BY FIELD(code, "USD", "EUR", "BRL") DESC, name ASC')
        ]);

        res.status(200).json({
            locations,
            agents,
            modalities,
            container_types,
            currencies
        });
    } catch (error) {
        console.error('Erro ao buscar dados para formulário:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar dados para o formulário.' });
    }
};

// Buscar análise de mercado real baseada em dados da base
exports.getMarketAnalysis = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

        // Análise de variação de preços nos últimos 30 dias
        const priceAnalysisQuery = `
            SELECT 
                AVG(CASE WHEN t.created_at >= ? THEN t.freight_cost END) as recent_avg_price,
                AVG(CASE WHEN t.created_at BETWEEN ? AND ? THEN t.freight_cost END) as previous_avg_price,
                COUNT(CASE WHEN t.created_at >= ? THEN 1 END) as recent_count,
                COUNT(CASE WHEN t.created_at BETWEEN ? AND ? THEN 1 END) as previous_count,
                COUNT(CASE WHEN t.validity_end_date >= CURDATE() THEN 1 END) as available_tariffs,
                COUNT(*) as total_tariffs
            FROM ft_tariffs t
        `;

        const priceData = await executeQuery(priceAnalysisQuery, [
            thirtyDaysAgo.toISOString().split('T')[0],
            sixtyDaysAgo.toISOString().split('T')[0],
            thirtyDaysAgo.toISOString().split('T')[0],
            thirtyDaysAgo.toISOString().split('T')[0],
            sixtyDaysAgo.toISOString().split('T')[0],
            thirtyDaysAgo.toISOString().split('T')[0]
        ]);

        // Calcular variação percentual
        let priceVariation = 0;
        if (priceData[0].recent_avg_price && priceData[0].previous_avg_price) {
            priceVariation = ((priceData[0].recent_avg_price - priceData[0].previous_avg_price) / priceData[0].previous_avg_price) * 100;
        }

        // Análise de disponibilidade
        const availabilityPercentage = (priceData[0].available_tariffs / priceData[0].total_tariffs) * 100;

        // Determinar tendência baseada em criação de novas tarifas
        let trend = 'Estável';
        if (priceData[0].recent_count > priceData[0].previous_count * 1.2) {
            trend = 'Crescimento';
        } else if (priceData[0].recent_count < priceData[0].previous_count * 0.8) {
            trend = 'Declínio';
        }

        // Classificar disponibilidade
        let availabilityStatus = 'Alta';
        if (availabilityPercentage < 40) {
            availabilityStatus = 'Baixa';
        } else if (availabilityPercentage < 70) {
            availabilityStatus = 'Moderada';
        }

        res.status(200).json({
            success: true,
            analysis: {
                priceVariation: {
                    percentage: Math.round(priceVariation * 100) / 100,
                    trend: priceVariation > 0 ? 'increase' : priceVariation < 0 ? 'decrease' : 'stable'
                },
                availability: {
                    percentage: Math.round(availabilityPercentage),
                    status: availabilityStatus
                },
                trend: {
                    status: trend,
                    recentTariffs: priceData[0].recent_count,
                    previousTariffs: priceData[0].previous_count
                },
                totalTariffs: priceData[0].total_tariffs,
                availableTariffs: priceData[0].available_tariffs
            }
        });

    } catch (error) {
        console.error('Erro ao buscar análise de mercado:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            analysis: null
        });
    }
};

// Buscar rotas populares baseadas em dados históricos
exports.getPopularRoutes = async (req, res) => {
    try {
        const query = `
            SELECT 
                ol.name as origin,
                dl.name as destination,
                m.name as modality,
                t.origin_id,
                t.destination_id,
                t.modality_id,
                COUNT(*) as tariff_count,
                MIN(t.freight_cost) as min_price,
                AVG(t.freight_cost) as avg_price,
                MIN(CAST(SUBSTRING_INDEX(t.transit_time, ' ', 1) AS UNSIGNED)) as min_transit_days
            FROM ft_tariffs t
            LEFT JOIN ft_locations ol ON t.origin_id = ol.id
            LEFT JOIN ft_locations dl ON t.destination_id = dl.id
            LEFT JOIN ft_modalities m ON t.modality_id = m.id
            WHERE t.validity_end_date >= CURDATE()
            AND ol.name IS NOT NULL 
            AND dl.name IS NOT NULL
            GROUP BY t.origin_id, t.destination_id, t.modality_id
            HAVING tariff_count >= 2
            ORDER BY tariff_count DESC, min_price ASC
            LIMIT 10
        `;
        
        const routes = await executeQuery(query);
        
        // Processar os resultados para determinar os tipos de recomendação
        const processedRoutes = routes.map((row, index) => {
            let reason = 'Popular';
            let badgeClass = 'popular';
            let details = `${row.tariff_count} tarifas disponíveis`;
            
            // Determinar o tipo de recomendação baseado na posição e características
            if (index === 0) {
                reason = 'Popular';
                badgeClass = 'popular';
                details = `${row.tariff_count} tarifas disponíveis`;
            } else if (row.min_price === Math.min(...routes.map(r => r.min_price))) {
                reason = 'Economia';
                badgeClass = 'economy';
                details = `A partir de $${Math.round(row.min_price)}`;
            } else if (row.min_transit_days && row.min_transit_days <= 7) {
                reason = 'Velocidade';
                badgeClass = 'speed';
                details = `${row.min_transit_days} dias de trânsito`;
            }
            
            return {
                route: `${row.origin} → ${row.destination}`,
                reason,
                details,
                badgeClass,
                filters: {
                    origin: row.origin_id.toString(),
                    destination: row.destination_id.toString(),
                    modality: row.modality_id.toString()
                },
                stats: {
                    count: row.tariff_count,
                    minPrice: row.min_price,
                    avgPrice: row.avg_price,
                    minTransit: row.min_transit_days
                }
            };
        });
        
        res.status(200).json({
            success: true,
            routes: processedRoutes.slice(0, 6) // Limitar a 6 recomendações
        });
    } catch (error) {
        console.error('Erro ao buscar rotas populares:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            routes: [] // Retornar array vazio em caso de erro
        });
    }
};

//================================================================================================
// Excel Import/Export Functions
//================================================================================================

// Download do template Excel
exports.downloadExcelTemplate = async (req, res) => {
    try {
        // Buscar dados para preencher o template
        const [locations, agents, modalities, containerTypes, currencies] = await Promise.all([
            executeQuery('SELECT id, name, type FROM ft_locations ORDER BY name'),
            executeQuery('SELECT id, name FROM ft_agents ORDER BY name'),
            executeQuery('SELECT id, name FROM ft_modalities ORDER BY name'),
            executeQuery('SELECT id, name, applicable_modalities FROM ft_container_types ORDER BY name'),
            executeQuery('SELECT code, name FROM ft_currencies ORDER BY FIELD(code, "USD", "EUR", "BRL") DESC, name ASC')
        ]);

        // Criar workbook
        const wb = XLSX.utils.book_new();

        // Aba principal - Template de tarifas
        const templateData = [
            [
                'Origem', 'Destino', 'Modal', 'Agente', 'Armador', 'Tipo Container', 
                'Data Início (YYYY-MM-DD)', 'Data Fim (YYYY-MM-DD)', 'Custo Frete', 'Moeda', 
                'Tempo Trânsito', 'Tipo Rota', 'Notas', 'Free Time',
                'Sobretaxa 1 Nome', 'Sobretaxa 1 Valor', 'Sobretaxa 1 Moeda',
                'Sobretaxa 2 Nome', 'Sobretaxa 2 Valor', 'Sobretaxa 2 Moeda',
                'Sobretaxa 3 Nome', 'Sobretaxa 3 Valor', 'Sobretaxa 3 Moeda'
            ],
            [
                'Porto de Santos, Brasil', 'Porto de Shanghai, China', 'Marítimo', 'Agent Shipping Ltda', 'Maersk Line', '20\' Standard Dry Van (DV)', 
                '2024-12-01', '2024-12-31', '1200.00', 'USD', 
                '35 dias', 'Direto', 'Esta linha será importada como tarifa válida - substitua pelos seus dados', '14 dias',
                'THC Origem', '950.00', 'BRL',
                'THC Destino', '180.00', 'USD',
                'BAF', '250.00', 'USD'
            ]
        ];

        const wsTemplate = XLSX.utils.aoa_to_sheet(templateData);
        
        // Ajustar largura das colunas
        const colWidths = [
            { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 25 },
            { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 8 }, 
            { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 },
            { wch: 18 }, { wch: 12 }, { wch: 8 },
            { wch: 18 }, { wch: 12 }, { wch: 8 },
            { wch: 18 }, { wch: 12 }, { wch: 8 }
        ];
        wsTemplate['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, wsTemplate, 'Tarifas');

        // Aba de referência - Localizações
        const locationsData = [['ID', 'Nome', 'Tipo']];
        locations.forEach(loc => locationsData.push([loc.id, loc.name, loc.type]));
        const wsLocations = XLSX.utils.aoa_to_sheet(locationsData);
        XLSX.utils.book_append_sheet(wb, wsLocations, 'Localizações');

        // Aba de referência - Agentes
        const agentsData = [['ID', 'Nome']];
        agents.forEach(agent => agentsData.push([agent.id, agent.name]));
        const wsAgents = XLSX.utils.aoa_to_sheet(agentsData);
        XLSX.utils.book_append_sheet(wb, wsAgents, 'Agentes');

        // Aba de referência - Modalidades
        const modalitiesData = [['ID', 'Nome']];
        modalities.forEach(mod => modalitiesData.push([mod.id, mod.name]));
        const wsModalities = XLSX.utils.aoa_to_sheet(modalitiesData);
        XLSX.utils.book_append_sheet(wb, wsModalities, 'Modalidades');

        // Aba de referência - Tipos de Container
        const containerTypesData = [['ID', 'Nome', 'Modalidades Aplicáveis']];
        containerTypes.forEach(ct => containerTypesData.push([ct.id, ct.name, ct.applicable_modalities]));
        const wsContainerTypes = XLSX.utils.aoa_to_sheet(containerTypesData);
        XLSX.utils.book_append_sheet(wb, wsContainerTypes, 'Tipos Container');

        // Aba de referência - Moedas
        const currenciesData = [['Código', 'Nome']];
        currencies.forEach(curr => currenciesData.push([curr.code, curr.name]));
        const wsCurrencies = XLSX.utils.aoa_to_sheet(currenciesData);
        XLSX.utils.book_append_sheet(wb, wsCurrencies, 'Moedas');

        // Gerar buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Enviar arquivo
        res.setHeader('Content-Disposition', 'attachment; filename="template-tarifas-frete.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        console.error('Erro ao gerar template Excel:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao gerar template.' });
    }
};

// Processar importação de Excel
exports.processExcelImport = async (req, res) => {
    try {
        // Usar middleware de upload
        upload.single('excel')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ message: 'Erro no upload: ' + err.message });
            }

            if (!req.file) {
                return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
            }

            try {
                // Ler arquivo Excel
                const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                // Remover apenas o cabeçalho (primeira linha), mantendo a linha de exemplo
                const rows = data.slice(1);

                // Buscar dados de referência para validação
                const formData = await getFormDataForValidation();

                // Processar cada linha
                const processedData = [];
                const validationResults = [];

                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.every(cell => !cell)) continue; // Pular linhas vazias

                    const tariffData = parseExcelRow(row);
                    const validation = await validateTariffData(tariffData, formData);

                    processedData.push(tariffData);
                    validationResults.push(validation);
                }

                res.status(200).json({
                    success: true,
                    data: processedData,
                    validation: validationResults
                });

            } catch (parseError) {
                console.error('Erro ao processar Excel:', parseError);
                res.status(400).json({ message: 'Erro ao processar arquivo Excel. Verifique o formato.' });
            }
        });

    } catch (error) {
        console.error('Erro na importação Excel:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// Validar linha individual
exports.validateExcelRow = async (req, res) => {
    try {
        const { rowData, formData } = req.body;
        const validation = await validateTariffData(rowData, formData);
        res.status(200).json(validation);
    } catch (error) {
        console.error('Erro ao validar linha:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// Confirmar importação
exports.confirmExcelImport = async (req, res) => {
    try {
        const { validItems } = req.body;
        let imported = 0;

        for (const item of validItems) {
            try {
                const tariffSql = `
                    INSERT INTO ft_tariffs (origin_id, destination_id, modality_id, container_type_id, agent_id, shipowner_id,
                                           validity_start_date, validity_end_date, freight_cost, freight_currency, 
                                           transit_time, route_type, notes, free_time)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                const tariffParams = [
                    item.origin_id, item.destination_id, item.modality_id, 
                    item.container_type_id || null, item.agent_id, item.shipowner_id || null,
                    item.validity_start_date, item.validity_end_date, 
                    item.freight_cost, item.freight_currency,
                    item.transit_time || null, item.route_type || null, item.notes || null, item.free_time || null
                ];

                const result = await executeQuery(tariffSql, tariffParams);
                const tariffId = result.insertId;

                // Inserir sobretaxas se existirem
                if (item.surcharges && item.surcharges.length > 0) {
                    const surchargeSql = 'INSERT INTO ft_tariffs_surcharges (tariff_id, name, value, currency) VALUES ?';
                    const surchargeValues = item.surcharges.map(s => [tariffId, s.name, s.value, s.currency]);
                    await executeQuery(surchargeSql, [surchargeValues]);
                }

                imported++;
            } catch (itemError) {
                console.error('Erro ao importar item:', itemError);
                // Continuar com os próximos itens
            }
        }

        res.status(200).json({
            success: true,
            imported: imported,
            total: validItems.length
        });

    } catch (error) {
        console.error('Erro na confirmação da importação:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// Funções auxiliares

async function getFormDataForValidation() {
    const [locations, agents, modalities, container_types, currencies] = await Promise.all([
        executeQuery('SELECT id, name, type FROM ft_locations ORDER BY name'),
        executeQuery('SELECT id, name FROM ft_agents ORDER BY name'),
        executeQuery('SELECT id, name FROM ft_modalities ORDER BY name'),
        executeQuery('SELECT id, name, applicable_modalities FROM ft_container_types ORDER BY name'),
        executeQuery('SELECT code, name, symbol FROM ft_currencies ORDER BY name')
    ]);

    return { locations, agents, modalities, container_types, currencies };
}

function parseExcelRow(row) {
    const surcharges = [];
    
    // Parse sobretaxas (colunas 13, 14, 15 para primeira sobretaxa, etc.)
    for (let i = 0; i < 3; i++) {
        const nameIdx = 14 + (i * 3);
        const valueIdx = 15 + (i * 3);
        const currencyIdx = 16 + (i * 3);
        
        if (row[nameIdx] && row[valueIdx] && row[currencyIdx]) {
            surcharges.push({
                name: row[nameIdx],
                value: parseFloat(row[valueIdx]) || 0,
                currency: row[currencyIdx]
            });
        }
    }

    return {
        origin: row[0] || '',
        destination: row[1] || '',
        modality: row[2] || '',
        agent: row[3] || '',
        shipowner: row[4] || '',
        container_type: row[5] || '',
        validity_start_date: parseExcelDate(row[6]),
        validity_end_date: parseExcelDate(row[7]),
        freight_cost: parseFloat(row[8]) || 0,
        freight_currency: row[9] || '',
        transit_time: row[10] || '',
        route_type: row[11] || '',
        notes: row[12] || '',
        free_time: row[13] || '',
        surcharges: surcharges
    };
}

function parseExcelDate(dateValue) {
    if (!dateValue) return null;
    
    // Se já está no formato YYYY-MM-DD
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
    }
    
    // Se é número (Excel date serial)
    if (typeof dateValue === 'number') {
        const date = XLSX.SSF.parse_date_code(dateValue);
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    
    // Tentar parse como data
    try {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    } catch (e) {
        // Ignorar erro
    }
    
    return null;
}

async function validateTariffData(data, formData) {
    const issues = [];
    let status = 'valid';

    // Validar campos obrigatórios
    if (!data.origin) {
        issues.push('Origem é obrigatória');
        status = 'error';
    } else {
        // Buscar ID da origem
        const origin = formData.locations.find(l => l.name === data.origin && l.type !== 'Destino');
        if (origin) {
            data.origin_id = origin.id;
        } else {
            issues.push('Origem não encontrada');
            status = 'error';
        }
    }

    if (!data.destination) {
        issues.push('Destino é obrigatório');
        status = 'error';
    } else {
        const destination = formData.locations.find(l => l.name === data.destination && l.type !== 'Origem');
        if (destination) {
            data.destination_id = destination.id;
        } else {
            issues.push('Destino não encontrado');
            status = 'error';
        }
    }

    if (!data.modality) {
        issues.push('Modal é obrigatório');
        status = 'error';
    } else {
        const modality = formData.modalities.find(m => m.name === data.modality);
        if (modality) {
            data.modality_id = modality.id;
        } else {
            issues.push('Modal não encontrado');
            status = 'error';
        }
    }

    if (!data.agent) {
        issues.push('Agente é obrigatório');
        status = 'error';
    } else {
        const agent = formData.agents.find(a => a.name === data.agent);
        if (agent) {
            data.agent_id = agent.id;
        } else {
            issues.push('Agente não encontrado');
            status = 'error';
        }
    }

    // Validar armador (tornando obrigatório)
    if (!data.shipowner) {
        issues.push('Armador é obrigatório');
        status = 'error';
    } else {
        const shipowner = formData.agents.find(a => a.name === data.shipowner);
        if (shipowner) {
            data.shipowner_id = shipowner.id;
        } else {
            issues.push('Armador não encontrado');
            status = 'error';
        }
    }

    // Validar tipo de container (obrigatório)
    if (!data.container_type) {
        issues.push('Tipo de container é obrigatório');
        status = 'error';
    } else {
        const containerType = formData.container_types.find(ct => ct.name === data.container_type);
        if (containerType) {
            data.container_type_id = containerType.id;
        } else {
            issues.push('Tipo de container não encontrado');
            status = 'error';
        }
    }

    // Validar datas
    if (!data.validity_start_date) {
        issues.push('Data de início é obrigatória');
        status = 'error';
    }

    if (!data.validity_end_date) {
        issues.push('Data de fim é obrigatória');
        status = 'error';
    }

    if (data.validity_start_date && data.validity_end_date) {
        const startDate = new Date(data.validity_start_date);
        const endDate = new Date(data.validity_end_date);
        
        if (startDate >= endDate) {
            issues.push('Data de fim deve ser posterior à data de início');
            status = 'error';
        }
    }

    // Validar custo
    if (!data.freight_cost || data.freight_cost <= 0) {
        issues.push('Custo do frete deve ser maior que zero');
        status = 'error';
    }

    // Validar moeda
    if (!data.freight_currency) {
        issues.push('Moeda é obrigatória');
        status = 'error';
    } else {
        const currency = formData.currencies.find(c => c.code === data.freight_currency);
        if (!currency) {
            issues.push('Moeda não encontrada');
            status = 'error';
        }
    }

    return {
        status: status,
        issues: issues
    };
} 

// Nova função específica para DataTable server-side
exports.getTariffsDataTable = async (req, res) => {
    try {
        const {
            draw, start, length, search, order,
            origin, destination, modality, agent, shipowner, status
        } = req.query;

        // Parâmetros de paginação
        const pageStart = parseInt(start) || 0;
        const pageLength = parseInt(length) || 10;
        const searchValue = search?.value || '';

        // Construir WHERE clauses para filtros
        const params = [];
        const whereClauses = [];

        if (origin) {
            whereClauses.push('t.origin_id = ?');
            params.push(origin);
        }
        if (destination) {
            whereClauses.push('t.destination_id = ?');
            params.push(destination);
        }
        if (modality) {
            whereClauses.push('t.modality_id = ?');
            params.push(modality);
        }
        if (agent) {
            whereClauses.push('t.agent_id = ?');
            params.push(agent);
        }
        if (shipowner) {
            whereClauses.push('t.shipowner_id = ?');
            params.push(shipowner);
        }

        // Adicionar busca global se fornecida
        if (searchValue) {
            console.log('Pesquisando por:', searchValue);
            whereClauses.push(`(
                orig.name LIKE ? OR 
                dest.name LIKE ? OR 
                modality.name LIKE ? OR 
                agent.name LIKE ? OR 
                shipowner.name LIKE ? OR
                ct.name LIKE ? OR
                t.transit_time LIKE ? OR
                t.free_time LIKE ? OR
                t.route_type LIKE ? OR
                CAST(t.freight_cost AS CHAR) LIKE ? OR
                t.freight_currency LIKE ? OR
                t.notes LIKE ? OR
                CASE
                    WHEN t.validity_end_date < CURDATE() THEN 'Expirada'
                    WHEN t.validity_end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 15 DAY) THEN 'Expira Breve'
                    ELSE 'Ativa'
                END LIKE ?
            )`);
            const searchPattern = `%${searchValue}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, 
                       searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        }

        // Construir WHERE para status
        if (status && status !== 'Todos') {
            const statusValues = status.split(',').map(s => s.trim()).filter(s => s);
            if (statusValues.length > 0) {
                const statusConditions = statusValues.map(statusValue => {
                    switch(statusValue) {
                        case 'Ativa':
                            return 't.validity_end_date >= CURDATE()';
                        case 'Expira Breve':
                            return 't.validity_end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 15 DAY)';
                        case 'Expirada':
                            return 't.validity_end_date < CURDATE()';
                        default:
                            return '1=1';
                    }
                });
                whereClauses.push(`(${statusConditions.join(' OR ')})`);
            }
        }
        
        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Construir ORDER BY
        let orderString = 'ORDER BY t.validity_start_date DESC';
        if (order && order.length > 0) {
            const orderColumn = order[0].column;
            const orderDir = order[0].dir;
            
            const columnMap = {
                0: 'status', // Coluna de detalhes não é ordenável
                1: 'status',
                2: 'orig.name',
                3: 'dest.name', 
                4: 'modality.name',
                5: 't.validity_start_date',
                6: 'agent.name',
                7: 'shipowner.name',
                8: 't.freight_cost',
                9: 't.transit_time',
                10: 't.free_time',
                11: 't.route_type',
                12: null // Coluna de ações não é ordenável
            };
            
            if (columnMap[orderColumn]) {
                orderString = `ORDER BY ${columnMap[orderColumn]} ${orderDir}`;
            }
        }

        // Query para contar total de registros
        const countQuery = `
            SELECT COUNT(DISTINCT t.id) as total
            FROM ft_tariffs t
            JOIN ft_locations orig ON t.origin_id = orig.id
            JOIN ft_locations dest ON t.destination_id = dest.id
            JOIN ft_modalities modality ON t.modality_id = modality.id
            JOIN ft_agents agent ON t.agent_id = agent.id
            LEFT JOIN ft_agents shipowner ON t.shipowner_id = shipowner.id
            LEFT JOIN ft_container_types ct ON t.container_type_id = ct.id
            ${whereString}
        `;
        
        const totalResult = await executeQuery(countQuery, params);
        const totalRecords = totalResult[0].total;

        // Query principal com paginação
        const dataQuery = `
            SELECT 
                t.*,
                orig.name AS origin_name,
                dest.name AS destination_name,
                modality.name AS modality_name,
                agent.name AS agent_name,
                shipowner.name AS shipowner_name,
                ct.name AS container_type_name,
                t.free_time,
                t.freight_cost,
                CASE
                    WHEN t.validity_end_date < CURDATE() THEN 'Expirada'
                    WHEN t.validity_end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 15 DAY) THEN 'Expira Breve'
                    ELSE 'Ativa'
                END AS status
            FROM ft_tariffs t
            JOIN ft_locations orig ON t.origin_id = orig.id
            JOIN ft_locations dest ON t.destination_id = dest.id
            JOIN ft_modalities modality ON t.modality_id = modality.id
            JOIN ft_agents agent ON t.agent_id = agent.id
            LEFT JOIN ft_agents shipowner ON t.shipowner_id = shipowner.id
            LEFT JOIN ft_container_types ct ON t.container_type_id = ct.id
            ${whereString}
            GROUP BY t.id
            ${orderString}
            LIMIT ?, ?
        `;

        const queryParams = [...params, pageStart, pageLength];
        let tariffs = await executeQuery(dataQuery, queryParams);
        
        // Para cada tarifa, buscar suas sobretaxas
        for (let tariff of tariffs) {
            const surcharges = await executeQuery('SELECT * FROM ft_tariffs_surcharges WHERE tariff_id = ?', [tariff.id]);
            tariff.surcharges = surcharges.map(s => ({...s, cost: s.value}));
        }

        // Contar registros filtrados (sem paginação)
        const filteredCountQuery = `
            SELECT COUNT(DISTINCT t.id) as total
            FROM ft_tariffs t
            JOIN ft_locations orig ON t.origin_id = orig.id
            JOIN ft_locations dest ON t.destination_id = dest.id
            JOIN ft_modalities modality ON t.modality_id = modality.id
            JOIN ft_agents agent ON t.agent_id = agent.id
            LEFT JOIN ft_agents shipowner ON t.shipowner_id = shipowner.id
            LEFT JOIN ft_container_types ct ON t.container_type_id = ct.id
            ${whereString}
        `;
        
        const filteredResult = await executeQuery(filteredCountQuery, params);
        const filteredCount = filteredResult[0].total;

        res.status(200).json({
            draw: parseInt(draw),
            recordsTotal: totalRecords,
            recordsFiltered: filteredCount,
            data: tariffs
        });

    } catch (error) {
        console.error('Erro ao buscar tarifas para DataTable:', error);
        res.status(500).json({ 
            message: 'Erro interno do servidor ao buscar tarifas.',
            error: error.message 
        });
    }
}; 

//================================================================================================
// Administração - Estatísticas e Limpeza
//================================================================================================

// Buscar estatísticas das tarifas
exports.getTariffStatistics = async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN validity_end_date >= CURDATE() THEN 1 END) as active,
                COUNT(CASE WHEN validity_end_date < CURDATE() THEN 1 END) as expired
            FROM ft_tariffs
        `;
        
        const result = await executeQuery(query);
        const stats = result[0];
        
        res.status(200).json({
            total: stats.total || 0,
            active: stats.active || 0,
            expired: stats.expired || 0
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas das tarifas:', error);
        res.status(500).json({ 
            message: 'Erro interno do servidor ao buscar estatísticas.',
            error: error.message 
        });
    }
};

// Limpar todas as tarifas
exports.clearAllTariffs = async (req, res, io) => {
    try {
        // Primeiro, deletar sobretaxas (devido à chave estrangeira)
        const deleteSurchargesQuery = 'DELETE FROM ft_tariffs_surcharges';
        await executeQuery(deleteSurchargesQuery);
        
        // Depois, deletar todas as tarifas
        const deleteTariffsQuery = 'DELETE FROM ft_tariffs';
        const result = await executeQuery(deleteTariffsQuery);
        
        const deletedCount = result.affectedRows;
        
        // Emitir evento Socket.IO para atualizar todas as tabelas
        if (io) {
            io.emit('tariffs_cleared', {
                message: 'Todas as tarifas foram removidas',
                deleted: deletedCount,
                timestamp: new Date().toISOString()
            });
        }
        
        res.status(200).json({
            success: true,
            message: `Todas as tarifas foram removidas com sucesso.`,
            deleted: deletedCount
        });
    } catch (error) {
        console.error('Erro ao limpar todas as tarifas:', error);
        res.status(500).json({ 
            message: 'Erro interno do servidor ao limpar tarifas.',
            error: error.message 
        });
    }
};