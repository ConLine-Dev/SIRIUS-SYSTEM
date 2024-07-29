// Variáveis globais para gerenciamento de selects com o Choices
// 's' antes da variável refere-se ao select
let idOccurrence, choices = [], ActionEvidence, ActionEvidence_view,effectivenessEvidence, correctiveEvidence_view, infoOccurence,sAllUnits,sAllStatus,sAllOrigins,sAllApproval,sAllResponsible,sAllResponsibleActions,sAllTypes;


/**
 * Verifica informações no localStorage do usuario logado
 */
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
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
            name: 'Desenvolvimento - Ação Corretiva'
        },
        {
            id: 6,
            name: 'Desenvolvimento - Avaliação de Eficácia'
        },
        {
            id: 7,
            name: 'Finalizado'
        }
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

    choices['occurrence_responsible'] = new Choices('select[name="occurrence_responsible"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
    });
    
    choices['occurrence_responsible'] = new Choices('select[name="occurrence_responsible"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
    });

    choices['action_responsible'] = new Choices('select[name="action_responsible"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        noChoicesText: 'Não há opções disponíveis',
    });

    choices['action_responsible_view'] = new Choices('select[name="action_responsible_view"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        noChoicesText: 'Não há opções disponíveis',
    });


    choices['effectiveness_responsible'] = new Choices('select[name="effectiveness_responsible"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        noChoicesText: 'Não há opções disponíveis',
    });


    choices['effectiveness_responsible_view'] = new Choices('#modalEffectivenessView select[name="responsible_view"]', {
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
    await loadOccurence(occurrence);

    if(urlParams.get('action')){
        await viewActionCorrective(urlParams.get('action'))
    }
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
    document.querySelector('input[name="occurrence_id"]').value = occurrence.id;

    document.querySelector('textarea[name="manpower"]').value = occurrence.manpower;
    document.querySelector('textarea[name="method"]').value = occurrence.method;
    document.querySelector('textarea[name="material"]').value = occurrence.material;
    document.querySelector('textarea[name="environment"]').value = occurrence.environment;
    document.querySelector('textarea[name="machine"]').value = occurrence.machine;
    document.querySelector('textarea[name="root_cause"]').value = occurrence.root_cause;

    document.querySelector('textarea[name="ROMFN"]').value = occurrence.ROMFN;
    
    

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


    // Formatação da abertura de ocorrência
    const date_occurrence_open = new Date(occurrence.create_at);

    const year_open = date_occurrence_open.getFullYear();
    const month_open = ('0' + (date_occurrence_open.getMonth() + 1)).slice(-2);
    const day_open = ('0' + date_occurrence_open.getDate()).slice(-2);
    const hours_open = ('0' + date_occurrence_open.getHours()).slice(-2);
    const minutes_open = ('0' + date_occurrence_open.getMinutes()).slice(-2);

    document.querySelector('input[name="create_at"]').value = `${year_open}-${month_open}-${day_open}T${hours_open}:${minutes_open}`;





 
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

        const formattedDate = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;



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

    if(occurrence.status == 5 || occurrence.status == 6 || occurrence.status == 7){
        const inputActions = document.querySelectorAll('.statusActions');
        inputActions.forEach(element => {
            element.classList.remove('inactive');
        });
    }
    console.log(occurrence.actionAllStatus)
    if((occurrence.status == 6 || occurrence.status == 7 ) && occurrence.actionAllStatus == true){
        const inputActions = document.querySelectorAll('.statusEfficiency');
        inputActions.forEach(element => {
            element.classList.remove('inactive');
        });
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
    if(!user.department_ids || !user.department_ids.includes('8')){
        // SE NÃO FIZER PARTE DO DEPARTAMENTO QUALIDADE 

        document.querySelector('.btnAprove').classList.add('d-none')
        document.querySelector('.btnReprove').classList.add('d-none')
        document.querySelector('.btnFinalize').classList.add('d-none')
        document.querySelector('.btnReset').classList.add('d-none')
        document.querySelector('.groupBlocks').classList.add('d-none')

        if(occurrence.status == 1){
            document.querySelector('#btnHistorico').click()
        }else if(occurrence.status == 4){
            document.querySelector('#btnHistorico').click()
        }else if(occurrence.status == 4){
            const element = document.getElementById('actionCorretive');
            setTimeout(() => {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }

        
    }else{
        
        // SE FIZER PARTE DO DEPARTAMENTO QUALIDADE 

        document.querySelector('.btnAprove').classList.add('disabled')
        document.querySelector('.btnReprove').classList.add('disabled')
        document.querySelector('.btnFinalize').classList.add('disabled')
        // document.querySelector('.btnReset').classList.add('disabled')
        
        
    
        if (occurrence.status == 0) {
            // 0 = aberto agora = Pendente de Aprovação
            document.querySelector('.btnAprove').classList.remove('disabled')
            document.querySelector('.btnReprove').classList.remove('disabled')
        }else if(occurrence.status == 1){
            // 1 = aprovado = Aguardando Preenchimento
            // document.querySelector('.btnReprove').classList.remove('disabled')
            // document.querySelector('.btnFinalize').classList.remove('disabled')
            document.querySelector('#btnHistorico').click()
        }else if(occurrence.status == 2){
            // 2 = reprovado = Aguardando Ajuste.
            // document.querySelector('.btnFinalize').classList.remove('disabled')
        }else if(occurrence.status == 3){
            // 3 = Finalizar = Finalizado
            document.querySelector('.btnAprove').classList.remove('disabled')
            document.querySelector('.btnReprove').classList.remove('disabled')
        }else if(occurrence.status == 4){
            document.querySelector('#btnHistorico').click()
            // 4 = Restaurado = Restaurado
            document.querySelector('.btnFinalize').classList.remove('disabled')
        }else if(occurrence.status == 5 && occurrence.actionAllStatus == true){
            // 5 = Desenvolvimento - Ação Corretiva só libera após todas as açõe finalizadas
            document.querySelector('.btnAprove').classList.remove('disabled')
            // document.querySelector('.btnReset').classList.add('disabled')
        }else if(occurrence.status == 6 && occurrence.EffectivenesAllStatus == true){
            // 5 = Desenvolvimento - Ação Corretiva só libera após todas as açõe finalizadas
            // document.querySelector('.btnAprove').classList.remove('disabled')
            document.querySelector('.btnFinalize').classList.remove('disabled')
            // document.querySelector('.btnReset').classList.add('disabled')
        }



        if(occurrence.status == 5){
            const element = document.getElementById('actionCorretive');
            setTimeout(() => {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
        

    }


    if(occurrence.status == 6 || occurrence.status == 7 || occurrence.status == 5){
        document.querySelector('.btnSave').classList.add('disabled')
    }else{
        document.querySelector('.btnSave').classList.remove('disabled')
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
        const my = this;

        Swal.fire({
            title: 'Tem certeza?',
            text: "Deseja realmente aprovar o status atual desta ocorrência?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Aprovar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                my.classList.add('disabled')

                document.querySelector('.btnReprove').classList.remove('disabled')
                document.querySelector('.btnFinalize').classList.remove('disabled')
        
                let numberType = 0
                let obs = ''
                if(infoOccurence.status == 0){
                    numberType = 2
                    obs = 'Aprovado - Liberado Preenchimento 2ª etapa'
                    await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:1, prop:'editing', id:idOccurrence, obs:'Bloqueado 1º etapa', userId:users.system_collaborator_id  });
                    await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:0, prop:'second_part', id:idOccurrence, obs:'Desbloqueado 2º etapa', userId:users.system_collaborator_id  });
                    makeRequest(`/api/non-compliance/sendEmailOccurrence`,'POST', {
                        subject:`[INTERNO] ${infoOccurence.reference} ${obs}`, 
                        template:'open', 
                        occurrence_id:idOccurrence});
                }
        
                if(infoOccurence.status == 3){
                    numberType = 5
                    obs = 'Desenvolvimento - Ação Corretiva'
                    await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:1, prop:'editing', id:idOccurrence, obs:'Bloqueado 1º etapa', userId:users.system_collaborator_id  });
                    await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:1, prop:'second_part', id:idOccurrence, obs:'Bloqueado 2º etapa', userId:users.system_collaborator_id  });
                    makeRequest(`/api/non-compliance/sendEmailOccurrence`,'POST', {
                        subject:`[INTERNO] ${infoOccurence.reference} - Etapa de Ação Corretiva liberada`, 
                        template:'complete', 
                        occurrence_id:idOccurrence});
                }

                if(infoOccurence.status == 5){
                    numberType = 6
                    obs = 'Desenvolvimento - Avaliação de Eficácia'
                    await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:1, prop:'editing', id:idOccurrence, obs:'Bloqueado 1º etapa', userId:users.system_collaborator_id  });
                    await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:1, prop:'second_part', id:idOccurrence, obs:'Bloqueado 2º etapa', userId:users.system_collaborator_id  });
                    makeRequest(`/api/non-compliance/sendEmailOccurrence`,'POST', {
                        subject:`[INTERNO] ${infoOccurence.reference} - Etapa de Avaliação de Eficácia liberada`, 
                        template:'complete', 
                        occurrence_id:idOccurrence});
                }

                if(infoOccurence.status == 6){
                    numberType = 7
                    obs = 'Finalizado'
                    await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:1, prop:'editing', id:idOccurrence, obs:'Bloqueado 1º etapa', userId:users.system_collaborator_id  });
                    await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:1, prop:'second_part', id:idOccurrence, obs:'Bloqueado 2º etapa', userId:users.system_collaborator_id  });
                    makeRequest(`/api/non-compliance/sendEmailOccurrence`,'POST', {
                        subject:`[INTERNO] ${infoOccurence.reference} - Ocorrência Finalizada`, 
                        template:'complete', 
                        occurrence_id:idOccurrence
                    });
                }
        
                sAllStatus.setChoiceByValue(numberType.toString());
        
                infoOccurence.status = numberType
                await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:numberType, prop:'status', id:idOccurrence, obs:obs, userId:users.system_collaborator_id });
        
        
                await headerManagement(infoOccurence)

                Swal.fire({
                    icon: 'success',
                    title: 'Aprovado!',
                    text: 'A ocorrência foi aprovada com sucesso.'
                });


                window.close()
                // Aqui você pode colocar o código para aprovar a ocorrência
            } else {
              
            }
        });

       
    })

    const btnReprove = document.querySelector('.btnReprove');
    btnReprove.addEventListener('click', async function(e){
        e.preventDefault();
        const my = this;
        Swal.fire({
            title: 'Tem certeza?',
            text: "Por favor, digite o motivo da reprovação:",
            icon: 'warning',
            input: 'textarea',
            inputAttributes: {
                maxlength: 250, // Define o tamanho máximo do texto para 100 caracteres
            },
            customClass: {
                input: 'swal2-input-custom' // Aplica a classe de estilo personalizada ao input
            },
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const reason = result.value;
                if (reason.trim() === '') {
                    Swal.fire({
                        icon: 'error',
                        title: 'Entrada Inválida',
                        text: 'Por favor, digite um motivo válido para a reprovação.'
                    });
                    my.classList.remove('disabled')
                } else {
                    my.classList.add('disabled')
                    Swal.fire({
                        icon: 'success',
                        title: 'Reprovado!',
                        text: `Motivo: ${reason}`
                    });


                    // Aqui você pode fazer o que desejar com a variável 'reason'
                    console.log('Motivo de reprovação:', reason);
                    document.querySelector('.btnAprove').classList.remove('disabled')
                    document.querySelector('.btnFinalize').classList.add('disabled')

                    let numberType = 0
                    let obs = ''
                    if(infoOccurence.status == 0){
                        numberType = 1
                        obs = 'Reprovado - Aguardando Ajuste 1ª etapa'
                        await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:0, prop:'editing', id:idOccurrence, obs:'Desbloqueado 1º etapa', userId:users.system_collaborator_id  });
                        makeRequest(`/api/non-compliance/sendEmailOccurrence`,'POST', {
                            subject:`[INTERNO] ${infoOccurence.reference} - ${obs}`, 
                            template:'open', 
                            occurrence_id:idOccurrence});
                    }

                    if(infoOccurence.status == 3){
                        numberType = 4
                        obs = 'Reprovado - Aguardando Ajuste 2ª etapa'
                        await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:0, prop:'second_part', id:idOccurrence, obs:'Desbloqueado 2º etapa', userId:users.system_collaborator_id  });
                        makeRequest(`/api/non-compliance/sendEmailOccurrence`,'POST', {
                            subject:`[INTERNO] ${infoOccurence.reference} - ${obs}`, 
                            template:'complete', 
                            occurrence_id:idOccurrence});
                    }
                    
                    sAllStatus.setChoiceByValue(numberType.toString());
                    infoOccurence.status = numberType
                    await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:numberType, prop:'status', id:idOccurrence, obs:obs+`<br>Motivo: ${reason}`, userId:users.system_collaborator_id  });
                    await headerManagement(infoOccurence)

                    window.close()
                }
            }
        });

    })

    const btnFinalize = document.querySelector('.btnFinalize');
    btnFinalize.addEventListener('click', async function(e){
        e.preventDefault();
        const my = this;

        Swal.fire({
            title: 'Tem certeza?',
            text: "Deseja realmente finalizar esta ocorrência?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Finalizar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                my.classList.add('disabled')
                document.querySelector('.btnAprove').classList.add('disabled')
                document.querySelector('.btnReprove').classList.add('disabled')
                document.querySelector('.btnReset').classList.remove('disabled')
        
               
                sAllStatus.setChoiceByValue('7');
                infoOccurence.status = 7
                
                await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:1, prop:'editing', id:idOccurrence, obs:'Bloqueado 1º etapa', userId:users.system_collaborator_id  });
                await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:1, prop:'second_part', id:idOccurrence, obs:'Bloqueado 2º etapa', userId:users.system_collaborator_id  });
                await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:7, prop:'status', id:idOccurrence, obs:'Finalizado', userId:users.system_collaborator_id  });
                await headerManagement(infoOccurence)

                makeRequest(`/api/non-compliance/sendEmailOccurrence`,'POST', {
                    subject:`[INTERNO] ${infoOccurence.reference} - Ocorrência Finalizada com sucesso!`, 
                    template:'complete', 
                    occurrence_id:idOccurrence});

                Swal.fire({
                    icon: 'success',
                    title: 'Finalizado!',
                    text: 'A ocorrência foi finalizada com sucesso.'
                });

                window.close()
                // Aqui você pode colocar o código para finalizar a ocorrência
            } else {
            }
        });
       
    })

    const btnReset = document.querySelector('.btnReset');
    btnReset.addEventListener('click', async function(e){
        e.preventDefault();
        const my = this;
        Swal.fire({
            title: 'Restaurar Status',
            text: "Tem certeza que deseja restaurar o status para 'Pendente de Aprovação 1ª Etapa'?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Restaurar',
            cancelButtonText: 'Cancelar'
        }).then( async (result) => {
            if (result.isConfirmed) {
                my.classList.add('disabled')
                document.querySelector('.btnAprove').classList.add('disabled');
                document.querySelector('.btnReprove').classList.add('disabled');
                document.querySelector('.btnFinalize').classList.add('disabled');

                sAllStatus.setChoiceByValue('0');
                infoOccurence.status = 0
                
                await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:0, prop:'editing', id:idOccurrence, obs:'Desbloqueado 1º etapa', userId:users.system_collaborator_id  });
                await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:1, prop:'second_part', id:idOccurrence, obs:'Bloqueado 2º etapa', userId:users.system_collaborator_id  });
                await makeRequest(`/api/non-compliance/changeBlock`, 'POST', { type:0, prop:'status', id:idOccurrence, obs:'Restaurado', userId:users.system_collaborator_id  });
                await headerManagement(infoOccurence)
                // makeRequest(`/api/non-compliance/sendEmailOccurrence`,'POST', {
                //     subject:`[INTERNO] ${infoOccurence.reference} - Atenção do status da sua Ocorrência foi restaurado`, 
                //     template:'complete', 
                //     occurrence_id:idOccurrence});

                Swal.fire({
                    icon: 'success',
                    title: 'Status Restaurado!',
                    text: 'O status da ocorrência foi restaurado para Pendente de Aprovação 1ª Etapa.'
                });


                window.close()
                
                // Aqui você pode colocar o código para restaurar o status da ocorrência
            } else {
              
            }
        });
        
    })

}

