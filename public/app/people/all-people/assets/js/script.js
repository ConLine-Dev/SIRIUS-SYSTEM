let startDateGlobal, endDateGlobal;

const socket = io();

socket.on("updatePeople", async (data) => {
    const people = data.people && data.people.length > 0 ? data.people[0] : data;
    const categories = data.categories || [];
    const categories_item = await listPeopleCategoryRelations(categories);
    const status = await listPeopleStatus(people); // Passando o objeto people diretamente
    const cardPeople = document.querySelector(`[data-people-id="${people.id}"]`);

    if (cardPeople) {
        cardPeople.querySelector('.io-people-fantasy-name').textContent = people.fantasy_name;
        cardPeople.querySelector('.io-people-commercial').textContent = people.commercial;
        cardPeople.querySelector('.io-people-responsable').textContent = people.collaborator_responsable;
        cardPeople.querySelector('.io-people-categories').innerHTML = categories_item;
        cardPeople.querySelector('.io-people-status').innerHTML = status;
    }
});

socket.on("insertPeople", async (data) => {
    await addNewPerson(data);
});

// Função para inserir novas pessoas pelo SOCKET IO
async function addNewPerson(data) {
    const people = document.getElementById('listPeople');
    let html = '';

    const item = data;
    const categories = await listPeopleCategoryRelations(item.categories);
    const status = await listPeopleStatus(item.people[0]);
    const cnpjCpfFormated = formatCnpjCpfString(item.people[0].cnpj_cpf);


    html += `<div class="col-xl-12 col-lg-12 col-md-12 col-sm-12 shadow-sm list-group-item-action py-3" style="cursor: pointer;" data-people-id="${item.people[0].id}" ondblclick="openPeople(${item.people[0].id})"> 
                    <div class="card-body">
                        <span class="io-people-status">${status}</span>
                        <div class="d-flex mb-3 flex-wrap align-items-center"> 
                            <div>
                                <h5 class="fw-semibold mb-0 d-flex align-items-center">
                                    <a class="io-people-fantasy-name">${item.people[0].fantasy_name}</a>
                                </h5> 
                                <a>Comercial: <span class="io-people-commercial">${item.people[0].commercial}</span></a>
                                <br>
                                <a>Funcionário Responsável: <span class="io-people-responsable">${item.people[0].collaborator_responsable}</span></a>
                            </div>
                        </div>
                        <div class="popular-tags"> 
                            <span class="io-people-categories">${categories}</span>
                            <div class="btn-list float-end"> 
                                <span>${cnpjCpfFormated}</span>
                                <span class="d-none">${item.people[0].cnpj_cpf}</span>
                            </div>
                        </div>
                    </div>
                </div>`;

    people.innerHTML += html;
};

async function active_tooltip() {
    const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]'
    );
    const tooltipList = [...tooltipTriggerList].map(
        (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
    );
};

// Função para formatar cnpj ou cpf na listagem das pessoas
function formatCnpjCpfString(value) {
    // Verifica o comprimento do valor recebido, se for 14 caracteres é cnpj, se for 11 é cpf
    if (value.length === 14) {
        // Formatar o CNPJ: 00.000.000/0000-00
        return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    } else if(value.length === 11) {
        // Formata como CPF: 000.000.000-00
        return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
        // Retorna o valor original se não tiver o comprimento esperado
        return value;
    }
};

// Função para formatar o CNPJ e CPF do input
function formatCnpjCpfInput(value) {
    // Remove todos os caracteres não numéricos
    value = value.replace(/\D/g, '');

    // Limita o comprimento a 14 dígitos
    if (value.length > 14) {
        value = value.substring(0, 14);
    }

    // Verifica o comprimento do valor para determinar se é um CNPJ ou CPF
    if (value.length === 14) {
        // Formata como CNPJ: 00.000.000/0000-00
        return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    } else if (value.length === 11) {
        // Formata como CPF: 000.000.000-00
        return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
        // Retorna o valor original se não tiver o comprimento esperado
        return value;
    }
};

// Função que cria o select para selecionar as categorias de pessoas
let selectPeopleCategory;
async function createSelectPeopleCategory(data) {
    // Formate o array para ser usado com o Choices.js
    const options = data.map(function(element) {
        return {
            value: `${element.id}`,
            label: `${element.name}`,
        };
    });

    // verifica se o select ja existe, caso exista destroi
    if (selectPeopleCategory) {
        selectPeopleCategory.destroy();
    }

    // renderiza o select com as opções formatadas
    selectPeopleCategory = new Choices('#selectPeopleCategory', {
        choices: options,
        allowHTML: true,
        allowSearch: true,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        noResultsText: 'Não há opções disponíveis'
    });
};

