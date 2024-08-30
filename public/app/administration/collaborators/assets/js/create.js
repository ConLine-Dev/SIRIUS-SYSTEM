let sAllcompanie, sAllLanguages, sAllResponsible;

/**
 * @function getAllCompanie
 * @description Carrega e popula a lista de todas as companhias no elemento select correspondente.
 * 
 * Esta função faz uma solicitação à API para obter todas as companhias. Em seguida,
 * percorre a lista de companhias e adiciona cada uma delas como uma opção no campo select.
 */
async function getAllCompanie() {
    // Solicita todas as unidades (companhias) da API
    const Companie = await makeRequest(`/api/non-compliance/AllUnit`);

    // Limpa as opções existentes no select de companhias
    document.querySelector('select[name="companie"]').innerHTML = '';

    // Adiciona cada companhia como uma opção no select
    for (let index = 0; index < Companie.length; index++) {
        const element = Companie[index];
        document.querySelector('select[name="companie"]').innerHTML += `<option value="${element.id}">${element.city + ' | ' + element.country}</option>`;
    }
}

/**
 * @function getAllContractType
 * @description Carrega e popula a lista de todos os tipos de contratos no elemento select correspondente.
 * 
 * Esta função faz uma solicitação à API para obter todos os tipos de contratos. Em seguida,
 * percorre a lista de tipos de contratos e adiciona cada um deles como uma opção no campo select.
 */
async function getAllContractType() {
    // Solicita todos os tipos de contrato da API
    const ContractType = await makeRequest(`/api/collaborators-management/getAllContractType`);

    // Limpa as opções existentes no select de tipos de contrato
    document.querySelector('select[name="contractType"]').innerHTML = '';

    // Adiciona cada tipo de contrato como uma opção no select
    for (let index = 0; index < ContractType.length; index++) {
        const element = ContractType[index];
        document.querySelector('select[name="contractType"]').innerHTML += `<option value="${element.id}">${element.name}</option>`;
    }
}

/**
 * @function getAllDepartments
 * @description Carrega e popula a lista de todos os departamentos no elemento select correspondente.
 * 
 * Esta função faz uma solicitação à API para obter todos os departamentos. Em seguida,
 * percorre a lista de departamentos e adiciona cada um deles como uma opção no campo select.
 */
async function getAllDepartments() {
    // Solicita todos os departamentos da API
    const Departaments = await makeRequest(`/api/collaborators-management/getAllDepartments`);

    // Limpa as opções existentes no select de departamentos
    document.querySelector('select[name="department"]').innerHTML = '';

    // Adiciona cada departamento como uma opção no select
    for (let index = 0; index < Departaments.length; index++) {
        const element = Departaments[index];
        document.querySelector('select[name="department"]').innerHTML += `<option value="${element.id}">${element.name}</option>`;
    }
}

/**
 * @function getAllImmediateSupervisor
 * @description Carrega e popula a lista de todos os supervisores imediatos no elemento select correspondente.
 * 
 * Esta função faz uma solicitação à API para obter todos os usuários. Em seguida,
 * percorre a lista de usuários e adiciona cada um deles como uma opção no campo select,
 * listando-os como supervisores imediatos.
 */
async function getAllImmediateSupervisor() {
    // Solicita todos os usuários da API
    const ImmediateSupervisor = await makeRequest(`/api/users/listAllUsers`);

    // Limpa as opções existentes no select de supervisores imediatos
    document.querySelector('select[name="immediateSupervisor"]').innerHTML = '';

    // Adiciona cada usuário como uma opção no select de supervisores imediatos
    for (let index = 0; index < ImmediateSupervisor.length; index++) {
        const element = ImmediateSupervisor[index];
        document.querySelector('select[name="immediateSupervisor"]').innerHTML += `<option value="${element.id_colab}">${element.username + ' ' + element.familyName}</option>`;
    }
}

/**
 * @function geAllLanguages
 * @description Carrega e popula a lista de todas as línguas no elemento select correspondente utilizando a biblioteca Choices.js.
 * 
 * Esta função prepara uma lista estática de opções de línguas e as configura utilizando a biblioteca Choices.js.
 * Se já houver um select existente, ele será destruído antes de ser recriado.
 */
