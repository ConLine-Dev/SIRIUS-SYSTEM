document.addEventListener("DOMContentLoaded", async () => {
  

    await init()
    document.querySelector('#loader2').classList.add('d-none')
})


async function fetchUserModules(userId) {
    const response = await fetch(`/api/module-management/getUserModulesByCategory/${userId}`);
    const data = await response.json();
    console.log(data)
    const categories = {};

    data.forEach(item => {
        if (!categories[item.category_name]) {
            categories[item.category_name] = [];
        }
        categories[item.category_name].push(item);
    });

    return categories;
}


function renderModules(modules) {
    const container = document.getElementById('modules-container');

    // Limpa o container antes de adicionar novos módulos
    container.innerHTML = '';

    Object.keys(modules).forEach(category => {
        // Cria o elemento para a categoria
        const categoryDiv = document.createElement('div');
        categoryDiv.classList.add('col-xl-3', 'col-lg-3', 'col-md-6', 'col-sm-12');

        // Cria o card
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card', 'custom-card');

        // Cria o cabeçalho do card
        const cardHeaderDiv = document.createElement('div');
        cardHeaderDiv.classList.add('card-header', 'justify-content-between');

        // Cria o título da categoria
        const cardTitleDiv = document.createElement('div');
        cardTitleDiv.classList.add('card-title');
        cardTitleDiv.textContent = category;

        cardHeaderDiv.appendChild(cardTitleDiv);
        cardDiv.appendChild(cardHeaderDiv);

        // Cria o corpo do card
        const cardBodyDiv = document.createElement('div');
        cardBodyDiv.classList.add('card-body');

        modules[category].forEach(module => {
            // Cria o elemento de check
            const formCheckDiv = document.createElement('div');
            formCheckDiv.classList.add('form-check');

            const checkbox = document.createElement('input');
            checkbox.classList.add('form-check-input');
            checkbox.type = 'checkbox';
            checkbox.checked = module.has_access;
            checkbox.id = `checkbox-${module.module_title.replace(/\s+/g, '-')}`;

            const label = document.createElement('label');
            label.classList.add('form-check-label');
            label.textContent = module.module_title;
            label.htmlFor = checkbox.id;

            formCheckDiv.appendChild(checkbox);
            formCheckDiv.appendChild(label);

            cardBodyDiv.appendChild(formCheckDiv);
        });

        cardDiv.appendChild(cardBodyDiv);
        categoryDiv.appendChild(cardDiv);

        container.appendChild(categoryDiv);
    });
}

async function init() {
    const userId = 1; // Substitua pelo ID do usuário que você deseja obter os módulos
    const modules = await fetchUserModules(userId);
    renderModules(modules);
}

async function generateTable() {
    // Fazer a requisição à API
    const dados = await makeRequest(`/api/launches_adm/getAllLaunches/`);

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#table_despesasADM')) {
        $('#table_despesasADM').DataTable().destroy();
    }

    // Criar a nova tabela com os dados da API
    $('#table_despesasADM').DataTable({
        dom: 'Bfrtip',
        pageLength: 15,
        order: [[0, 'desc']],
        data: dados.data,
        columns: [
            { data: 'Data_Vencimento' },
            { data: 'Situacao' },
            { data: 'Historico_Resumo' },
            { data: 'Pessoa' },
            { data: 'Tipo_Transacao' },
            { data: 'Valor' }
            // Adicione mais colunas conforme necessário
        ],
        buttons: [
            'excel', 'pdf', 'print'
        ],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
        },
    });
}
