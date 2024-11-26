// Verifica o localStorage para alterar a mensagem de boas vindas
// Obtém os dados armazenados no localStorage sob a chave 'StorageGoogle'
const StorageGoogleData = localStorage.getItem('StorageGoogle');
// Converte os dados armazenados de JSON para um objeto JavaScript
const StorageGoogle = JSON.parse(StorageGoogleData);

// Função para submeter aos logs do head.
let tables;
async function submitLog() {
    document.querySelector('#loader').classList.remove('d-none'); // Exibe o loader

    const selectedTable = await getSelectTable();
    const selectedColumn = await getSelectColumn();
    const selectedType = await getSelectType();
    
    const filters = {
        dataAte: document.querySelector('#dataAte').value,
        dataDe: document.querySelector('#dataDe').value,
        tabela: selectedTable,
        coluna: selectedColumn,
        tipo: selectedType,
        valor: document.querySelector('#valor').value,
    }

    const dados = await makeRequest(`/api/headcargo/searchLog/filter`, 'POST', { filters });

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#table_result_log')) {
        $('#table_result_log').DataTable().destroy();
    }

    $('#table_result_log').DataTable({
        paging: false,
        scrollX: true,
        scrollY: '60vh',
        pageInfo: false,
        bInfo: false,
        order: [[0, 'desc']],
        data: dados, // Define os dados da tabela
        columns: [
            { data: 'Usuario' },
            { data: 
                'Data',
                render: function(data) {
                    return formatDate(data)
                }
            },
            { data: 
                'Data_Inicio_Transacao',
                render: function(data) {
                    return formatDate(data)
                }
            },
            { data: 
                'Data_Termino_Transacao',
                render: function(data) {
                    return formatDate(data)
                }
            },
            { data: 'Tempo_Transacao' },
            { data: 'Usuario_Windows' },
            { data: 'Computador' },
            { data: 'Tabela' },
            { data: 'Tipo' },
            { data: 'Indice' },
            {
                data: 'Campos',
                render: function (data, type, row) {
                    return `<a href="#" class="btn-view-xml" data-xml='${encodeURIComponent(data)}'>Visualizar XML</a>`;
                },
            },
        ],
        language: {
            url: "../../assets/libs/datatables/pt-br.json",
            searchPlaceholder: 'Pesquisar...',
            Search: '',
        }
    });

    document.querySelector('#loader').classList.add('d-none'); // Esconde o loader
};

function formatDate(dateString) {
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    };

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', options).format(date).replace(',', '');
}

let selectTable, selectColumn, selectType;
async function createSelectWithChoices() {
    // renderiza o select com as opções formatadas
    selectTable = new Choices('#selectTable', {
       allowHTML: true,
       allowSearch: true,
       shouldSort: false,
       removeItemButton: true,
       noChoicesText: 'Não há opções disponíveis',
       noResultsText: 'Não há opções disponíveis',
       position: 'bottom'
    });

    // renderiza o select com as opções formatadas
    selectColumn = new Choices('#selectColumn', {
        allowHTML: true,
        allowSearch: true,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        noResultsText: 'Não há opções disponíveis',
        position: 'bottom'
    });

    // renderiza o select com as opções formatadas
    selectType = new Choices('#selectType', {
        allowHTML: true,
        allowSearch: true,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        noResultsText: 'Não há opções disponíveis',
        position: 'bottom'
    });
};

// Função para carregar as opções do banco de dados
async function loadSelectTable() {
    // Mostra o indicador de carregamento
    selectTable.setChoices([{
       value: '',
       label: 'Carregando...',
       disabled: true
    }], 'value', 'label', true);
 
    try {
        // Simula uma chamada para o banco de dados
        const getTable = await makeRequest('/api/headcargo/searchLog/getTables', 'POST',);
 
        // Formate o array para ser usado com o Choices.js
        const options = getTable.map(element => ({
            value: element.TABLE_NAME,
            label: element.TABLE_NAME
        }));
 
        // Atualiza as opções do Choices.js
        selectTable.clearChoices();
        selectTable.setChoices(options, 'value', 'label', true);
    } catch (error) {
        // Lida com o erro se a chamada para o banco de dados falhar
        console.error('Erro ao carregar opções:', error);
        selectTable.clearChoices();
        selectTable.setChoices([{
            value: '',
            label: 'Erro ao carregar opções',
            disabled: true
        }], 'value', 'label', true);
    }
 
};
 
// Função para selecionar a tabela
async function setSelectTableFromDB(value) {
    selectTable.setChoiceByValue(value);
};
 
// Função para pegar a opção selecionada do Select Tabela
async function getSelectTable() {
if (selectTable) {
    const values = selectTable.getValue(true);
    if (values && values.length === 0) {
        return undefined;
    } else {
        return values;
    }
} else {
    return undefined;
}
};
 
