// Variáveis globais para gerenciamento de selects com o Choices
// 's' antes da variável refere-se ao select
let idOccurrence, correctiveEvidence, correctiveEvidenceView,effectivenessEvidence, infoOccurence,sAllUnits,sAllStatus,sAllOrigins,sAllApproval,sAllResponsible,sAllResponsibleActions,sAllTypes;


/**
 * Verifica informações no localStorage do usuario logado
 */
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    console.log(StorageGoogle)
    return StorageGoogle;
}

/**
 * Função assíncrona para carregar todas as unidades cadastradas (filiais).
 */
async function getAllUnit() {
    // Carrega as unidades cadastradas (filiais)
    const Units = await makeRequest(`/api/non-compliance/AllUnit`);

    // Formata o array para ser usado com o Choices.js
    const listaDeOpcoes = Units.map(function(element) {
        return {
            value: `${element.id}`,
            label: `${element.city + ' | ' + element.country}`,
        };
    });

    // Adiciona a opção 'Selecione' ao select como padrão e desabilita
    listaDeOpcoes.push({ value: 0, label: 'Selecione', selected: true, disabled: true });

    // Verifica se o select já existe; se existir, destrói-o
    if (sAllUnits) {
        sAllUnits.destroy();
    }

    // Renderiza o select com as opções formatadas
    sAllUnits = new Choices('select[name="company_id"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        noChoicesText: 'Não há opções disponíveis',
    });
}

/**
 * Função assíncrona para carregar todos status da ocorrencia.
 */
async function getAllStatus() {
    // Carrega os status ocorrencia
    const AllStatus = [
        {
            id: 0,
            name: 'Pendente - Aprovação 1ª etapa'
        },
        {
            id: 1,
            name: 'Reprovado - Aguardando Ajuste 1ª etapa'
        },
        {
            id: 2,
            name: 'Aprovado - Liberado Preenchimento 2ª etapa'
        },
        {
            id: 3,
            name: 'Pendente - aprovação 2ª etapa'
        },
        {
            id: 4,
            name: 'Reprovado - Aguardando Ajuste 2ª etapa'
        },
        {
            id: 5,
            name: 'Finalizado'
        },
       
    ]

    // Formata o array para ser usado com o Choices.js
    const listaDeOpcoes = AllStatus.map(function(element) {
        return {
            value: `${element.id}`,
            label: `${element.name}`,
        };
    });


    // Adiciona a opção 'Selecione' ao select como padrão e desabilita
    listaDeOpcoes.push({ value: 0, label: 'Selecione', selected: true, disabled: true });

    // Verifica se o select já existe; se existir, destrói-o
    if (sAllStatus) {
        sAllStatus.destroy();
    }

    // Renderiza o select com as opções formatadas
    sAllStatus = new Choices('select[name="status_occurrence"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        noChoicesText: 'Não há opções disponíveis',
    });

    $('select[name="status_occurrence"]').on('change', async function(e) {

        // Habilita os campos dependendo do status e da edição da ocorrência
        if (this.value != 0) {
            const statusApproval = document.querySelectorAll('.statusApproval');
            statusApproval.forEach(element => {
                element.classList.remove('inactive');
            });
        }else{
            const statusApproval = document.querySelectorAll('.statusApproval');
            statusApproval.forEach(element => {
                element.classList.add('inactive');
            });
        }
    });


   
}

/**
 * Função assíncrona para carregar todas as origens cadastradas (motivos).
 */
async function getAllOrigins() {
    // Carrega as origens cadastradas (motivos)
    const Origins = await makeRequest(`/api/non-compliance/AllOrigin`);

    // Formata o array para ser usado com o Choices.js
    const listaDeOpcoes = Origins.map(function(element) {
        return {
            value: `${element.id}`,
            label: `${element.name}`,
        };
    });

    // Adiciona a opção 'Selecione' ao select como padrão e desabilita
    listaDeOpcoes.push({ value: 0, label: 'Selecione', selected: true, disabled: true });

    // Verifica se o select já existe; se existir, destrói-o
    if (sAllOrigins) {
        sAllOrigins.destroy();
    }

    // Renderiza o select com as opções formatadas
    sAllOrigins = new Choices('select[name="origin_id"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        noChoicesText: 'Não há opções disponíveis',
    });
}

/**
 * Função assíncrona para carregar todos os usuários que podem aprovar.
 */