/**
 * Função assíncrona para adicionar uma nova ação.
 */
async function addAction() {

    console.log(FilePond.FileStatus)
    // return false;

    // Obtém os valores dos campos de input
    const actionResponsible = document.querySelector('[name=action_responsible]').value;
    const actionExpiration = document.querySelector('[name=action_expiration]').value;
    const actionDescription = document.querySelector('[name=action_description]').value;
    const occurrence_id = document.querySelector('[name=occurrence_id]').value;

    // Verifica se algum campo está vazio
    if (!actionResponsible || !actionExpiration || !actionDescription) {
        alert('Por favor, preencha todos os campos.');
        return false; // Retorna false para interromper a execução da função
    }

    // Obtém os arquivos de evidências
    const evidenceFiles = ActionEvidence.getFiles();

    // Cria um objeto FormData para enviar os dados e arquivos
    const formData = new FormData();
    formData.append('action_responsible', actionResponsible);
    formData.append('action_expiration', actionExpiration);
    formData.append('action_description', actionDescription);
    formData.append('occurrence_id', occurrence_id);

    // Adiciona cada arquivo ao FormData
    for (let i = 0; i < evidenceFiles.length; i++) {
        const file = evidenceFiles[i].file;
        formData.append('evidence_files', file);
    }

    // Faz a requisição para adicionar a ação
    const response = await fetch('/api/non-compliance/add-action', {
        method: 'POST',
        body: formData
    });

    // Converte a resposta para JSON
    const result = await response.json();
    if (result.success) {
        // document.querySelector('[name=action_responsible]').value = '';
        document.querySelector('[name=action_expiration]').value = '';
        document.querySelector('[name=action_description]').value = '';
        ActionEvidence.removeFiles(); // Limpa o FilePond

        // Atualiza a tabela de ações e fecha o modal se a ação for adicionada com sucesso
        await table_corrective();
        $('#modalActions').modal('hide');
    } else {
        // Mostra uma mensagem de erro se houver falha
        alert('Erro ao adicionar ação.');
    }
}