// Adiciona um evento para carregar as opções quando o dropdown do select é exibido
document.querySelector('#selectTable').addEventListener('showDropdown', async function() {
    const currentValue = selectTable.getValue(true);
    if (!currentValue || currentValue.length === 0) {
        await loadSelectTable();
    }
});

// Função para carregar as opções do banco de dados
async function loadSelectColumn() {
    // Mostra o indicador de carregamento
    selectColumn.setChoices([{
       value: '',
       label: 'Carregando...',
       disabled: true
    }], 'value', 'label', true);

    const selectedTable = await getSelectTable();
 
    try {
        // Simula uma chamada para o banco de dados
        const getColumn = await makeRequest('/api/headcargo/searchLog/getColumns', 'POST', {table: selectedTable});
 
        // Formate o array para ser usado com o Choices.js
        const options = getColumn.map(element => ({
            value: element.column_name,
            label: element.column_name
        }));
        
 
        // Atualiza as opções do Choices.js
        selectColumn.clearChoices();
        selectColumn.setChoices(options, 'value', 'label', true);
    } catch (error) {
        // Lida com o erro se a chamada para o banco de dados falhar
        console.error('Erro ao carregar opções:', error);
        selectColumn.clearChoices();
        selectColumn.setChoices([{
            value: '',
            label: 'Erro ao carregar opções',
            disabled: true
        }], 'value', 'label', true);
    }
 
};

// Função para pegar a opção selecionada do Select Tabela
async function getSelectColumn() {
    if (selectColumn) {
        const values = selectColumn.getValue(true);
        if (values && values.length === 0) {
            return undefined;
        } else {
            return values;
        }
    } else {
        return undefined;
    }
};

// Adiciona um evento para carregar as opções quando o dropdown do select é exibido
document.querySelector('#selectColumn').addEventListener('showDropdown', async function() {
    const currentValue = selectColumn.getValue(true);
    if (currentValue || !currentValue || currentValue.length === 0) {
        await loadSelectColumn();
    }
});

async function createSelectPeopleType() {
    // Dados do select
    const options = [
       { value: 0, label: 'Todos' },
       { value: 1, label: 'Inserção' },
       { value: 2, label: 'Excluido' },
       { value: 3, label: 'Atualização' }
    ];
 
    selectType.clearChoices();
    selectType.setChoices(options, 'value', 'label', true);
};

async function getSelectType() {
    if (selectType) {
        const values = selectType.getValue(true);
        if (values && values.length === 0) {
            return undefined;
        } else {
            return values;
        }
    } else {
        return undefined;
    }
};

// Adiciona evento de click
document.addEventListener('click', function (event) {
    // Verifica se o click foi no item de visualizar
    if (event.target.classList.contains('btn-view-xml')) {
        event.preventDefault();

        // Obtém o conteúdo XML do atributo data-xml
        const xmlContent = decodeURIComponent(event.target.getAttribute('data-xml'));

        // Formata o XML com indentação
        const formattedXml = formatXml(xmlContent);

        // Abre uma nova janela
        const openWindow = window.open('', '_blank', 'scrollbars=no,resizable=no');

        // Insere o conteúdo na nova janela
        openWindow.document.write(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Visualizador de Log</title>
                <link href="../../assets/libs/prisma.code/prism-tomorrow.min.css" rel="stylesheet">
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        font-size: 0.9rem;
                        background-color: #2d2d2d;
                        color: #f8f8f2;
                    }
                    pre {
                        margin: 0;
                        padding: 15px;
                        background-color: #2d2d2d;
                        color: #f8f8f2;
                        border-radius: 5px;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                    }
                </style>
            </head>
            <body>
                <pre><code id="xmlCode" class="language-xml">${formattedXml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
                <script src="../../assets/libs/prisma.code/prism.min.js"></script>
                <script>
                    Prism.highlightAll();

                    // Calcula o tamanho do conteúdo
                    const preElement = document.querySelector('pre');
                    const contentWidth = preElement.offsetWidth;
                    const contentHeight = preElement.offsetHeight;

                    // Redimensiona a janela para o tamanho do conteúdo, com margens adicionais
                    window.resizeTo(contentWidth + 40, contentHeight + 40); // Inclui margens e padding
                </script>
            </body>
            </html>
        `);

        openWindow.document.close();
    }
});

// Função para formatar o XML com indentação
function formatXml(xml) {
    const PADDING = '    '; // Define o número de espaços para cada nível de indentação
    let formatted = '';
    let pad = 0;

    xml.split(/>\s*</).forEach(function (node) {
        if (node.match(/^\/\w/)) {
            pad -= 1;
        }
        formatted += PADDING.repeat(pad) + '<' + node + '>\n';
        if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith('?')) {
            pad += 1;
        }
    });

    return formatted.trim();
};

window.addEventListener("load", async () => {

    await createSelectWithChoices(); // Cria o choices
    await createSelectPeopleType(); // Cria o choices de tipo
    await loadSelectTable(); // Cria as opções das tabelas no select

    // Esconder o loader
    document.querySelector('#loader2').classList.add('d-none');
});