// Função para pegar as opções selecionadas do Select Categoria da Pessoa
async function getSelectPeopleCategoryValues() {
    if (selectPeopleCategory && selectPeopleCategory.getValue(true).length === 0) {
       return undefined;
    } else {
       // Usar o método getValue() para pegar os valores selecionados
       const selectedValues = selectPeopleCategory.getValue(true);
       // Transformar o array em uma string com os valores entre parênteses e separados por virgula
       const formattedValues = `(${selectedValues.map(value => `${value}`).join(', ')})`
       return formattedValues;
    }
};

// Função que cria o select para selecionar as categorias de pessoas
let selectPeopleStatus;
async function createSelectPeopleStatus(data) {
    // Formate o array para ser usado com o Choices.js
    const options = data.map(function(element) {
        return {
            value: `${element.id}`,
            label: `${element.name}`,
        };
    });

    // verifica se o select ja existe, caso exista destroi
    if (selectPeopleStatus) {
        selectPeopleStatus.destroy();
    }

    // renderiza o select com as opções formatadas
    selectPeopleStatus = new Choices('#selectPeopleStatus', {
        choices: options,
        allowHTML: true,
        allowSearch: true,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        noResultsText: 'Não há opções disponíveis'
    });
};

// Função para pegar as opções selecionadas do Select Status da Pessoa
async function getSelectPeopleStatusValues() {
    if (selectPeopleStatus && selectPeopleStatus.getValue(true).length === 0) {
       return undefined;
    } else {
       // Usar o método getValue() para pegar os valores selecionados
       const selectedValues = selectPeopleStatus.getValue(true);
       // Transformar o array em uma string com os valores entre parênteses e separados por virgula
       const formattedValues = `(${selectedValues.map(value => `${value}`).join(', ')})`
       return formattedValues;
    }
};

// Função que cria o select para selecionar os comerciais
let selectCommercial;
async function createSelectCommercial(data) {
    // Formate o array para ser usado com o Choices.js
    const options = data.map(function(element) {
        return {
            value: `${element.commercial_id}`,
            label: `${element.commercial}`,
        };
    });

    // verifica se o select ja existe, caso exista destroi
    if (selectCommercial) {
        selectCommercial.destroy();
    }

    // renderiza o select com as opções formatadas
    selectCommercial = new Choices('#selectCommercial', {
        choices: options,
        allowHTML: true,
        allowSearch: true,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        noResultsText: 'Não há opções disponíveis'
    });
};

// Função para pegar as opções selecionadas do Select Comercial
async function getSelectCommercialValues() {
    if (selectCommercial && selectCommercial.getValue(true).length === 0) {
       return undefined;
    } else {
       // Usar o método getValue() para pegar os valores selecionados
       const selectedValues = selectCommercial.getValue(true);
       // Transformar o array em uma string com os valores entre parênteses e separados por virgula
       const formattedValues = `(${selectedValues.map(value => `${value}`).join(', ')})`
       return formattedValues;
    }
};

// Função que cria o select para selecionar os funcionarios responsaveis(inside sales)
let selectCollaboratorResponsable;
async function createSelectCollaboratorResponsable(data) {
    // Formate o array para ser usado com o Choices.js
    const options = data.map(function(element) {
        return {
            value: `${element.collaborator_responsable_id}`,
            label: `${element.collaborator_responsable}`,
        };
    });

    // verifica se o select ja existe, caso exista destroi
    if (selectCollaboratorResponsable) {
        selectCollaboratorResponsable.destroy();
    }

    // renderiza o select com as opções formatadas
    selectCollaboratorResponsable = new Choices('#selectCollaboratorResponsable', {
        choices: options,
        allowHTML: true,
        allowSearch: true,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        noResultsText: 'Não há opções disponíveis'
    });
};

// Função para pegar as opções selecionadas do Select Funcionario Responsavel
async function getSelectCollaboratorResponsableValues() {
    if (selectCollaboratorResponsable && selectCollaboratorResponsable.getValue(true).length === 0) {
       return undefined;
    } else {
       // Usar o método getValue() para pegar os valores selecionados
       const selectedValues = selectCollaboratorResponsable.getValue(true);
       // Transformar o array em uma string com os valores entre parênteses e separados por virgula
       const formattedValues = `(${selectedValues.map(value => `${value}`).join(', ')})`
       return formattedValues;
    }
};