/**
 * Função assíncrona para editar Ação Corretiva.
 */
async function SaveAction() {
    // Obtém os valores dos campos de input
    const actionResponsible = document.querySelector('#modalActionsView [name=action_responsible_view]').value;
    const actionExpiration = document.querySelector('#modalActionsView [name=action_expiration_view]').value;
    const actionDescription = document.querySelector('#modalActionsView [name=action_description_view]').value;
    const action_id = document.querySelector('#modalActionsView [name=action_id]').value;
     // Verifica se algum campo está vazio
     if (!actionResponsible || !actionExpiration || !actionDescription) {
        alert('Por favor, preencha todos os campos.');
        return false; // Retorna false para interromper a execução da função
    }

    // Obtém os arquivos de evidências
    const evidenceFiles = ActionEvidence_view.getFiles();

    // Cria um objeto FormData para enviar os dados e arquivos
    const formData = new FormData();
    formData.append('action_responsible', actionResponsible);
    formData.append('action_expiration', actionExpiration);
    formData.append('action_description', actionDescription);
    formData.append('action_id', action_id);

    // Adiciona cada arquivo ao FormData
    for (let i = 0; i < evidenceFiles.length; i++) {
        const file = evidenceFiles[i].file;
        formData.append('evidence_files', file);
    }

    // Faz a requisição para adicionar a ação
    const response = await fetch('/api/non-compliance/save-action', {
        method: 'POST',
        body: formData
    });

    // Converte a resposta para JSON
    const result = await response.json();
    if (result.success) {
        // Limpa os campos do formulário após salvar com sucesso
        // document.querySelector('#modalActionsView [name=action_responsible_view]').value = '';
        document.querySelector('#modalActionsView [name=action_expiration_view]').value = '';
        document.querySelector('#modalActionsView [name=action_description_view]').value = '';
        ActionEvidence_view.removeFiles(); // Limpa o FilePond

        // Atualiza a tabela de ações e fecha o modal se a ação for adicionada com sucesso
        await table_corrective();
        $('#modalActionsView').modal('hide');
    } else {
        // Mostra uma mensagem de erro se houver falha
        alert('Erro ao adicionar ação.');
    }
}

