// Variáveis globais para gerenciamento de selects com o Choices
// 's' antes da variável refere-se ao select
let idOccurrence, infoOccurence,sAllUnits,sAllStatus,sAllOrigins,sAllApproval,sAllResponsible,sAllResponsibleActions,sAllTypes;




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
            name: 'Aprovado - Libera Preenchimento 2ª etapa'
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
            name: 'Aprovado 2ª etapa - Finalizado'
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

    sAllResponsibleActions = new Choices('select[name="Preventive_responsible"]', {
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

    idOccurrence = occurrence.id
    // Preenche os campos de referência da ocorrência
    document.querySelector('#referenceOccurrence').innerHTML = occurrence.reference;
    document.querySelector('input[name="occurrence"]').value = occurrence.title;
    document.querySelector('textarea[name="description"]').value = occurrence.description;
    document.querySelector('textarea[name="correction"]').value = occurrence.correction;

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



    await loadHistory(occurrence.id)
}

/**
 * Função assíncrona para carregar o historico da ocorrencia.
 */
async function loadHistory(id){
    console.log(id)
    const history = await makeRequest(`/api/non-compliance/getHistory`, 'POST', { id:id });

    let historyText = '';
    for (let index = 0; index < history.length; index++) {
        const element = history[index];
        const name = await formatarNome(element.name+' '+element.family_name);

        const date = new Date(element.create_at)
        const year = date.getFullYear(); // Obtém o ano
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Obtém o mês (0-indexado) e adiciona um zero à esquerda se necessário
        const day = String(date.getDate()).padStart(2, '0');
        historyText += `<li class="list-group-item">
                            <div class="d-flex align-items-center">
                                <div class="me-2"> <img src="https://cdn.conlinebr.com.br/colaboradores/${element.id_headcargo}" class="avatar avatar-md bg-primary avatar-rounded" alt=""> </div>
                                <div class="flex-fill">
                                    <p class="fw-semibold mb-0">${name}
                                        <span class="badge bg-light text-muted float-end">${year}-${month}-${day}</span>
                                    </p>
                                    <span class="fs-12 text-muted">
                                        <!-- <i class="ri-time-line align-middle me-1 d-inline-block"></i> -->
                                        1ª etapa aprovada
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



        // Desabilita campos na segunda parte da ocorrência
        const InputDefault = document.querySelectorAll('.statusApproval input');
        InputDefault.forEach(element => {
            element.setAttribute('disabled', true);
        });

        const Textareafault = document.querySelectorAll('.statusApproval textarea');
        Textareafault.forEach(element => {
            element.setAttribute('disabled', true);
        });

        // document.querySelector('.btnReset').classList.remove('disabled')
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
        }else if(occurrence.status == 4){
            // 4 = Restaurado = Restaurado
            document.querySelector('.btnFinalize').classList.remove('disabled')
        }else if(occurrence.status == 5){
            // 4 = Restaurado = Restaurado
            // document.querySelector('.btnAprove').classList.remove('disabled')
            // document.querySelector('.btnReset').classList.add('disabled')
        }

    }
    

}

/**
 * Função assíncrona para eventos de bloqueio
 */
async function controlBlock(){
    const block1Etapa = document.querySelector('.block1Etapa');
    block1Etapa.addEventListener('click', async function(e){
        e.preventDefault();

        const type = this.getAttribute('type')
        if(type == 1){
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

        await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:type, prop:'editing', id:idOccurrence });
        
    
       

    })


    const block2Etapa = document.querySelector('.block2Etapa');
    block2Etapa.addEventListener('click', async function(e){
        e.preventDefault();

        const type = this.getAttribute('type')
        if(type == 1){
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

        await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:type, prop:'second_part', id:idOccurrence });

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
        }

        if(infoOccurence.status == 3){
            numberType = 5
            obs = 'Aprovado 2ª etapa - Finalizado'
        }

        sAllStatus.setChoiceByValue(numberType.toString());

        await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:numberType, prop:'status', id:idOccurrence, obs:obs, userId:users.system_collaborator_id });
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
        }

        if(infoOccurence.status == 3){
            numberType = 4
            obs = 'Reprovado - Aguardando Ajuste 2ª etapa'
        }
        
        sAllStatus.setChoiceByValue(numberType.toString());
        await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:numberType, prop:'status', id:idOccurrence, obs:obs, userId:users.system_collaborator_id  });
    })

    const btnFinalize = document.querySelector('.btnFinalize');
    btnFinalize.addEventListener('click', async function(e){
        e.preventDefault();
        this.classList.add('disabled')
        document.querySelector('.btnAprove').classList.add('disabled')
        document.querySelector('.btnReprove').classList.add('disabled')
        document.querySelector('.btnReset').classList.remove('disabled')

       
        sAllStatus.setChoiceByValue('5');

        await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:5, prop:'status', id:idOccurrence, obs:'Finalizado - Aprovado 2ª etapa', userId:users.system_collaborator_id  });
    })

    const btnReset = document.querySelector('.btnReset');
    btnReset.addEventListener('click', async function(e){
        e.preventDefault();
        this.classList.add('disabled')
        document.querySelector('.btnAprove').classList.add('disabled');
        document.querySelector('.btnReprove').classList.add('disabled');
        document.querySelector('.btnFinalize').classList.add('disabled');

        sAllStatus.setChoiceByValue('1');

        await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:1, prop:'status', id:idOccurrence, obs:'Restaurado', userId:users.system_collaborator_id  });
    })


    
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
    await getOccurenceInfo();
    await controlBlock();
    await controlButtons();
    
    

    document.querySelector('#loader2').classList.add('d-none');
    console.timeEnd(`A página "${document.title}" carregou em`);
});