// Função que printa as categorias de cada pessoa
async function listPeopleCategoryRelations(data) {
    let categoriesHtml = '';
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        categoriesHtml += `<span class="badge rounded-pill bg-light text-default">${item.category}</span>`
    };

    return categoriesHtml;
};

async function listPeopleStatus(data) {
    let status = '';
    const peopleStatus = data.people ? data.people.people_status : data.people_status;
    const peopleStatusId = data.people ? data.people.people_status_id : data.people_status_id;

    if (peopleStatusId === 1 && peopleStatus !== null) {
        status = `<div class="btn-list float-end"> 
                    <span class="badge bg-indigo rounded-pill" id="cart-icon-badge">${peopleStatus}</span>
                  </div>`;
    } else if (peopleStatusId === 3 && peopleStatus !== null) {
        status = `<div class="btn-list float-end"> 
                    <span class="badge bg-primary rounded-pill" id="cart-icon-badge">${peopleStatus}</span>
                  </div>`;
    } else if (peopleStatusId !== 1 && peopleStatusId !== 3 && peopleStatus !== null) {
        status = `<div class="btn-list float-end"> 
                    <span class="badge bg-secondary rounded-pill" id="cart-icon-badge">${peopleStatus}</span>
                  </div>`;
    }

    return status;
};

// Função lista todos os colaboradores 
async function listPeople(data) {
    const people = document.getElementById('listPeople');
    let html = '';
        
    //Essa funçao faz a busca no banco para puxar todos os colaboradores
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const categories = await listPeopleCategoryRelations(item.categories);
        const status = await listPeopleStatus(item);

        const cnpjCpfFormated = formatCnpjCpfString(item.people.cnpj_cpf);

        html += `<div class="col-xl-12 col-lg-12 col-md-12 col-sm-12 shadow-sm list-group-item-action py-3" style="cursor: pointer;" data-people-id="${item.people.id}" ondblclick="openPeople(${item.people.id})"> 
                        <div class="card-body">
                            <span class="io-people-status">${status}</span>
                            <div class="d-flex mb-3 flex-wrap align-items-center"> 
                                <div>
                                    <h5 class="fw-semibold mb-0 d-flex align-items-center">
                                        <a class="io-people-fantasy-name">${item.people.fantasy_name}</a>
                                    </h5> 
                                    <a>Comercial: <span class="io-people-commercial">${item.people.commercial}</span></a>
                                    <br>
                                    <a>Funcionário Responsável: <span class="io-people-responsable">${item.people.collaborator_responsable}</span></a>
                                </div>
                            </div>
                            <div class="popular-tags"> 
                                <span class="io-people-categories">${categories}</span>
                                <div class="btn-list float-end"> 
                                    <span>${cnpjCpfFormated}</span>
                                    <span class="d-none">${item.people.cnpj_cpf}</span>
                                </div>
                            </div>
                        </div>
                    </div>`
    }

   people.innerHTML = html;
};

