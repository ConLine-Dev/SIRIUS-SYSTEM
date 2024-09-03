let sAllcompanie, sAllLanguages, sAllResponsible, BankingInformation = [], Documents = [], Certifications = [];

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
        { name: 'name', message: 'O campo Nome é obrigatório.' },
        { name: 'family_name', message: 'O campo Sobrenome é obrigatório.' },
        { name: 'birthdate', message: 'O campo Data de Nascimento é obrigatório.' },
        { name: 'admissionDate', message: 'O campo Data de Admissão é obrigatório.' },
        { name: 'workload', message: 'O campo Carga Horária Semanal é obrigatório.' },
        { name: 'emailBusiness', message: 'O campo Email Corporativo é obrigatório.' },
        { name: 'cpf', message: 'O campo CPF é obrigatório.' },
        { name: 'rg', message: 'O campo RG é obrigatório.' }
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
    if (photoInput && photoInput.files.length > 0) {
        formData.append('photo', photoInput.files[0]);  // Adiciona a imagem ao FormData
    }


    

     // Adiciona os documentos ao formData
     Documents.forEach(doc => {
        console.log(doc)
        // Adiciona os dados do documento como JSON
        formData.append('documentsData[]', JSON.stringify({ name: doc.name, date: doc.date }));
        // Adiciona o arquivo do documento
        if (doc.file) {
            formData.append('files[]', doc.file);
        }
    });


      // Adiciona as certificações ao formData
      Certifications.forEach(cert => {
        // Adiciona os dados da certificação como JSON
        formData.append('certificationsData[]', JSON.stringify({qualification:cert.qualification, institution:cert.institution,completionDate:cert.completionDate }));
        // Adiciona o arquivo da certificação
        if (cert.file) {
            formData.append('certifications-files[]', cert.file);
        }
    });

    


    try {
        await makeRequest(`/api/collaborators-management/collaborators`, 'POST', formData);
        window.close();
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: error.message || 'Ocorreu um erro ao cadastrar o colaborador.',
        });
    }


    // Envia os dados para o servidor
    

    
}




/**
 * Renderiza as informações bancárias na tabela HTML.
 * Esta função percorre o array `BankingInformation` e gera linhas de tabela
 * para exibir os dados. Cada linha inclui links para editar e remover informações.
 */
function renderBankingInformation() {
    // Inicializa uma string para armazenar o conteúdo HTML das linhas da tabela
    let rowBankingInformation = '';

    // Itera sobre o array `BankingInformation` para gerar as linhas da tabela
    for (let index = 0; index < BankingInformation.length; index++) {
        const element = BankingInformation[index];

        // Adiciona uma linha com os dados do item atual e os botões de ação
        rowBankingInformation += `<tr>
                                     <td>${element.bank}</td>
                                     <td>${element.agency}</td>
                                     <td>${element.account}</td>
                                     <td>${element.type}</td>
                                     <td>
                                      <div class="hstack gap-2 flex-wrap"> 
                                        <a href="javascript:void(0);" onclick="fillBankingInformation(${element.id})" class="text-info fs-14 lh-1">
                                            <i class="ri-edit-line"></i>
                                        </a> 
                                        <a href="javascript:void(0);" onclick="removeBankingInformation(${element.id})" class="text-danger fs-14 lh-1">
                                            <i class="ri-delete-bin-5-line"></i>
                                        </a> 
                                      </div>
                                     </td>
                                 </tr>`;
    }

    // Atualiza o conteúdo da tabela no HTML com as novas linhas geradas
    document.querySelector('#BankingInformation tbody').innerHTML = rowBankingInformation;
}

/**
 * Adiciona uma nova informação bancária ao array `BankingInformation` e atualiza a tabela.
 * Obtém os valores dos campos do formulário, adiciona um novo objeto ao array e
 * chama as funções para limpar o formulário e renderizar a tabela.
 * @param {Event} e - O evento do clique no botão de adicionar.
 */
function addBankingInformation(e) {
    // Obtém os elementos do formulário e os seus valores
    const [bank_bank, bank_agencie, bank_account, bank_type] = Array.from(document.querySelectorAll('#bank_type, #bank_account, #bank_agencie, #bank_bank'));
  
    // Adiciona um novo objeto ao array `BankingInformation` com os valores do formulário
    BankingInformation.push({
        id: BankingInformation.length + 1,
        bank: bank_bank.value,
        account: bank_account.value,
        agency: bank_agencie.value,
        type: bank_type.value
    });

    // Limpa o formulário e renderiza a tabela atualizada
    clearFormBankingInformation();
    renderBankingInformation();
}

