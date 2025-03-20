// Variáveis globais
let gridApi = null;
let columnDefs = [];
let rowData = [];
let filterOptions = {};
// Chave para armazenar o estado do grid no localStorage
const GRID_STATE_KEY = 'process-query-filter-grid-state';
// Variável para armazenar os dados de distribuição de documentos
let documentosDistribuicaoData = {};

// Esta função é executada quando o documento HTML é completamente carregado e analisado
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Verificar se o AG Grid está disponível
        if (typeof agGrid === 'undefined') {
            throw new Error('AG Grid não está disponível. Verifique se o script foi carregado corretamente.');
        }
        
        // Verificar a versão do AG Grid e registrar no console
        console.log('Versão do AG Grid:', agGrid.version);
        console.log('Método createGrid disponível:', typeof agGrid.createGrid === 'function');
        
        // Ajustar a altura do grid inicialmente
        adjustGridHeight();
        
        // Inicializar o grid
        await initializeGrid();
        
        // Esconder o loader
        const loader = document.querySelector('#loader2');
        if (loader) {
            loader.style.display = 'none';
        }
        
        // Adicionar evento para o botão de redefinir grid
        const resetButton = document.getElementById('resetGridState');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                if (confirm('Tem certeza que deseja redefinir todas as configurações do grid? Esta ação não pode ser desfeita.')) {
                    // Redefinir o estado do grid
                    if (resetGridState()) {
                        // Mostrar mensagem de sucesso
                        alert('Configurações do grid redefinidas com sucesso!');
                    } else {
                        // Recarregar a página em caso de erro
                        window.location.reload();
                    }
                }
            });
        }
        
        // Adicionar evento para o botão de atualizar dados
        const refreshButton = document.getElementById('refreshGridData');
        if (refreshButton) {
            refreshButton.addEventListener('click', async () => {
                try {
                    // Mostrar indicador de carregamento no botão
                    refreshButton.disabled = true;
                    refreshButton.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Atualizando...';
                    
                    // Chamar a função para atualizar os dados
                    await refreshGridData();
                    
                    // Restaurar o botão após a atualização
                    refreshButton.disabled = false;
                    refreshButton.innerHTML = '<i class="ri-refresh-line"></i> Atualizar Dados';
                    
                    // Mostrar mensagem de sucesso
                    console.log('Dados atualizados com sucesso!');
                } catch (error) {
                    console.error('Erro ao atualizar dados:', error);
                    
                    // Restaurar o botão em caso de erro
                    refreshButton.disabled = false;
                    refreshButton.innerHTML = '<i class="ri-refresh-line"></i> Atualizar Dados';
                    
                    // Mostrar mensagem de erro
                    showNotification('Erro ao atualizar dados. Por favor, tente novamente.', 'error');
                }
            });
        }
        
        // Adicionar evento para salvar o estado do grid antes de fechar a página
        window.addEventListener('beforeunload', () => {
            console.log('Salvando estado do grid antes de fechar a página...');
            saveGridState();
        });
        
        // Adicionar evento para ajustar a altura do grid quando a janela for redimensionada
        window.addEventListener('resize', () => {
            adjustGridHeight();
        });
    } catch (error) {
        console.error('Erro ao inicializar a página:', error);
        alert('Ocorreu um erro ao carregar a página. Por favor, tente novamente mais tarde.');
    }
});

// Função para verificar se uma data é válida
function isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
}

// Função para formatar data no formato brasileiro
function formatDateToPtBr(params) {
    if (!params.value) return '-';
    
    try {
        // Se já estiver no formato dd/mm/yyyy, retornar como está
        if (typeof params.value === 'string' && params.value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            return params.value;
        }
        
        // Tratar data com fuso horário
        if (typeof params.value === 'string' && params.value.includes('T')) {
            // Data ISO com timezone
            const parts = params.value.split('T')[0].split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
        }
        
        // Extrair apenas a parte da data (yyyy-MM-dd) para evitar problemas de fuso
        if (typeof params.value === 'string') {
            const dateMatch = params.value.match(/(\d{4})-(\d{2})-(\d{2})/);
            if (dateMatch) {
                const [_, year, month, day] = dateMatch;
                return `${day}/${month}/${year}`;
            }
        }
        
        // Se for um objeto Date, formatar diretamente usando UTC
        if (params.value instanceof Date) {
            const day = params.value.getUTCDate().toString().padStart(2, '0');
            const month = (params.value.getUTCMonth() + 1).toString().padStart(2, '0');
            const year = params.value.getUTCFullYear();
            return `${day}/${month}/${year}`;
        }
        
        // Tentar criar um objeto Date a partir do valor
        const date = new Date(params.value);
        
        // Verificar se a data é válida
        if (!isValidDate(date)) {
            console.warn('Data inválida:', params.value);
            return '-';
        }
        
        // Usar UTC para evitar problemas de fuso horário
        const day = date.getUTCDate().toString().padStart(2, '0');
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const year = date.getUTCFullYear();
        
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Erro ao formatar data:', error, params.value);
        return '-';
    }
}

// Função para formatar valores monetários
function formatCurrency(params) {
    if (params.value === null || params.value === undefined || isNaN(params.value)) {
        return '-';
    }
    
    try {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(params.value);
    } catch (error) {
        console.error('Erro ao formatar valor monetário:', error);
        return '-';
    }
}

// Função para renderizar células de status
function statusCellRenderer(params) {
    if (!params.value) return '-';
    
    let statusClass = '';
    switch (params.value) {
        case 'Sem recebimento':
        case 'Sem pagamento':
            statusClass = 'status-sem-recebimento';
            break;
        case 'Em aberto':
            statusClass = 'status-em-aberto';
            break;
        case 'Parcialmente recebido':
        case 'Parcialmente pago':
            statusClass = 'status-parcialmente';
            break;
        case 'Recebido':
        case 'Pago':
            statusClass = 'status-recebido';
            break;
        default:
            // Para valores não mapeados, usar classe padrão
            statusClass = 'status-default';
    }
    
    return `<span class="status-cell ${statusClass}">${params.value}</span>`;
}

// Função para renderizar células de distribuição de documentos
function distribuicaoCellRenderer(params) {
    if (!params.value || params.value === '-') return '-';
    
    let distribuicaoClass = '';
    
    // Determinar a classe com base no valor
    if (params.value.includes('Liberado')) {
        distribuicaoClass = 'distribuicao-liberado';
    } else if (params.value.includes('Enviado')) {
        distribuicaoClass = 'distribuicao-enviado';
    } else if (params.value.includes('Express')) {
        distribuicaoClass = 'distribuicao-express';
    } else if (params.value.includes('Impressão')) {
        distribuicaoClass = 'distribuicao-impressao';
    } else if (params.value.includes('Emissão')) {
        distribuicaoClass = 'distribuicao-emissao';
    } else if (params.value.includes('e-BL')) {
        distribuicaoClass = 'distribuicao-ebl';
    }
    
    return `<span class="ag-cell-distribuicao ${distribuicaoClass}">${params.value}</span>`;
}