// Função é executada quando for pesquisar e selecionar um colaborador  
async function eventClick() {
    // ========== PESQUISA ========== //
    const input_search = document.querySelector('#search');
    input_search.addEventListener('keyup', function (e) {
        e.preventDefault();
        let term_search = this.value.toLowerCase(); // Obtém o valor do input em maiúscula
        // Itera sobre os itens da lista e mostra/oculta com base no termo de pesquisa
        let list_items = document.querySelectorAll('[data-people-id]');
        list_items.forEach(function (item) {
            let textoItem = item.querySelector('.card-body').textContent.toLowerCase();

            // Verifica se o texto do item contém o termo de pesquisa
            if (textoItem.includes(term_search)) {
                item.style.display = 'flex'; // Mostra o item
            } else {
                item.style.display = 'none'; // Oculta o item
            }
        });
    })
    // ========== FIM PESQUISA ========== // 

    // ========== BOTAO DE FILTRO ========== // 
    const inputDateFilter = document.getElementById('inputDateFilter');
    const btn_filter = document.getElementById('btn-filter');
    btn_filter.addEventListener('click', async function (e) {
        e.preventDefault();
        // Obtém o valor do input
        const dateRange = inputDateFilter.value;
        // Divide o valor em duas data separadas
        const [startDateStr, endDateStr] = dateRange.split(' até ');
        // Função para converter uma data "01 jan 2024" para "2024-01-01"
        const formatDate = (dateStr) => {
            if (!dateStr) {
                return false
            } else {
            const [day, month, year] = dateStr.split(' ');
            const month_map = {
                    'Jan': '01',
                    'Fev': '02',
                    'Mar': '03',
                    'Abr': '04',
                    'Mai': '05',
                    'Jun': '06',
                    'Jul': '07',
                    'Ago': '08',
                    'Set': '09',
                    'Out': '10',
                    'Nov': '11',
                    'Dez': '12',
            };

                return `${year}-${month_map[month]}-${day.padStart(2, 0)}`
            }
        };

        startDateGlobal = formatDate(startDateStr);
        endDateGlobal = formatDate(endDateStr);

        const peopleCategorySelected = await getSelectPeopleCategoryValues(); // Armazena todas as categorias Selecionadas
        const peopleStatusSelected = await getSelectPeopleStatusValues(); // Armazena todos os status Selecionadas
        const commercialValues = await getSelectCommercialValues(); // Armazena todos os comerciais Selecionadas
        const collaboratorResponsableValues = await getSelectCollaboratorResponsableValues(); // Armazena todos os funcionarios responsaveis Selecionadas

        // Pegar o filtro de tipo pessoa, se é PJ ou PF
        const peopleTypePJ = document.getElementById('peoplePJ').checked ? 1 : 0;
        const peopleTypePF = document.getElementById('peoplePF').checked ? 1 : 0;
        // No banco de dados esse campo é um boolean. O IF ELSE abaixo é feito para informar o banco se o filtro esta sendo feito para PJ e PF
        // Boolean = 0 PJ   Boolean = 1 PF
        const peopleAllType = peopleTypePJ == 1 && peopleTypePF == 1 ? '(0,1)' : peopleTypePJ == 1 && peopleTypePF == 0 ? '(0)' : peopleTypePJ == 0 && peopleTypePF == 1 ? '(1)' : '(0,1)'

        // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
        document.querySelector('#loader2').classList.remove('d-none')

        const peopleFilter = await makeRequest(`/api/people/listAllPeople`, 'POST', {startDate: startDateGlobal, endDate: endDateGlobal, peopleCategorySelected: peopleCategorySelected, peopleAllType: peopleAllType, peopleStatusSelected: peopleStatusSelected, commercialValues: commercialValues, collaboratorResponsableValues: collaboratorResponsableValues});

        // CHAMA AS FUNÇÕES
        await listPeople(peopleFilter);

        // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
        document.querySelector('#loader2').classList.add('d-none')
    });
    // ========== / BOTAO DE FILTRO ========== // 

    // ========== CRIAR PESSOA ========== // 
    document.getElementById('createPeople').addEventListener('click', async function () {
        await createPeople();
    });
    // ========== / CRIAR PESSOA ========== // 
};

// Inicializa o seletor de data
async function initializeDatePicker() {
    flatpickr("#inputDateFilter", {
        mode: "range",
        dateFormat: "d M Y",
    });
};

// Função que envia para a proxima janela o id da pessoa clicada
async function openPeople(id) {
    const body = {
        url: `/app/people/get-people?id=${id}`
    }
    window.ipcRenderer.invoke('open-exWindow', body);
};

// Função para criar uma nova pessoa!
async function createPeople() {
    const body = {
        url: `/app/people/create-people`
    }
    window.ipcRenderer.invoke('open-exWindow', body);
};


// Função executada após toda a página ser executada
window.addEventListener("load", async () => {
   const getAllPeople = await makeRequest('/api/people/listAllPeople', 'POST',);
   const getAllPeopleCategory = await makeRequest('/api/people/getAllPeopleCategory', 'POST',);
   const getAllPeopleStatus = await makeRequest('/api/people/getAllPeopleStatus', 'POST',);
   const getAllCommercial = await makeRequest('/api/people/getAllCommercial', 'POST',);
   const getAllCollaboratorsResponsable = await makeRequest('/api/people/getAllCollaboratorsResponsable', 'POST',);

   await listPeople(getAllPeople);
   await createSelectPeopleCategory(getAllPeopleCategory);
   await createSelectPeopleStatus(getAllPeopleStatus);
   await createSelectCommercial(getAllCommercial);
   await createSelectCollaboratorResponsable(getAllCollaboratorsResponsable);
   await eventClick();
   await initializeDatePicker();
   await active_tooltip();

   // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
   document.querySelector('#loader2').classList.add('d-none')

})