/**
 * Função assíncrona para obter os valores da ocorrência.
 */
async function getValuesOccurrence(e) {
    // Array com os names dos inputs que não devem ficar em branco e suas mensagens personalizadas
    let requiredFields = [];
    if (infoOccurence.status == 1) {
        requiredFields = [
            { name: 'occurrence', message: 'O campo Ocorrência é obrigatório.' },
            { name: 'occurrence_date', message: 'O campo Data da Ocorrência é obrigatório.' },
            { name: 'company_id', message: 'O campo Empresa é obrigatório.' },
            { name: 'origin_id', message: 'O campo Origem é obrigatório.' },
            { name: 'type_id', message: 'O campo Tipo é obrigatório.' },
            { name: 'occurrence_responsible', message: 'O campo Responsável pela Ocorrência é obrigatório.' },
            { name: 'correction', message: 'O campo Correção é obrigatório.' },
            { name: 'description', message: 'O campo Descrição é obrigatório.' }
        ];
    } else if (infoOccurence.status == 2 || infoOccurence.status == 4) {
        requiredFields = [
            { name: 'manpower', message: 'O campo Mão-de-obra é obrigatório.' },
            { name: 'method', message: 'O campo Método é obrigatório.' },
            { name: 'material', message: 'O campo Material é obrigatório.' },
            { name: 'environment', message: 'O campo Meio Ambiente é obrigatório.' },
            { name: 'machine', message: 'O campo Máquina é obrigatório.' },
            { name: 'root_cause', message: 'O campo Causa Raiz é obrigatório.' }
        ];
    }

    const elements = document.querySelectorAll('.form-input[name]');

    const formBody = {};

    for (let index = 0; index < elements.length; index++) {
        const item = elements[index];
        const itemName = item.getAttribute('name');
        
        // Verificar se o campo está no array de campos obrigatórios e se está vazio
        const requiredField = requiredFields.find(field => field.name === itemName);
        if (requiredField && (item.value.trim() === '' || item.value.trim() === '0')) {
            Swal.fire(requiredField.message);
            return false;
        }

        // Adicionando dinamicamente o nome e o valor ao objeto
        formBody[itemName] = (itemName === 'occurrence_responsible' || itemName === 'types') ? sAllResponsible.getValue(true) : item.value;
    }

    const sendToServer = await makeRequest(`/api/non-compliance/saveOccurence`, 'POST', { formBody });

    if (infoOccurence.status == 1) {
        makeRequest(`/api/non-compliance/sendEmailOccurrence`,'POST', {
            subject:`[INTERNO] ${infoOccurence.reference} - Pendente aprovação 1ª Etapa`, 
            template:'open', 
            occurrence_id:idOccurrence});
    } else if (infoOccurence.status == 2) {
        makeRequest(`/api/non-compliance/sendEmailOccurrence`,'POST', {
            subject:`[INTERNO] ${infoOccurence.reference} - Pendente aprovação 2ª Etapa`, 
            template:'complete', 
            occurrence_id:idOccurrence});
    }
    

    window.close();
}


