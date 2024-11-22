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
    
    const filters = {
        dataAte: document.querySelector('#dataAte').value,
        dataDe: document.querySelector('#dataDe').value,
        tabela: selectedTable,
        coluna: selectedColumn,
        valor: document.querySelector('#valor').value,
    }

    console.log(filters)
    const dados = await makeRequest(`/api/headcargo/searchLog/filter`, 'POST', { filters });
    console.log(dados)

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
            { data: 'Usuario' }, // Coluna de modal
            { data: 'Data' }, // Coluna de importador
            { data: 'Data_Inicio_Transacao' }, // Coluna de processo
            { data: 'Data_Termino_Transacao' }, // Coluna de abertura
            { data: 'Tempo_Transacao' }, // Coluna de data de compensação
            { data: 'Usuario_Windows' }, // Coluna de tipo
            { data: 'Computador' }, // Coluna de cliente
            { data: 'Tabela' }, // Coluna de vendedor
            { data: 'Tipo' }, // Coluna de inside
            { data: 'Indice' }, // Coluna de exportador
            { data: 'Campos' }, // Coluna de comissão de vendedor
        ],
        language: {
            url: "../../assets/libs/datatables/pt-br.json",
            searchPlaceholder: 'Pesquisar...',
            Search: '',
        }
    });

    document.querySelector('#loader').classList.add('d-none'); // Esconde o loader
};

let selectTable, selectColumn;
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

/**
 * Evento que será disparado quando o DOM estiver completamente carregado,
 * mas antes que recursos adicionais (como imagens e folhas de estilo) sejam carregados.
 */
window.addEventListener("load", async () => {
    await createSelectWithChoices(); // Cria o choices

    await loadSelectTable(); // Cria as opções das tabelas no select

    // Esconder o loader
    document.querySelector('#loader2').classList.add('d-none');
});