async function getAllApproval() {
    // Carrega os usuários que podem aprovar
    const Approvals = await makeRequest(`/api/non-compliance/AllApproval`);
    
    // Formata o array para ser usado com o Choices.js
    const listaDeOpcoes = Approvals.map(function(element) {
        return {
            value: `${element.id_colab}`,
            label: `${element.username + ' ' + element.familyName}`,
        };
    });

    // Adiciona a opção 'Selecione' ao select como padrão e desabilita
    listaDeOpcoes.push({ value: 0, label: 'Selecione', selected: true, disabled: true });

    // Verifica se o select já existe; se existir, destrói-o
    if (sAllApproval) {
        sAllApproval.destroy();
    }

    // Renderiza o select com as opções formatadas
    sAllApproval = new Choices('select[name="approval"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        noChoicesText: 'Não há opções disponíveis',
    });
}

/**
 * Função assíncrona para carregar todos os tipos de ocorrência.
 */
async function getAllTypes() {
    // Carrega os tipos de ocorrência
    const AllTypes = await makeRequest(`/api/non-compliance/AllTypes`);
    
    // Formata o array para ser usado com o Choices.js
    const listaDeOpcoes = AllTypes.map(function(element) {
        return {
            value: `${element.id}`,
            label: `${element.name}`,
        };
    });

    // Adiciona a opção 'Selecione' ao select como padrão e desabilita
    listaDeOpcoes.push({ value: 0, label: 'Selecione', selected: true, disabled: true });

    // Verifica se o select já existe; se existir, destrói-o
    if (sAllTypes) {
        sAllTypes.destroy();
    }

    // Renderiza o select com as opções formatadas
    sAllTypes = new Choices('select[name="type_id"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        noChoicesText: 'Não há opções disponíveis',
    });
}

/**
 * Função assíncrona para carregar todos os usuários responsáveis.
 */
async function getAllResponsible() {
    // Carrega os usuários responsáveis
    const Responsible = await makeRequest(`/api/non-compliance/AllResponsible`);
    
    // Formata o array para ser usado com o Choices.js
    const listaDeOpcoes = Responsible.map(function(element) {
        return {
            value: `${element.id_colab}`,
            label: `${element.username + ' ' + element.familyName}`,
        };
    });

    // Verifica se os selects já existem; se existirem, destroem-nos
    if (sAllResponsible || sAllResponsibleActions) {
        sAllResponsible.destroy();
        sAllResponsibleActions.destroy();
    }

    // Renderiza os selects com as opções formatadas
    sAllResponsible = new Choices('select[name="occurrence_responsible"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
    });

    sAllResponsibleActions = new Choices('select[name="action_responsible"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        noChoicesText: 'Não há opções disponíveis',
    });


    sAllResponsibleActions = new Choices('select[name="effectiveness_responsible"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        noChoicesText: 'Não há opções disponíveis',
    });


    sAllResponsibleActions = new Choices('select[name="action_responsible_view"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        noChoicesText: 'Não há opções disponíveis',
    });

    
}

/**
 * Função assíncrona para obter informações da ocorrência.
 */
async function getOccurenceInfo() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const id = urlParams.get('id');

    const occurrence = await makeRequest(`/api/non-compliance/getOcurrenceById`, 'POST', { id });
    infoOccurence = occurrence
    console.log(occurrence);
    await loadOccurence(occurrence);
}

/**
 * Função assíncrona para carregar informações da ocorrência nos campos correspondentes.
 * @param {Object} occurrence - Objeto contendo informações da ocorrência.
 */