/**
 * Função assíncrona para visualizar uma ação corretiva.
 */
async function viewActionCorrective(id) {
    // Mostra o modal de visualização de ações
    $('#modalActionsView').modal('show');
    let action = await makeRequest(`/api/non-compliance/get-action/${id}`);
    action = action.action;
    document.querySelector('#modalActionsView [name=action_id]').value = id

    // Preenche os campos do modal com os dados da ação
    // Obtém o valor de responsible_id que deseja selecionar
    const responsibleId = action.responsible_id;

    // Seleciona o elemento <select>
    const selectElement = document.querySelector('#modalActionsView [name=action_responsible_view]');

    // Percorre as opções do <select>
    for (let option of selectElement.options) {
        if (option.value === responsibleId) {
            option.selected = true; // Marca a opção como selecionada
            break; // Interrompe o loop após encontrar a opção correta
        }
    }

    choices['action_responsible_view'].setChoiceByValue(responsibleId.toString());


    document.querySelector('[name=action_description_view]').value = action.action;

    // Formata a data de expiração
    const date_occurrence = new Date(action.deadline);
    const year = date_occurrence.getFullYear();
    const month = ('0' + (date_occurrence.getMonth() + 1)).slice(-2);
    const day = ('0' + date_occurrence.getDate()).slice(-2);
    document.querySelector('[name=action_expiration_view]').value = `${year}-${month}-${day}`;

    // Preenche a lista de evidências
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
    };

    let evidenceHTML = '';
    for (let index = 0; index < evidence.length; index++) {
        const element = evidence[index];
        let icon = mimeToIcon[element.mimetype] || '../../assets/images/media/files/all.png';

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

    // Adiciona eventos de clique aos botões de exclusão de evidências
    const deleteButtons = document.querySelectorAll('.listAllFilesActions .btnDeleteActionEvidence');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const filename = event.currentTarget.getAttribute('data-filename');
            const actionId = event.currentTarget.getAttribute('data-actionid');
            await deleteEvidence(actionId, filename);
            viewActionCorrective(id); // Atualiza a lista de evidências após a exclusão
        });
    });


    if(evidence.length > 0){
       const bloks = document.querySelectorAll('#modalActionsView input, #modalActionsView textarea');

       for (let index = 0; index < bloks.length; index++) {
        const element = bloks[index];
        element.setAttribute('disabled', true)
       }

       choices['action_responsible_view'].disable()
    }else{
        const bloks = document.querySelectorAll('#modalActionsView input, #modalActionsView textarea');

        for (let index = 0; index < bloks.length; index++) {
         const element = bloks[index];
         element.removeAttribute('disabled')
         
        }
        choices['action_responsible_view'].enable()
    }
}

/**
 * Função assíncrona para adicionar eventos de duplo clique às linhas da tabela de ações.
 */