// Função para verificar e tratar valores nulos ou indefinidos
function valueOrDefault(value, defaultValue = '-') {
    if (value === null || value === undefined || value === '' || 
        (typeof value === 'string' && value.trim() === '') ||
        (typeof value === 'number' && isNaN(value))) {
        return defaultValue;
    }
    return value;
}

// Função para renderizar células de texto
function textCellRenderer(params) {
    return valueOrDefault(params.value);
}

// Função para inicializar o AG Grid
async function initializeGrid() {
    try {
        // Definir as colunas da tabela
        columnDefs = [
            { 
                field: 'IdFatura', 
                headerName: 'ID Fatura', 
                filter: 'agNumberColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true
                },
                sortable: true,
                valueFormatter: (params) => valueOrDefault(params.value)
            },
            { 
                field: 'Numero_Fatura', 
                headerName: 'Número da Fatura', 
                filter: 'agTextColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true
                },
                sortable: true,
                cellRenderer: textCellRenderer
            },
            { 
                field: 'Referencia', 
                headerName: 'Referência', 
                filter: 'agTextColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true
                },
                sortable: true,
                cellRenderer: textCellRenderer
            },
            { 
                field: 'Pessoa', 
                headerName: 'Pessoa', 
                filter: 'agTextColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true
                },
                sortable: true,
                cellRenderer: textCellRenderer
            },
            { 
                field: 'Data_Abertura_Processo', 
                headerName: 'Data de Abertura', 
                filter: 'agDateColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true,
                    comparator: function(filterLocalDateAtMidnight, cellValue) {
                        if (!cellValue || cellValue === '-') return -1;
                        
                        try {
                            const dateParts = cellValue.split('/');
                            if (dateParts.length !== 3) return -1;
                            
                            const day = parseInt(dateParts[0]);
                            const month = parseInt(dateParts[1]) - 1;
                            const year = parseInt(dateParts[2]);
                            
                            if (isNaN(day) || isNaN(month) || isNaN(year)) return -1;
                            
                            const cellDate = new Date(year, month, day);
                            
                            if (!isValidDate(cellDate)) return -1;
                            
                            if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
                                return 0;
                            }
                            if (cellDate < filterLocalDateAtMidnight) {
                                return -1;
                            }
                            if (cellDate > filterLocalDateAtMidnight) {
                                return 1;
                            }
                        } catch (error) {
                            console.error('Erro ao comparar datas:', error);
                            return -1;
                        }
                    }
                },
                sortable: true,
                valueFormatter: formatDateToPtBr
            },
            { 
                field: 'Data_Vencimento', 
                headerName: 'Data de Vencimento', 
                filter: 'agDateColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true,
                    comparator: function(filterLocalDateAtMidnight, cellValue) {
                        if (!cellValue || cellValue === '-') return -1;
                        
                        try {
                            const dateParts = cellValue.split('/');
                            if (dateParts.length !== 3) return -1;
                            
                            const day = parseInt(dateParts[0]);
                            const month = parseInt(dateParts[1]) - 1;
                            const year = parseInt(dateParts[2]);
                            
                            if (isNaN(day) || isNaN(month) || isNaN(year)) return -1;
                            
                            const cellDate = new Date(year, month, day);
                            
                            if (!isValidDate(cellDate)) return -1;
                            
                            if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
                                return 0;
                            }
                            if (cellDate < filterLocalDateAtMidnight) {
                                return -1;
                            }
                            if (cellDate > filterLocalDateAtMidnight) {
                                return 1;
                            }
                        } catch (error) {
                            console.error('Erro ao comparar datas:', error);
                            return -1;
                        }
                    }
                },
                sortable: true,
                valueFormatter: formatDateToPtBr
            },
            { 
                field: 'Data_Pagamento', 
                headerName: 'Data de Pagamento', 
                filter: 'agDateColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true,
                    comparator: function(filterLocalDateAtMidnight, cellValue) {
                        if (!cellValue || cellValue === '-') return -1;
                        
                        try {
                            const dateParts = cellValue.split('/');
                            if (dateParts.length !== 3) return -1;
                            
                            const day = parseInt(dateParts[0]);
                            const month = parseInt(dateParts[1]) - 1;
                            const year = parseInt(dateParts[2]);
                            
                            if (isNaN(day) || isNaN(month) || isNaN(year)) return -1;
                            
                            const cellDate = new Date(year, month, day);
                            
                            if (!isValidDate(cellDate)) return -1;
                            
                            if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
                                return 0;
                            }
                            if (cellDate < filterLocalDateAtMidnight) {
                                return -1;
                            }
                            if (cellDate > filterLocalDateAtMidnight) {
                                return 1;
                            }
                        } catch (error) {
                            console.error('Erro ao comparar datas:', error);
                            return -1;
                        }
                    }
                },
                sortable: true,
                valueFormatter: formatDateToPtBr
            },
            { 
                field: 'Situacao_Recebimento', 
                headerName: 'Situação de Recebimento', 
                filter: 'agSetColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true
                },
                sortable: true,
                cellRenderer: statusCellRenderer
            },
            { 
                field: 'Data_Pgto_Processo', 
                headerName: 'Data Pgto Processo', 
                filter: 'agDateColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true,
                    comparator: function(filterLocalDateAtMidnight, cellValue) {
                        if (!cellValue || cellValue === '-') return -1;
                        
                        try {
                            const dateParts = cellValue.split('/');
                            if (dateParts.length !== 3) return -1;
                            
                            const day = parseInt(dateParts[0]);
                            const month = parseInt(dateParts[1]) - 1;
                            const year = parseInt(dateParts[2]);
                            
                            if (isNaN(day) || isNaN(month) || isNaN(year)) return -1;
                            
                            const cellDate = new Date(year, month, day);
                            
                            if (!isValidDate(cellDate)) return -1;
                            
                            if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
                                return 0;
                            }
                            if (cellDate < filterLocalDateAtMidnight) {
                                return -1;
                            }
                            if (cellDate > filterLocalDateAtMidnight) {
                                return 1;
                            }
                        } catch (error) {
                            console.error('Erro ao comparar datas:', error);
                            return -1;
                        }
                    }
                },
                sortable: true,
                valueFormatter: formatDateToPtBr
            },
            { 
                field: 'Situacao_Pagamento', 
                headerName: 'Situação de Pagamento', 
                filter: 'agSetColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true
                },
                sortable: true,
                cellRenderer: statusCellRenderer
            },
            { 
                field: 'Status_Processo', 
                headerName: 'Status do Processo', 
                filter: 'agSetColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true
                },
                sortable: true,
                cellRenderer: textCellRenderer
            },
            { 
                field: 'Tipo_Carga', 
                headerName: 'Tipo de Carga', 
                filter: 'agSetColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true
                },
                sortable: true,
                cellRenderer: textCellRenderer
            },
            { 
                field: 'Data_Desembarque', 
                headerName: 'Data de Desembarque', 
                filter: 'agDateColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true,
                    comparator: function(filterLocalDateAtMidnight, cellValue) {
                        if (!cellValue || cellValue === '-') return -1;
                        
                        try {
                            const dateParts = cellValue.split('/');
                            if (dateParts.length !== 3) return -1;
                            
                            const day = parseInt(dateParts[0]);
                            const month = parseInt(dateParts[1]) - 1;
                            const year = parseInt(dateParts[2]);
                            
                            if (isNaN(day) || isNaN(month) || isNaN(year)) return -1;
                            
                            const cellDate = new Date(year, month, day);
                            
                            if (!isValidDate(cellDate)) return -1;
                            
                            if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
                                return 0;
                            }
                            if (cellDate < filterLocalDateAtMidnight) {
                                return -1;
                            }
                            if (cellDate > filterLocalDateAtMidnight) {
                                return 1;
                            }
                        } catch (error) {
                            console.error('Erro ao comparar datas:', error);
                            return -1;
                        }
                    }
                },
                sortable: true,
                valueFormatter: formatDateToPtBr
            },
            { 
                field: 'Conhecimento_Master', 
                headerName: 'Conhecimento Master', 
                filter: 'agTextColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true
                },
                sortable: true,
                cellRenderer: textCellRenderer
            },
            { 
                field: 'Companhia_Transporte', 
                headerName: 'Companhia de Transporte', 
                filter: 'agSetColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true
                },
                sortable: true,
                cellRenderer: textCellRenderer
            },
            { 
                field: 'Valor', 
                headerName: 'Valor', 
                filter: 'agNumberColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true
                },
                sortable: true,
                valueFormatter: formatCurrency
            },
            // Novas colunas para dados de distribuição de documentos
            { 
                field: 'OHBL', 
                headerName: 'OHBL', 
                filter: 'agSetColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true
                },
                sortable: true,
                cellRenderer: distribuicaoCellRenderer
            },
            { 
                field: 'OMBL', 
                headerName: 'OMBL', 
                filter: 'agSetColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true
                },
                sortable: true,
                cellRenderer: distribuicaoCellRenderer
            },
            { 
                field: 'Envio_Docs_Armador', 
                headerName: 'Envio Docs Armador', 
                filter: 'agDateColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true,
                    comparator: function(filterLocalDateAtMidnight, cellValue) {
                        if (!cellValue || cellValue === '-') return -1;
                        
                        try {
                            const dateParts = cellValue.split('/');
                            if (dateParts.length !== 3) return -1;
                            
                            const day = parseInt(dateParts[0]);
                            const month = parseInt(dateParts[1]) - 1;
                            const year = parseInt(dateParts[2]);
                            
                            if (isNaN(day) || isNaN(month) || isNaN(year)) return -1;
                            
                            const cellDate = new Date(year, month, day);
                            
                            if (!isValidDate(cellDate)) return -1;
                            
                            if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
                                return 0;
                            }
                            if (cellDate < filterLocalDateAtMidnight) {
                                return -1;
                            }
                            if (cellDate > filterLocalDateAtMidnight) {
                                return 1;
                            }
                        } catch (error) {
                            console.error('Erro ao comparar datas:', error);
                            return -1;
                        }
                    }
                },
                sortable: true,
                cellRenderer: distribuicaoCellRenderer
            },
            { 
                field: 'Liberacao', 
                headerName: 'Liberação', 
                filter: 'agDateColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true,
                    comparator: function(filterLocalDateAtMidnight, cellValue) {
                        if (!cellValue || cellValue === '-') return -1;
                        
                        try {
                            const dateParts = cellValue.split('/');
                            if (dateParts.length !== 3) return -1;
                            
                            const day = parseInt(dateParts[0]);
                            const month = parseInt(dateParts[1]) - 1;
                            const year = parseInt(dateParts[2]);
                            
                            if (isNaN(day) || isNaN(month) || isNaN(year)) return -1;
                            
                            const cellDate = new Date(year, month, day);
                            
                            if (!isValidDate(cellDate)) return -1;
                            
                            if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
                                return 0;
                            }
                            if (cellDate < filterLocalDateAtMidnight) {
                                return -1;
                            }
                            if (cellDate > filterLocalDateAtMidnight) {
                                return 1;
                            }
                        } catch (error) {
                            console.error('Erro ao comparar datas:', error);
                            return -1;
                        }
                    }
                },
                sortable: true,
                cellRenderer: distribuicaoCellRenderer
            },
            { 
                field: 'Recebimento_Docs', 
                headerName: 'Recebimento Docs', 
                filter: 'agDateColumnFilter',
                filterParams: {
                    buttons: ['apply', 'reset'],
                    closeOnApply: true,
                    comparator: function(filterLocalDateAtMidnight, cellValue) {
                        if (!cellValue || cellValue === '-') return -1;
                        
                        try {
                            const dateParts = cellValue.split('/');
                            if (dateParts.length !== 3) return -1;
                            
                            const day = parseInt(dateParts[0]);
                            const month = parseInt(dateParts[1]) - 1;
                            const year = parseInt(dateParts[2]);
                            
                            if (isNaN(day) || isNaN(month) || isNaN(year)) return -1;
                            
                            const cellDate = new Date(year, month, day);
                            
                            if (!isValidDate(cellDate)) return -1;
                            
                            if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
                                return 0;
                            }
                            if (cellDate < filterLocalDateAtMidnight) {
                                return -1;
                            }
                            if (cellDate > filterLocalDateAtMidnight) {
                                return 1;
                            }
                        } catch (error) {
                            console.error('Erro ao comparar datas:', error);
                            return -1;
                        }
                    }
                },
                sortable: true,
                cellRenderer: distribuicaoCellRenderer
            }
        ];

        // Configurações do AG Grid
        const gridOptions = {
            columnDefs: columnDefs,
            defaultColDef: {
                // Remover flex para permitir que o autosize funcione corretamente
                // flex: 1,
                minWidth: 100,
                resizable: true,
                sortable: true,
                filter: true,
                floatingFilter: true,
                // Configurações de autosize
                autoSize: true,
                suppressSizeToFit: false,
                // Garantir que o conteúdo seja visível
                wrapText: false,
                suppressColumnVirtualisation: true
            },
            // Configurações adicionais do AG Grid
            rowSelection: 'multiple',
            pagination: true,
            paginationPageSize: 20,
            rowModelType: 'clientSide',
            animateRows: true,
            enableRangeSelection: true,
            enableCharts: true,
            // Definir explicitamente o tema para usar o método legacy de temas do AG Grid
            theme: 'legacy',
            // Configurações específicas para o tema Quartz Dark
            popupParent: document.body,
            suppressMenuHide: true,
            // Configuração da barra lateral - Iniciar fechada
            sideBar: {
                toolPanels: [
                    {
                        id: 'columns',
                        labelDefault: 'Colunas',
                        labelKey: 'columns',
                        iconKey: 'columns',
                        toolPanel: 'agColumnsToolPanel',
                    },
                    {
                        id: 'filters',
                        labelDefault: 'Filtros',
                        labelKey: 'filters',
                        iconKey: 'filter',
                        toolPanel: 'agFiltersToolPanel',
                    }
                ],
                defaultToolPanel: false, // Iniciar com o painel fechado
                hiddenByDefault: false // Mostrar o botão da barra lateral, mas iniciar fechado
            },
            // Função para processar dados antes de exibir na tabela
            processCellForClipboard: (params) => {
                if (params.column.getColDef().valueFormatter) {
                    return params.column.getColDef().valueFormatter(params);
                }
                return params.value;
            },
            // Função para tratar erros de carregamento
            onGridReady: (params) => {
                // Na versão 33.1.1, a API mudou e não usa mais overlayService diretamente
                // Mostrar mensagem de carregamento
                if (params.api && typeof params.api.showLoadingOverlay === 'function') {
                    params.api.showLoadingOverlay();
                }
                
                // Armazenar a API para uso posterior
                gridApi = params.api;
                
                // Função para aplicar autosize em todas as colunas
                const applyAutoSizeToAllColumns = () => {
                    if (params.columnApi && typeof params.columnApi.autoSizeAllColumns === 'function') {
                        console.log('Aplicando autosize em todas as colunas...');
                        params.columnApi.autoSizeAllColumns();
                    }
                };
                
                // Aplicar autosize imediatamente
                applyAutoSizeToAllColumns();
                
                // Aplicar autosize após o carregamento dos dados
                setTimeout(applyAutoSizeToAllColumns, 300);
                
                // Aplicar autosize após a renderização completa
                setTimeout(applyAutoSizeToAllColumns, 1000);
                
                // Adicionar um listener para o evento de redimensionamento da janela
                window.addEventListener('resize', () => {
                    setTimeout(applyAutoSizeToAllColumns, 100);
                });
                
                // Adicionar um listener para o evento de mudança de visibilidade da página
                document.addEventListener('visibilitychange', () => {
                    if (!document.hidden) {
                        setTimeout(applyAutoSizeToAllColumns, 100);
                    }
                });
                
                // Adicionar eventos para salvar o estado do grid quando houver mudanças
                const saveGridStateDebounced = debounce(() => {
                    console.log('Salvando estado do grid após mudanças...');
                    saveGridState();
                }, 500);
                
                // Eventos que devem acionar o salvamento do estado
                const eventsToSave = [
                    'columnVisible', 'columnPinned', 'columnResized', 'columnMoved',
                    'sortChanged', 'filterChanged', 'columnRowGroupChanged',
                    'columnPivotChanged', 'columnValueChanged'
                ];
                
                // Registrar os eventos
                eventsToSave.forEach(eventName => {
                    if (params.api && typeof params.api.addEventListener === 'function') {
                        params.api.addEventListener(eventName, saveGridStateDebounced);
                    }
                });
                
                // Não restauramos o estado aqui, isso será feito após o carregamento dos dados
                console.log('Grid inicializado, aguardando carregamento de dados para restaurar estado...');
            },
            // Função para filtrar dados
            onFilterChanged: (params) => {
                // Obter contagem de linhas exibidas usando a API da versão 33.1.1
                if (params.api && params.api.rowModel && typeof params.api.rowModel.getRowCount === 'function') {
                    const filteredCount = params.api.rowModel.getRowCount();
                    console.log(`Exibindo ${filteredCount} registros após aplicar filtros`);
                }
            },
            // Evento disparado quando os dados são atualizados
            onRowDataUpdated: (params) => {
                // Aplicar autoSize em todas as colunas quando os dados forem atualizados
                if (params.columnApi && typeof params.columnApi.autoSizeAllColumns === 'function') {
                    setTimeout(() => {
                        params.columnApi.autoSizeAllColumns();
                    }, 100);
                }
            },
            // Evento disparado quando os dados são renderizados pela primeira vez
            onFirstDataRendered: (params) => {
                // Aplicar autoSize em todas as colunas quando os dados forem renderizados pela primeira vez
                if (params.columnApi && typeof params.columnApi.autoSizeAllColumns === 'function') {
                    console.log('Primeira renderização de dados - aplicando autosize...');
                    params.columnApi.autoSizeAllColumns();
                    
                    // Aplicar novamente após um pequeno atraso para garantir que todos os dados estejam renderizados
                    setTimeout(() => {
                        params.columnApi.autoSizeAllColumns();
                        
                        // Ajustar a altura do grid após o autosize
                        adjustGridHeight();
                    }, 500);
                }
            },
            // Configurações de tema
            getRowClass: (params) => {
                return 'ag-row-dark';
            },
            // Tradução para português
            localeText: {
                page: 'Página',
                more: 'Mais',
                to: 'a',
                of: 'de',
                next: 'Próximo',
                last: 'Último',
                first: 'Primeiro',
                previous: 'Anterior',
                loadingOoo: 'Carregando...',
                noRowsToShow: 'Nenhum registro encontrado',
                filterOoo: 'Filtrar...',
                equals: 'Igual',
                notEqual: 'Diferente',
                lessThan: 'Menor que',
                greaterThan: 'Maior que',
                contains: 'Contém',
                notContains: 'Não contém',
                startsWith: 'Começa com',
                endsWith: 'Termina com',
                applyFilter: 'Aplicar filtro',
                resetFilter: 'Limpar filtro',
                clearFilter: 'Limpar filtro',
                andCondition: 'E',
                orCondition: 'OU',
                // Tradução para o painel lateral
                columns: 'Colunas',
                filters: 'Filtros',
                rowGroupColumns: 'Agrupar por',
                rowGroupColumnsEmptyMessage: 'Arraste colunas aqui para agrupar',
                valueColumns: 'Colunas de valor',
                pivotMode: 'Modo Pivot',
                groups: 'Grupos',
                values: 'Valores',
                pivots: 'Pivôs',
                valueColumnsEmptyMessage: 'Arraste colunas aqui para agregar',
                pivotColumnsEmptyMessage: 'Arraste colunas aqui para pivotar',
                toolPanelButton: 'Painel de ferramentas'
            },
            // Função para tratar dados vazios
            noRowsOverlayComponent: 'customNoRowsOverlay',
            components: {
                customNoRowsOverlay: function() {
                    return '<div class="ag-overlay-loading-center">Nenhum registro encontrado</div>';
                }
            }
        };

        // Inicializar o grid - CORREÇÃO PARA AG GRID 33.1.1
        const gridDiv = document.getElementById('ag-grid-container');
        
        // Na versão 33.1.1, a forma de criar o grid mudou
        console.log('Inicializando AG Grid versão:', agGrid.version);

        // Usar o método createGrid da versão 33.1.1
        gridApi = agGrid.createGrid(gridDiv, gridOptions);

        // Registrar o gridApi para depuração
        console.log('Grid API inicializada:', gridApi);
        
        // Carregar dados iniciais
        try {
            // Dados de exemplo para teste
            const mockData = [
                {
                    IdFatura: 1001,
                    Numero_Fatura: 'FAT-2023-001',
                    Referencia: 'REF001',
                    Pessoa: 'Empresa ABC Ltda',
                    Data_Vencimento: '2023-10-15',
                    Data_Pagamento: '2023-10-14',
                    Situacao_Recebimento: 'Recebido',
                    Data_Pgto_Processo: '2023-10-14',
                    Situacao_Pagamento: 'Pago',
                    Status_Processo: 'Concluído',
                    Data_Desembarque: '2023-10-05',
                    Conhecimento_Master: 'MSCUABCD1234567',
                    Companhia_Transporte: 'MSC',
                    Valor: 15000.50,
                    IdLogistica_House: 1001
                },
                {
                    IdFatura: 1002,
                    Numero_Fatura: 'FAT-2023-002',
                    Referencia: 'REF002',
                    Pessoa: 'Empresa XYZ S.A.',
                    Data_Vencimento: '2023-10-20',
                    Data_Pagamento: null,
                    Situacao_Recebimento: 'Em aberto',
                    Data_Pgto_Processo: null,
                    Situacao_Pagamento: 'Em aberto',
                    Status_Processo: 'Em andamento',
                    Data_Desembarque: '2023-10-10',
                    Conhecimento_Master: 'MAEUABCD7654321',
                    Companhia_Transporte: 'Maersk',
                    Valor: 22750.75,
                    IdLogistica_House: 1002
                },
                {
                    IdFatura: 1003,
                    Numero_Fatura: 'FAT-2023-003',
                    Referencia: 'REF003',
                    Pessoa: 'Indústrias 123 Ltda',
                    Data_Vencimento: '2023-09-30',
                    Data_Pagamento: '2023-10-05',
                    Situacao_Recebimento: 'Recebido',
                    Data_Pgto_Processo: '2023-10-05',
                    Situacao_Pagamento: 'Pago',
                    Status_Processo: 'Concluído',
                    Data_Desembarque: '2023-09-25',
                    Conhecimento_Master: 'CMDUABCD9876543',
                    Companhia_Transporte: 'CMA CGM',
                    Valor: 8500.25,
                    IdLogistica_House: 1003
                },
                {
                    IdFatura: 1004,
                    Numero_Fatura: 'FAT-2023-004',
                    Referencia: 'REF004',
                    Pessoa: 'Comércio Global Ltda',
                    Data_Vencimento: '2023-11-05',
                    Data_Pagamento: null,
                    Situacao_Recebimento: 'Sem recebimento',
                    Data_Pgto_Processo: null,
                    Situacao_Pagamento: 'Sem pagamento',
                    Status_Processo: 'Aguardando documentação',
                    Data_Desembarque: '2023-10-30',
                    Conhecimento_Master: 'ONEUBCD1357924',
                    Companhia_Transporte: 'ONE',
                    Valor: 31200.00,
                    IdLogistica_House: 1004
                },
                {
                    IdFatura: 1005,
                    Numero_Fatura: 'FAT-2023-005',
                    Referencia: 'REF005',
                    Pessoa: 'Importadora Nacional S.A.',
                    Data_Vencimento: '2023-10-25',
                    Data_Pagamento: '2023-10-20',
                    Situacao_Recebimento: 'Parcialmente recebido',
                    Data_Pgto_Processo: '2023-10-20',
                    Situacao_Pagamento: 'Parcialmente pago',
                    Status_Processo: 'Em andamento',
                    Data_Desembarque: '2023-10-15',
                    Conhecimento_Master: 'COSABCDE2468013',
                    Companhia_Transporte: 'COSCO',
                    Valor: 45750.30,
                    IdLogistica_House: 1005
                }
            ];
            
            // Buscar dados de distribuição de documentos
            await fetchDocumentosDistribuicao();
            
            // Tentar obter dados do servidor
            let data = [];
            try {
                const response = await fetch('/api/process-query-filter/getData', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({})
                });
                
                if (response.ok) {
                    data = await response.json();
                    console.log('Dados obtidos do servidor com sucesso');
                } else {
                    console.warn('Não foi possível obter dados do servidor. Usando dados de exemplo.');
                    data = mockData;
                }
            } catch (error) {
                console.warn('Erro ao obter dados do servidor. Usando dados de exemplo:', error);
                data = mockData;
            }
            
            // Processar os dados para garantir que não haja valores inválidos
            data = processDataBeforeDisplay(data);
            
            // Atualizar os dados do grid usando a API da versão 33.1.1
            if (gridApi && typeof gridApi.setGridOption === 'function') {
                gridApi.setGridOption('rowData', data);
                
                // Aplicar autosize após o carregamento dos dados
                setTimeout(() => {
                    if (gridApi.columnModel && typeof gridApi.columnModel.autoSizeAllColumns === 'function') {
                        console.log('Aplicando autosize após carregamento de dados...');
                        gridApi.columnModel.autoSizeAllColumns();
                    }
                    
                    // Restaurar o estado do grid após o carregamento dos dados
                    console.log('Tentando restaurar o estado do grid após carregamento de dados...');
                    setTimeout(() => {
                        restoreGridState();
                        
                        // Ajustar a altura do grid após restaurar o estado
                        setTimeout(adjustGridHeight, 100);
                    }, 100);
                }, 200);
            }

            // Esconder o overlay de carregamento
            if (gridApi && typeof gridApi.hideOverlay === 'function') {
                gridApi.hideOverlay();
            } else if (gridApi && typeof gridApi.hideLoadingOverlay === 'function') {
                gridApi.hideLoadingOverlay();
            }
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            // Mostrar overlay de "sem linhas" usando a API da versão 33.1.1
            if (gridApi && typeof gridApi.showNoRowsOverlay === 'function') {
                gridApi.showNoRowsOverlay();
            }
        }
    } catch (error) {
        console.error('Erro ao inicializar o grid:', error);
        throw error;
    }
}

