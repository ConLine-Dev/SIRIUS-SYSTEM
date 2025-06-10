const { executeQuery } = require('../connect/mysql');

// Função auxiliar para extrair texto puro do formato Delta do Quill e truncar.
function generateSummaryFromContent(content, maxLength = 250) {
    if (!content || !content.ops) {
        return '';
    }
    // Concatena todos os inserts de texto do Delta.
    const text = content.ops.reduce((acc, op) => {
        if (typeof op.insert === 'string') {
            return acc + op.insert;
        }
        return acc;
    }, '');
    // Remove quebras de linha excessivas e espaços.
    const cleanText = text.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
    // Trunca e adiciona "..." se necessário.
    if (cleanText.length > maxLength) {
        return cleanText.substring(0, maxLength) + '...';
    }
    return cleanText;
}

// Função auxiliar para obter tags de um procedimento
async function getTagsForProcedure(procedureId) {
    const tags = await executeQuery(`
        SELECT t.name
        FROM proc_tags t
        JOIN proc_procedure_tags pt ON t.id = pt.tag_id
        WHERE pt.procedure_id = ?
    `, [procedureId]);
    return tags.map(tag => tag.name);
}

// Obter todos os procedimentos (versão para listagem)
exports.getProcedures = async (req, res) => {
    try {
        const procedures = await executeQuery(`
            SELECT 
                id,
                title,
                summary,
                department,
                role,
                type,
                responsible,
                updated_at
            FROM proc_main
            ORDER BY updated_at DESC
        `);

        // Para cada procedimento, buscar suas tags
        for (const proc of procedures) {
            proc.tags = await getTagsForProcedure(proc.id);
        }

        res.json(procedures);
    } catch (error) {
        console.error('Erro ao buscar procedimentos:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar procedimentos.' });
    }
};

