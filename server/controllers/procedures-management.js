const { executeQuery, executeTransaction } = require('../connect/mysql');
const fs = require('fs');
const path = require('path');

// ===============================
// SISTEMA DE CACHE OTIMIZADO
// ===============================
const CACHE_TTL = 300000; // 5 minutos em ms
const cache = {
    procedures: { data: null, timestamp: 0 },
    departments: { data: null, timestamp: 0 },
    roles: { data: null, timestamp: 0 },
    types: { data: null, timestamp: 0 },
    responsibles: { data: null, timestamp: 0 }
};

function getCachedData(key) {
    const cached = cache[key];
    if (cached.data && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return cached.data;
    }
    return null;
}

function setCachedData(key, data) {
    cache[key] = { data, timestamp: Date.now() };
}

function invalidateCache(keys = null) {
    if (keys) {
        keys.forEach(key => {
            if (cache[key]) cache[key].timestamp = 0;
        });
    } else {
        Object.keys(cache).forEach(key => cache[key].timestamp = 0);
    }
}

// ===============================
// FUNÇÕES AUXILIARES OTIMIZADAS
// ===============================

// Função auxiliar para obter o ID do colaborador a partir do header x-user.
const getAuthorIdFromHeader = (req) => {
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
    return 1; // Fallback
};

// Função otimizada para extrair texto e lidar com imagens
function generateSummaryFromContent(content, maxLength = 250) {
    if (!content || !content.ops || !Array.isArray(content.ops) || content.ops.length === 0) {
        return '';
    }
    
    let text = '';
    let currentLength = 0;
    
    for (const op of content.ops) {
        if (currentLength >= maxLength) break;
        
        if (typeof op.insert === 'string') {
            // Detectar e pular imagens base64 para evitar sobrecarga
            if (op.insert.startsWith('data:image/') || op.insert.length > 1000) {
                text += '[IMAGEM] ';
                currentLength += 9;
            } else {
                const remainingLength = maxLength - currentLength;
                const chunk = op.insert.substring(0, remainingLength);
                text += chunk;
                currentLength += chunk.length;
            }
        } else if (op.insert && typeof op.insert === 'object') {
            // Lidar com outros tipos de inserção (vídeo, etc.)
            if (op.insert.image) {
                text += '[IMAGEM] ';
                currentLength += 9;
            } else if (op.insert.video) {
                text += '[VÍDEO] ';
                currentLength += 8;
            }
        }
    }
    
    return text.replace(/\s+/g, ' ').trim();
}

// Função otimizada para comparar conteúdos grandes e pequenos
function isContentChanged(oldContent, newContent) {
    try {
        console.log('🔍 isContentChanged - Iniciando comparação...');
        console.log('🔍 oldContent type:', typeof oldContent);
        console.log('🔍 newContent type:', typeof newContent);
        
        // Verificar se os conteúdos são válidos
        if (!oldContent || !newContent) {
            console.log('📊 Conteúdo inválido detectado - Old:', !!oldContent, 'New:', !!newContent);
            const hasChanged = oldContent !== newContent;
            console.log('📊 Resultado da comparação (conteúdo inválido):', hasChanged);
            return hasChanged;
        }

        // Se oldContent for uma string JSON, tentar fazer parse
        let oldContentObj = oldContent;
        if (typeof oldContent === 'string') {
            try {
                oldContentObj = JSON.parse(oldContent);
                console.log('📊 oldContent parseado com sucesso');
            } catch (e) {
                console.log('📊 Erro ao fazer parse do oldContent:', e.message);
                oldContentObj = oldContent;
            }
        }

        // Se newContent for uma string JSON, tentar fazer parse
        let newContentObj = newContent;
        if (typeof newContent === 'string') {
            try {
                newContentObj = JSON.parse(newContent);
                console.log('📊 newContent parseado com sucesso');
            } catch (e) {
                console.log('📊 Erro ao fazer parse do newContent:', e.message);
                newContentObj = newContent;
            }
        }

        // Log de debug para acompanhar tamanho dos conteúdos
        const oldStr = JSON.stringify(oldContentObj);
        const newStr = JSON.stringify(newContentObj);
        
        console.log(`📊 Comparação de conteúdo - Old: ${oldStr.length} chars, New: ${newStr.length} chars`);
        
        // Para conteúdos pequenos (menos de 100KB), usar comparação completa
        if (oldStr.length <= 100000 && newStr.length <= 100000) {
            const isChanged = oldStr !== newStr;
            console.log(`📊 Comparação completa (pequeno) - Mudou: ${isChanged}`);
            return isChanged;
        }
        
        // Para conteúdos grandes, usar estratégia híbrida mais robusta
        console.log('📊 Conteúdo grande detectado, usando comparação híbrida...');
        
        // 1. Comparar quantidade de operações
        const oldOpsCount = oldContentObj?.ops?.length || 0;
        const newOpsCount = newContentObj?.ops?.length || 0;
        
        if (oldOpsCount !== newOpsCount) {
            console.log(`📊 Quantidade de operações diferente: ${oldOpsCount} vs ${newOpsCount}`);
            return true;
        }
        
        // 2. Extrair e comparar texto sem imagens base64 para análise rápida
        const oldTextClean = extractTextWithoutBase64(oldContentObj);
        const newTextClean = extractTextWithoutBase64(newContentObj);
        
        if (oldTextClean !== newTextClean) {
            console.log(`📊 Texto limpo (sem base64) diferente: ${oldTextClean.length} vs ${newTextClean.length} chars`);
            return true;
        }
        
        // 3. Comparar operações não-texto (imagens, formatação)
        const oldNonTextOps = extractNonTextOps(oldContentObj);
        const newNonTextOps = extractNonTextOps(newContentObj);
        
        if (oldNonTextOps.length !== newNonTextOps.length) {
            console.log(`📊 Operações não-texto diferentes: ${oldNonTextOps.length} vs ${newNonTextOps.length}`);
            return true;
        }
        
        // 4. Comparar hash das operações não-texto para detectar mudanças em imagens
        for (let i = 0; i < oldNonTextOps.length; i++) {
            const oldOpHash = simpleHash(JSON.stringify(oldNonTextOps[i]));
            const newOpHash = simpleHash(JSON.stringify(newNonTextOps[i]));
            
            if (oldOpHash !== newOpHash) {
                console.log(`📊 Hash de operação não-texto diferente na posição ${i}: ${oldOpHash} vs ${newOpHash}`);
                return true;
            }
        }
        
        console.log('📊 Conteúdos são idênticos após análise híbrida');
        return false;
        
    } catch (error) {
        console.error('❌ Erro ao comparar conteúdos (assumindo mudança):', error);
        return true; // Em caso de erro, assumir que mudou para preservar dados
    }
}