// Função para processar os dados antes de exibir na tabela
function processDataBeforeDisplay(data) {
    if (!Array.isArray(data)) {
        console.error('Dados recebidos não são um array:', data);
        return [];
    }
    
    return data.map(item => {
        const processedItem = { ...item };
        
        // Processar datas
        const dateFields = ['Data_Vencimento', 'Data_Pagamento', 'Data_Pgto_Processo', 'Data_Desembarque', 'Data_Abertura_Processo'];
        dateFields.forEach(field => {
            if (processedItem[field]) {
                try {
                    // Se a data já estiver no formato dd/mm/yyyy, manter como está
                    if (typeof processedItem[field] === 'string' && processedItem[field].match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                        return;
                    }
                    
                    // Tratar data com fuso horário
                    if (typeof processedItem[field] === 'string' && processedItem[field].includes('T')) {
                        // Data ISO com timezone
                        const parts = processedItem[field].split('T')[0].split('-');
                        if (parts.length === 3) {
                            processedItem[field] = `${parts[2]}/${parts[1]}/${parts[0]}`;
                            return;
                        }
                    }
                    
                    // Extrair apenas a parte da data (yyyy-MM-dd) para evitar problemas de fuso
                    const dateMatch = processedItem[field].match(/(\d{4})-(\d{2})-(\d{2})/);
                    if (dateMatch) {
                        const [_, year, month, day] = dateMatch;
                        processedItem[field] = `${day}/${month}/${year}`;
                        return;
                    }
                    
                    const date = new Date(processedItem[field]);
                    if (!isValidDate(date)) {
                        console.warn(`Data inválida para o campo ${field}:`, processedItem[field]);
                        processedItem[field] = null;
                    } else {
                        // Usar UTC para evitar problemas de fuso horário
                        const day = date.getUTCDate().toString().padStart(2, '0');
                        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                        const year = date.getUTCFullYear();
                        processedItem[field] = `${day}/${month}/${year}`;
                    }
                } catch (error) {
                    console.error(`Erro ao processar data para o campo ${field}:`, error, processedItem[field]);
                    processedItem[field] = null;
                }
            } else {
                processedItem[field] = null;
            }
        });
        
        // Processar valores numéricos
        const numericFields = ['IdFatura', 'Valor'];
        numericFields.forEach(field => {
            if (processedItem[field] !== undefined && processedItem[field] !== null) {
                const numValue = parseFloat(processedItem[field]);
                if (isNaN(numValue)) {
                    processedItem[field] = null;
                } else {
                    processedItem[field] = numValue;
                }
            }
        });
        
        // Processar campos de texto
        const textFields = ['Numero_Fatura', 'Referencia', 'Pessoa', 'Conhecimento_Master', 'Companhia_Transporte'];
        textFields.forEach(field => {
            if (processedItem[field] === undefined || processedItem[field] === null) {
                processedItem[field] = '';
            }
        });
        
        // Adicionar dados de distribuição de documentos, se disponíveis
        if (processedItem.IdLogistica_House && documentosDistribuicaoData[processedItem.IdLogistica_House]) {
            const docsData = documentosDistribuicaoData[processedItem.IdLogistica_House];
            
            // Adicionar cada campo como uma nova coluna
            processedItem.OHBL = docsData.OHBL || '-';
            processedItem.OMBL = docsData.OMBL || '-';
            processedItem.Envio_Docs_Armador = docsData.Envio_Docs_Armador || '-';
            processedItem.Liberacao = docsData.Liberacao || '-';
            processedItem.Recebimento_Docs = docsData.Recebimento_Docs || '-';
        } else {
            // Se não houver dados de distribuição para este item, adicionar valores padrão
            processedItem.OHBL = '-';
            processedItem.OMBL = '-';
            processedItem.Envio_Docs_Armador = '-';
            processedItem.Liberacao = '-';
            processedItem.Recebimento_Docs = '-';
        }
        
        return processedItem;
    });
}