async function loadOccurence(occurrence) {

    sAllStatus.disable();
    console.log(occurrence)

    idOccurrence = occurrence.id
    // Preenche os campos de referência da ocorrência
    document.querySelector('#referenceOccurrence').innerHTML = occurrence.reference;
    document.querySelector('input[name="occurrence"]').value = occurrence.title;
    document.querySelector('textarea[name="description"]').value = occurrence.description;
    document.querySelector('textarea[name="correction"]').value = occurrence.correction;
    document.querySelector('input[name="occurrence_id"]').value = occurrence.id;

    document.querySelector('textarea[name="manpower"]').value = occurrence.manpower;
    document.querySelector('textarea[name="method"]').value = occurrence.method;
    document.querySelector('textarea[name="material"]').value = occurrence.material;
    document.querySelector('textarea[name="environment"]').value = occurrence.environment;
    document.querySelector('textarea[name="machine"]').value = occurrence.machine;
    document.querySelector('textarea[name="root_cause"]').value = occurrence.root_cause;
    

    // Define as opções selecionadas nos selects
    sAllOrigins.setChoiceByValue(occurrence.origin_id.toString());
    sAllUnits.setChoiceByValue(occurrence.company_id.toString());
    sAllTypes.setChoiceByValue(occurrence.typeId.toString());
    sAllStatus.setChoiceByValue(occurrence.status.toString());


    if(occurrence.editing == 1){
        document.querySelector('.block1Etapa').textContent = 'Desbloquear 1° etapa'
        document.querySelector('.block1Etapa').setAttribute('type', '0')
    }else{
        document.querySelector('.block1Etapa').textContent = 'Bloquear 1° etapa'
        document.querySelector('.block1Etapa').setAttribute('type', '1')
    }

    if(occurrence.second_part == 1){
        document.querySelector('.block2Etapa').textContent = 'Desbloquear 2° etapa'
        document.querySelector('.block2Etapa').setAttribute('type', '0')
    }else{
        document.querySelector('.block2Etapa').textContent = 'Bloquear 2° etapa'
        document.querySelector('.block2Etapa').setAttribute('type', '1')
    }
    


    

    // Marcando os responsáveis
    const responsibleIds = occurrence.responsibles.map(responsible => responsible.collaborator_id.toString());
    sAllResponsible.setChoiceByValue(responsibleIds);

    // Formatação da data de ocorrência
    const date_occurrence = new Date(occurrence.date_occurrence);
    const year = date_occurrence.getFullYear();
    const month = ('0' + (date_occurrence.getMonth() + 1)).slice(-2);
    const day = ('0' + date_occurrence.getDate()).slice(-2);
    document.querySelector('input[name="occurrence_date"]').value = `${year}-${month}-${day}`;

 
    await headerManagement(occurrence)

    await statusManagement(occurrence)

   

    if (occurrence.editing === 1) {
        // Desabilita campos durante a edição
        const InputDefault = document.querySelectorAll('.default input');
        InputDefault.forEach(element => {
            element.setAttribute('disabled', true);
        });

        const Textareafault = document.querySelectorAll('.default textarea');
        Textareafault.forEach(element => {
            element.setAttribute('disabled', true);
        });

        sAllOrigins.disable();
        sAllUnits.disable();
        sAllTypes.disable();
        sAllResponsible.disable();


        const user = await getInfosLogin();
        if(!user.department_ids.includes('8')){
            // sAllStatus.disable();
            document.querySelector('.groupBlocks').style.display = 'none'
        }
   
    }

    if (occurrence.second_part === 1) {
        // Desabilita campos na segunda parte da ocorrência
        const InputDefault = document.querySelectorAll('.statusApproval input');
        InputDefault.forEach(element => {
            element.setAttribute('disabled', true);
        });

        const Textareafault = document.querySelectorAll('.statusApproval textarea');
        Textareafault.forEach(element => {
            element.setAttribute('disabled', true);
        });
    }



    await loadHistory(idOccurrence)
}

/**
 * Função assíncrona para carregar o historico da ocorrencia.
 */
async function loadHistory(id){
    const history = await makeRequest(`/api/non-compliance/getHistory`, 'POST', { id:id });

    let historyText = '';
    for (let index = 0; index < history.length; index++) {
        const element = history[index];
        const name = await formatarNome(element.name+' '+element.family_name);

        const date = new Date(element.create_at);
        const year = date.getFullYear(); // Obtém o ano
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Obtém o mês (0-indexado) e adiciona um zero à esquerda se necessário
        const day = String(date.getDate()).padStart(2, '0'); // Obtém o dia e adiciona um zero à esquerda se necessário
        const hours = String(date.getHours()).padStart(2, '0'); // Obtém a hora e adiciona um zero à esquerda se necessário
        const minutes = String(date.getMinutes()).padStart(2, '0'); // Obtém os minutos e adiciona um zero à esquerda se necessário
        const seconds = String(date.getSeconds()).padStart(2, '0'); // Obtém os segundos e adiciona um zero à esquerda se necessário

        const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;



        historyText += `<li class="list-group-item">
                            <div class="d-flex align-items-center">
                                <div class="me-2"> <img src="https://cdn.conlinebr.com.br/colaboradores/${element.id_headcargo}" class="avatar avatar-md bg-primary avatar-rounded" alt=""> </div>
                                <div class="flex-fill">
                                    <p class="fw-semibold mb-0">${name}
                                        <span class="badge bg-light text-muted float-end">${formattedDate}</span>
                                    </p>
                                    <span class="fs-12 text-muted">
                                        <!-- <i class="ri-time-line align-middle me-1 d-inline-block"></i> -->
                                        ${element.body}
                                    </span> 
                                    </div>
                            </div>
                        </li>`

    
    }

    document.querySelector('.bodyHistory').innerHTML = historyText
}


/**
 * Função para formatar o nome.
 * @param {string} nome - Nome a ser formatado
 * @returns {string} - Nome formatado
 */
async function formatarNome(nome) {
    const preposicoes = new Set(["de", "do", "da", "dos", "das"]); // Conjunto de preposições
    const palavras = nome.split(" "); // Divide o nome em palavras
    const palavrasFormatadas = palavras.map((palavra, index) => {
        // Verifica se a palavra é uma preposição e não é a primeira palavra
        if (preposicoes.has(palavra.toLowerCase()) && index !== 0) {
            return palavra.toLowerCase(); // Retorna a palavra em minúsculas
        } else {
            return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase(); // Retorna a palavra com a primeira letra em maiúscula e o restante em minúsculas
        }
    });
    return palavrasFormatadas.join(" "); // Junta as palavras formatadas em uma string
}