/**
 * Preenche os campos do formulário com as informações bancárias do item selecionado.
 * Ajusta a visibilidade dos botões do formulário para permitir a edição.
 * @param {number} id - O ID da informação bancária a ser editada.
 */
function fillBankingInformation(id) {
    // Localiza o item no array `BankingInformation` usando o ID
    const bankingInfo = BankingInformation.find(info => info.id === id);

    // Se o item for encontrado, preenche os campos do formulário e ajusta os botões
    if (bankingInfo) {
        document.querySelector('#bank_type').value = bankingInfo.type;
        document.querySelector('#bank_account').value = bankingInfo.account;
        document.querySelector('#bank_agencie').value = bankingInfo.agency;
        document.querySelector('#bank_bank').value = bankingInfo.bank;

        // Esconde o botão "Adicionar" e mostra os botões "Salvar" e "Cancelar"
        document.querySelector('#BankingInformation .btn_add').style.display = 'none';
        document.querySelector('#BankingInformation .btn_save').style.display = 'inline-block';
        document.querySelector('#BankingInformation .btn_cancel').style.display = 'inline-block';

        // Armazena o ID do item sendo editado em um atributo data para uso posterior
        document.querySelector('#BankingInformation .btn_save').dataset.editId = id;
    }
}

/**
 * Limpa os campos do formulário e ajusta a visibilidade dos botões.
 * Exibe o botão "Adicionar" e oculta os botões "Salvar" e "Cancelar".
 */
function clearFormBankingInformation() {
    // Limpa os valores dos campos do formulário
    document.querySelector('#bank_type').value = '';
    document.querySelector('#bank_account').value = '';
    document.querySelector('#bank_agencie').value = '';
    document.querySelector('#bank_bank').value = '';

    // Mostra o botão "Adicionar" e esconde os botões "Salvar" e "Cancelar"
    document.querySelector('#BankingInformation .btn_add').style.display = 'inline-block';
    document.querySelector('#BankingInformation .btn_save').style.display = 'none';
    document.querySelector('#BankingInformation .btn_cancel').style.display = 'none';
}

/**
 * Cancela a edição atual, limpando o formulário e ajustando a visibilidade dos botões.
 */
function cancelBankingInformation() {
    // Limpa o formulário e ajusta os botões
    clearFormBankingInformation();
}

/**
 * Salva as alterações feitas na informação bancária editada.
 * Atualiza o item correspondente no array `BankingInformation` e re-renderiza a tabela.
 */
function saveBankingInformation() {
    // Recupera o ID do item sendo editado a partir do botão "Salvar"
    const id = parseInt(document.querySelector('#BankingInformation .btn_save').dataset.editId, 10);

    // Localiza o item no array e atualiza suas informações
    const index = BankingInformation.findIndex(info => info.id === id);
    if (index !== -1) {
        BankingInformation[index] = {
            id: id,
            bank: document.querySelector('#bank_bank').value,
            account: document.querySelector('#bank_account').value,
            agency: document.querySelector('#bank_agencie').value,
            type: document.querySelector('#bank_type').value
        };

        // Renderiza novamente as informações bancárias
        renderBankingInformation();

        // Limpa o formulário e ajusta os botões
        clearFormBankingInformation();
    }
}

/**
 * Remove uma informação bancária do array `BankingInformation` com base no ID fornecido.
 * Atualiza a tabela após a remoção do item.
 * @param {number} id - O ID da informação bancária a ser removida.
 */
function removeBankingInformation(id) {
    // Filtra o array para remover o item com o ID correspondente
    BankingInformation = BankingInformation.filter(info => info.id !== id);

    // Atualiza a exibição das informações bancárias
    renderBankingInformation();
}

/**
 * Função para renderizar a lista de documentos na tabela.
 * 
 * Esta função percorre o array de documentos e cria uma linha HTML para cada documento,
 * exibindo informações como nome, data e um link para visualizar o arquivo.
 * Também adiciona botões para editar e remover documentos.
 */