// Obter um procedimento completo por ID
exports.getProcedureById = async (req, res) => {
    const { id } = req.params;
    try {
        const procedureResult = await executeQuery('SELECT * FROM proc_main WHERE id = ?', [id]);
        if (procedureResult.length === 0) {
            return res.status(404).json({ message: 'Procedimento não encontrado.' });
        }
        const procedure = procedureResult[0];

        // Buscar versões, anexos e tags em paralelo
        const [versions, attachments, tags] = await Promise.all([
            executeQuery('SELECT * FROM proc_versions WHERE procedure_id = ? ORDER BY version_number DESC', [id]),
            executeQuery('SELECT * FROM proc_attachments WHERE procedure_id = ?', [id]),
            getTagsForProcedure(id)
        ]);

        // Adiciona o conteúdo da versão mais recente ao objeto principal para facilitar o uso no front-end.
        if (versions.length > 0) {
            procedure.content = versions[0].content;
        } else {
            // Se, por algum motivo, não houver versões, envia um conteúdo vazio.
            procedure.content = { ops: [] };
        }

        procedure.versions = versions;
        procedure.attachments = attachments;
        procedure.tags = tags;

        res.json(procedure);
    } catch (error) {
        console.error(`Erro ao buscar procedimento ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar o procedimento.' });
    }
};

// Criar um novo procedimento
exports.createProcedure = async (req, res) => {
    const { title, department, role, type, responsible, content, attachments = [], tags = [] } = req.body;
    const authorName = (req.user && req.user.name) ? req.user.name : 'Usuário do Sistema';
    
    // Gera o resumo a partir do conteúdo do Quill.
    const summary = generateSummaryFromContent(content);

    try {
        // Passo 1: Inserir o procedimento principal com o resumo gerado.
        const mainResult = await executeQuery(
            'INSERT INTO proc_main (title, summary, department, role, type, responsible) VALUES (?, ?, ?, ?, ?, ?)',
            [title, summary, department, role, type, responsible]
        );
        const procedureId = mainResult.insertId;

        // Passo 2: Inserir a primeira versão
        await executeQuery(
            'INSERT INTO proc_versions (procedure_id, version_number, author, content) VALUES (?, ?, ?, ?)',
            [procedureId, 1, authorName, JSON.stringify(content)]
        );

        // Passo 3: Lidar com tags
        for (const tagName of tags) {
            // Garante que a tag exista
            const tagResult = await executeQuery('INSERT IGNORE INTO proc_tags (name) VALUES (?)', [tagName]);
            const tagId = tagResult.insertId || (await executeQuery('SELECT id FROM proc_tags WHERE name = ?', [tagName]))[0].id;
            // Associa a tag ao procedimento
            await executeQuery('INSERT INTO proc_procedure_tags (procedure_id, tag_id) VALUES (?, ?)', [procedureId, tagId]);
        }
        
        // Passo 4: Lidar com anexos
        for (const attachment of attachments) {
            await executeQuery(
                'INSERT INTO proc_attachments (procedure_id, type, url, description) VALUES (?, ?, ?, ?)',
                [procedureId, attachment.type, attachment.url, attachment.description]
            );
        }

        res.status(201).json({ message: 'Procedimento criado com sucesso!', id: procedureId });
    } catch (error) {
        console.error('Erro ao criar procedimento:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao criar o procedimento.' });
    }
};

// Atualizar um procedimento existente
exports.updateProcedure = async (req, res) => {
    const { id } = req.params;
    const { title, department, role, type, responsible, content, attachments = [], tags = [] } = req.body;
    const authorName = (req.user && req.user.name) ? req.user.name : 'Usuário do Sistema';
    
    // Gera o resumo a partir do conteúdo atualizado.
    const summary = generateSummaryFromContent(content);

    try {
        // Passo 1: Atualizar os dados principais do procedimento, incluindo o novo resumo.
        await executeQuery(
            'UPDATE proc_main SET title = ?, summary = ?, department = ?, role = ?, type = ?, responsible = ? WHERE id = ?',
            [title, summary, department, role, type, responsible, id]
        );

        // Passo 2: Criar uma nova versão (lógica de versionamento)
        const lastVersionResult = await executeQuery(
            'SELECT MAX(version_number) as max_version FROM proc_versions WHERE procedure_id = ?', [id]
        );
        const newVersionNumber = (lastVersionResult[0].max_version || 0) + 1;

        await executeQuery(
            'INSERT INTO proc_versions (procedure_id, version_number, author, content) VALUES (?, ?, ?, ?)',
            [id, newVersionNumber, authorName, JSON.stringify(content)]
        );

        // Passo 3: Atualizar tags (a abordagem mais simples é remover e readicionar)
        await executeQuery('DELETE FROM proc_procedure_tags WHERE procedure_id = ?', [id]);
        for (const tagName of tags) {
            const tagResult = await executeQuery('INSERT IGNORE INTO proc_tags (name) VALUES (?)', [tagName]);
            const tagId = tagResult.insertId || (await executeQuery('SELECT id FROM proc_tags WHERE name = ?', [tagName]))[0].id;
            await executeQuery('INSERT INTO proc_procedure_tags (procedure_id, tag_id) VALUES (?, ?)', [id, tagId]);
        }

        // Passo 4: Atualizar anexos (remover e readicionar)
        await executeQuery('DELETE FROM proc_attachments WHERE procedure_id = ?', [id]);
        for (const attachment of attachments) {
            await executeQuery(
                'INSERT INTO proc_attachments (procedure_id, type, url, description) VALUES (?, ?, ?, ?)',
                [id, attachment.type, attachment.url, attachment.description]
            );
        }

        res.json({ message: 'Procedimento atualizado com sucesso!' });
    } catch (error) {
        console.error(`Erro ao atualizar procedimento ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar o procedimento.' });
    }
};

// Deletar um procedimento
exports.deleteProcedure = async (req, res) => {
    const { id } = req.params;
    try {
        await executeQuery('DELETE FROM proc_main WHERE id = ?', [id]);
        res.json({ message: 'Procedimento deletado com sucesso.' });
    } catch (error) {
        console.error(`Erro ao deletar procedimento ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao deletar o procedimento.' });
        // A cascata no DB cuidará do resto (versões, anexos, tags)
    }
};

// A rota /history não é mais necessária, pois os dados estão embutidos.
// A função getProcedureHistory foi removida. 