async function dblClickOnActions() {
    const rowTableOccurence = document.querySelectorAll(`#ActionsByOccurrence_table tbody tr`);

    for (let index = 0; index < rowTableOccurence.length; index++) {
        const element = rowTableOccurence[index];

        // Define a função de callback do evento
        const handleDoubleClick = async function(e) {
            e.preventDefault();
            const id = this.getAttribute('action-id');
            await viewActionCorrective(id);
        };

        // Remove o event listener se já existir e adiciona o novo
        element.removeEventListener('dblclick', handleDoubleClick);
        element.addEventListener('dblclick', handleDoubleClick);
    }
}

/**
 * Função assíncrona para deletar uma evidência.
 * @param {number} actionId - O ID da ação.
 * @param {string} filename - O nome do arquivo da evidência.
 */
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

/**
 * Função assíncrona para configurar a tabela de ações corretivas.
 */
async function table_corrective() {
    // Fazer a requisição à API para obter os dados das ações corretivas
    const dados = await makeRequest(`/api/non-compliance/get-actions/${idOccurrence}`);

    // Verifica se a tabela já foi inicializada com DataTables e a destrói se necessário
    if ($.fn.DataTable.isDataTable('#ActionsByOccurrence_table')) {
        $('#ActionsByOccurrence_table').DataTable().destroy();
    }

    // Inicializa a tabela DataTable com os dados obtidos da API
    $('#ActionsByOccurrence_table').DataTable({
        // Configuração de layout da tabela
        dom: 'rtip', // Define a estrutura da tabela: filter (f), length (l), table (t), info (i), pagination (p)
        pageLength: 5, // Define o número de registros por página
        order: [[0, 'desc']], // Define a ordenação inicial da tabela (pela primeira coluna, em ordem decrescente)
        data: dados, // Define os dados da tabela
        pageInfo: false, // Oculta informações de paginação
        bInfo: false, // Oculta informações adicionais da tabela
        columns: [
            { data: 'id', visible: false }, // Coluna oculta para o ID
            { data: 'actionLimit', orderable: false }, // Coluna para a ação (não ordenável)
            { data: 'responsible', orderable: false }, // Coluna para o responsável (não ordenável)
            { data: 'deadline', orderable: false }, // Coluna para a data limite (não ordenável)
            { data: 'status' }, // Coluna para o status (ordenável por padrão)
            { data: 'verifyEvidence', orderable: false }, // Coluna para verificar evidências (não ordenável)
        ],
        buttons: [
            'excel', 'pdf' // Botões para exportar a tabela em Excel e PDF
        ],
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json", // URL para o arquivo de tradução em português
            searchPlaceholder: 'Pesquisar...', // Placeholder para a caixa de pesquisa
        },
        // Função de callback para adicionar um atributo 'action-id' a cada linha da tabela
        rowCallback: function(row, data, index) {
            $(row).attr('action-id', data.id);
        },
        // Função de inicialização completa
        initComplete: function () {
            // Usa requestAnimationFrame para garantir que a função seja chamada após a renderização da tabela
            requestAnimationFrame(async () => {
                await dblClickOnActions(); // Adiciona eventos de duplo clique às linhas da tabela
            });
        },
    });
}

/**
 * Função assíncrona para adicionar uma Avaliação De Eficácia.
 */
async function addEffectiveness() {
    // Obtém os valores dos campos do formulário
    const actionResponsible = document.querySelector('[name=effectiveness_responsible]').value;
    const actionExpiration = document.querySelector('[name=effectiveness_expiration]').value;
    const actionDescription = document.querySelector('[name=effectiveness_description]').value;
    const occurrence_id = document.querySelector('[name=occurrence_id]').value;

     // Verifica se algum campo está vazio
     if (!actionResponsible || !actionExpiration || !actionDescription) {
        alert('Por favor, preencha todos os campos.');
        return false; // Retorna false para interromper a execução da função
    }

    // Espera até que todos os arquivos sejam carregados
    await effectivenessEvidence.processFiles();

    // Obtém os arquivos de evidência
    const evidenceFiles = effectivenessEvidence.getFiles();

    // Cria um objeto FormData para enviar os dados e arquivos
    const formData = new FormData();
    formData.append('effectiveness_responsible', actionResponsible);
    formData.append('effectiveness_expiration', actionExpiration);
    formData.append('effectiveness_description', actionDescription);
    formData.append('occurrence_id', occurrence_id);

    // Adiciona os arquivos de evidência ao FormData
    for (let i = 0; i < evidenceFiles.length; i++) {
        const file = evidenceFiles[i].file;
        formData.append('evidence_files', file);
    }

    // Faz a requisição para adicionar a avaliação de eficácia
    const response = await fetch('/api/non-compliance/add-effectivenes', {
        method: 'POST',
        body: formData
    });

    // Obtém o resultado da requisição
    const result = await response.json();
    if (result.success) {
        // document.querySelector('[name=effectiveness_responsible]').value = '';
        document.querySelector('[name=effectiveness_expiration]').value = '';
        document.querySelector('[name=effectiveness_description]').value = '';
        effectivenessEvidence.removeFiles();
        // Atualiza a tabela e fecha o modal se a requisição for bem-sucedida
        await table_effectiveness();
        $('#modalEffectiveness').modal('hide');
        // alert('Ação adicionada com sucesso!');
    } else {
        alert('Erro ao adicionar ação.');
    }
}

/**
 * Função assíncrona para adicionar uma Avaliação De Eficácia.
 */