/**
 * Função para formatar a data.
 * @param {string} dateString - Data a ser formatado
 * @returns {string} - Data formatada
 */
async function formatDate(dateString) {
    const date = new Date(dateString)
    const year = date.getFullYear(); // Obtém o ano
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Obtém o mês (0-indexado) e adiciona um zero à esquerda se necessário
    const day = String(date.getDate()).padStart(2, '0'); // Obtém o dia e adiciona um zero à esquerda se necessário
    return `${year}-${month}-${day}`; // Retorna a data formatada como YYYY-MM-DD
}


/**
 * Função assíncrona para validar campos!
 */
async function statusManagement(occurrence){

     // Habilita os campos dependendo do status e da edição da ocorrência
     if (occurrence.status != 0 && occurrence.status != 1) {
        const statusApproval = document.querySelectorAll('.statusApproval');
        statusApproval.forEach(element => {
            element.classList.remove('inactive');
        });
    }

    if(occurrence.status == 2 || occurrence.status == 3 || occurrence.status == 4 || occurrence.status == 5) {
        // Desabilita campos durante a edição
        const InputDefault1 = document.querySelectorAll('.default input');
        InputDefault1.forEach(element => {
            element.setAttribute('disabled', true);
        });

        const Textareafault1 = document.querySelectorAll('.default textarea');
        Textareafault1.forEach(element => {
            element.setAttribute('disabled', true);
        });

        sAllOrigins.disable();
        sAllUnits.disable();
        sAllTypes.disable();
        sAllResponsible.disable();



       
        // document.querySelector('.btnReset').classList.remove('disabled')
    }

    
    if(occurrence.status != 4 && occurrence.status != 2) {
        // Desabilita campos na segunda parte da ocorrência
        const InputDefault = document.querySelectorAll('.statusApproval input');
        InputDefault.forEach(element => {
            element.setAttribute('disabled', true);
        });

        const Textareafault = document.querySelectorAll('.statusApproval textarea');
        Textareafault.forEach(element => {
            element.setAttribute('disabled', true);
        });

    }

    if(occurrence.status == 3){
        document.querySelector('.btnReset').classList.remove('disabled')
    }
}

/**
 * Função assíncrona para validar os botões do cabeçalho!
 */
async function headerManagement(occurrence){


    const user = await getInfosLogin();
    if(!user.department_ids.includes('8')){
        // SE NÃO FIZER PARTE DO DEPARTAMENTO QUALIDADE 

        document.querySelector('.btnAprove').classList.add('d-none')
        document.querySelector('.btnReprove').classList.add('d-none')
        document.querySelector('.btnFinalize').classList.add('d-none')
        document.querySelector('.btnReset').classList.add('d-none')
        document.querySelector('.groupBlocks').classList.add('d-none')

        
    }else{
        
        // SE FIZER PARTE DO DEPARTAMENTO QUALIDADE 

        document.querySelector('.btnAprove').classList.add('disabled')
        document.querySelector('.btnReprove').classList.add('disabled')
        document.querySelector('.btnFinalize').classList.add('disabled')
        // document.querySelector('.btnReset').classList.add('disabled')
        
        
    
        if (occurrence.status == 0) {
            // 0 = aberto agora = Pendente de Aprovação
            document.querySelector('.btnAprove').classList.remove('disabled')
        }else if(occurrence.status == 1){
            // 1 = aprovado = Aguardando Preenchimento
            // document.querySelector('.btnReprove').classList.remove('disabled')
            document.querySelector('.btnFinalize').classList.remove('disabled')
        }else if(occurrence.status == 2){
            // 2 = reprovado = Aguardando Ajuste.
            document.querySelector('.btnFinalize').classList.remove('disabled')
        }else if(occurrence.status == 3){
            // 3 = Finalizar = Finalizado
            document.querySelector('.btnAprove').classList.remove('disabled')
            document.querySelector('.btnReprove').classList.remove('disabled')
        }else if(occurrence.status == 4){
            // 4 = Restaurado = Restaurado
            document.querySelector('.btnFinalize').classList.remove('disabled')
        }else if(occurrence.status == 5){
            // 4 = Restaurado = Restaurado
            // document.querySelector('.btnAprove').classList.remove('disabled')
            // document.querySelector('.btnReset').classList.add('disabled')
        }

    }
    
    await loadHistory(idOccurrence)
}

/**
 * Função assíncrona para eventos de bloqueio
 */
