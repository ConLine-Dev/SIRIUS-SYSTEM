// material-api.js
// Gerenciamento de chamadas à API de Materiais

// MaterialAPI - Gerenciamento de Materiais
class MaterialAPI {
    constructor() {
        this.baseUrl = '/api/material-control';
    }

    // Método para buscar todos os materiais com estoque
    async getAllMaterials() {
        try {
            const response = await fetch(`${this.baseUrl}/materials`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao buscar materiais');
            }
            const data = await response.json();
            
            // Verificar a estrutura dos dados
            if (Array.isArray(data)) {
                // Se for um array direto
                return data;
            } else if (data.materials) {
                // Se já tiver a chave materials
                return data.materials;
            } else {
                // Caso contrário, criar um array com o dado
                return [data];
            }
        } catch (error) {
            console.error('Erro na requisição de materiais:', error);
            throw error;
        }
    }

    // Método para determinar status do estoque
    determineStockStatus(material) {
        const currentStock = material.current_stock || 0;
        const minimumStock = material.minimum_stock || 0;

        if (currentStock <= 0) return 'inactive';
        if (currentStock <= minimumStock) return 'low_stock';
        return 'active';
    }

    // Método para calcular detalhes de estoque de um material específico
    getMaterialStockDetails(materialId) {
        return new Promise((resolve, reject) => {
            fetch(`${this.baseUrl}/materials/${materialId}/stock-details`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao buscar detalhes de estoque');
                    }
                    return response.json();
                })
                .then(details => resolve(details))
                .catch(error => {
                    console.error('Erro na requisição de detalhes de estoque:', error);
                    reject(error);
                });
        });
    }

    // Método para registrar entrada de estoque
    registerStockEntry(entryData) {
        return new Promise((resolve, reject) => {
            fetch(`${this.baseUrl}/stock/entry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(entryData)
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(errorText => {
                        console.error('Erro na resposta:', errorText);
                        throw new Error(errorText || 'Erro ao registrar entrada de estoque');
                    });
                }
                return response.json();
            })
            .then(result => resolve(result))
            .catch(error => {
                console.error('Erro ao registrar entrada de estoque:', error);
                reject(error);
            });
        });
    }

    // Método para registrar saída de estoque
    registerStockOutput(outputData) {
        return new Promise((resolve, reject) => {
            fetch(`${this.baseUrl}/stock/output`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(outputData)
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(errorText => {
                        console.error('Erro na resposta:', errorText);
                        throw new Error(errorText || 'Erro ao registrar saída de estoque');
                    });
                }
                return response.json();
            })
            .then(result => resolve(result))
            .catch(error => {
                console.error('Erro ao registrar saída de estoque:', error);
                reject(error);
            });
        });
    }

    // Método para criar novo material
    createMaterial(materialData) {
        return new Promise((resolve, reject) => {
            fetch(`${this.baseUrl}/materials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(materialData)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Erro ao criar material');
                    });
                }
                return response.json();
            })
            .then(result => resolve(result))
            .catch(error => {
                console.error('Erro ao criar material:', error);
                reject(error);
            });
        });
    }

    // Método para buscar histórico de movimentações
    getMovementHistory(filters = {}) {
        const queryParams = new URLSearchParams(filters);
        return new Promise((resolve, reject) => {
            fetch(`${this.baseUrl}/movements?${queryParams}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao buscar histórico de movimentações');
                    }
                    return response.json();
                })
                .then(movements => resolve(movements))
                .catch(error => {
                    console.error('Erro na requisição de histórico de movimentações:', error);
                    reject(error);
                });
        });
    }

    // Buscar colaboradores
    getCollaborators() {
        return new Promise((resolve, reject) => {
            fetch('/api/users/listAllUsers')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao buscar colaboradores');
                    }
                    return response.json();
                })
                .then(collaborators => resolve(collaborators))
                .catch(error => {
                    console.error('Erro na requisição de colaboradores:', error);
                    reject(error);
                });
        });
    }

    // Buscar colaboradores com materiais alocados
    getCollaboratorsWithAllocatedMaterials() {
        return new Promise((resolve, reject) => {
            fetch(`${this.baseUrl}/allocations/active-collaborators`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao buscar colaboradores com materiais alocados');
                    }
                    return response.json();
                })
                .then(collaborators => {
                    console.log('Colaboradores com materiais alocados:', collaborators);
                    resolve(collaborators);
                })
                .catch(error => {
                    console.error('Erro ao buscar colaboradores com materiais alocados:', error);
                    reject(error);
                });
        });
    }

    // Método para buscar materiais alocados por colaborador
    getAllocatedMaterialsByCollaborator(collaboratorId) {
        return new Promise((resolve, reject) => {
            fetch(`${this.baseUrl}/allocations/materials/${collaboratorId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao buscar materiais alocados');
                    }
                    return response.json();
                })
                .then(materials => {
                    console.log('Materiais alocados:', materials);
                    resolve(materials);
                })
                .catch(error => {
                    console.error('Erro ao buscar materiais alocados:', error);
                    reject(error);
                });
        });
    }

    // Buscar ID da alocação para devolução
    findAllocationId(allocationData) {
        return new Promise((resolve, reject) => {
            const { material_id, collaborator_id, quantity } = allocationData;
            
            const query = new URLSearchParams({
                material_id,
                collaborator_id,
                quantity
            }).toString();

            fetch(`${this.baseUrl}/allocations/find?${query}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao buscar ID da alocação');
                    }
                    return response.json();
                })
                .then(allocations => {
                    if (allocations.length === 0) {
                        throw new Error('Nenhuma alocação encontrada para os dados informados');
                    }
                    resolve(allocations[0].id);
                })
                .catch(error => {
                    console.error('Erro ao buscar ID da alocação:', error);
                    reject(error);
                });
        });
    }

    // Devolver material
    returnMaterial(returnData) {
        return new Promise((resolve, reject) => {
            fetch(`${this.baseUrl}/allocations/return`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(returnData)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Erro ao devolver material');
                    });
                }
                return response.json();
            })
            .then(result => resolve(result))
            .catch(error => {
                console.error('Erro ao devolver material:', error);
                reject(error);
            });
        });
    }

    // Devolver material alocado
    returnAllocatedMaterial(returnData) {
        return new Promise((resolve, reject) => {
            // Preparar payload para envio
            const returnPayload = {
                allocation_id: returnData.allocation_id,
                material_id: returnData.material_id,
                collaborator_id: returnData.collaborator_id,
                quantity: returnData.quantity,
                material_condition: returnData.material_condition || 'perfeito',
                observations: returnData.observations || ''
            };

            console.log('Enviando dados de devolução:', returnPayload);

            // Enviar requisição para devolver material
            fetch(`${this.baseUrl}/allocations/return`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(returnPayload)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(JSON.stringify(errorData));
                    });
                }
                return response.json();
            })
            .then(result => {
                console.log('Resposta da devolução:', result);
                resolve(result);
            })
            .catch(error => {
                console.error('Erro ao devolver material:', error);
                reject(error);
            });
        });
    }

    // Alocar material para colaborador
    allocateMaterial(allocationData) {
        return new Promise((resolve, reject) => {
            fetch(`${this.baseUrl}/allocations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(allocationData)
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(errorText => {
                        console.error('Erro de resposta:', errorText);
                        throw new Error(errorText || 'Erro ao alocar material');
                    });
                }
                return response.json();
            })
            .then(result => {
                console.log('Alocação de material realizada:', result);
                resolve(result);
            })
            .catch(error => {
                console.error('Erro ao alocar material:', error);
                reject(error);
            });
        });
    }

    // Método para editar material
    editMaterial(materialData) {
        return new Promise((resolve, reject) => {
            fetch(`${this.baseUrl}/edit-material`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(materialData)
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(errorText => {
                        console.error('Erro na resposta:', errorText);
                        throw new Error(errorText || 'Erro ao editar material');
                    });
                }
                return response.json();
            })
            .then(result => resolve(result))
            .catch(error => {
                console.error('Erro ao editar material:', error);
                reject(error);
            });
        });
    }

    // Método para excluir material
    deleteMaterial(materialId) {
        return new Promise((resolve, reject) => {
            fetch(`${this.baseUrl}/materials/${materialId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(errorText => {
                        console.error('Erro na resposta:', errorText);
                        throw new Error(errorText || 'Erro ao excluir material');
                    });
                }
                return response.json();
            })
            .then(result => resolve(result))
            .catch(error => {
                console.error('Erro ao excluir material:', error);
                reject(error);
            });
        });
    }
}

// Criar instância global para compatibilidade
window.MaterialAPI = new MaterialAPI();
