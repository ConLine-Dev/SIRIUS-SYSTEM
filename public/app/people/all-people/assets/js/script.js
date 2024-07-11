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

// Função que cria o select para selecionar se a pessoa é PJ ou PF
let selectPeopleType;
async function createSelectPeopleType() {
    const inputCnpjCpf = document.getElementById('input-cnpj-cpf');

    // Permite que seja digitado somente numero
    inputCnpjCpf.addEventListener('input', (event) => {
        let value = event.target.value.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
        event.target.value = formatCnpjCpfInput(value);
    });

    inputCnpjCpf.addEventListener('keypress', (event) => {
        // Permite apenas a entrada de números
        const charCode = event.charCode || event.keyCode || event.which;
        if (charCode < 48 || charCode > 57) {
            event.preventDefault();
        }
    });

    // Dados do select
    const data = [
        { value: 0, label: 'Pessoa Jurídica' },
        { value: 1, label: 'Pessoa Física' }
    ];

    // Verifica se o select já existe, caso exista, destroi
    if (selectPeopleType) {
        selectPeopleType.destroy();
    };

    // Renderiza o select com as opções formatadas
    selectPeopleType = new Choices('#typePeople', {
        choices: data,
        allowSearch: true,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        noResultsText: 'Não há opções disponíveis'
    });

    // Adiciona um evento para monitorar mudanças no seletor
    document.querySelector('#typePeople').addEventListener('change', (event) => {
        const selectedValue = event.detail.value;
        if (selectedValue === 0) {
            // Pessoa Jurídica
            inputCnpjCpf.disabled = false;
            inputCnpjCpf.maxLength = 18;
            inputCnpjCpf.placeholder = '00.000.000/0000-00';
        } else if (selectedValue === 1) {
            // Pessoa Física
            inputCnpjCpf.disabled = false;
            inputCnpjCpf.maxLength = 11;
            inputCnpjCpf.placeholder = '000.000.000-00';
        } else if (selectedValue === '') {
            inputCnpjCpf.disabled = true;
            inputCnpjCpf.value = '';
            inputCnpjCpf.placeholder = 'CPF/CNPJ';
        };
    });
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

// Função para pegar as opções selecionadas do Select
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

// Função lista todos os colaboradores 
async function listPeople(data) {
   const people = document.getElementById('listPeople');

   let html = '';

   //Essa funçao faz a busca no banco para puxar todos os colaboradores
   for (let i = 0; i < data.length; i++) {
       const item = data[i];
       const cnpjCpfFormated = formatCnpjCpfString(item.cnpj_cpf)

       html += `<li class="files-type" data-people-id="${item.id}" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="${item.fantasy_name}">
                    <a href="javascript:void(0)">
                        <div class="d-flex align-items-center">
                            <span class="name flex-fill text-nowrap first-name" style="font-weight: bold; color: #000;">${item.fantasy_name}</span>
                            <span class="name flex-fill text-nowrap second-name" style="font-weight: bold; color: #000; text-align: right;">${cnpjCpfFormated}</span>
                            <span class="name flex-fill text-nowrap second-name d-none" style="font-weight: bold; color: #000; text-align: right;">${item.cnpj_cpf}</span>
                            <span class="text-muted fs-12 responsable d-none"></span>
                        </div>
                        <div class="d-flex align-items-center">
                            <span class="text-muted fs-12 responsable"></span>
                        </div>
                    </a>
                </li>`
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
        let list_items = document.querySelectorAll('.list-unstyled .files-type');
        list_items.forEach(function (item) {
            let textoItem = item.querySelector('div').textContent.toLowerCase();

            // Verifica se o texto do item contém o termo de pesquisa
            if (textoItem.includes(term_search)) {
                item.style.display = 'block'; // Mostra o item
            } else {
                item.style.display = 'none'; // Oculta o item
            }
        });
    })
   // ========== FIM PESQUISA ========== // 

   // ========== SELEÇAO PESSOA ========== // 
    const peopleSelected = document.querySelectorAll('.files-type')
    peopleSelected.forEach(item => {
        item.addEventListener('click', async function () {
            peopleSelected.forEach(selected => {
                selected.classList.remove('active')
            });

            item.classList.add('active')

            const peopleId = this.getAttribute('data-people-id');
            // const getDataByPeople = await makeRequest(`/api/product/getProductCategory/${collaborator_id}`, 'POST',);

            const img_cards = document.getElementById('img-cards')
            const cards = document.getElementById('information')

            if (!img_cards.classList.contains('d-none')) {
                img_cards.classList.add('d-none')
                cards.classList.remove('d-none')
            }
        })
    });
    // ========== FIM SELEÇAO PESSOA ========== // 

    // ========== BOTAO DE FILTRO ========== // 
    const btn_filter = document.getElementById('btn-filter');
    btn_filter.addEventListener('click', async function (e) {
        e.preventDefault();

        // Armazena todas as depesas Selecionadas
        const peopleCategorySelected = await getSelectPeopleCategoryValues();

        // Pegar o filtro de tipo pessoa, se é PJ ou PF
        const peopleTypePJ = document.getElementById('peoplePJ').checked ? 1 : 0;
        const peopleTypePF = document.getElementById('peoplePF').checked ? 1 : 0;
        // No banco de dados esse campo é um boolean. O IF ELSE abaixo é feito para informar o banco se o filtro esta sendo feito para PJ e PF
        // Boolean = 0 PJ   Boolean = 1 PF
        const peopleAllType = peopleTypePJ == 1 && peopleTypePF == 1 ? '(0,1)' : peopleTypePJ == 1 && peopleTypePF == 0 ? '(0)' : peopleTypePJ == 0 && peopleTypePF == 1 ? '(1)' : '(0,1)'

        // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
        document.querySelector('#loader2').classList.remove('d-none')

        const peopleFilter = await makeRequest(`/api/people/listAllPeople`, 'POST', {peopleCategorySelected: peopleCategorySelected, peopleAllType: peopleAllType});
        // CHAMA AS FUNÇÕES
        await listPeople(peopleFilter);

        // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
        document.querySelector('#loader2').classList.add('d-none')
    });
    // ========== / BOTAO DE FILTRO ========== // 
}


// Função executada após toda a página ser executada
window.addEventListener("load", async () => {
   const getAllPeople = await makeRequest('/api/people/listAllPeople', 'POST',);
   const getAllPeopleCategory = await makeRequest('/api/people/getAllPeopleCategory', 'POST',);

   await listPeople(getAllPeople);
   await createSelectPeopleCategory(getAllPeopleCategory);
   await createSelectPeopleType();
   await eventClick();
   await active_tooltip();


   // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
   document.querySelector('#loader2').classList.add('d-none')

})