async function controlBlock(){
    const block1Etapa = document.querySelector('.block1Etapa');
    block1Etapa.addEventListener('click', async function(e){
        e.preventDefault();
        const users = await getInfosLogin();
        const type = this.getAttribute('type')
        let obs = ''
        if(type == 1){
            obs = 'Bloqueado 1° etapa';
            document.querySelector('.block1Etapa').textContent = 'Desbloquear 1° etapa'
            document.querySelector('.block1Etapa').setAttribute('type', '0')

            // Desabilita campos durante a edição
            const InputDefault = document.querySelectorAll('.default input');
            InputDefault.forEach(element => {
                element.setAttribute('disabled', true);
            });

            const Textareafault = document.querySelectorAll('.default textarea');
            Textareafault.forEach(element => {
                element.setAttribute('disabled', true);
            });

            sAllOrigins.disable();
            sAllUnits.disable();
            sAllTypes.disable();
            sAllResponsible.disable();
        }else{
            obs = 'Desbloqueado 1° etapa'
            document.querySelector('.block1Etapa').textContent = 'Bloquear 1° etapa'
            document.querySelector('.block1Etapa').setAttribute('type', '1')

            // Desabilita campos durante a edição
            const InputDefault = document.querySelectorAll('.default input');
            InputDefault.forEach(element => {
                element.removeAttribute('disabled');
            });

            const Textareafault = document.querySelectorAll('.default textarea');
            Textareafault.forEach(element => {
                element.removeAttribute('disabled');
            });

            sAllOrigins.enable();
            sAllUnits.enable();
            sAllTypes.enable();
            sAllResponsible.enable();
        }

        await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:type, prop:'editing', id:idOccurrence, obs:obs, userId:users.system_collaborator_id });
        
    
       

    })


    const block2Etapa = document.querySelector('.block2Etapa');
    block2Etapa.addEventListener('click', async function(e){
        e.preventDefault();
        const users = await getInfosLogin();
        const type = this.getAttribute('type')
        let obs = ''
        if(type == 1){
            obs = 'Bloqueado 2° etapa'
            document.querySelector('.block2Etapa').textContent = 'Desbloquear 2° etapa'
            document.querySelector('.block2Etapa').setAttribute('type', '0')

             // Desabilita campos na segunda parte da ocorrência
            const InputDefault = document.querySelectorAll('.statusApproval input');
            InputDefault.forEach(element => {
                element.setAttribute('disabled', true);
            });

            const Textareafault = document.querySelectorAll('.statusApproval textarea');
            Textareafault.forEach(element => {
                element.setAttribute('disabled', true);
            });
        }else{
            obs = 'Desbloqueado 2° etapa'
            document.querySelector('.block2Etapa').textContent = 'Bloquear 2° etapa'
            document.querySelector('.block2Etapa').setAttribute('type', '1')

             // Desabilita campos na segunda parte da ocorrência
            const InputDefault = document.querySelectorAll('.statusApproval input');
            InputDefault.forEach(element => {
                element.removeAttribute('disabled', true);
            });

            const Textareafault = document.querySelectorAll('.statusApproval textarea');
            Textareafault.forEach(element => {
                element.removeAttribute('disabled', true);
            });
        }

        await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:type, prop:'second_part', id:idOccurrence, obs:obs, userId:users.system_collaborator_id });


    })
}

/**
 * Função assíncrona para eventos de botoes clicks
 */