async function saveEffectiveness() {
    // Obtém os valores dos campos do formulário
    const actionResponsible = document.querySelector('#modalEffectivenessView [name=responsible_view]').value;
    const actionExpiration = document.querySelector('#modalEffectivenessView [name=expiration_view]').value;
    const actionDescription = document.querySelector('#modalEffectivenessView [name=description_view]').value;
    const effectivenes_id = document.querySelector('#modalEffectivenessView  [name=effectivenes_id]').value;

     // Verifica se algum campo está vazio
     if (!actionResponsible || !actionExpiration || !actionDescription) {
        alert('Por favor, preencha todos os campos.');
        return false; // Retorna false para interromper a execução da função
    }

    // Obtém os arquivos de evidência
    const evidenceFiles = correctiveEvidence_view.getFiles();

    // Cria um objeto FormData para enviar os dados e arquivos
    const formData = new FormData();
    formData.append('effectiveness_responsible', actionResponsible);
    formData.append('effectiveness_expiration', actionExpiration);
    formData.append('effectiveness_description', actionDescription);
    formData.append('effectivenes_id', effectivenes_id);

    // Adiciona os arquivos de evidência ao FormData
    for (let i = 0; i < evidenceFiles.length; i++) {
        const file = evidenceFiles[i].file;
        formData.append('evidence_files', file);
    }

    // Faz a requisição para adicionar a avaliação de eficácia
    const response = await fetch('/api/non-compliance/save-effectivenes', {
        method: 'POST',
        body: formData
    });

    // Obtém o resultado da requisição
    const result = await response.json();
    if (result.success) {
        // document.querySelector('#modalEffectivenessView [name=responsible_view]').value = '';
        document.querySelector('#modalEffectivenessView [name=expiration_view]').value = '';
        document.querySelector('#modalEffectivenessView [name=description_view]').value = '';
        correctiveEvidence_view.removeFiles(); // Limpa o FilePond
        
        // Atualiza a tabela e fecha o modal se a requisição for bem-sucedida
        await table_effectiveness();
        $('#modalEffectivenessView').modal('hide');
        // alert('Ação salva com sucesso!');
    } else {
        alert('Erro ao adicionar ação.');
    }
}


/**
 * Função assíncrona para renderizar a tabela de Avaliação De Eficácia.
 */
async function table_effectiveness() {
    // Fazer a requisição à API para obter os dados das avaliações de eficácia
    const dados = await makeRequest(`/api/non-compliance/get-effectiveness/${idOccurrence}`);

    // Verifica se a tabela já foi inicializada com DataTables e a destrói se necessário
    if ($.fn.DataTable.isDataTable('#EffectivenessByOccurrence_table')) {
        $('#EffectivenessByOccurrence_table').DataTable().destroy();
    }

    // Inicializa a tabela DataTable com os dados obtidos da API
    $('#EffectivenessByOccurrence_table').DataTable({
        dom: 'rtip', // Define a estrutura da tabela
        pageLength: 5, // Define o número de registros por página
        order: [[0, 'desc']], // Define a ordenação inicial da tabela
        data: dados, // Define os dados da tabela
        pageInfo: false, // Oculta informações de paginação
        bInfo: false, // Oculta informações adicionais da tabela
        columns: [
            { data: 'id', visible: false }, // Coluna oculta para o ID
            { data: 'action', orderable: false }, // Coluna para a ação (não ordenável)
            { data: 'responsible', orderable: false }, // Coluna para o responsável (não ordenável)
            { data: 'deadline', orderable: false }, // Coluna para a data limite (não ordenável)
            { data: 'status' }, // Coluna para o status (ordenável por padrão)
            { data: 'verifyEvidence', orderable: false }, // Coluna para verificar evidências (não ordenável)
        ],
        buttons: [
            'excel', 'pdf' // Botões para exportar a tabela em Excel e PDF
        ],
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json", // URL para o arquivo de tradução em português
            searchPlaceholder: 'Pesquisar...', // Placeholder para a caixa de pesquisa
        },
        // Função de callback para adicionar um atributo 'effectivenes-id' a cada linha da tabela
        rowCallback: function(row, data, index) {
            $(row).attr('effectivenes-id', data.id);
        },
        // Função de inicialização completa
        initComplete: function () {
            // Usa requestAnimationFrame para garantir que a função seja chamada após a renderização da tabela
            requestAnimationFrame(async () => {
                await dblClickOnEffectiveness(); // Adiciona eventos de duplo clique às linhas da tabela
            });
        },
    });
}

/**
 * Função assíncrona para visualizar uma Avaliação De Eficácia específica.
 * @param {number} id - ID da avaliação de eficácia.
 */