function renderDocuments() {
    let rowDocuments = ''; // Armazena o HTML das linhas da tabela
    
    // Itera sobre todos os documentos
    for (let index = 0; index < Documents.length; index++) {
        const element = Documents[index];
        rowDocuments += `<tr>
                             <td>${element.name}</td>
                             <td>${element.date}</td>
                             <td><a href="${element.fileURL}" target="_blank">
                                 <div class="d-flex align-items-center">
                                     <div class="me-2">
                                         <span class="avatar avatar-xs">
                                             <img src="../../assets/images/media/files/file.png" alt="">
                                         </span>
                                     </div>
                                     <div> Visualizar </div>
                                 </div>
                             </a></td>
                             <td>
                              <div class="hstack gap-2 flex-wrap"> 
                                <a href="javascript:void(0);" onclick="fillDocument(${element.id})" class="text-info fs-14 lh-1">
                                    <i class="ri-edit-line"></i>
                                </a> 
                                <a href="javascript:void(0);" onclick="removeDocument(${element.id})" class="text-danger fs-14 lh-1">
                                    <i class="ri-delete-bin-5-line"></i>
                                </a> 
                              </div>
                             </td>
                         </tr>`;
    }
    
    // Atualiza o conteúdo da tabela com as linhas geradas
    document.querySelector('#documents tbody').innerHTML = rowDocuments;
}

/**
 * Função para adicionar um novo documento.
 * 
 * Coleta os dados do formulário, cria um novo objeto de documento e o adiciona ao array de documentos.
 * Se um arquivo for selecionado, gera um URL temporário para visualização.
 */
function addDocument() {
    const docName = document.querySelector('#documents #doc_name').value;
    const docDate = document.querySelector('#documents #doc_date').value;
    const docFile = document.querySelector('#documents #doc_file').files[0]; // Captura o arquivo selecionado

    let fileURL = '';
    if (docFile) {
        fileURL = URL.createObjectURL(docFile); // Gera URL temporário para visualização
    }

    Documents.push({
        id: Documents.length + 1, // Gera um novo ID sequencial
        name: docName,
        date: docDate,
        file: docFile,
        fileURL
    });

    clearFormDocument(); // Limpa o formulário após a adição
    renderDocuments(); // Atualiza a tabela com o novo documento
}

/**
 * Função para preencher os campos do formulário com as informações de um documento existente.
 * 
 * Recebe o ID do documento, busca no array e preenche os campos do formulário com os dados do documento.
 * Ajusta a visibilidade dos botões para edição.
 * 
 * @param {number} id - O ID do documento a ser editado.
 */
function fillDocument(id) {
    const documentInfo = Documents.find(doc => doc.id === id);

    if (documentInfo) {
        document.querySelector('#documents #doc_name').value = documentInfo.name;
        document.querySelector('#documents #doc_date').value = documentInfo.date;
        document.querySelector('#documents #doc_file').value = ''; // Não podemos definir o valor de um input type=file por segurança

        // Ajusta a visibilidade dos botões
        document.querySelector('#documents .btn_add').style.display = 'none';
        document.querySelector('#documents .btn_save').style.display = 'inline-block';
        document.querySelector('#documents .btn_cancel').style.display = 'inline-block';

        // Armazena o ID do documento sendo editado para uso posterior
        document.querySelector('#documents .btn_save').dataset.editId = id;
    }
}

/**
 * Função para limpar os campos do formulário e ajustar a visibilidade dos botões.
 * 
 * Reseta os campos de entrada e ajusta a visibilidade dos botões para retornar ao estado inicial.
 */
function clearFormDocument() {
    document.querySelector('#documents #doc_name').value = '';
    document.querySelector('#documents #doc_date').value = '';
    document.querySelector('#documents #doc_file').value = '';

    // Ajusta a visibilidade dos botões
    document.querySelector('#documents .btn_add').style.display = 'inline-block';
    document.querySelector('#documents .btn_save').style.display = 'none';
    document.querySelector('#documents .btn_cancel').style.display = 'none';
}

/**
 * Função para cancelar a edição de um documento.
 * 
 * Limpa os campos do formulário e ajusta a visibilidade dos botões para o estado inicial.
 */
function cancelDocuments() {
    clearFormDocument(); // Limpa o formulário e ajusta os botões
}

/**
 * Função para salvar as alterações de um documento existente.
 * 
 * Atualiza um documento existente com novos dados, incluindo um novo arquivo, se selecionado.
 * 
 * Atualiza a tabela de documentos e limpa o formulário após salvar.
 */