async function controlButtons(){
    const users = await getInfosLogin();
    const btnAprove = document.querySelector('.btnAprove');
    btnAprove.addEventListener('click', async function(e){
        e.preventDefault();

        this.classList.add('disabled')
        document.querySelector('.btnReprove').classList.remove('disabled')
        document.querySelector('.btnFinalize').classList.remove('disabled')

        let numberType = 0
        let obs = ''
        if(infoOccurence.status == 0){
            numberType = 2
            obs = 'Aprovado - Liberado Preenchimento 2ª etapa'
            await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:1, prop:'editing', id:idOccurrence, obs:'Bloqueado 1º etapa', userId:users.system_collaborator_id  });
            await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:0, prop:'second_part', id:idOccurrence, obs:'Desbloqueado 2º etapa', userId:users.system_collaborator_id  });
        }

        if(infoOccurence.status == 3){
            numberType = 5
            obs = 'Aprovado 2ª etapa - Finalizado'
            await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:1, prop:'editing', id:idOccurrence, obs:'Bloqueado 1º etapa', userId:users.system_collaborator_id  });
            await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:1, prop:'second_part', id:idOccurrence, obs:'Desbloqueado 2º etapa', userId:users.system_collaborator_id  });
        }

        sAllStatus.setChoiceByValue(numberType.toString());

        infoOccurence.status = numberType
        await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:numberType, prop:'status', id:idOccurrence, obs:obs, userId:users.system_collaborator_id });


        await headerManagement(infoOccurence)
    })


    const btnReprove = document.querySelector('.btnReprove');
    btnReprove.addEventListener('click', async function(e){
        e.preventDefault();
        this.classList.add('disabled')
        document.querySelector('.btnAprove').classList.remove('disabled')
        document.querySelector('.btnFinalize').classList.add('disabled')

        let numberType = 0
        let obs = ''
        if(infoOccurence.status == 0){
            numberType = 1
            obs = 'Reprovado - Aguardando Ajuste 1ª etapa'
            await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:0, prop:'editing', id:idOccurrence, obs:'Desbloqueado 1º etapa', userId:users.system_collaborator_id  });
        }

        if(infoOccurence.status == 3){
            numberType = 4
            obs = 'Reprovado - Aguardando Ajuste 2ª etapa'
            await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:0, prop:'second_part', id:idOccurrence, obs:'Desbloqueado 2º etapa', userId:users.system_collaborator_id  });
        }
        
        sAllStatus.setChoiceByValue(numberType.toString());
        infoOccurence.status = numberType
        await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:numberType, prop:'status', id:idOccurrence, obs:obs, userId:users.system_collaborator_id  });
        await headerManagement(infoOccurence)
    })

    const btnFinalize = document.querySelector('.btnFinalize');
    btnFinalize.addEventListener('click', async function(e){
        e.preventDefault();
        this.classList.add('disabled')
        document.querySelector('.btnAprove').classList.add('disabled')
        document.querySelector('.btnReprove').classList.add('disabled')
        document.querySelector('.btnReset').classList.remove('disabled')

       
        sAllStatus.setChoiceByValue('5');
        infoOccurence.status = 5
        
        await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:1, prop:'editing', id:idOccurrence, obs:'Bloqueado 1º etapa', userId:users.system_collaborator_id  });
        await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:1, prop:'second_part', id:idOccurrence, obs:'Bloqueado 2º etapa', userId:users.system_collaborator_id  });
        await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:5, prop:'status', id:idOccurrence, obs:'Finalizado', userId:users.system_collaborator_id  });
        await headerManagement(infoOccurence)
    })

    const btnReset = document.querySelector('.btnReset');
    btnReset.addEventListener('click', async function(e){
        e.preventDefault();
        this.classList.add('disabled')
        document.querySelector('.btnAprove').classList.add('disabled');
        document.querySelector('.btnReprove').classList.add('disabled');
        document.querySelector('.btnFinalize').classList.add('disabled');

        sAllStatus.setChoiceByValue('0');
        infoOccurence.status = 0
        
        await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:0, prop:'editing', id:idOccurrence, obs:'Desbloqueado 1º etapa', userId:users.system_collaborator_id  });
        await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:1, prop:'second_part', id:idOccurrence, obs:'Bloqueado 2º etapa', userId:users.system_collaborator_id  });
        await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:0, prop:'status', id:idOccurrence, obs:'Restaurado', userId:users.system_collaborator_id  });
        await headerManagement(infoOccurence)
    })


    
}


/**
 * Função assíncrona para adicionar ação
 */
async function addAction() {
    const actionResponsible = document.querySelector('[name=action_responsible]').value;
    const actionExpiration = document.querySelector('[name=action_expiration]').value;
    const actionDescription = document.querySelector('[name=action_description]').value;
    const occurrence_id = document.querySelector('[name=occurrence_id]').value;

    
    const evidenceFiles = correctiveEvidence.getFiles();

    const formData = new FormData();
    formData.append('action_responsible', actionResponsible);
    formData.append('action_expiration', actionExpiration);
    formData.append('action_description', actionDescription);
    formData.append('occurrence_id', occurrence_id);

    for (let i = 0; i < evidenceFiles.length; i++) {
        const file = evidenceFiles[i].file;
        formData.append('evidence_files', file);
    }
  

    const response = await fetch('/api/non-compliance/add-action', {
        method: 'POST',
        body: formData
    });

    const result = await response.json();
    if (result.success) {
        await table_corrective()
        alert('Ação adicionada com sucesso!');
        // Limpar o modal ou fechar
    } else {
        alert('Erro ao adicionar ação.');
    }
}

async function getValuesOccurrence(e) {
    
    const elements = document.querySelectorAll('.form-input[name]');

    const formBody = {};

    for (let index = 0; index < elements.length; index++) {
        const item = elements[index];
        // if(item.value.trim() == '' || item.value.trim() == 0){
        //     console.log('campos invalidos')
        //     return false;
        // }
        
        // Adicionando dinamicamente o nome e o valor ao objeto
        // REVER AMANHA E REFAZER O IF
        formBody[item.getAttribute('name')] = (item.getAttribute('name') == 'occurrence_responsible' || item.getAttribute('name') == 'types') ? sAllResponsible.getValue(true) : item.value
        
    }

    console.log(formBody)

    const sendToServer = await makeRequest(`/api/non-compliance/saveOccurence`, 'POST', {
        formBody
    });
    

    
    // window.close()


}

