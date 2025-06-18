const { executeQuery } = require('../connect/mysql');

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
        const { origin, destination, modality, agent, status } = req.query;

        let query = `
            SELECT 
                t.*,
                orig.name AS origin_name,
                dest.name AS destination_name,
                m.name AS modality_name,
                ct.name AS container_type_name,
                a.name AS agent_name,
                (SELECT SUM(s.value) FROM ft_tariffs_surcharges s WHERE s.tariff_id = t.id) AS total_surcharges,
                (t.freight_cost + COALESCE((SELECT SUM(s.value) FROM ft_tariffs_surcharges s WHERE s.tariff_id = t.id), 0)) AS total_cost,
                CASE
                    WHEN CURDATE() > t.validity_end_date THEN 'Expirada'
                    WHEN DATEDIFF(t.validity_end_date, CURDATE()) <= 7 THEN 'Expira Breve'
                    ELSE 'Ativa'
                END AS status
            FROM ft_tariffs t
            LEFT JOIN ft_locations orig ON t.origin_id = orig.id
            LEFT JOIN ft_locations dest ON t.destination_id = dest.id
            LEFT JOIN ft_modalities m ON t.modality_id = m.id
            LEFT JOIN ft_container_types ct ON t.container_type_id = ct.id
            LEFT JOIN ft_agents a ON t.agent_id = a.id
        `;
        
        const whereClauses = [];
        const params = [];

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
        if (status && status !== 'Todos') {
            let statusCondition;
            if (status === 'Ativa') {
                statusCondition = "CURDATE() BETWEEN t.validity_start_date AND t.validity_end_date AND DATEDIFF(t.validity_end_date, CURDATE()) > 7";
            } else if (status === 'Expira Breve') {
                statusCondition = "CURDATE() BETWEEN t.validity_start_date AND t.validity_end_date AND DATEDIFF(t.validity_end_date, CURDATE()) <= 7";
            } else if (status === 'Expirada') {
                statusCondition = "CURDATE() > t.validity_end_date";
            }
            if(statusCondition) whereClauses.push(statusCondition);
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }
        
        query += ' ORDER BY t.updated_at DESC';

        const tariffs = await executeQuery(query, params);
        res.status(200).json(tariffs);
    } catch (error) {
        console.error('Erro ao buscar tarifas:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar tarifas.' });
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
                a.name AS agent_name
            FROM ft_tariffs t
            LEFT JOIN ft_locations orig ON t.origin_id = orig.id
            LEFT JOIN ft_locations dest ON t.destination_id = dest.id
            LEFT JOIN ft_modalities m ON t.modality_id = m.id
            LEFT JOIN ft_container_types ct ON t.container_type_id = ct.id
            LEFT JOIN ft_agents a ON t.agent_id = a.id
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

exports.createTariff = async (req, res) => {
    const {
        origin_id, destination_id, modality_id, container_type_id, agent_id,
        validity_start_date, validity_end_date, freight_cost, freight_currency,
        transit_time, route_type, notes, surcharges
    } = req.body;

    // Validação básica
    if (!origin_id || !destination_id || !modality_id || !agent_id || !validity_start_date || !validity_end_date || !freight_cost || !freight_currency) {
        return res.status(400).json({ message: 'Campos obrigatórios da tarifa estão faltando.' });
    }

    try {
        const tariffSql = `
            INSERT INTO ft_tariffs (origin_id, destination_id, modality_id, container_type_id, agent_id, validity_start_date, validity_end_date, freight_cost, freight_currency, transit_time, route_type, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const tariffParams = [
            origin_id, destination_id, modality_id, container_type_id || null, agent_id,
            validity_start_date, validity_end_date, freight_cost, freight_currency,
            transit_time || null, route_type || null, notes || null
        ];

        const result = await executeQuery(tariffSql, tariffParams);
        const tariffId = result.insertId;

        if (surcharges && Array.isArray(surcharges) && surcharges.length > 0) {
            const surchargeSql = 'INSERT INTO ft_tariffs_surcharges (tariff_id, name, value, currency) VALUES ?';
            const surchargeValues = surcharges.map(s => [tariffId, s.name, s.value, s.currency]);
            await executeQuery(surchargeSql, [surchargeValues]);
        }

        res.status(201).json({ id: tariffId, message: 'Tarifa criada com sucesso!' });

    } catch (error) {
        console.error('Erro ao criar tarifa:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao criar a tarifa.' });
    }
};

exports.updateTariff = async (req, res) => {
    const { id } = req.params;
    const {
        origin_id, destination_id, modality_id, container_type_id, agent_id,
        validity_start_date, validity_end_date, freight_cost, freight_currency,
        transit_time, route_type, notes, surcharges
    } = req.body;

    if (!origin_id || !destination_id || !modality_id || !agent_id || !validity_start_date || !validity_end_date || !freight_cost || !freight_currency) {
        return res.status(400).json({ message: 'Campos obrigatórios da tarifa estão faltando.' });
    }

    try {
        const tariffSql = `
            UPDATE ft_tariffs SET
                origin_id = ?, destination_id = ?, modality_id = ?, container_type_id = ?, agent_id = ?,
                validity_start_date = ?, validity_end_date = ?, freight_cost = ?, freight_currency = ?,
                transit_time = ?, route_type = ?, notes = ?
            WHERE id = ?
        `;
        const tariffParams = [
            origin_id, destination_id, modality_id, container_type_id || null, agent_id,
            validity_start_date, validity_end_date, freight_cost, freight_currency,
            transit_time || null, route_type || null, notes || null,
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

        res.status(200).json({ message: 'Tarifa atualizada com sucesso!' });

    } catch (error) {
        console.error('Erro ao atualizar tarifa:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar a tarifa.' });
    }
};

exports.deleteTariff = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await executeQuery('DELETE FROM ft_tariffs WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tarifa não encontrada.' });
        }
        res.status(200).json({ message: 'Tarifa excluída com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir tarifa:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao excluir a tarifa.' });
    }
};


//================================================================================================
// Metadata for Forms
//================================================================================================
exports.getFormData = async (req, res) => {
    try {
        const [locations, agents, modalities, container_types] = await Promise.all([
            executeQuery('SELECT id, name, type FROM ft_locations ORDER BY name'),
            executeQuery('SELECT id, name FROM ft_agents ORDER BY name'),
            executeQuery('SELECT id, name FROM ft_modalities ORDER BY name'),
            executeQuery('SELECT id, name, applicable_modalities FROM ft_container_types ORDER BY name')
        ]);

        res.status(200).json({
            locations,
            agents,
            modalities,
            container_types
        });
    } catch (error) {
        console.error('Erro ao buscar dados para formulário:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar dados para o formulário.' });
    }
}; 