function saveDocument() {
    const id = parseInt(document.querySelector('#documents .btn_save').dataset.editId, 10);
    const index = Documents.findIndex(doc => doc.id === id);

    if (index !== -1) {
        const docName = document.querySelector('#documents #doc_name').value;
        const docDate = document.querySelector('#documents #doc_date').value;
        const docFile = document.querySelector('#documents #doc_file').files[0]; // Novo arquivo (se houver)

        let fileURL = Documents[index].fileURL; // Mantém o URL do arquivo antigo por padrão

        // Atualiza o URL se um novo arquivo for selecionado
        if (docFile) {
            fileURL = URL.createObjectURL(docFile); // Gera URL temporário para visualização
        }

        Documents[index] = {
            id: id,
            name: docName,
            date: docDate,
            fileURL,
            file: docFile ? docFile : Documents[index].file
        };

        renderDocuments(); // Atualiza a tabela com as alterações
        clearFormDocument(); // Limpa o formulário após salvar
    }
}

/**
 * Função para remover um documento do array com base no ID.
 * 
 * Filtra o array de documentos para remover o documento com o ID especificado.
 * Atualiza a tabela após a remoção.
 * 
 * @param {number} id - O ID do documento a ser removido.
 */
function removeDocument(id) {
    Documents = Documents.filter(doc => doc.id !== id); // Filtra o array para remover o documento
    renderDocuments(); // Atualiza a tabela com a lista de documentos atualizada
}


/**
 * Função para renderizar a tabela de certificações.
 * 
 * Esta função gera o HTML para a tabela de certificações, preenchendo 
 * as linhas da tabela com informações sobre cada certificação armazenada 
 * no array `Certifications`. Ela também inclui links para visualizar e 
 * ações para editar e remover certificações.
 */
function renderCertifications() {
    let rowCertifications = '';
    
    // Itera sobre cada certificação no array `Certifications`
    for (let index = 0; index < Certifications.length; index++) {
        const element = Certifications[index];
        rowCertifications += `<tr>
            <td>${element.qualification}</td>
            <td>${element.institution}</td>
            <td>${element.completionDate}</td>
            <td><a href="${element.certificateURL}" target="_blank">
            <div class="d-flex align-items-center">
            <div class="me-2">
              <span class="avatar avatar-xs">
                <img src="../../assets/images/media/files/file.png" alt="">
              </span>
            </div>
            <div> Visualizar </div>
          </div>
          </a></td>
            <td>
                <div class="hstack gap-2 flex-wrap">
                    <a href="javascript:void(0);" onclick="fillCertification(${element.id})" class="text-info fs-14 lh-1">
                        <i class="ri-edit-line"></i>
                    </a>
                    <a href="javascript:void(0);" onclick="removeCertification(${element.id})" class="text-danger fs-14 lh-1">
                        <i class="ri-delete-bin-5-line"></i>
                    </a>
                </div>
            </td>
        </tr>`;
    }

    // Atualiza o conteúdo da tabela com o HTML gerado
    document.querySelector('#Certifications tbody').innerHTML = rowCertifications;
}

/**
 * Função para adicionar uma nova certificação.
 * 
 * Esta função coleta os dados do formulário, cria um novo objeto de certificação
 * e o adiciona ao array `Certifications`. Após adicionar a certificação, 
 * a função limpa o formulário e re-renderiza a tabela de certificações.
 */
function addCertification() {
    const qualification = document.querySelector('#Certifications #qualification').value;
    const institution = document.querySelector('#Certifications #institution').value;
    const completionDate = document.querySelector('#Certifications #completionDate').value;
    const certificateFile = document.querySelector('#Certifications #certificate').files[0];
    
    let certificateURL = '';
    if (certificateFile) {
        certificateURL = URL.createObjectURL(certificateFile); // Gera URL para visualização do arquivo
    }

    Certifications.push({
        id: Certifications.length + 1, // Gera um novo ID para a certificação
        qualification,
        institution,
        completionDate,
        certificateURL,
        file: certificateFile
    });

    clearFormCertification(); // Limpa o formulário após adicionar
    renderCertifications(); // Atualiza a tabela com a nova certificação
}

/**
 * Função para preencher os campos do formulário para edição.
 * 
 * Esta função localiza a certificação com o ID fornecido, preenche os campos
 * do formulário com os dados da certificação e ajusta a visibilidade dos botões
 * para permitir a edição. O botão "Adicionar" é escondido e os botões "Salvar"
 * e "Cancelar" são mostrados.
 * 
 * @param {number} id - O ID da certificação a ser editada.
 */