async function geAllLanguages() {
    // Lista de opções de idiomas para uso no select
    const listaDeOpcoes = [
        { value: 'mandarim', label: 'Mandarim' },
        { value: 'espanhol', label: 'Espanhol' },
        { value: 'ingles', label: 'Inglês' },
        { value: 'hindi', label: 'Hindi' },
        { value: 'arabe', label: 'Árabe' },
        { value: 'portugues', label: 'Português' },
        { value: 'bengali', label: 'Bengali' },
        { value: 'russo', label: 'Russo' },
        { value: 'japones', label: 'Japonês' },
        { value: 'panjabi', label: 'Panjabi' },
        { value: 'alemão', label: 'Alemão' },
        { value: 'javanes', label: 'Javanês' },
        { value: 'wu', label: 'Wu (Shanghainês)' },
        { value: 'malai', label: 'Malai' },
        { value: 'telugu', label: 'Telugu' },
        { value: 'vietnamita', label: 'Vietnamita' },
        { value: 'coreano', label: 'Coreano' },
        { value: 'frances', label: 'Francês' },
        { value: 'marata', label: 'Marata' },
        { value: 'tamil', label: 'Tâmil' }
    ];

    // Verifica se o select já existe e o destrói se necessário
    if (sAllLanguages) {
        sAllLanguages.destroy();
    }

    // Renderiza o select com as opções formatadas usando Choices.js
    sAllLanguages = new Choices('select[name="languages"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
    });
}

/**
 * @function getAllResponsible
 * @description Carrega e popula a lista de todos os responsáveis no elemento select correspondente utilizando a biblioteca Choices.js.
 * 
 * Esta função faz uma solicitação à API para obter todos os usuários. Em seguida,
 * formata e adiciona cada usuário como uma opção no campo select.
 * Se já houver um select existente, ele será destruído antes de ser recriado.
 */
async function getAllResponsible() {
    // Solicita todos os usuários da API
    const Responsible = await makeRequest(`/api/users/listAllUsers`);

    // Formata os dados para uso no select
    const listaDeOpcoes = Responsible.map(function (element) {
        return {
            value: `${element.id_colab}`,
            label: `${element.username + ' ' + element.familyName}`,
        };
    });

    // Verifica se o select já existe e o destrói se necessário
    if (sAllResponsible) {
        sAllResponsible.destroy();
    }

    // Renderiza o select com as opções formatadas usando Choices.js
    sAllResponsible = new Choices('select[name="responsible"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        removeItemButton: false,
        noChoicesText: 'Não há opções disponíveis',
    });
}

/**
 * @function eventChangeImgProfile
 * @description Adiciona um evento de mudança de imagem de perfil, permitindo o upload e visualização de uma nova imagem.
 * 
 * Esta função adiciona um event listener ao campo de upload de imagem de perfil,
 * que atualiza a imagem de perfil ao selecionar um arquivo válido.
 */
async function eventChangeImgProfile() {
    // Função para carregar o arquivo de imagem e atualizar a imagem de perfil
    let loadFile = function (event) {
        var reader = new FileReader();
        reader.onload = function () {
            var output = document.getElementById("profile-img");
            if (event.target.files[0].type.match("image.*")) {
                output.src = reader.result;
            } else {
                event.target.value = "";
                alert("Por favor, selecione uma imagem válida.");
            }
        };
        if (event.target.files[0]) {
            reader.readAsDataURL(event.target.files[0]);
        }
    };

    // Adiciona o evento de mudança ao campo de upload de imagem de perfil
    let ProfileChange = document.querySelector("#profile-change");
    ProfileChange.addEventListener("change", loadFile);
}

/**
 * @function eventInputProfile
 * @description Adiciona eventos aos campos de perfil para atualizar dinamicamente as informações exibidas conforme o usuário digita.
 * 
 * Esta função adiciona event listeners aos campos de nome completo, e-mail comercial e selects,
 * para que as informações exibidas sejam atualizadas em tempo real conforme o usuário faz alterações.
 */
