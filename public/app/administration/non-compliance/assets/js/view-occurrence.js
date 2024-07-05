// Variáveis globais para gerenciamento de selects com o Choices
// 's' antes da variável refere-se ao select
let sAllUnits, sAllOrigins, sAllApproval, sAllResponsible, sAllResponsibleActions, sAllTypes;


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

    console.log(occurrence);
    await loadOccurence(occurrence);
}

/**
 * Função assíncrona para carregar informações da ocorrência nos campos correspondentes.
 * @param {Object} occurrence - Objeto contendo informações da ocorrência.
 */
async function loadOccurence(occurrence) {
    // Preenche os campos de referência da ocorrência
    document.querySelector('#referenceOccurrence').innerHTML = occurrence.reference;
    document.querySelector('input[name="occurrence"]').value = occurrence.title;
    document.querySelector('textarea[name="description"]').value = occurrence.description;
    document.querySelector('textarea[name="correction"]').value = occurrence.correction;

    // Define as opções selecionadas nos selects
    sAllOrigins.setChoiceByValue(occurrence.origin_id.toString());
    sAllUnits.setChoiceByValue(occurrence.company_id.toString());
    sAllTypes.setChoiceByValue(occurrence.typeId.toString());

    // Marcando os responsáveis
    const responsibleIds = occurrence.responsibles.map(responsible => responsible.collaborator_id.toString());
    sAllResponsible.setChoiceByValue(responsibleIds);

    // Formatação da data de ocorrência
    const date_occurrence = new Date(occurrence.date_occurrence);
    const year = date_occurrence.getFullYear();
    const month = ('0' + (date_occurrence.getMonth() + 1)).slice(-2);
    const day = ('0' + date_occurrence.getDate()).slice(-2);
    document.querySelector('input[name="occurrence_date"]').value = `${year}-${month}-${day}`;

    // Habilita os campos dependendo do status e da edição da ocorrência
    if (occurrence.status != 0) {
        const statusApproval = document.querySelectorAll('.statusApproval');
        statusApproval.forEach(element => {
            element.classList.remove('inactive');
        });
    }

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
}


// Carrega as informações iniciais e configura os selects quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", async () => {
    console.time(`A página "${document.title}" carregou em`);

    await getAllUnit();
    await getAllOrigins();
    await getAllApproval();
    await getAllResponsible();
    await getAllTypes();
    await getOccurenceInfo();

    document.querySelector('#loader2').classList.add('d-none');
    console.timeEnd(`A página "${document.title}" carregou em`);
});