function fillCertification(id) {
    const certification = Certifications.find(cert => cert.id === id);

    if (certification) {
        document.querySelector('#Certifications #qualification').value = certification.qualification;
        document.querySelector('#Certifications #institution').value = certification.institution;
        document.querySelector('#Certifications #completionDate').value = certification.completionDate;
        document.querySelector('#Certifications #certificate').value = ''; // Não é possível definir o valor do input file

        // Ajusta a visibilidade dos botões do formulário
        document.querySelector('#Certifications .btn_add').style.display = 'none';
        document.querySelector('#Certifications .btn_save').style.display = 'inline-block';
        document.querySelector('#Certifications .btn_cancel').style.display = 'inline-block';

        // Armazena o ID da certificação no botão "Salvar"
        document.querySelector('#Certifications .btn_save').dataset.editId = id;
    }
}

/**
 * Função para limpar o formulário e ajustar a visibilidade dos botões.
 * 
 * Esta função reseta os campos do formulário e ajusta os botões para o estado
 * padrão, escondendo os botões de "Salvar" e "Cancelar" e mostrando o botão 
 * "Adicionar".
 */
function clearFormCertification() {
    document.querySelector('#Certifications #qualification').value = '';
    document.querySelector('#Certifications #institution').value = '';
    document.querySelector('#Certifications #completionDate').value = '';
    document.querySelector('#Certifications #certificate').value = '';

    // Ajusta a visibilidade dos botões do formulário
    document.querySelector('#Certifications .btn_add').style.display = 'inline-block';
    document.querySelector('#Certifications .btn_save').style.display = 'none';
    document.querySelector('#Certifications .btn_cancel').style.display = 'none';
}

/**
 * Função para cancelar a edição de uma certificação.
 * 
 * Esta função limpa o formulário e retorna os botões do formulário para o estado
 * padrão, sem aplicar alterações.
 */
function cancelCertification() {
    clearFormCertification(); // Limpa o formulário
}

/**
 * Função para salvar as alterações no array de certificações.
 * 
 * Esta função localiza a certificação com o ID armazenado no botão "Salvar",
 * atualiza os dados da certificação com os valores do formulário e re-renderiza
 * a tabela de certificações. Se um novo arquivo de certificado for selecionado,
 * o URL é atualizado.
 */
function saveCertification() {
    const id = parseInt(document.querySelector('.btn_save').dataset.editId, 10);

    const index = Certifications.findIndex(cert => cert.id === id);
    if (index !== -1) {
        const qualification = document.querySelector('#qualification').value;
        const institution = document.querySelector('#institution').value;
        const completionDate = document.querySelector('#completionDate').value;
        const certificateFile = document.querySelector('#certificate').files[0];

        let certificateURL = Certifications[index].certificateURL; // Mantém o URL antigo por padrão
  
        // Atualiza o URL se um novo arquivo for selecionado
        if (certificateFile) {
            certificateURL = URL.createObjectURL(certificateFile); // Gera URL para visualização do novo arquivo
        }

        Certifications[index] = {
            id: id,
            qualification,
            institution,
            completionDate,
            certificateURL,
            file: certificateFile ? certificateFile : Certifications[index].file
        };

        renderCertifications(); // Atualiza a tabela com as alterações
        clearFormCertification(); // Limpa o formulário após salvar
    }
}

/**
 * Função para remover uma certificação do array com base no ID.
 * 
 * Esta função filtra o array `Certifications` para remover a certificação com
 * o ID fornecido e, em seguida, re-renderiza a tabela de certificações.
 * 
 * @param {number} id - O ID da certificação a ser removida.
 */
function removeCertification(id) {
    Certifications = Certifications.filter(cert => cert.id !== id);
    renderCertifications(); // Atualiza a tabela após remoção
}


async function formatInputs(){
     // CPF
     new Cleave('[name="cpf"]', {
        delimiters: ['.', '.', '-'],
        blocks: [3, 3, 3, 2],
        numericOnly: true
    });

    // // CNPJ
    new Cleave('[name="cnpj"]', {
        delimiters: ['.', '.', '/', '-'],
        blocks: [2, 3, 3, 4, 2],
        numericOnly: true
    });

    // // CEP
    new Cleave('[name="cep"]', {
        delimiters: ['-'],
        blocks: [5, 3],
        numericOnly: true
    });

    // // Salário
    new Cleave('[name="salary"]', {
        numeral: true,
        numeralThousandsGroupStyle: 'thousand',
        delimiter: '.',
        numeralDecimalMark: ','
    });

      // CPF
      new Cleave('[name="workload"]', {
        numeral: true,
        delimiter: '',
        numeralDecimalMark: '',
        numericOnly: true
    });
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
    await formatInputs();


    // Fim da medição do tempo de carregamento da página
    console.timeEnd(`A página "${document.title}" carregou em`);
});