async function eventInputProfile() {
    let Name = document.querySelector('input[name="name"]');
    Name.addEventListener("input", function (event) {
        if (this.value.trim() == '') {
            document.querySelector('.textName').innerHTML = '<br>';
        } else {
            document.querySelector('.textName').textContent = this.value;
        }
    });

    let FamilyName = document.querySelector('input[name="family_name"]');
    FamilyName.addEventListener("input", function (event) {
        if (this.value.trim() == '') {
            document.querySelector('.textFamilyName').innerHTML = '';
        } else {
            document.querySelector('.textFamilyName').textContent = this.value;
        }
    });

    let emailBusiness = document.querySelector('input[name="emailBusiness"]');
    emailBusiness.addEventListener("input", function (event) {
        if (this.value.trim() == '') {
            document.querySelector('.textEmailBusiness').textContent = '-';
        } else {
            document.querySelector('.textEmailBusiness').textContent = this.value;
        }
    });

    // Atualiza o nome da companhia selecionada
    document.querySelector('select[name="companie"]').addEventListener('change', function(event) {
        const selectedLabel = event.target.selectedOptions[0].label;
        document.querySelector('.textCompanie').textContent = selectedLabel;
    });

    // Atualiza o tipo de contrato selecionado
    document.querySelector('select[name="contractType"]').addEventListener('change', function(event) {
        const selectedLabel = event.target.selectedOptions[0].label;
        document.querySelector('.textContractType').textContent = selectedLabel;
    });
}


// Função para os valores de qualquer selected
async function getSelectValues() {
    const selectElement = document.querySelector(`form select[name]`);
    if (selectElement) {
       const selectedOptions = Array.from(selectElement.selectedOptions);
       if (!selectedOptions || selectedOptions.length === 0 || selectedOptions[0].value === '') {
          return undefined;
       } else {
          const selectedValues = selectedOptions.map(option => option.value);
          return selectedValues;
       }
    } else {
       return undefined;
    }
};


/**
 * @function getAllValuesInForm
 * @description Percorre o formulário e coleta todos os valores dos inputs, selects e textareas.
 * 
 * Esta função verifica se todos os campos obrigatórios estão preenchidos.
 * Se algum campo obrigatório estiver vazio, exibe uma mensagem de erro.
 * Retorna um objeto contendo todos os valores do formulário.
 */
async function getAllValuesInForm() {
    const formData = new FormData();

    // Seleciona todos os elementos input, select e textarea que possuem um atributo 'name'
    const elements = document.querySelectorAll('form input[name],form textarea[name],form select[name]');

    // Array de campos obrigatórios com mensagens de erro personalizadas
    let requiredInputFields = [
        { name: 'cpf', message: 'O campo CPF é obrigatório.' },
        { name: 'login', message: 'O campo LOGIN é obrigatório.' },
        { name: 'password', message: 'O campo SENHA é obrigatório.' },
    ];

    // Percorre todos os elementos do formulário
    for (let index = 0; index < elements.length; index++) {
        const element = elements[index];
        const itemName = element.getAttribute('name');

        // Verifica se o campo é obrigatório e se está vazio
        const requiredField = requiredInputFields.find(field => field.name === itemName);
        if (requiredField && (element.value.trim() === '' || element.value.trim() === '0')) {
            Swal.fire(requiredField.message);
            return false;
        }

        // Adiciona o valor do campo no objeto formData
        formData.append(itemName, element.value);
    }

    // Adiciona os valores do select de línguas ao formData
    formData.append('languages', sAllLanguages.getValue(true));

    // Verifica se há uma imagem no campo de upload
    const photoInput = document.querySelector('input[name="photo"]');
    console.log(photoInput)
    if (photoInput && photoInput.files.length > 0) {
        formData.append('photo', photoInput.files[0]);  // Adiciona a imagem ao FormData
    }
    

    // Exibe os dados no console para verificação (opcional)
    for (let [key, value] of formData.entries()) { 
        // console.log(key, value);
    }

    // Faz a requisição para adicionar a ação
    // const response = await fetch('/api/collaborators-management/collaborators', {
    //     method: 'POST',
    //     body: formData
    // });


    // Envia os dados para o servidor
    await makeRequest(`/api/collaborators-management/collaborators`, 'POST', formData);

    window.close();
}

/**
 * @description Aguarda a página ser completamente carregada e inicializa todas as funções necessárias.
 * 
 * Esta função utiliza o evento DOMContentLoaded para garantir que todo o DOM esteja pronto antes de iniciar as funções.
 * Também calcula e exibe o tempo de carregamento da página.
 */
document.addEventListener("DOMContentLoaded", async () => {
    // Início da medição do tempo de carregamento da página
    console.time(`A página "${document.title}" carregou em`);

    // Carrega as listas de dados necessários para os selects
    await getAllCompanie();
    await getAllContractType();
    await getAllDepartments();
    await getAllImmediateSupervisor();
    await geAllLanguages();

    // Inicializa os eventos de input e mudança de imagem de perfil
    await eventChangeImgProfile();
    await eventInputProfile();

    // Fim da medição do tempo de carregamento da página
    console.timeEnd(`A página "${document.title}" carregou em`);
});
