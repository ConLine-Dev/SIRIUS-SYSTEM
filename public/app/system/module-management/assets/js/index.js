
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

    // Calcula a quantidade máxima de módulos em uma categoria
    let maxModuleCount = 0;
    Object.keys(modules).forEach(category => {
        maxModuleCount = Math.max(maxModuleCount, modules[category].length);
    });

    Object.keys(modules).forEach(category => {
        // Cria o elemento para a categoria
        const categoryDiv = document.createElement('div');
        categoryDiv.classList.add('col-xl-3', 'col-lg-3', 'col-md-6', 'col-sm-12', 'd-flex');

        // Cria o card
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card', 'custom-card', 'flex-fill');

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
            if(!module.module_id){
                return false
            }
            // Cria o elemento de check
            const formCheckDiv = document.createElement('div');
            formCheckDiv.classList.add('form-check');

            const checkbox = document.createElement('input');
            checkbox.classList.add('form-check-input');
            checkbox.type = 'checkbox';
            checkbox.checked = module.has_access;
            console.log(module.module_title, module)
            checkbox.id = `checkbox-${module.module_title.replace(/\s+/g, '-')}`;
            checkbox.dataset.moduleId = module.module_id; // Adiciona o ID do módulo como data attribute

            checkbox.addEventListener('change', handleModuleAccessChange); // Adiciona o event listener

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

async function handleModuleAccessChange(event) {
    const checkbox = event.target;
    const moduleId = checkbox.dataset.moduleId;
    const userId = currentUserId; // Usa a variável global currentUserId

    const action = checkbox.checked ? 'add' : 'remove';

    try {
        const response = await fetch('/api/module-management/userModuleAccess', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                moduleId: moduleId,
                action: action
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update module access');
        }

        const result = await response.json();
        console.log(result.message);
    } catch (error) {
        console.error(error);
        // Reverte o estado do checkbox em caso de erro
        checkbox.checked = !checkbox.checked;
    }
}

async function listAllUsers() {
    const users = await makeRequest('/api/users/listAllUsers');
    console.log(users);
    let userHTML = ``;
    for (let index = 0; index < users.length; index++) {
        const element = users[index];
        userHTML += `<li class="list-group-item" data-userid="${element.userID}">
        <div class="d-flex align-items-center justify-content-between flex-wrap">
            <div class="d-flex align-items-center gap-2">
                <div> <span class="avatar bg-light"> <img src="https://cdn.conlinebr.com.br/colaboradores/${element.id_headcargo}" alt=""> </span> </div>
                <div>
                    <span class="d-block fw-semibold">${element.username} ${element.familyName}<i class="bi bi-patch-check-fill text-success ms-2"></i></span>
                    <span class="d-block text-muted fs-12 fw-normal">-</span>
                </div>
            </div>
        </div>
    </li>`;
    }

    document.querySelector('.listHistory').innerHTML = userHTML;

    const searchInput = document.querySelector('.searchInput');

    // Remove todos os event listeners existentes substituindo o elemento por uma cópia
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);

    // Adiciona um event listener ao novo elemento da lista
    newSearchInput.addEventListener('input', function () {
        var filter = this.value.toLowerCase();
        var items = document.querySelectorAll('.listHistory li');

        items.forEach(function (item) {
            var text = item.textContent.toLowerCase();
            if (text.includes(filter)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });

    // Adiciona event listeners aos itens da lista
    const userItems = document.querySelectorAll('.listHistory li');
    userItems.forEach(item => {
        item.addEventListener('click', async () => {
            // Remove a classe 'active' de todos os itens
            userItems.forEach(i => i.classList.remove('active'));

            // Adiciona a classe 'active' ao item clicado
            item.classList.add('active');

            const userId = item.getAttribute('data-userid');
            currentUserId = userId; // Atualiza o userId global
            const modules = await fetchUserModules(userId);
            renderModules(modules);
        });
    });
}


async function init() {
    currentUserId = null; // Inicialize a variável global
    await listAllUsers();
}

document.addEventListener("DOMContentLoaded", async () => {
    await init();
    document.querySelector('#loader2').classList.add('d-none');
});

