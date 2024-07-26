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

    Object.keys(modules).forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.classList.add('category');

        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = category;
        categoryDiv.appendChild(categoryTitle);

        modules[category].forEach(module => {
            const moduleDiv = document.createElement('div');
            moduleDiv.classList.add('module');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = module.has_access;

            const label = document.createElement('label');
            label.textContent = module.module_title;

            moduleDiv.appendChild(checkbox);
            moduleDiv.appendChild(label);
            categoryDiv.appendChild(moduleDiv);
        });

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
