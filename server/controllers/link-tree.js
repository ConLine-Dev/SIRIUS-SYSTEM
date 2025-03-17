const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Caminho para o arquivo JSON que armazena os dados do link-tree
const dataFilePath = path.join(__dirname, '../../uploads/marketing/link-tree/link-tree-data.json');
const agentGuideDir = path.join(__dirname, '../../uploads/marketing/link-tree/agent-guide');

// Função auxiliar para garantir que os diretórios existam
async function ensureDirectoriesExist() {
    try {
        await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
        await fs.mkdir(agentGuideDir, { recursive: true });
    } catch (error) {
        console.error('Erro ao criar diretórios:', error);
        throw error;
    }
}

// Função auxiliar para ler os dados do link-tree
async function readLinkTreeData() {
    try {
        await ensureDirectoriesExist();
        
        try {
            const data = await fs.readFile(dataFilePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // Se o arquivo não existir ou estiver corrompido, cria um novo
            const defaultData = {
                buttons: [],
                agentGuide: null
            };
            await fs.writeFile(dataFilePath, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
    } catch (error) {
        console.error('Erro ao ler dados do link-tree:', error);
        throw error;
    }
}

// Função auxiliar para salvar os dados do link-tree
async function saveLinkTreeData(data) {
    try {
        await ensureDirectoriesExist();
        await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Erro ao salvar dados do link-tree:', error);
        throw error;
    }
}

module.exports = {
    // Obter todos os botões e informações do guia do agente
    getLinkTreeData: async function() {
        try {
            return await readLinkTreeData();
        } catch (error) {
            console.error('Erro ao obter dados do link-tree:', error);
            throw error;
        }
    },

    // Adicionar um novo botão
    addButton: async function(buttonData) {
        try {
            const data = await readLinkTreeData();
            
            // Adiciona um ID único ao botão
            const newButton = {
                id: crypto.randomUUID(),
                title: buttonData.title,
                url: buttonData.url,
                downloadUrl: buttonData.downloadUrl || null,
                active: buttonData.active !== undefined ? buttonData.active : true,
                createdAt: new Date().toISOString()
            };
            
            data.buttons.push(newButton);
            await saveLinkTreeData(data);
            
            return newButton;
        } catch (error) {
            console.error('Erro ao adicionar botão:', error);
            throw error;
        }
    },

    // Atualizar um botão existente
    updateButton: async function(buttonId, buttonData) {
        try {
            const data = await readLinkTreeData();
            
            const buttonIndex = data.buttons.findIndex(button => button.id === buttonId);
            if (buttonIndex === -1) {
                throw new Error('Botão não encontrado');
            }
            
            // Atualiza os dados do botão
            data.buttons[buttonIndex] = {
                ...data.buttons[buttonIndex],
                title: buttonData.title !== undefined ? buttonData.title : data.buttons[buttonIndex].title,
                url: buttonData.url !== undefined ? buttonData.url : data.buttons[buttonIndex].url,
                downloadUrl: buttonData.downloadUrl !== undefined ? buttonData.downloadUrl : data.buttons[buttonIndex].downloadUrl,
                active: buttonData.active !== undefined ? buttonData.active : data.buttons[buttonIndex].active,
                updatedAt: new Date().toISOString()
            };
            
            await saveLinkTreeData(data);
            
            return data.buttons[buttonIndex];
        } catch (error) {
            console.error('Erro ao atualizar botão:', error);
            throw error;
        }
    },

    // Remover um botão
    deleteButton: async function(buttonId) {
        try {
            const data = await readLinkTreeData();
            
            const buttonIndex = data.buttons.findIndex(button => button.id === buttonId);
            if (buttonIndex === -1) {
                throw new Error('Botão não encontrado');
            }
            
            // Remove o botão
            data.buttons.splice(buttonIndex, 1);
            
            await saveLinkTreeData(data);
            
            return { success: true, message: 'Botão removido com sucesso' };
        } catch (error) {
            console.error('Erro ao remover botão:', error);
            throw error;
        }
    },

    // Reordenar botões
    reorderButtons: async function(buttonIds) {
        try {
            const data = await readLinkTreeData();
            
            // Verifica se todos os IDs fornecidos existem nos botões atuais
            const currentButtonIds = data.buttons.map(button => button.id);
            const allIdsExist = buttonIds.every(id => currentButtonIds.includes(id));
            
            if (!allIdsExist) {
                throw new Error('Um ou mais botões não foram encontrados');
            }
            
            // Verifica se a quantidade de IDs é a mesma
            if (buttonIds.length !== data.buttons.length) {
                throw new Error('A quantidade de botões não corresponde');
            }
            
            // Cria um novo array de botões na ordem especificada
            const reorderedButtons = buttonIds.map(id => {
                return data.buttons.find(button => button.id === id);
            });
            
            // Atualiza os botões com a nova ordem
            data.buttons = reorderedButtons;
            
            await saveLinkTreeData(data);
            
            return data.buttons;
        } catch (error) {
            console.error('Erro ao reordenar botões:', error);
            throw error;
        }
    },

    // Upload do guia do agente (PDF)
    uploadAgentGuide: async function(file) {
        try {
            await ensureDirectoriesExist();
            
            // Gera um nome único para o arquivo
            const timestamp = Date.now();
            const randomString = crypto.randomBytes(8).toString('hex');
            const fileExtension = path.extname(file.originalname);
            const fileName = `agent-guide-${timestamp}-${randomString}${fileExtension}`;
            
            // Caminho completo para o arquivo
            const filePath = path.join(agentGuideDir, fileName);
            
            // Move o arquivo para o diretório de destino
            await fs.rename(file.path, filePath);
            
            // Atualiza os dados do link-tree com o novo arquivo
            const data = await readLinkTreeData();
            
            // Se já existir um guia, exclui o arquivo antigo
            if (data.agentGuide && data.agentGuide.filePath) {
                try {
                    await fs.unlink(path.join(agentGuideDir, path.basename(data.agentGuide.filePath)));
                } catch (error) {
                    console.error('Erro ao excluir arquivo antigo:', error);
                    // Continua mesmo se não conseguir excluir o arquivo antigo
                }
            }
            
            // Atualiza os dados com o novo arquivo
            data.agentGuide = {
                fileName: file.originalname,
                filePath: `/uploads/marketing/link-tree/agent-guide/${fileName}`,
                mimeType: file.mimetype,
                size: file.size,
                uploadedAt: new Date().toISOString()
            };
            
            await saveLinkTreeData(data);
            
            return data.agentGuide;
        } catch (error) {
            console.error('Erro ao fazer upload do guia do agente:', error);
            throw error;
        }
    },

    // Remover o guia do agente
    deleteAgentGuide: async function() {
        try {
            const data = await readLinkTreeData();
            
            // Verifica se existe um guia
            if (!data.agentGuide) {
                throw new Error('Guia do agente não encontrado');
            }
            
            // Exclui o arquivo
            try {
                await fs.unlink(path.join(agentGuideDir, path.basename(data.agentGuide.filePath)));
            } catch (error) {
                console.error('Erro ao excluir arquivo do guia:', error);
                // Continua mesmo se não conseguir excluir o arquivo
            }
            
            // Atualiza os dados
            data.agentGuide = null;
            
            await saveLinkTreeData(data);
            
            return { success: true, message: 'Guia do agente removido com sucesso' };
        } catch (error) {
            console.error('Erro ao remover guia do agente:', error);
            throw error;
        }
    },
    
    // Obter o caminho do arquivo do guia do agente para visualização
    getAgentGuidePath: async function() {
        try {
            const data = await readLinkTreeData();
            
            // Verifica se existe um guia
            if (!data.agentGuide) {
                throw new Error('Guia do agente não encontrado');
            }
            
            return {
                filePath: path.join(agentGuideDir, path.basename(data.agentGuide.filePath)),
                fileName: data.agentGuide.fileName,
                mimeType: data.agentGuide.mimeType
            };
        } catch (error) {
            console.error('Erro ao obter caminho do guia do agente:', error);
            throw error;
        }
    },
    
    // Obter dados públicos para API externa (apenas links ativos)
    getPublicLinks: async function() {
        try {
            const data = await readLinkTreeData();
            
            // Filtrar apenas os botões ativos
            const activeButtons = data.buttons
                .filter(button => button.active)
                .map(button => ({
                    id: button.id,
                    title: button.title,
                    url: button.url,
                    downloadUrl: button.downloadUrl
                }));
            
            // Dados do guia do agente, caso exista
            const agentGuide = data.agentGuide ? {
                title: 'Guia do Agente',
                url: '/api/link-tree/agent-guide/view'
            } : null;
            
            // Adicionar o guia ao final, se existir
            const result = {
                links: activeButtons,
                agentGuide: agentGuide
            };
            
            return result;
        } catch (error) {
            console.error('Erro ao obter links públicos:', error);
            throw error;
        }
    }
}; 