async function viewActionCorrective(id) {
    $('#modalActionsView').modal('show');
    let action = await makeRequest(`/api/non-compliance/get-action/${id}`);
    action = action.action;
    console.log(action);

    document.querySelector('[name=action_responsible_view]').value = action.responsible_id;
    document.querySelector('[name=action_description_view]').value = action.action;

    const date_occurrence = new Date(action.deadline);
    const year = date_occurrence.getFullYear();
    const month = ('0' + (date_occurrence.getMonth() + 1)).slice(-2);
    const day = ('0' + date_occurrence.getDate()).slice(-2);
    document.querySelector('[name=action_expiration_view]').value = `${year}-${month}-${day}`;

    const evidence = action.evidence;

    const mimeToIcon = {
        'image/png': '../../assets/images/media/files/image.png',
        'image/jpeg': '../../assets/images/media/files/image.png',
        'application/pdf': '../../assets/images/media/files/pdf.png',
        'application/msword': '../../assets/images/media/files/doc.png',
        'application/vnd.ms-excel': '../../assets/images/media/files/xls.png',
        'text/csv': '../../assets/images/media/files/csv-file.png',
        'video/mp4': '../../assets/images/media/files/video.png',
        'video/mpeg': '../../assets/images/media/files/video.png',
        // Adicione mais mapeamentos conforme necessário
    };

    console.log(evidence);

    let evidenceHTML = '';
    for (let index = 0; index < evidence.length; index++) {
        const element = evidence[index];
        console.log(element);

        let icon;
        if (mimeToIcon[element.mimetype]) {
            icon = mimeToIcon[element.mimetype];
        } else {
            icon = '../../assets/images/media/files/all.png'; // Ícone padrão para tipos de arquivo desconhecidos
        }

        evidenceHTML += `<li class="list-group-item">
                            <div class="d-flex align-items-center flex-wrap gap-2">
                                <div class="lh-1">
                                    <span class="avatar avatar-rounded p-2 bg-light">
                                        <img src="${icon}" alt="">
                                    </span>
                                </div>
                                <div class="flex-fill">
                                    <a href="javascript:void(0);">
                                        <span class="d-block fw-semibold" style="max-width: 15ch;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;">
                                            ${element.originalname}
                                        </span>
                                    </a>
                                    <span class="d-block text-muted fs-12 fw-normal">0.45MB</span>
                                </div>
                                <div class="btn-list">
                                    <a href="/api/non-compliance/download-evidence/${element.filename}" class="btn btn-sm btn-icon btn-info-light btn-wave waves-effect waves-light">
                                        <i class="ri-download-cloud-2-line"></i>
                                    </a>
                                    <button class="btn btn-sm btn-icon btn-danger-light btn-wave waves-effect waves-light btnDeleteActionEvidence" data-filename="${element.filename}" data-actionid="${id}">
                                        <i class="ri-delete-bin-line"></i>
                                    </button>
                                </div>
                            </div>
                        </li>`;
    }

    document.querySelector('.listAllFilesActions').innerHTML = evidenceHTML;

    // Adicionar evento de clique aos botões de exclusão
    const deleteButtons = document.querySelectorAll('.listAllFilesActions .btnDeleteActionEvidence');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const filename = event.currentTarget.getAttribute('data-filename');
            const actionId = event.currentTarget.getAttribute('data-actionid');
            await deleteEvidence(actionId, filename);
            // Atualizar a lista de evidências após a exclusão
            viewActionCorrective(id);
        });
    });
}

async function dblClickOnActions(){
    const rowTableOccurence = document.querySelectorAll(`#ActionsByOccurrence_table tbody tr`);

    for (let index = 0; index < rowTableOccurence.length; index++) {
        const element = rowTableOccurence[index];

        // Define a função de callback do evento
        const handleDoubleClick = async function(e) {
            e.preventDefault();
            const id = this.getAttribute('action-id');
           
            await viewActionCorrective(id)
        };

        // Remove event listener se já existir
        element.removeEventListener('dblclick', handleDoubleClick);
        // Adiciona event listener
        element.addEventListener('dblclick', handleDoubleClick);
    }
}

async function deleteEvidence(actionId, filename) {
    try {
        const response = await fetch(`/api/non-compliance/delete-evidence/${actionId}/${filename}`, {
            method: 'DELETE',
        });
        const result = await response.json();
        if (result.success) {
            console.log('Evidência deletada com sucesso.');
        } else {
            console.error('Erro ao deletar a evidência:', result.message);
        }
    } catch (error) {
        console.error('Erro ao deletar a evidência:', error);
    }
}