// Função auxiliar para fazer requisições ao servidor
async function makeRequest(url, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro ao fazer requisição:', error);
        throw error;
    }
}

// Função para limpar o estado do grid e restaurar as configurações padrão
function resetGridState() {
    if (!gridApi) {
        console.warn('Grid API não disponível para redefinir o estado');
        return false;
    }
    
    try {
        // Remover o estado salvo
        localStorage.removeItem(GRID_STATE_KEY);
        console.log('Estado salvo removido do localStorage');
        
        // Restaurar o estado padrão das colunas
        if (typeof gridApi.resetColumnState === 'function') {
            gridApi.resetColumnState();
            console.log('Estado das colunas redefinido');
        } else if (gridApi.columnModel && typeof gridApi.columnModel.resetColumnState === 'function') {
            gridApi.columnModel.resetColumnState();
            console.log('Estado das colunas redefinido via columnModel');
        } else {
            console.warn('Método para redefinir estado das colunas não encontrado');
        }
        
        // Limpar os filtros
        if (typeof gridApi.setFilterModel === 'function') {
            gridApi.setFilterModel(null);
            console.log('Filtros redefinidos');
        } else if (gridApi.filterManager && typeof gridApi.filterManager.setFilterModel === 'function') {
            gridApi.filterManager.setFilterModel(null);
            console.log('Filtros redefinidos via filterManager');
        } else {
            console.warn('Método para redefinir filtros não encontrado');
        }
        
        // Limpar a ordenação
        if (typeof gridApi.setSortModel === 'function') {
            gridApi.setSortModel(null);
            console.log('Ordenação redefinida');
        } else if (gridApi.sortController && typeof gridApi.sortController.setSortModel === 'function') {
            gridApi.sortController.setSortModel(null);
            console.log('Ordenação redefinida via sortController');
        } else {
            console.warn('Método para redefinir ordenação não encontrado');
        }
        
        // Aplicar autosize em todas as colunas
        if (gridApi.columnModel && typeof gridApi.columnModel.autoSizeAllColumns === 'function') {
            setTimeout(() => {
                gridApi.columnModel.autoSizeAllColumns();
                console.log('Autosize aplicado após redefinição');
                
                // Ajustar a altura do grid após o autosize
                adjustGridHeight();
            }, 100);
        } else if (gridApi.columnApi && typeof gridApi.columnApi.autoSizeAllColumns === 'function') {
            setTimeout(() => {
                gridApi.columnApi.autoSizeAllColumns();
                console.log('Autosize aplicado após redefinição via columnApi');
                
                // Ajustar a altura do grid após o autosize
                adjustGridHeight();
            }, 100);
        }
        
        console.log('Estado do grid redefinido com sucesso');
        return true;
    } catch (error) {
        console.error('Erro ao redefinir o estado do grid:', error);
        return false;
    }
}