// Função para extrair texto sem imagens base64
function extractTextWithoutBase64(content) {
    if (!content || !content.ops || !Array.isArray(content.ops)) {
        return '';
    }
    
    let text = '';
    for (const op of content.ops) {
        if (typeof op.insert === 'string') {
            // Pular strings muito grandes que provavelmente são base64
            if (op.insert.startsWith('data:image/') || op.insert.length > 1000) {
                text += '[IMG_PLACEHOLDER]';
            } else {
                text += op.insert;
            }
        } else if (op.insert && typeof op.insert === 'object') {
            // Lidar com outros tipos de inserção
            if (op.insert.image) {
                text += '[IMG_EMBED]';
            } else if (op.insert.video) {
                text += '[VIDEO_EMBED]';
            } else {
                text += '[OBJECT_EMBED]';
            }
        }
    }
    
    return text;
}

// Função para extrair operações não-texto (imagens, formatação, etc.)
function extractNonTextOps(content) {
    if (!content || !content.ops || !Array.isArray(content.ops)) {
        return [];
    }
    
    const nonTextOps = [];
    for (const op of content.ops) {
        // Incluir operações que são objetos (imagens, vídeos, etc.)
        if (op.insert && typeof op.insert === 'object') {
            nonTextOps.push(op);
        }
        // Incluir strings base64 (imagens convertidas)
        else if (typeof op.insert === 'string' && 
                (op.insert.startsWith('data:image/') || op.insert.length > 1000)) {
            nonTextOps.push(op);
        }
        // Incluir operações com formatação especial
        else if (op.attributes && Object.keys(op.attributes).length > 0) {
            nonTextOps.push({
                insert: typeof op.insert === 'string' ? '[TEXT_WITH_FORMAT]' : op.insert,
                attributes: op.attributes
            });
        }
    }
    
    return nonTextOps;
}

// Função para extrair texto completo do conteúdo Quill (sem limites)
function extractFullTextFromContent(content) {
    if (!content || !content.ops || !Array.isArray(content.ops)) {
        return '';
    }
    
    let text = '';
    for (const op of content.ops) {
        if (typeof op.insert === 'string') {
            // Detectar e marcar imagens base64 de forma consistente
            if (op.insert.startsWith('data:image/') || op.insert.length > 1000) {
                text += '[IMAGEM_BASE64]';
            } else {
                text += op.insert;
            }
        } else if (op.insert && typeof op.insert === 'object') {
            // Lidar com outros tipos de inserção
            if (op.insert.image) {
                text += '[IMAGEM]';
            } else if (op.insert.video) {
                text += '[VÍDEO]';
            } else {
                text += '[EMBED]';
            }
        }
    }
    
    return text;
}

// Função simples de hash para comparação rápida
function simpleHash(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash;
}

// Função auxiliar para obter tags de um procedimento
async function getTagsForProcedure(procedureId) {
    const tags = await executeQuery(
        'SELECT t.name FROM proc_tags t JOIN proc_procedure_tags pt ON t.id = pt.tag_id WHERE pt.procedure_id = ?',
        [procedureId]
    );
    return tags.map(tag => tag.name);
}

// ===============================
// CONTROLLERS PRINCIPAIS OTIMIZADOS
// ===============================