async function viewEffectiveness(id) {
    $('#modalEffectivenessView').modal('show'); // Exibe o modal de visualização
    let result = await makeRequest(`/api/non-compliance/get-effectivenes/${id}`); // Faz a requisição para obter os dados da avaliação de eficácia

    document.querySelector('#modalEffectivenessView [name=effectivenes_id]').value = id
    let effectivenes = result.effectivenes;

    // Preenche os campos do modal com os dados da avaliação de eficácia
    // Obtém o valor de responsible_id que deseja selecionar
    const responsibleId = effectivenes.responsible_id;

    // Seleciona o elemento <select>
    const selectElement = document.querySelector('#modalEffectivenessView [name=responsible_view]');

    // Percorre as opções do <select>
    for (let option of selectElement.options) {
        if (option.value === responsibleId) {
            option.selected = true; // Marca a opção como selecionada
            break; // Interrompe o loop após encontrar a opção correta
        }
    }

    choices['effectiveness_responsible_view'].setChoiceByValue(responsibleId.toString());

    document.querySelector('#modalEffectivenessView [name=description_view]').value = effectivenes.action;

    const date_occurrence = new Date(effectivenes.deadline);
    const year = date_occurrence.getFullYear();
    const month = ('0' + (date_occurrence.getMonth() + 1)).slice(-2);
    const day = ('0' + date_occurrence.getDate()).slice(-2);
    document.querySelector('#modalEffectivenessView [name=expiration_view]').value = `${year}-${month}-${day}`;

    const evidence = effectivenes.evidence;

    // Mapeamento de mime types para ícones
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

    // Gera o HTML para exibir as evidências
    let evidenceHTML = '';
    for (let index = 0; index < evidence.length; index++) {
        const element = evidence[index];

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

    // Insere o HTML gerado no modal
    document.querySelector('.listAllFilesEffectiveness').innerHTML = evidenceHTML;

    // Adiciona evento de clique aos botões de exclusão
    const deleteButtons = document.querySelectorAll('.listAllFilesEffectiveness .btnDeleteActionEvidence');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const filename = event.currentTarget.getAttribute('data-filename');
            const actionId = event.currentTarget.getAttribute('data-actionid');
            await deleteEvidenceEffectiveness(actionId, filename); // Chama a função para deletar a evidência
            viewEffectiveness(id); // Atualiza a lista de evidências após a exclusão
        });
    });
}

/**
 * Função assíncrona para deletar uma evidência de uma Avaliação De Eficácia.
 * @param {number} effectivenesId - ID da avaliação de eficácia.
 * @param {string} filename - Nome do arquivo a ser deletado.
 */
async function deleteEvidenceEffectiveness(effectivenesId, filename) {
    try {
        const response = await fetch(`/api/non-compliance/delete-evidence-effectivenes/${effectivenesId}/${filename}`, {
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

/**
 * Função assíncrona para adicionar eventos de duplo clique às linhas da tabela de Avaliação De Eficácia.
 */
async function dblClickOnEffectiveness() {
    const rowTableOccurence = document.querySelectorAll('#EffectivenessByOccurrence_table tbody tr');

    for (let index = 0; index < rowTableOccurence.length; index++) {
        const element = rowTableOccurence[index];

        // Define a função de callback do evento de duplo clique
        const handleDoubleClick = async function(e) {
            e.preventDefault();
            const id = this.getAttribute('effectivenes-id');
            await viewEffectiveness(id); // Chama a função para visualizar a avaliação de eficácia
        };

        // Remove event listener se já existir
        element.removeEventListener('dblclick', handleDoubleClick);
        // Adiciona event listener para o duplo clique
        element.addEventListener('dblclick', handleDoubleClick);
    }
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
 * Função assíncrona para inicializar eventos.
 */
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


    // ------- FILES UPLOAD ACTIONS Ação Corretiva 
    // ACTION MODAL
    // Criar a instância do FilePond com a opção labelIdle alterada correctiveEvidence
    ActionEvidence = FilePond.create(document.querySelector('.multiple-filepond-evidence-action-Evidence'), {
        labelIdle: 'Arraste e solte seus arquivos aqui ou <span class="filepond--label-action">Procure</span>'
    });

    // ACTION VIEW MODAL
    // Criar a instância do FilePond com a opção labelIdle alterada correctiveEvidence
    ActionEvidence_view = FilePond.create(document.querySelector('.multiple-filepond-action-Evidence-view'), {
        labelIdle: 'Arraste e solte seus arquivos aqui ou <span class="filepond--label-action">Procure</span>'
    });



    // ------- FILES UPLOAD Effectiveness Avaliação De Eficácia
    // Criar a instância do FilePond com a opção labelIdle alterada MultipleEffectiveness
    effectivenessEvidence = FilePond.create(document.querySelector('.multiple-filepond-evidence-effectiveness'), {
        labelIdle: 'Arraste e solte seus arquivos aqui ou <span class="filepond--label-action">Procure</span>'
    });


    // Criar a instância do FilePond com a opção labelIdle alterada MultipleEffectiveness
    correctiveEvidence_view = FilePond.create(document.querySelector('.multiple-filepond-evidence-effectiveness-view'), {
        labelIdle: 'Arraste e solte seus arquivos aqui ou <span class="filepond--label-action">Procure</span>'
    });


}


/**
 * Carrega as informações iniciais e configura os selects quando o DOM estiver pronto.
 */
window.addEventListener("load", async () => {
    console.time(`A página "${document.title}" carregou em`); // Inicia o contador de tempo para carregamento da página

    // Carrega todas as informações necessárias de forma assíncrona
    await getAllStatus();
    await getAllUnit();
    await getAllOrigins();
    await getAllApproval();
    await getAllResponsible();
    await getAllTypes();
    await events(); // Configura eventos adicionais
    await getOccurenceInfo(); // Obtém informações da ocorrência
    await controlBlock(); // Controla os blocos de informação
    await controlButtons(); // Controla os botões da página
    await table_corrective(); // Renderiza a tabela de ações corretivas
    await table_effectiveness(); // Renderiza a tabela de avaliação de eficácia

    // Esconde o loader após o carregamento completo
    document.querySelector('#loader2').classList.add('d-none');
    
    console.timeEnd(`A página "${document.title}" carregou em`); // Finaliza o contador de tempo para carregamento da página
});