// Função para salvar o estado do grid no localStorage
function saveGridState() {
    if (!gridApi) {
        console.warn('Grid API não disponível para salvar o estado');
        return;
    }
    
    try {
        // Obter o estado atual do grid
        let columnState = null;
        let filterModel = null;
        let sortModel = null;
        
        // Verificar qual método está disponível para obter o estado das colunas
        if (typeof gridApi.getColumnState === 'function') {
            columnState = gridApi.getColumnState();
        } else if (gridApi.columnModel && typeof gridApi.columnModel.getColumnState === 'function') {
            columnState = gridApi.columnModel.getColumnState();
        } else {
            console.warn('Método para obter estado das colunas não encontrado');
        }
        
        // Verificar qual método está disponível para obter os filtros
        if (typeof gridApi.getFilterModel === 'function') {
            filterModel = gridApi.getFilterModel();
        } else if (gridApi.filterManager && typeof gridApi.filterManager.getFilterModel === 'function') {
            filterModel = gridApi.filterManager.getFilterModel();
        } else {
            console.warn('Método para obter filtros não encontrado');
        }
        
        // Verificar qual método está disponível para obter a ordenação
        if (typeof gridApi.getSortModel === 'function') {
            sortModel = gridApi.getSortModel();
        } else if (gridApi.sortController && typeof gridApi.sortController.getSortModel === 'function') {
            sortModel = gridApi.sortController.getSortModel();
        } else {
            console.warn('Método para obter ordenação não encontrado');
        }
        
        // Verificar se temos dados para salvar
        if (!columnState && !filterModel && !sortModel) {
            console.warn('Não foi possível obter o estado do grid para salvar');
            return;
        }
        
        // Criar objeto com o estado do grid
        const gridState = {
            columnState: columnState,
            filterModel: filterModel,
            sortModel: sortModel,
            timestamp: new Date().getTime()
        };
        
        // Salvar no localStorage
        localStorage.setItem(GRID_STATE_KEY, JSON.stringify(gridState));
        console.log('Estado do grid salvo com sucesso:', gridState);
    } catch (error) {
        console.error('Erro ao salvar o estado do grid:', error);
    }
}

