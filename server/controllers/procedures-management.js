const { executeQuery } = require('../connect/mysql');
const fs = require('fs');
const path = require('path');

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
    // Retorna um ID de fallback (ex: usuário "Sistema") caso o header não seja encontrado ou falhe.
    return 1;
};

// Função auxiliar para extrair texto puro do formato Delta do Quill e truncar.
function generateSummaryFromContent(content, maxLength = 250) {
    // Trata todos os casos de conteúdo vazio
    if (!content || !content.ops || !Array.isArray(content.ops) || content.ops.length === 0) {
        return '';
    }
    const text = content.ops.reduce((acc, op) => {
        if (typeof op.insert === 'string') {
            return acc + op.insert;
        }
        return acc;
    }, '').replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
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

// Função auxiliar para comparar conteúdos Delta do Quill
function areDeltaContentsEqual(content1, content2, ignoreEmptyOld = false) {
    // Se ambos são nulos ou undefined, são iguais
    if (!content1 && !content2) {
        console.log('Ambos conteúdos são nulos/undefined - iguais');
        return true;
    }
    
    try {
        // Normaliza para garantir que estamos comparando objetos
        const obj1 = typeof content1 === 'string' ? JSON.parse(content1) : content1;
        const obj2 = typeof content2 === 'string' ? JSON.parse(content2) : content2;
        
        // Extrai apenas o texto para comparação
        const text1 = generateSummaryFromContent(obj1, 10000);
        const text2 = generateSummaryFromContent(obj2, 10000);
        
        console.log('Comparação de conteúdo:');
        console.log('- Texto 1 (length:', text1.length, '):', text1.substring(0, 100) + (text1.length > 100 ? '...' : ''));
        console.log('- Texto 2 (length:', text2.length, '):', text2.substring(0, 100) + (text2.length > 100 ? '...' : ''));
        
        // Se o texto antigo está vazio e a opção ignoreEmptyOld está ativada, 
        // considera os conteúdos iguais para não mostrar "conteúdo alterado"
        if (ignoreEmptyOld && !text1) {
            console.log('Ignorando conteúdo vazio anterior');
            return true;
        }
        
        // Compara os textos extraídos
        const isEqual = text1 === text2;
        console.log('Resultado da comparação de conteúdo:', isEqual ? 'IGUAIS' : 'DIFERENTES');
        return isEqual;
    } catch (e) {
        console.error('Erro ao comparar conteúdos Delta:', e);
        // Em caso de erro, faz uma comparação simples de strings
        const str1 = JSON.stringify(content1);
        const str2 = JSON.stringify(content2);
        const isEqual = str1 === str2;
        console.log('Comparação de fallback (JSON):', isEqual ? 'IGUAIS' : 'DIFERENTES');
        return isEqual;
    }
}

// Função auxiliar para gerar um resumo de alteração entre dois conteúdos Quill Delta
function generateChangeSummary(oldContent, newContent, versionNumber = 2) {
    const oldText = generateSummaryFromContent(oldContent, 500);
    const newText = generateSummaryFromContent(newContent, 500);

    if (versionNumber === 1) return 'Criação do procedimento';
    if (oldText === newText) return 'Sem alterações no conteúdo.';

    if (!oldText && newText && versionNumber === 2) return 'Alteração de conteúdo.';
    if (!oldText && newText) return 'Alteração de conteúdo.';
    if (oldText && !newText) return 'Conteúdo removido.';

    if (newText.startsWith(oldText) && newText.length > oldText.length) {
        const added = newText.substring(oldText.length).trim().split(' ').slice(0, 8).join(' ');
        return `Conteúdo ampliado. Adicionado: "${added}..."`;
    }
    if (oldText.startsWith(newText) && oldText.length > newText.length) {
        const removed = oldText.substring(newText.length).trim().split(' ').slice(0, 8).join(' ');
        return `Conteúdo reduzido. Removido: "${removed}..."`;
    }

    let diffIndex = 0;
    while (diffIndex < oldText.length && diffIndex < newText.length && oldText[diffIndex] === newText[diffIndex]) {
        diffIndex++;
    }
    const trechoNovo = newText.substring(diffIndex, diffIndex + 20).split(' ').slice(0, 8).join(' ');
    const trechoAntigo = oldText.substring(diffIndex, diffIndex + 20).split(' ').slice(0, 8).join(' ');

    return `Conteúdo alterado. Antes: "${trechoAntigo}..." Agora: "${trechoNovo}..."`;
}

// Função auxiliar para gerar um resumo detalhado de alteração entre dois estados do procedimento
function generateDetailedChangeSummary(oldData, newData, versionNumber = 2) {
    console.log('Old Data:', JSON.stringify(oldData));
    console.log('New Data:', JSON.stringify(newData));
    
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
    
    console.log('=== ANÁLISE DE CONTEÚDO ===');
    console.log('Versão:', versionNumber, '| É primeira edição?', isFirstEdit);
    console.log('Texto antigo (length:', oldText.length, '):', oldText.substring(0, 50) + (oldText.length > 50 ? '...' : ''));
    console.log('Texto novo (length:', newText.length, '):', newText.substring(0, 50) + (newText.length > 50 ? '...' : ''));
    
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

// Função auxiliar para obter tags de um procedimento
async function getTagsForProcedure(procedureId) {
    const tags = await executeQuery('SELECT t.name FROM proc_tags t JOIN proc_procedure_tags pt ON t.id = pt.tag_id WHERE pt.procedure_id = ?', [procedureId]);
    return tags.map(tag => tag.name);
}

// Obter todos os procedimentos para a listagem
exports.getProcedures = async (req, res) => {
    try {
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
                p.updated_at
            FROM proc_main p
            LEFT JOIN departments d ON p.department_id = d.id
            LEFT JOIN proc_types pt ON p.type_id = pt.id
            LEFT JOIN collaborators c ON p.responsible_id = c.id
            WHERE p.deleted_at IS NULL
            ORDER BY p.updated_at DESC
        `);
        for (const proc of procedures) {
            proc.tags = await getTagsForProcedure(proc.id);
        }
        res.json(procedures);
    } catch (error) {
        console.error('Erro ao buscar procedimentos:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// Obter um procedimento completo por ID
exports.getProcedureById = async (req, res) => {
    const { id } = req.params;
    try {
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
            WHERE p.id = ?
        `, [id]);

        if (procedureResult.length === 0) {
            return res.status(404).json({ message: 'Procedimento não encontrado.' });
        }
        const procedure = procedureResult[0];

        const [versions, attachments, tags] = await Promise.all([
            executeQuery(`
                SELECT 
                    v.*,
                    c.name as author_name
                FROM proc_versions v
                LEFT JOIN collaborators c ON v.author_id = c.id
                WHERE v.procedure_id = ? 
                ORDER BY v.version_number DESC
            `, [id]),
            executeQuery('SELECT * FROM proc_attachments WHERE procedure_id = ?', [id]),
            getTagsForProcedure(id)
        ]);

        procedure.content = versions.length > 0 ? versions[0].content : { ops: [] };
        procedure.versions = versions;
        procedure.attachments = attachments;
        procedure.tags = tags;

        res.json(procedure);
    } catch (error) {
        console.error(`Erro ao buscar procedimento ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// Criar um novo procedimento
exports.createProcedure = async (req, res) => {
    const { title, department_id, role, type_id, responsible, content, attachments = [], tags = [] } = req.body;
    
    if (!title || !department_id || !role || !type_id || !responsible || !content) {
        res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' });
        return { id: null };
    }

    const authorId = getAuthorIdFromHeader(req);
    const summary = generateSummaryFromContent(content);

    try {
        await executeQuery('START TRANSACTION');

        const mainResult = await executeQuery(
            'INSERT INTO proc_main (title, summary, department_id, role, type_id, responsible_id) VALUES (?, ?, ?, ?, ?, ?)',
            [title, summary, department_id, role, type_id, responsible]
        );
        const procedureId = mainResult.insertId;

        await executeQuery(
            'INSERT INTO proc_versions (procedure_id, version_number, author_id, content, change_summary, title, department_id, role, type_id, responsible_id, tags, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [procedureId, 1, authorId, JSON.stringify(content), 'Criação do procedimento.', title, department_id, role, type_id, responsible, JSON.stringify(tags), JSON.stringify(attachments)]
        );

        if (tags && tags.length > 0) {
        for (const tagName of tags) {
            const tagResult = await executeQuery('INSERT IGNORE INTO proc_tags (name) VALUES (?)', [tagName]);
            const tagId = tagResult.insertId || (await executeQuery('SELECT id FROM proc_tags WHERE name = ?', [tagName]))[0].id;
            await executeQuery('INSERT INTO proc_procedure_tags (procedure_id, tag_id) VALUES (?, ?)', [procedureId, tagId]);
            }
        }
        
        if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
            await executeQuery(
                'INSERT INTO proc_attachments (procedure_id, type, url, description) VALUES (?, ?, ?, ?)',
                [procedureId, attachment.type, attachment.url, attachment.description]
            );
            }
        }

        await executeQuery('COMMIT');
        res.status(201).json({ message: 'Procedimento criado com sucesso!', id: procedureId });
        return { id: procedureId };
    } catch (error) {
        await executeQuery('ROLLBACK');
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
    
    const summary = generateSummaryFromContent(content);

    try {
        await executeQuery('START TRANSACTION');
        
        // Buscar dados antigos ANTES de atualizar
        const oldMainArr = await executeQuery(`
            SELECT 
                p.title, 
                p.department_id, 
                p.role, 
                p.type_id, 
                p.responsible_id,
                d.name AS department_name,
                pt.name AS type_name,
                c.name AS responsible_name
            FROM proc_main p
            LEFT JOIN departments d ON p.department_id = d.id
            LEFT JOIN proc_types pt ON p.type_id = pt.id
            LEFT JOIN collaborators c ON p.responsible_id = c.id
            WHERE p.id = ?
        `, [id]);
        const oldMain = oldMainArr[0] || {};
        
        // Converter IDs para números para garantir comparação correta
        if (oldMain.department_id) oldMain.department_id = Number(oldMain.department_id);
        if (oldMain.type_id) oldMain.type_id = Number(oldMain.type_id);
        if (oldMain.responsible_id) oldMain.responsible_id = Number(oldMain.responsible_id);
        
        // Buscar tags antigas
        const oldTags = await getTagsForProcedure(id);
        
        // Buscar anexos antigos
        const oldAttachments = await executeQuery('SELECT type, url, description FROM proc_attachments WHERE procedure_id = ?', [id]);
        
        // Buscar conteúdo da última versão
        let lastContent = { ops: [] };
        let lastContentValid = false;
        const lastVersionResult = await executeQuery('SELECT MAX(version_number) as max_version FROM proc_versions WHERE procedure_id = ?', [id]);
        const newVersionNumber = (lastVersionResult[0].max_version || 0) + 1;
        
        if (lastVersionResult[0].max_version) {
            const lastVersion = await executeQuery('SELECT content FROM proc_versions WHERE procedure_id = ? AND version_number = ?', [id, lastVersionResult[0].max_version]);
            if (lastVersion.length > 0) {
                try {
                    const rawContent = lastVersion[0].content;
                    console.log('Conteúdo bruto da última versão:', typeof rawContent, rawContent);
                    
                    // Se já é um objeto, usa diretamente
                    if (typeof rawContent === 'object' && rawContent !== null) {
                        lastContent = rawContent;
                        lastContentValid = true;
                        console.log('Conteúdo da última versão carregado como objeto');
                    } 
                    // Se é string, tenta parsear
                    else if (typeof rawContent === 'string') {
                        lastContent = JSON.parse(rawContent);
                        lastContentValid = true;
                        console.log('Conteúdo da última versão parseado com sucesso');
                    }
                } catch (e) { 
                    console.error('Erro ao parsear conteúdo da última versão:', e);
                    lastContent = { ops: [] };
                    lastContentValid = false;
                    console.log('Usando conteúdo vazio como fallback');
                }
            }
        }
        
        // Garantir que o conteúdo atual é um objeto válido
        let currentContent;
        try {
            // Se content já for um objeto, usa como está
            if (typeof content === 'object' && content !== null) {
                currentContent = content;
            } else {
                // Caso contrário, tenta parsear
                currentContent = JSON.parse(content);
            }
            console.log('Conteúdo atual é válido');
        } catch (e) {
            console.error('Erro ao processar conteúdo atual:', e);
            currentContent = { ops: [] };
        }
        
        // Verificar se o conteúdo realmente mudou comparando com a última versão
        console.log('=== VERIFICAÇÃO DE ALTERAÇÃO DE CONTEÚDO ===');
        console.log('lastContent:', JSON.stringify(lastContent));
        console.log('lastContentValid:', lastContentValid);
        console.log('currentContent:', JSON.stringify(currentContent));
        
        let contentReallyChanged = false;
        let contentForComparison = currentContent;
        
        // Se o conteúdo da última versão é válido, fazer comparação normal
        if (lastContentValid) {
            contentReallyChanged = !areDeltaContentsEqual(lastContent, currentContent);
            contentForComparison = contentReallyChanged ? lastContent : currentContent;
            console.log('Comparação normal - Conteúdo mudou?', contentReallyChanged);
        } 
        // Se o conteúdo da última versão não é válido, assumir que não mudou
        // para evitar falsos positivos quando apenas outros campos são alterados
        else {
            console.log('Conteúdo da última versão inválido - assumindo que não mudou');
            contentReallyChanged = false;
            contentForComparison = currentContent; // Usar conteúdo atual para ambas as comparações
        }
        
        console.log('Resultado final - Conteúdo realmente mudou?', contentReallyChanged);
        console.log('Conteúdo que será usado para comparação:', contentReallyChanged ? 'ÚLTIMO SALVO' : 'ATUAL');
        console.log('=== FIM VERIFICAÇÃO ===');
        
        // Buscar informações dos novos valores selecionados
        const [newDepartment, newType, newResponsible] = await Promise.all([
            executeQuery('SELECT name FROM departments WHERE id = ?', [department_id]),
            executeQuery('SELECT name FROM proc_types WHERE id = ?', [type_id]),
            executeQuery('SELECT name FROM collaborators WHERE id = ?', [responsible])
        ]);
        
        console.log('Valores dos campos:', {
            oldDepartmentId: oldMain.department_id, 
            newDepartmentId: department_id,
            oldTypeId: oldMain.type_id, 
            newTypeId: type_id,
            oldResponsibleId: oldMain.responsible_id, 
            newResponsibleId: responsible
        });
        
        // Atualizar o proc_main
        await executeQuery(
            'UPDATE proc_main SET title = ?, summary = ?, department_id = ?, role = ?, type_id = ?, responsible_id = ? WHERE id = ?',
            [title, summary, department_id, role, type_id, responsible, id]
        );
        
        // Montar objeto oldData e newData
        const oldData = { 
            ...oldMain,
            tags: oldTags, 
            attachments: oldAttachments, 
            content: contentForComparison // Usar conteúdo apropriado para comparação
        };
        
        const newData = { 
            title, 
            department_id, 
            department_name: newDepartment.length > 0 ? newDepartment[0].name : '',
            role, 
            type_id, 
            type_name: newType.length > 0 ? newType[0].name : '',
            responsible_id: responsible, // Usar o mesmo nome de campo que no oldData
            responsible_name: newResponsible.length > 0 ? newResponsible[0].name : '',
            responsible, // Manter para compatibilidade
            tags, 
            attachments, 
            content: currentContent // Usar o conteúdo processado
        };
        
        // Gerar o resumo de alterações
        const changeSummary = generateDetailedChangeSummary(oldData, newData, newVersionNumber);
        
        // Se não houver alterações, não criar uma nova versão
        if (changeSummary === 'Sem alterações no procedimento.') {
            await executeQuery('COMMIT');
            res.json({ message: 'Procedimento atualizado com sucesso! (Sem alterações detectadas)' });
            return { success: true };
        }
        
        // Inserir nova versão com o snapshot completo
        await executeQuery(
            'INSERT INTO proc_versions (procedure_id, version_number, author_id, content, change_summary, title, department_id, role, type_id, responsible_id, tags, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, newVersionNumber, authorId, JSON.stringify(currentContent), changeSummary, newData.title, newData.department_id, newData.role, newData.type_id, newData.responsible_id, JSON.stringify(newData.tags), JSON.stringify(newData.attachments)]
        );

        await executeQuery('DELETE FROM proc_procedure_tags WHERE procedure_id = ?', [id]);
        if (tags && tags.length > 0) {
        for (const tagName of tags) {
            const tagResult = await executeQuery('INSERT IGNORE INTO proc_tags (name) VALUES (?)', [tagName]);
            const tagId = tagResult.insertId || (await executeQuery('SELECT id FROM proc_tags WHERE name = ?', [tagName]))[0].id;
            await executeQuery('INSERT INTO proc_procedure_tags (procedure_id, tag_id) VALUES (?, ?)', [id, tagId]);
            }
        }

        await executeQuery('DELETE FROM proc_attachments WHERE procedure_id = ?', [id]);
        if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
            await executeQuery(
                'INSERT INTO proc_attachments (procedure_id, type, url, description) VALUES (?, ?, ?, ?)',
                [id, attachment.type, attachment.url, attachment.description]
            );
            }
        }

        await executeQuery('COMMIT');
        res.json({ message: 'Procedimento atualizado com sucesso!' });
        return { success: true };
    } catch (error) {
        await executeQuery('ROLLBACK');
        console.error(`Erro ao atualizar procedimento ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar o procedimento.' });
        return { success: false };
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
        
        // 2. Atualizar a tabela principal (proc_main) com os dados da versão antiga
        await executeQuery(
            'UPDATE proc_main SET title = ?, summary = ?, department_id = ?, role = ?, type_id = ?, responsible_id = ? WHERE id = ?',
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

// Obter lista de departamentos
exports.getDepartments = async (req, res) => {
    try {
        const departments = await executeQuery('SELECT id, name FROM departments ORDER BY name');
        res.json(departments);
    } catch (error) {
        console.error('Erro ao buscar departamentos:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// Obter lista de cargos (distintos da tabela de colaboradores)
exports.getRoles = async (req, res) => {
    try {
        const roles = await executeQuery("SELECT DISTINCT job_position FROM collaborators WHERE job_position IS NOT NULL AND job_position != '' ORDER BY job_position");
        res.json(roles.map(r => r.job_position));
    } catch (error) {
        console.error('Erro ao buscar cargos:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// Obter lista de tipos de procedimento
exports.getProcedureTypes = async (req, res) => {
    try {
        const types = await executeQuery('SELECT id, name FROM proc_types ORDER BY name');
        res.json(types);
    } catch (error) {
        console.error('Erro ao buscar tipos de procedimento:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// Obter lista de colaboradores para o campo "responsável"
exports.getResponsibles = async (req, res) => {
    try {
        const responsibles = await executeQuery("SELECT id, CONCAT(name, ' ', family_name) AS name FROM collaborators WHERE name IS NOT NULL AND name != '' ORDER BY name");
        res.json(responsibles);
    } catch (error) {
        console.error('Erro ao buscar responsáveis:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
}; 