async function events(){
    /* filepond */
   FilePond.registerPlugin(
        FilePondPluginImagePreview,
        FilePondPluginImageExifOrientation,
        FilePondPluginFileValidateSize,
        FilePondPluginFileEncode,
        FilePondPluginImageEdit,
        FilePondPluginFileValidateType,
        FilePondPluginImageCrop,
        FilePondPluginImageResize,
        FilePondPluginImageTransform
    );

    /* multiple upload */
    const ElementEvidence = document.querySelector('.multiple-filepond-Evidence');

    // Criar a instância do FilePond com a opção labelIdle alterada correctiveEvidence
    correctiveEvidence = FilePond.create(ElementEvidence, {
        labelIdle: 'Arraste e solte seus arquivos aqui ou <span class="filepond--label-action">Procure</span>'
    });

    const MultipleEffectiveness = document.querySelector('.multiple-filepond-Effectiveness');
    // Criar a instância do FilePond com a opção labelIdle alterada MultipleEffectiveness
    effectivenessEvidence = FilePond.create(MultipleEffectiveness, {
        labelIdle: 'Arraste e solte seus arquivos aqui ou <span class="filepond--label-action">Procure</span>'
    });


    const MultipleEffectivenessView = document.querySelector('.multiple-filepond-Evidence-view');
    // Criar a instância do FilePond com a opção labelIdle alterada MultipleEffectiveness
    correctiveEvidenceView = FilePond.create(MultipleEffectivenessView, {
        labelIdle: 'Arraste e solte seus arquivos aqui ou <span class="filepond--label-action">Procure</span>'
    });


}

async function table_corrective(){
     // Fazer a requisição à API
     const dados = await makeRequest(`/api/non-compliance/get-actions/${idOccurrence}`);

     // Destruir a tabela existente, se houver
     if ($.fn.DataTable.isDataTable('#ActionsByOccurrence_table')) {
         $('#ActionsByOccurrence_table').DataTable().destroy();
     }
 
     // Criar a nova tabela com os dados da API
     $('#ActionsByOccurrence_table').DataTable({
         dom: 'frtip',
         pageLength: 5,
         order: [[0, 'desc']],
         data: dados,
         pageInfo: false,
         bInfo: false,
         columns: [
             { data: 'action' },
             { data: 'responsible' },
             { data: 'deadline' },
             { data: 'status' },
             { data: 'verifyEvidence' },
             // { data: 'action' }
             // Adicione mais colunas conforme necessário
         ],
         buttons: [
             'excel', 'pdf'
         ],
         language: {
             url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",
             searchPlaceholder: 'Pesquisar...',
         },
         "rowCallback": function(row, data, index) {
            // Adiciona um atributo id a cada linha
            $(row).attr('action-id', data.id);
        },
         initComplete: function () {
             requestAnimationFrame(async () => {
                 await dblClickOnActions()
             });
         },
     });
}


/**
 * Função assíncrona para Avaliação De Eficácia
 */
async function addEffectiveness() {
    const actionResponsible = document.querySelector('[name=effectiveness_responsible]').value;
    const actionExpiration = document.querySelector('[name=effectiveness_expiration]').value;
    const actionDescription = document.querySelector('[name=effectiveness_description]').value;
    const occurrence_id = document.querySelector('[name=occurrence_id]').value;

    
    const evidenceFiles = effectivenessEvidence.getFiles();

    const formData = new FormData();
    formData.append('effectiveness_responsible', actionResponsible);
    formData.append('effectiveness_expiration', actionExpiration);
    formData.append('effectiveness_description', actionDescription);
    formData.append('occurrence_id', occurrence_id);

    for (let i = 0; i < evidenceFiles.length; i++) {
        const file = evidenceFiles[i].file;
        formData.append('evidence_files', file);
    }
  

    const response = await fetch('/api/non-compliance/add-effectiveness', {
        method: 'POST',
        body: formData
    });

    const result = await response.json();
    if (result.success) {
        // await table_corrective()
        alert('Ação adicionada com sucesso!');
        // Limpar o modal ou fechar
    } else {
        alert('Erro ao adicionar ação.');
    }
}




// Carrega as informações iniciais e configura os selects quando o DOM estiver pronto
window.addEventListener("load", async () => {
    console.time(`A página "${document.title}" carregou em`);

    await getAllStatus();
    await getAllUnit();
    await getAllOrigins();
    await getAllApproval();
    await getAllResponsible();
    await getAllTypes();
    await events()
    await getOccurenceInfo();
    await controlBlock();
    await controlButtons();
    await table_corrective()

    document.querySelector('#loader2').classList.add('d-none');
    console.timeEnd(`A página "${document.title}" carregou em`);
});