// Função para restaurar o estado do grid a partir do localStorage
function restoreGridState() {
    if (!gridApi) {
        console.warn('Grid API não disponível para restaurar o estado');
        return false;
    }
    
    try {
        // Obter o estado salvo do localStorage
        const savedState = localStorage.getItem(GRID_STATE_KEY);
        if (!savedState) {
            console.log('Nenhum estado do grid encontrado para restaurar');
            return false;
        }
        
        // Converter para objeto
        const gridState = JSON.parse(savedState);
        console.log('Estado do grid encontrado:', gridState);
        
        // Verificar se o estado não está muito antigo (mais de 7 dias)
        const now = new Date().getTime();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (now - gridState.timestamp > sevenDays) {
            console.log('Estado do grid muito antigo, não será restaurado');
            localStorage.removeItem(GRID_STATE_KEY);
            return false;
        }
        
        // Restaurar o estado das colunas
        if (gridState.columnState) {
            console.log('Restaurando estado das colunas:', gridState.columnState);
            
            // Verificar qual método está disponível para restaurar o estado das colunas
            if (typeof gridApi.applyColumnState === 'function') {
                gridApi.applyColumnState({ state: gridState.columnState, applyOrder: true });
            } else if (typeof gridApi.setColumnState === 'function') {
                gridApi.setColumnState(gridState.columnState);
            } else if (gridApi.columnModel && typeof gridApi.columnModel.setColumnState === 'function') {
                gridApi.columnModel.setColumnState(gridState.columnState);
            } else {
                console.warn('Método para restaurar estado das colunas não encontrado');
            }
        }
        
        // Restaurar os filtros
        if (gridState.filterModel) {
            console.log('Restaurando filtros:', gridState.filterModel);
            
            // Verificar qual método está disponível para restaurar os filtros
            if (typeof gridApi.setFilterModel === 'function') {
                gridApi.setFilterModel(gridState.filterModel);
            } else if (gridApi.filterManager && typeof gridApi.filterManager.setFilterModel === 'function') {
                gridApi.filterManager.setFilterModel(gridState.filterModel);
            } else {
                console.warn('Método para restaurar filtros não encontrado');
            }
        }
        
        // Restaurar a ordenação
        if (gridState.sortModel) {
            console.log('Restaurando ordenação:', gridState.sortModel);
            
            // Verificar qual método está disponível para restaurar a ordenação
            if (typeof gridApi.setSortModel === 'function') {
                gridApi.setSortModel(gridState.sortModel);
            } else if (gridApi.sortController && typeof gridApi.sortController.setSortModel === 'function') {
                gridApi.sortController.setSortModel(gridState.sortModel);
            } else {
                console.warn('Método para restaurar ordenação não encontrado');
            }
        }
        
        console.log('Estado do grid restaurado com sucesso');
        
        // Ajustar a altura do grid após restaurar o estado
        setTimeout(adjustGridHeight, 100);
        
        return true;
    } catch (error) {
        console.error('Erro ao restaurar o estado do grid:', error);
        // Em caso de erro, remover o estado salvo para evitar problemas futuros
        localStorage.removeItem(GRID_STATE_KEY);
        return false;
    }
}