// Obter todos os procedimentos para a listagem (OTIMIZADO)
exports.getProcedures = async (req, res) => {
    try {
        // Verificar cache primeiro
        const cached = getCachedData('procedures');
        if (cached) {
            return res.json(cached);
        }

        // Query otimizada com menos dados para listagem
        const procedures = await executeQuery(`
            SELECT 
                p.id,
                p.title,
                p.summary,
                p.department_id,
                d.name AS department,
                p.role,
                pt.name AS type,
                p.responsible_id,
                c.name AS responsible,
                p.updated_at,
                (SELECT COUNT(*) FROM proc_versions WHERE procedure_id = p.id) as version_count
            FROM proc_main p
            LEFT JOIN departments d ON p.department_id = d.id
            LEFT JOIN proc_types pt ON p.type_id = pt.id
            LEFT JOIN collaborators c ON p.responsible_id = c.id
            WHERE p.deleted_at IS NULL
            ORDER BY p.updated_at DESC
        `);

        // Buscar tags em batch para melhor performance
        const procedureIds = procedures.map(p => p.id);
        if (procedureIds.length > 0) {
            const allTags = await executeQuery(`
                SELECT pt.procedure_id, t.name 
                FROM proc_tags t 
                JOIN proc_procedure_tags pt ON t.id = pt.tag_id 
                WHERE pt.procedure_id IN (${procedureIds.map(() => '?').join(',')})
            `, procedureIds);

            // Agrupar tags por procedimento
            const tagsByProcedure = {};
            allTags.forEach(tag => {
                if (!tagsByProcedure[tag.procedure_id]) {
                    tagsByProcedure[tag.procedure_id] = [];
                }
                tagsByProcedure[tag.procedure_id].push(tag.name);
            });

            // Atribuir tags aos procedimentos
            procedures.forEach(proc => {
                proc.tags = tagsByProcedure[proc.id] || [];
            });
        }

        // Cachear resultado
        setCachedData('procedures', procedures);
        
        res.json(procedures);
    } catch (error) {
        console.error('Erro ao buscar procedimentos:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// Obter um procedimento completo por ID (OTIMIZADO)
exports.getProcedureById = async (req, res) => {
    const { id } = req.params;
    try {
        // Query otimizada em uma única consulta
        const procedureResult = await executeQuery(`
            SELECT 
                p.*,
                d.name AS department,
                pt.name AS type,
                c.name AS responsible
            FROM proc_main p
            LEFT JOIN departments d ON p.department_id = d.id
            LEFT JOIN proc_types pt ON p.type_id = pt.id
            LEFT JOIN collaborators c ON p.responsible_id = c.id
            WHERE p.id = ? AND p.deleted_at IS NULL
        `, [id]);

        if (procedureResult.length === 0) {
            return res.status(404).json({ message: 'Procedimento não encontrado.' });
        }

        const procedure = procedureResult[0];

        // Buscar versões (SEM conteúdo), anexos e tags em paralelo
        const [versionsMetadata, attachments, tags] = await Promise.all([
            executeQuery(`
                SELECT 
                    v.id, v.procedure_id, v.version_number, v.author_id, v.change_summary, v.created_at,
                    v.title, v.department_id, v.role, v.type_id, v.responsible_id, v.tags, v.attachments,
                    c.name as author_name
                FROM proc_versions v
                LEFT JOIN collaborators c ON v.author_id = c.id
                WHERE v.procedure_id = ? 
                ORDER BY v.version_number DESC
            `, [id]),
            executeQuery('SELECT * FROM proc_attachments WHERE procedure_id = ?', [id]),
            getTagsForProcedure(id)
        ]);

        // Carregar conteúdo da versão mais recente (SEMPRE COMPLETO para VIEW, otimizado para EDIT)
        let versions = versionsMetadata;
        if (versions.length > 0) {
            console.log(`🔍 Carregando conteúdo para procedimento ${id} - ${versions.length} versões encontradas`);
            
            // Carregar conteúdo completo da versão mais recente
            const latestVersionId = versions[0].id;
            const latestVersionNumber = versions[0].version_number;
            
            console.log(`📋 Carregando conteúdo da versão mais recente: ID ${latestVersionId}, Número ${latestVersionNumber}`);
            
            const latestContentResult = await executeQuery('SELECT content FROM proc_versions WHERE id = ?', [latestVersionId]);
            
            let latestContent = { ops: [] };
            let contentLoadedSuccessfully = false;
            
            if (latestContentResult.length > 0) {
                try {
                    const rawContent = latestContentResult[0].content;
                    const rawContentSize = rawContent ? JSON.stringify(rawContent).length : 0;
                    
                    console.log(`📄 Conteúdo bruto da versão ${latestVersionNumber} - Tipo: ${typeof rawContent}, Tamanho: ${rawContentSize} chars`);
                    
                    if (typeof rawContent === 'string') {
                        latestContent = JSON.parse(rawContent);
                        contentLoadedSuccessfully = true;
                        console.log(`✅ Conteúdo parseado com sucesso - ${latestContent?.ops?.length || 0} operações`);
                    } else if (typeof rawContent === 'object' && rawContent !== null) {
                        latestContent = rawContent;
                        contentLoadedSuccessfully = true;
                        console.log(`✅ Conteúdo objeto carregado - ${latestContent?.ops?.length || 0} operações`);
                    } else {
                        console.log(`⚠️ Conteúdo em formato inesperado: ${typeof rawContent}`);
                    }
                    
                    // Verificar se o conteúdo tem operações válidas
                    if (latestContent && latestContent.ops && Array.isArray(latestContent.ops) && latestContent.ops.length > 0) {
                        console.log(`✅ Conteúdo válido encontrado com ${latestContent.ops.length} operações`);
                    } else {
                        console.log(`⚠️ Conteúdo está vazio ou inválido, tentando outras versões...`);
                        contentLoadedSuccessfully = false;
                        
                        // Tentar carregar de outras versões se a mais recente estiver vazia
                        for (let i = 1; i < Math.min(versions.length, 5); i++) { // Tentar até 5 versões
                            const alternativeVersionId = versions[i].id;
                            const alternativeVersionNumber = versions[i].version_number;
                            
                            console.log(`🔄 Tentando versão alternativa: ID ${alternativeVersionId}, Número ${alternativeVersionNumber}`);
                            
                            const altContentResult = await executeQuery('SELECT content FROM proc_versions WHERE id = ?', [alternativeVersionId]);
                            
                            if (altContentResult.length > 0) {
                                try {
                                    const altRawContent = altContentResult[0].content;
                                    let altContent;
                                    
                                    if (typeof altRawContent === 'string') {
                                        altContent = JSON.parse(altRawContent);
                                    } else if (typeof altRawContent === 'object' && altRawContent !== null) {
                                        altContent = altRawContent;
                                    } else {
                                        continue; // Pular esta versão
                                    }
                                    
                                    if (altContent && altContent.ops && Array.isArray(altContent.ops) && altContent.ops.length > 0) {
                                        console.log(`✅ Conteúdo válido encontrado na versão ${alternativeVersionNumber} com ${altContent.ops.length} operações`);
                                        latestContent = altContent;
                                        contentLoadedSuccessfully = true;
                                        break; // Parar de procurar
                                    }
                                } catch (altError) {
                                    console.log(`❌ Erro ao processar versão ${alternativeVersionNumber}:`, altError);
                                    continue;
                                }
                            }
                        }
                    }
                    
                } catch(e) {
                    console.error(`❌ Erro ao parsear conteúdo da versão mais recente ${latestVersionId}:`, e);
                    latestContent = { ops: [] };
                    contentLoadedSuccessfully = false;
                }
            } else {
                console.log(`⚠️ Nenhum conteúdo encontrado para a versão ${latestVersionNumber}`);
            }
            
            // Definir conteúdo na versão mais recente E no procedure principal
            versions[0].content = latestContent;
            procedure.content = latestContent;

            if (contentLoadedSuccessfully) {
                console.log(`✅ Conteúdo carregado com sucesso para procedimento ${id} - ${latestContent?.ops?.length || 0} operações`);
            } else {
                console.log(`⚠️ Nenhum conteúdo válido encontrado para procedimento ${id}, usando conteúdo vazio`);
            }
            
            // Para versões antigas, definir placeholder que será carregado sob demanda no edit
            for (let i = 1; i < versions.length; i++) {
                versions[i].content = null; // Será carregado sob demanda apenas no edit
            }
        } else {
            procedure.content = { ops: [] };
            console.log(`⚠️ Nenhuma versão encontrada para procedimento ${id}, usando conteúdo vazio`);
        }
        
        procedure.versions = versions;
        procedure.attachments = attachments;
        procedure.tags = tags;

        res.json(procedure);
    } catch (error) {
        console.error(`Erro ao buscar procedimento ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// Endpoint otimizado para carregar conteúdo de versão específica sob demanda
exports.getVersionContent = async (req, res) => {
    const { procedureId, versionNumber } = req.params;
    
    try {
        console.log(`📋 Carregando conteúdo da versão ${versionNumber} do procedimento ${procedureId}`);
        
        // Buscar conteúdo específico da versão
        const versionResult = await executeQuery(`
            SELECT v.content, v.title, v.department_id, v.role, v.type_id, v.responsible_id, v.tags, v.attachments
            FROM proc_versions v
            WHERE v.procedure_id = ? AND v.version_number = ?
        `, [procedureId, versionNumber]);
        
        if (versionResult.length === 0) {
            return res.status(404).json({ message: 'Versão não encontrada.' });
        }
        
        const version = versionResult[0];
        
        // Processar conteúdo
        try {
            if (version.content) {
                if (typeof version.content === 'string') {
                    version.content = JSON.parse(version.content);
                } else if (typeof version.content !== 'object') {
                    version.content = { ops: [] };
                }
            } else {
                version.content = { ops: [] };
            }
        } catch(e) {
            console.error(`Erro ao parsear conteúdo da versão ${versionNumber}:`, e);
            version.content = { ops: [] };
        }
        
        console.log(`✅ Conteúdo da versão ${versionNumber} carregado com sucesso`);
        res.json(version);
        
    } catch (error) {
        console.error(`Erro ao carregar conteúdo da versão ${versionNumber} do procedimento ${procedureId}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao carregar conteúdo da versão.' });
    }
};

// Criar um novo procedimento (OTIMIZADO)
exports.createProcedure = async (req, res) => {
    const { title, department_id, role, type_id, responsible, content, attachments = [], tags = [] } = req.body;
    
    if (!title || !department_id || !role || !type_id || !responsible || !content) {
        res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' });
        return { id: null };
    }

    const authorId = getAuthorIdFromHeader(req);
    const summary = generateSummaryFromContent(content);

    try {
        const result = await executeTransaction(async (connection) => {
            const mainResult = await connection.query(
            'INSERT INTO proc_main (title, summary, department_id, role, type_id, responsible_id) VALUES (?, ?, ?, ?, ?, ?)',
            [title, summary, department_id, role, type_id, responsible]
        );
            const procedureId = mainResult[0].insertId;

            await connection.query(
            'INSERT INTO proc_versions (procedure_id, version_number, author_id, content, change_summary, title, department_id, role, type_id, responsible_id, tags, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [procedureId, 1, authorId, JSON.stringify(content), 'Criação do procedimento.', title, department_id, role, type_id, responsible, JSON.stringify(tags), JSON.stringify(attachments)]
        );

        // Processar tags e anexos em batch se houver
        if (tags && tags.length > 0) {
        for (const tagName of tags) {
                    const tagResult = await connection.query('INSERT IGNORE INTO proc_tags (name) VALUES (?)', [tagName]);
                    const tagId = tagResult[0].insertId || (await connection.query('SELECT id FROM proc_tags WHERE name = ?', [tagName]))[0].id;
                    await connection.query('INSERT INTO proc_procedure_tags (procedure_id, tag_id) VALUES (?, ?)', [procedureId, tagId]);
            }
        }
        
        if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
                    await connection.query(
                'INSERT INTO proc_attachments (procedure_id, type, url, description) VALUES (?, ?, ?, ?)',
                [procedureId, attachment.type, attachment.url, attachment.description]
            );
            }
        }

            return { id: procedureId };
        }, 60000); // 60 segundos timeout para criação
        
        // Invalidar cache
        invalidateCache(['procedures']);
        
        res.status(201).json({ message: 'Procedimento criado com sucesso!', id: result.id });
        return result;
    } catch (error) {
        console.error('Erro ao criar procedimento:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao criar o procedimento.' });
        return { id: null };
    }
};

// Atualizar um procedimento existente
exports.updateProcedure = async (req, res) => {
    const { id } = req.params;
    let { title, department_id, role, type_id, responsible, content, attachments = [], tags = [] } = req.body;
    
    if (!title || !department_id || !role || !type_id || !responsible || !content) {
        return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    // Converter IDs para números para garantir comparação correta
    department_id = Number(department_id);
    type_id = Number(type_id);
    responsible = Number(responsible);

    const authorId = getAuthorIdFromHeader(req);
    
    // ===============================
    // VERIFICAÇÃO DE TAMANHO CRÍTICA
    // ===============================
    const contentStr = JSON.stringify(content);
    const contentSizeMB = (contentStr.length / 1024 / 1024).toFixed(2);
    
    console.log(`📊 TAMANHO DO CONTEÚDO: ${contentSizeMB}MB (${contentStr.length} chars)`);
    
    // Alertar para conteúdos grandes
    if (contentStr.length > 5000000) { // 5MB
        console.warn(`⚠️ CONTEÚDO MUITO GRANDE: ${contentSizeMB}MB - Risco de falha no MySQL`);
    }
    
    // Verificar se contém imagens base64
    const base64Images = (contentStr.match(/data:image\/[^"]+/g) || []);
    if (base64Images.length > 0) {
        console.log(`🖼️ IMAGENS BASE64 DETECTADAS: ${base64Images.length}`);
        const avgImageSize = base64Images.reduce((acc, img) => acc + img.length, 0) / base64Images.length / 1024;
        console.log(`📏 Tamanho médio das imagens: ${avgImageSize.toFixed(2)}KB`);
    }
    
    const summary = generateSummaryFromContent(content);

    try {
        const result = await executeTransaction(async (connection) => {
        console.log(`🔄 Iniciando atualização do procedimento ${id}...`);
        
        // Buscar dados antigos ANTES de atualizar
            const oldMainResult = await connection.query('SELECT * FROM proc_main WHERE id = ?', [id]);
            const oldMain = oldMainResult[0][0]; // Acessar o primeiro elemento do array aninhado
            
            if (!oldMain) {
                throw new Error('Procedimento não encontrado');
            }

            console.log('🔍 DEBUG - oldMain:', oldMain);

            // Buscar versão atual
            const currentVersionResult = await connection.query(
                'SELECT * FROM proc_versions WHERE procedure_id = ? ORDER BY version_number DESC LIMIT 1',
                [id]
            );
            const currentVersion = currentVersionResult[0][0]; // Acessar o primeiro elemento do array aninhado

            console.log('🔍 DEBUG - currentVersion:', currentVersion);
            console.log('🔍 DEBUG - currentVersion.content:', currentVersion?.content);
            console.log('🔍 DEBUG - currentVersion.content type:', typeof currentVersion?.content);

            if (!currentVersion) {
                throw new Error('Versão atual não encontrada');
            }

            // Garantir que temos acesso ao conteúdo da versão atual
            const currentVersionContent = currentVersion.content;
            console.log('🔍 DEBUG - currentVersionContent:', currentVersionContent);
            console.log('🔍 DEBUG - currentVersionContent type:', typeof currentVersionContent);

            // Buscar dados relacionados
            const oldTagsResult = await connection.query('SELECT pt.name FROM proc_procedure_tags ppt JOIN proc_tags pt ON ppt.tag_id = pt.id WHERE ppt.procedure_id = ?', [id]);
            const oldTags = oldTagsResult[0];
            const oldAttachmentsResult = await connection.query('SELECT * FROM proc_attachments WHERE procedure_id = ?', [id]);
            const oldAttachments = oldAttachmentsResult[0];

            // Buscar informações dos novos relacionamentos
            const newDepartmentResult = await connection.query('SELECT name FROM departments WHERE id = ?', [department_id]);
            const newDepartment = newDepartmentResult[0];
            const newTypeResult = await connection.query('SELECT name FROM proc_types WHERE id = ?', [type_id]);
            const newType = newTypeResult[0];
            const newResponsibleResult = await connection.query('SELECT name FROM collaborators WHERE id = ?', [responsible]);
            const newResponsible = newResponsibleResult[0];
            
            console.log('📝 Valores dos campos:', {
                oldDepartmentId: oldMain.department_id, 
                newDepartmentId: department_id,
                oldTypeId: oldMain.type_id, 
                newTypeId: type_id,
                oldResponsibleId: oldMain.responsible_id, 
                newResponsibleId: responsible
            });
            
            // Atualizar o proc_main incluindo updated_at
            console.log('📤 Atualizando tabela principal...');
            await connection.query(
                'UPDATE proc_main SET title = ?, summary = ?, department_id = ?, role = ?, type_id = ?, responsible_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [title, summary, department_id, role, type_id, responsible, id]
            );
            
            // Definir conteúdo para comparação (conteúdo da versão atual)
            const contentForComparison = currentVersionContent;
            
            // Definir conteúdo atual (novo conteúdo) - Converter para string se necessário
            const currentContent = typeof content === 'object' ? JSON.stringify(content) : content;
            
            // Processar tags antigas para extrair apenas os nomes
            const oldTagNames = oldTags ? oldTags.map(tag => tag.name) : [];
            
            // Montar objeto oldData e newData
            const oldData = { 
                ...oldMain,
                tags: oldTagNames, 
                attachments: oldAttachments || [], 
                content: contentForComparison // Usar conteúdo apropriado para comparação
            };
            
            const newData = { 
                title, 
                department_id, 
                department_name: newDepartment && newDepartment.length > 0 ? newDepartment[0].name : '',
                role, 
                type_id, 
                type_name: newType && newType.length > 0 ? newType[0].name : '',
                responsible_id: responsible, // Usar o mesmo nome de campo que no oldData
                responsible_name: newResponsible && newResponsible.length > 0 ? newResponsible[0].name : '',
                responsible, // Manter para compatibilidade
                tags, 
                attachments, 
                content: currentContent // Usar o conteúdo processado
            };
            
            // Verificação rápida de mudanças importantes
            const hasImportantChanges = 
                oldMain.title !== title ||
                oldMain.department_id !== department_id ||
                oldMain.role !== role ||
                oldMain.type_id !== type_id ||
                oldMain.responsible_id !== responsible;

            // Verificar se o conteúdo mudou usando a função otimizada
            const contentChanged = isContentChanged(currentVersionContent, content);
            
            console.log('📊 Análise de mudanças:', {
                hasImportantChanges,
                contentChanged,
                oldContentSize: currentVersionContent?.length || 0,
                newContentSize: currentContent?.length || 0
            });

            // Se houve mudanças importantes ou de conteúdo, criar nova versão
            if (hasImportantChanges || contentChanged) {
                // Buscar a versão mais alta para calcular a próxima
                const maxVersionResult = await connection.query(
                    'SELECT MAX(version_number) as max_version FROM proc_versions WHERE procedure_id = ?',
                    [id]
                );
                const maxVersion = maxVersionResult[0][0]?.max_version || 0;
                const nextVersion = maxVersion + 1;
                
                console.log(`📚 Versão atual: ${currentVersion.version_number}, Versão máxima: ${maxVersion}, Nova versão será: ${nextVersion}`);
                
                // Gerar resumo de mudanças
                const changeSummary = hasImportantChanges ? 
                    generateDetailedChangeSummary(oldData, newData, nextVersion) : 
                    'Atualização de conteúdo.';

                // Inserir nova versão
                await connection.query(
                    'INSERT INTO proc_versions (procedure_id, version_number, author_id, content, change_summary, title, department_id, role, type_id, responsible_id, tags, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [id, nextVersion, authorId, currentContent, changeSummary, title, department_id, role, type_id, responsible, JSON.stringify(tags), JSON.stringify(attachments)]
                );
                
                console.log('✅ Nova versão inserida com sucesso');
            }

            // Atualizar tags em batch
            if (tags && tags.length > 0) {
                // Remover tags antigas
                await connection.query('DELETE FROM proc_procedure_tags WHERE procedure_id = ?', [id]);
                
                // Inserir novas tags em batch
                for (const tagName of tags) {
                    console.log(`🔍 Processando tag: ${tagName}`);
                    
                    // Tentar inserir a tag (IGNORE evita duplicatas)
                    const tagResult = await connection.query('INSERT IGNORE INTO proc_tags (name) VALUES (?)', [tagName]);
                    console.log(`🔍 Resultado INSERT IGNORE:`, tagResult);
                    
                    let tagId;
                    if (tagResult[0].insertId) {
                        // Tag foi inserida, usar o ID gerado
                        tagId = tagResult[0].insertId;
                        console.log(`🔍 Tag inserida com ID: ${tagId}`);
                    } else {
                        // Tag já existe, buscar o ID
                        const existingTagResult = await connection.query('SELECT id FROM proc_tags WHERE name = ?', [tagName]);
                        console.log(`🔍 Buscando tag existente:`, existingTagResult);
                        
                        if (existingTagResult[0] && existingTagResult[0].length > 0 && existingTagResult[0][0] && existingTagResult[0][0].id) {
                            tagId = existingTagResult[0][0].id;
                            console.log(`🔍 Tag encontrada com ID: ${tagId}`);
                        } else {
                            console.error(`❌ ERRO: Não foi possível encontrar ou criar tag: ${tagName}`);
                            console.error(`❌ ERRO: Estrutura do resultado:`, JSON.stringify(existingTagResult, null, 2));
                            throw new Error(`Tag '${tagName}' não pôde ser processada`);
                        }
                    }
                    
                    // Validar tagId antes de inserir
                    if (!tagId) {
                        console.error(`❌ ERRO: tagId é null/undefined para tag: ${tagName}`);
                        throw new Error(`ID da tag '${tagName}' é inválido`);
                    }
                    
                    // Inserir relação procedure-tag
                    await connection.query('INSERT INTO proc_procedure_tags (procedure_id, tag_id) VALUES (?, ?)', [id, tagId]);
                    console.log(`✅ Relação procedure-tag criada: procedure_id=${id}, tag_id=${tagId}`);
                }
            }
            
            // Atualizar anexos em batch
        if (attachments && attachments.length > 0) {
                // Remover anexos antigos
                await connection.query('DELETE FROM proc_attachments WHERE procedure_id = ?', [id]);
                
                // Inserir novos anexos em batch
        for (const attachment of attachments) {
                    await connection.query(
                'INSERT INTO proc_attachments (procedure_id, type, url, description) VALUES (?, ?, ?, ?)',
                [id, attachment.type, attachment.url, attachment.description]
            );
            }
        }

            return { id: id, versionCreated: hasImportantChanges || contentChanged };
        }, 90000); // 90 segundos timeout para atualização
        
        // Invalidar cache
        invalidateCache(['procedures']);
        
        console.log('✅ Transação commitada com sucesso');
        
        res.status(200).json({ 
            message: 'Procedimento atualizado com sucesso!', 
            id: result.id,
            versionCreated: result.versionCreated
        });
        
        return result;
    } catch (error) {
        console.error('Erro ao atualizar procedimento:', error);
            res.status(500).json({ message: 'Erro interno do servidor ao atualizar o procedimento.' });
        return { id: null };
    }
};

// Reverter um procedimento para uma versão específica
exports.revertToVersion = async (req, res) => {
    const { id } = req.params;
    const { version_number } = req.body;
    const authorId = getAuthorIdFromHeader(req);

    if (!version_number) {
        res.status(400).json({ message: 'O número da versão é obrigatório.' });
        return { success: false };
    }

    try {
        await executeQuery('START TRANSACTION');

        // 1. Buscar os dados da versão para a qual queremos reverter
        const versionDataResult = await executeQuery('SELECT * FROM proc_versions WHERE procedure_id = ? AND version_number = ?', [id, version_number]);
        if (versionDataResult.length === 0) {
            await executeQuery('ROLLBACK');
            res.status(404).json({ message: 'Versão não encontrada.' });
            return { success: false };
        }
        const versionData = versionDataResult[0];

        // Se a versão antiga não tiver dados de snapshot, não é possível reverter.
        if (!versionData.title || versionData.tags === null || versionData.attachments === null) {
            await executeQuery('ROLLBACK');
            res.status(400).json({ message: 'Não é possível reverter para esta versão, pois ela não contém um snapshot completo dos dados. Crie uma nova versão primeiro.' });
            return { success: false };
        }

        const contentToRevert = typeof versionData.content === 'string' ? JSON.parse(versionData.content) : versionData.content;
        const newSummary = generateSummaryFromContent(contentToRevert);
        
        // 2. Atualizar a tabela principal (proc_main) com os dados da versão antiga incluindo updated_at
        await executeQuery(
            'UPDATE proc_main SET title = ?, summary = ?, department_id = ?, role = ?, type_id = ?, responsible_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [versionData.title, newSummary, versionData.department_id, versionData.role, versionData.type_id, versionData.responsible_id, id]
        );

        // 3. Atualizar tags
        const tagsToRevert = typeof versionData.tags === 'string' ? JSON.parse(versionData.tags) : versionData.tags;
        await executeQuery('DELETE FROM proc_procedure_tags WHERE procedure_id = ?', [id]);
        if (tagsToRevert && tagsToRevert.length > 0) {
            for (const tagName of tagsToRevert) {
                const tagResult = await executeQuery('INSERT IGNORE INTO proc_tags (name) VALUES (?)', [tagName]);
                const tagId = tagResult.insertId || (await executeQuery('SELECT id FROM proc_tags WHERE name = ?', [tagName]))[0].id;
                await executeQuery('INSERT INTO proc_procedure_tags (procedure_id, tag_id) VALUES (?, ?)', [id, tagId]);
            }
        }
        
        // 4. Atualizar anexos
        const attachmentsToRevert = typeof versionData.attachments === 'string' ? JSON.parse(versionData.attachments) : versionData.attachments;
        await executeQuery('DELETE FROM proc_attachments WHERE procedure_id = ?', [id]);
        if (attachmentsToRevert && attachmentsToRevert.length > 0) {
            for (const attachment of attachmentsToRevert) {
                await executeQuery(
                    'INSERT INTO proc_attachments (procedure_id, type, url, description) VALUES (?, ?, ?, ?)',
                    [id, attachment.type, attachment.url, attachment.description]
                );
            }
        }

        // 5. Criar uma nova versão que representa o estado revertido
        const lastVersionResult = await executeQuery('SELECT MAX(version_number) as max_version FROM proc_versions WHERE procedure_id = ?', [id]);
        const newVersionNumber = (lastVersionResult[0].max_version || 0) + 1;
        
        const changeSummary = `Procedimento revertido para a versão ${version_number}.`;

        await executeQuery(
            'INSERT INTO proc_versions (procedure_id, version_number, author_id, content, change_summary, title, department_id, role, type_id, responsible_id, tags, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, newVersionNumber, authorId, JSON.stringify(contentToRevert), changeSummary, versionData.title, versionData.department_id, versionData.role, versionData.type_id, versionData.responsible_id, JSON.stringify(tagsToRevert), JSON.stringify(attachmentsToRevert)]
        );

        await executeQuery('COMMIT');
        res.json({ message: `Procedimento revertido com sucesso para a versão ${version_number}!` });
        return { success: true };

    } catch (error) {
        await executeQuery('ROLLBACK');
        console.error(`Erro ao reverter procedimento ${id} para a versão ${version_number}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao reverter o procedimento.' });
        return { success: false };
    }
};

// Deletar um procedimento
exports.deleteProcedure = async (req, res) => {
    const { id } = req.params;
    const userId = getAuthorIdFromHeader(req);

    try {
        // 1. Buscar o procedimento para verificar a permissão
        const procedureResult = await executeQuery('SELECT responsible_id FROM proc_main WHERE id = ?', [id]);
        if (procedureResult.length === 0) {
            return res.status(404).json({ message: 'Procedimento não encontrado.' });
        }
        const procedure = procedureResult[0];

        // 2. Verificar se o usuário logado é o responsável
        if (procedure.responsible_id !== userId) {
            return res.status(403).json({ message: 'Apenas o responsável pelo procedimento tem permissão de exclusão.' });
        }

        // 3. Executar o soft delete (marcar como excluído)
        await executeQuery('UPDATE proc_main SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        
        // Invalidar cache
        invalidateCache(['procedures']);
        
        console.log(`Procedimento ${id} marcado como excluído pelo usuário ${userId}.`);
        
        res.json({ message: 'Procedimento desativado com sucesso.' });
        return { success: true };
    } catch (error) {
        console.error(`Erro ao desativar procedimento ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
        return { success: false };
    }
};

// --- Funções para obter metadados ---

// Obter lista de departamentos (COM CACHE)
exports.getDepartments = async (req, res) => {
    try {
        // Verificar cache primeiro
        const cached = getCachedData('departments');
        if (cached) {
            return res.json(cached);
        }

        const departments = await executeQuery('SELECT id, name FROM departments ORDER BY name');
        
        // Cachear resultado
        setCachedData('departments', departments);
        
        res.json(departments);
    } catch (error) {
        console.error('Erro ao buscar departamentos:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// Obter lista de cargos (COM CACHE)
exports.getRoles = async (req, res) => {
    try {
        // Verificar cache primeiro
        const cached = getCachedData('roles');
        if (cached) {
            return res.json(cached);
        }

        const roles = await executeQuery("SELECT DISTINCT job_position FROM collaborators WHERE job_position IS NOT NULL AND job_position != '' ORDER BY job_position");
        const result = roles.map(r => r.job_position);
        
        // Cachear resultado
        setCachedData('roles', result);
        
        res.json(result);
    } catch (error) {
        console.error('Erro ao buscar cargos:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// Obter lista de tipos de procedimento (COM CACHE)
exports.getProcedureTypes = async (req, res) => {
    try {
        // Verificar cache primeiro
        const cached = getCachedData('types');
        if (cached) {
            return res.json(cached);
        }

        const types = await executeQuery('SELECT id, name FROM proc_types ORDER BY name');
        
        // Cachear resultado
        setCachedData('types', types);
        
        res.json(types);
    } catch (error) {
        console.error('Erro ao buscar tipos de procedimento:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// Obter lista de colaboradores para o campo "responsável" (COM CACHE)
exports.getResponsibles = async (req, res) => {
    try {
        // Verificar cache primeiro
        const cached = getCachedData('responsibles');
        if (cached) {
            return res.json(cached);
        }

        const responsibles = await executeQuery("SELECT id, CONCAT(name, ' ', family_name) AS name FROM collaborators WHERE name IS NOT NULL AND name != '' ORDER BY name");
        
        // Cachear resultado
        setCachedData('responsibles', responsibles);
        
        res.json(responsibles);
    } catch (error) {
        console.error('Erro ao buscar responsáveis:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
}; 

// Função auxiliar para buscar apenas o título de um procedimento (para notificações)
exports.getProcedureTitle = async (procedureId) => {
    try {
        const result = await executeQuery('SELECT title FROM proc_main WHERE id = ? AND deleted_at IS NULL', [procedureId]);
        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('Erro ao buscar título do procedimento:', error);
        return null;
    }
};

// Função auxiliar para gerar um resumo detalhado de alteração entre dois estados do procedimento
function generateDetailedChangeSummary(oldData, newData, versionNumber = 2) {
    // console.log('Old Data:', JSON.stringify(oldData));
    // console.log('New Data:', JSON.stringify(newData));
    
    if (versionNumber === 1) return 'Criação do procedimento';
    
    const changes = [];
    
    // Título
    if (!areValuesEqual(oldData.title, newData.title)) {
        changes.push(`Título alterado de "${normalizeValue(oldData.title) || 'vazio'}" para "${normalizeValue(newData.title) || 'vazio'}".`);
    }
    
    // Departamento - comparar IDs
    console.log('Departamento - Old:', oldData.department_id, 'New:', newData.department_id);
    if (!areValuesEqual(oldData.department_id, newData.department_id)) {
        const oldDeptName = oldData.department_name || 'não definido';
        const newDeptName = newData.department_name || 'não definido';
        changes.push(`Departamento alterado de "${oldDeptName}" para "${newDeptName}".`);
    }
    
    // Cargo
    console.log('Cargo - Old:', oldData.role, 'New:', newData.role);
    if (!areValuesEqual(oldData.role, newData.role)) {
        changes.push(`Cargo alterado de "${normalizeValue(oldData.role) || 'não definido'}" para "${normalizeValue(newData.role) || 'não definido'}".`);
    }
    
    // Tipo - comparar IDs
    console.log('Tipo - Old:', oldData.type_id, 'New:', newData.type_id);
    if (!areValuesEqual(oldData.type_id, newData.type_id)) {
        const oldTypeName = oldData.type_name || 'não definido';
        const newTypeName = newData.type_name || 'não definido';
        changes.push(`Tipo alterado de "${oldTypeName}" para "${newTypeName}".`);
    }
    
    // Responsável - comparar IDs
    console.log('Responsável - Old:', oldData.responsible_id, 'New:', newData.responsible);
    if (!areValuesEqual(oldData.responsible_id, newData.responsible)) {
        const oldRespName = oldData.responsible_name || 'não definido';
        const newRespName = newData.responsible_name || 'não definido';
        changes.push(`Responsável alterado de "${oldRespName}" para "${newRespName}".`);
    }
    
    // Tags
    const oldTags = Array.isArray(oldData.tags) ? oldData.tags : [];
    const newTags = Array.isArray(newData.tags) ? newData.tags : [];
    console.log('Tags - Old:', oldTags, 'New:', newTags);
    const addedTags = newTags.filter(t => !oldTags.includes(t));
    const removedTags = oldTags.filter(t => !newTags.includes(t));
    if (addedTags.length > 0) changes.push(`Tags adicionadas: ${addedTags.join(', ')}.`);
    if (removedTags.length > 0) changes.push(`Tags removidas: ${removedTags.join(', ')}.`);
    
    // Anexos (comparação detalhada por URL e descrição)
    const oldAttachments = Array.isArray(oldData.attachments) ? oldData.attachments : [];
    const newAttachments = Array.isArray(newData.attachments) ? newData.attachments : [];

    const oldUrls = oldAttachments.map(a => a.url);
    const newUrls = newAttachments.map(a => a.url);

    const addedCount = newAttachments.filter(a => !oldUrls.includes(a.url)).length;
    const removedCount = oldAttachments.filter(a => !newUrls.includes(a.url)).length;

    if (addedCount > 0) {
        changes.push(`Adicionado(s) ${addedCount} anexo(s).`);
    }
    if (removedCount > 0) {
        changes.push(`Removido(s) ${removedCount} anexo(s).`);
    }

    // Verificar mudanças na descrição dos anexos que permaneceram
    let descriptionChanged = false;
    const keptNewAttachments = newAttachments.filter(a => oldUrls.includes(a.url));
    for (const newAttach of keptNewAttachments) {
        const oldAttach = oldAttachments.find(a => a.url === newAttach.url);
        // Compara descrições, considerando que podem ser null, undefined ou strings vazias
        if (oldAttach && normalizeValue(oldAttach.description) !== normalizeValue(newAttach.description)) {
            descriptionChanged = true;
            break; // Sai do loop assim que a primeira alteração é encontrada
        }
    }

    if (descriptionChanged) {
        changes.push('Descrição de um ou mais anexos foi alterada.');
    }
    
    // Verificar se é a primeira edição após a criação
    const isFirstEdit = versionNumber === 2;
    
    // Conteúdo - Comparação direta dos textos
    const oldText = generateSummaryFromContent(oldData.content, 500);
    const newText = generateSummaryFromContent(newData.content, 500);
    
    // console.log('=== ANÁLISE DE CONTEÚDO ===');
    // console.log('Versão:', versionNumber, '| É primeira edição?', isFirstEdit);
    // console.log('Texto antigo (length:', oldText.length, '):', oldText.substring(0, 50) + (oldText.length > 50 ? '...' : ''));
    // console.log('Texto novo (length:', newText.length, '):', newText.substring(0, 50) + (newText.length > 50 ? '...' : ''));
    
    // Se ambos têm conteúdo e são diferentes
    if (oldText && newText && oldText !== newText) {
        console.log('DECISÃO: Conteúdo realmente alterado (ambos têm texto e são diferentes)');
        changes.push('Conteúdo do procedimento alterado.');
    }
    // Se tinha conteúdo antes mas agora está vazio
    else if (oldText && !newText) {
        console.log('DECISÃO: Conteúdo removido (tinha texto, agora vazio)');
        changes.push('Conteúdo do procedimento removido.');
    }
    // Se não tinha conteúdo antes mas agora tem
    else if (!oldText && newText) {
        // Na primeira edição, não mostramos como alteração
        if (!isFirstEdit) {
            console.log('DECISÃO: Conteúdo adicionado (não é primeira edição)');
            changes.push('Conteúdo do procedimento alterado.');
        } else {
            console.log('DECISÃO: Conteúdo adicionado na primeira edição - ignorando');
        }
    }
    // Se ambos são iguais ou ambos estão vazios
    else {
        console.log('DECISÃO: Conteúdo não alterado (iguais ou ambos vazios)');
    }
    
    console.log('=== FIM ANÁLISE DE CONTEÚDO ===');
    
    console.log('Changes detected:', changes);
    
    if (changes.length === 0) return 'Sem alterações no procedimento.';
    return changes.join(' ');
}

// Função auxiliar para normalizar valores para comparação
function normalizeValue(val) {
    if (val === undefined || val === null) return '';
    return String(val).trim();
}

// Função para comparar valores considerando tipos numéricos
function areValuesEqual(val1, val2) {
    console.log(`Comparando valores: "${val1}" (${typeof val1}) e "${val2}" (${typeof val2})`);
    
    // Se ambos são undefined ou null, são iguais
    if ((!val1 && !val2) || (val1 === null && val2 === null)) {
        return true;
    }
    
    // Se um é undefined/null e o outro não, são diferentes
    if ((!val1 && val2) || (val1 && !val2)) {
        return false;
    }
    
    // Normaliza para string para comparação inicial
    const str1 = normalizeValue(val1);
    const str2 = normalizeValue(val2);
    
    // Comparação direta de strings normalizadas
    if (str1 === str2) {
        return true;
    }
    
    // Tenta comparar como números se ambos parecem ser numéricos
    if (!isNaN(val1) && !isNaN(val2)) {
        return Number(val1) === Number(val2);
    }
    
    // Caso contrário, são diferentes
    return false;
} 