// Função para limitar a frequência de chamadas de uma função (debounce)
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Função para exibir notificações ao usuário
function showNotification(message, type = 'info', duration = 3000) {
    // Verificar se já existe um container de notificações
    let notificationContainer = document.getElementById('notification-container');
    
    // Se não existir, criar um novo
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        document.body.appendChild(notificationContainer);
    }
    
    // Criar a notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="notification-icon ri-${type === 'success' ? 'check-line' : type === 'error' ? 'error-warning-line' : 'information-line'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close"><i class="ri-close-line"></i></button>
    `;
    
    // Estilizar a notificação
    notification.style.backgroundColor = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8';
    notification.style.color = '#fff';
    notification.style.padding = '12px 15px';
    notification.style.borderRadius = '4px';
    notification.style.marginBottom = '10px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    notification.style.display = 'flex';
    notification.style.justifyContent = 'space-between';
    notification.style.alignItems = 'center';
    notification.style.minWidth = '300px';
    notification.style.maxWidth = '400px';
    notification.style.animation = 'fadeIn 0.3s ease-out forwards';
    
    // Estilizar o botão de fechar
    const closeButton = notification.querySelector('.notification-close');
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = '#fff';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '16px';
    closeButton.style.marginLeft = '10px';
    
    // Adicionar a notificação ao container
    notificationContainer.appendChild(notification);
    
    // Adicionar evento para fechar a notificação
    closeButton.addEventListener('click', () => {
        notification.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 300);
    });
    
    // Fechar automaticamente após o tempo definido
    setTimeout(() => {
        if (notification.parentNode === notificationContainer) {
            notification.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (notification.parentNode === notificationContainer) {
                    notificationContainer.removeChild(notification);
                }
            }, 300);
        }
    }, duration);
    
    return notification;
}

// Função para ajustar a altura do grid para ocupar o espaço disponível
function adjustGridHeight() {
    const gridContainer = document.getElementById('ag-grid-container');
    if (!gridContainer) return;
    
    // Calcular a altura disponível
    const windowHeight = window.innerHeight;
    const containerRect = gridContainer.getBoundingClientRect();
    const topPosition = containerRect.top;
    
    // Deixar um pequeno espaço na parte inferior (20px)
    const bottomMargin = 20;
    const availableHeight = windowHeight - topPosition - bottomMargin;
    
    // Definir uma altura mínima para o grid
    const minHeight = 300;
    const newHeight = Math.max(availableHeight, minHeight);
    
    // Aplicar a nova altura
    gridContainer.style.height = `${newHeight}px`;
    
    // Se o grid já estiver inicializado, notificar sobre a mudança de tamanho
    if (gridApi && typeof gridApi.setDomLayout === 'function') {
        gridApi.setDomLayout('normal');
    }
    
    console.log(`Grid height adjusted to ${newHeight}px`);
}

// Função para atualizar os dados do grid sem recarregar a página
async function refreshGridData() {
    if (!gridApi) {
        console.warn('Grid API não disponível para atualizar os dados');
        return false;
    }
    
    try {
        // Mostrar overlay de carregamento
        if (gridApi && typeof gridApi.showLoadingOverlay === 'function') {
            gridApi.showLoadingOverlay();
        }
        
        // Salvar o estado atual do grid para restaurar após a atualização
        saveGridState();
        
        // Buscar dados de distribuição de documentos primeiro
        await fetchDocumentosDistribuicao();
        
        // Tentar obter dados do servidor
        let data = [];
        try {
            const response = await fetch('/api/process-query-filter/getData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            
            if (response.ok) {
                data = await response.json();
                console.log('Dados obtidos do servidor com sucesso');
            } else {
                console.warn('Não foi possível obter dados do servidor. Usando dados de exemplo.');
                // Usar os dados de exemplo definidos na função initializeGrid
                data = mockData;
            }
        } catch (error) {
            console.warn('Erro ao obter dados do servidor. Usando dados de exemplo:', error);
            // Usar os dados de exemplo definidos na função initializeGrid
            data = mockData;
        }
        
        // Processar os dados para garantir que não haja valores inválidos
        data = processDataBeforeDisplay(data);
        
        // Atualizar os dados do grid usando a API da versão 33.1.1
        if (gridApi && typeof gridApi.setGridOption === 'function') {
            gridApi.setGridOption('rowData', data);
            console.log('Dados do grid atualizados com sucesso');
            
            // Aplicar autosize após o carregamento dos dados
            setTimeout(() => {
                if (gridApi.columnModel && typeof gridApi.columnModel.autoSizeAllColumns === 'function') {
                    console.log('Aplicando autosize após atualização de dados...');
                    gridApi.columnModel.autoSizeAllColumns();
                } else if (gridApi.columnApi && typeof gridApi.columnApi.autoSizeAllColumns === 'function') {
                    console.log('Aplicando autosize após atualização de dados via columnApi...');
                    gridApi.columnApi.autoSizeAllColumns();
                }
                
                // Restaurar o estado do grid após o carregamento dos dados
                console.log('Tentando restaurar o estado do grid após atualização de dados...');
                setTimeout(() => {
                    restoreGridState();
                    
                    // Ajustar a altura do grid após restaurar o estado
                    setTimeout(adjustGridHeight, 100);
                    
                    // Mostrar notificação de sucesso
                    showNotification('Dados atualizados com sucesso!', 'success');
                }, 100);
            }, 200);
        }
        
        // Esconder o overlay de carregamento
        if (gridApi && typeof gridApi.hideOverlay === 'function') {
            gridApi.hideOverlay();
        } else if (gridApi && typeof gridApi.hideLoadingOverlay === 'function') {
            gridApi.hideLoadingOverlay();
        }
        
        return true;
    } catch (error) {
        console.error('Erro ao atualizar dados do grid:', error);
        
        // Esconder o overlay de carregamento em caso de erro
        if (gridApi && typeof gridApi.hideOverlay === 'function') {
            gridApi.hideOverlay();
        } else if (gridApi && typeof gridApi.hideLoadingOverlay === 'function') {
            gridApi.hideLoadingOverlay();
        }
        
        // Mostrar notificação de erro
        showNotification('Erro ao atualizar dados. Por favor, tente novamente.', 'error');
        
        return false;
    }
}

// Função para buscar dados de distribuição de documentos
async function fetchDocumentosDistribuicao() {
    try {
        // Mostrar mensagem de log
        console.log('Buscando dados de distribuição de documentos...');
        
        // Tentar obter dados do servidor
        const response = await fetch('/api/process-query-filter/getDocumentosDistribuicao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar dados de distribuição de documentos: ${response.status} ${response.statusText}`);
        }
        
        // Processar os dados recebidos
        const data = await response.json();
        console.log('Dados de distribuição de documentos recebidos:', data.length, 'registros');
        
        // Organizar os dados por IdLogistica_House
        const documentosMap = {};
        
        data.forEach(item => {
            const idLogisticaHouse = item.IdLogistica_House;
            
            // Se ainda não temos um objeto para este IdLogistica_House, criar um
            if (!documentosMap[idLogisticaHouse]) {
                documentosMap[idLogisticaHouse] = {};
            }
            
            // Determinar o tipo de documento/informação com base na descrição
            const descricao = item.Descricao;
            
            // Adicionar a informação ao objeto
            if (descricao && descricao.includes('OHBL')) {
                documentosMap[idLogisticaHouse]['OHBL'] = item.Distribuicao_Documentos || '-';
            } else if (descricao && descricao.includes('OMBL')) {
                documentosMap[idLogisticaHouse]['OMBL'] = item.Distribuicao_Documentos || '-';
            } else if (descricao && descricao.includes('Envio dos Docs para Armador')) {
                documentosMap[idLogisticaHouse]['Envio_Docs_Armador'] = item.Distribuicao_Documentos || '-';
            } else if (descricao && descricao.includes('Liberação')) {
                documentosMap[idLogisticaHouse]['Liberacao'] = item.Distribuicao_Documentos || '-';
            } else if (descricao && descricao.includes('Recebimento dos Docs')) {
                documentosMap[idLogisticaHouse]['Recebimento_Docs'] = item.Distribuicao_Documentos || '-';
            }
        });
        
        // Armazenar os dados processados na variável global
        documentosDistribuicaoData = documentosMap;
        
        console.log('Dados de distribuição de documentos processados com sucesso');
        return documentosMap;
    } catch (error) {
        console.error('Erro ao buscar dados de distribuição de documentos:', error);
        
        // Em caso de erro, usar dados de exemplo para testes
        console.warn('Usando dados de exemplo para distribuição de documentos');
        
        // Dados de exemplo para testes
        const mockDocumentosData = {
            1001: {
                OHBL: 'Liberado ao exportador',
                OMBL: 'Enviado Courrier',
                Envio_Docs_Armador: '15/10/2023',
                Liberacao: '18/10/2023',
                Recebimento_Docs: '12/10/2023'
            },
            1002: {
                OHBL: 'Express Release',
                OMBL: 'e-BL',
                Envio_Docs_Armador: '20/10/2023',
                Liberacao: '25/10/2023',
                Recebimento_Docs: '18/10/2023'
            },
            1003: {
                OHBL: 'Impressão no Destino',
                OMBL: 'Emissão destino',
                Envio_Docs_Armador: '05/10/2023',
                Liberacao: '10/10/2023',
                Recebimento_Docs: '01/10/2023'
            },
            1004: {
                OHBL: 'Enviado Courrier',
                OMBL: 'Enviado Courrier',
                Envio_Docs_Armador: '30/10/2023',
                Liberacao: '05/11/2023',
                Recebimento_Docs: '28/10/2023'
            },
            1005: {
                OHBL: 'Express Release',
                OMBL: 'e-BL',
                Envio_Docs_Armador: '22/10/2023',
                Liberacao: '28/10/2023',
                Recebimento_Docs: '20/10/2023'
            }
        };
        
        // Armazenar os dados de exemplo na variável global
        documentosDistribuicaoData = mockDocumentosData;
        
        return mockDocumentosData;
    }
} 