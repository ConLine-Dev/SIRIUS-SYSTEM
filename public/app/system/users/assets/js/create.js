const apiUrl = '/api/user-management';
let sAllColaborators;

async function getAllColaborators() {
    // carrega os usuarios responsaveis
    const Colaborators = await makeRequest(`/api/users/getAllColab`);

    // Formate o array para ser usado com o Choices.js
    const listaDeOpcoes = Colaborators.map(function (element) {
        return {
            value: `${element.id}`,
            label: element.ColabFullName,
        };
    });



    // verifica se o select ja existe, caso exista destroi
    if (sAllColaborators) {
        sAllColaborators.destroy();
    }


    // renderiza o select com as opções formatadas
    sAllColaborators = new Choices('select[name="collaborator"]', {
        choices: listaDeOpcoes,
        // allowHTML: true,
        // allowSearch: true,
        shouldSort: false,
        removeItemButton: false,
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







document.addEventListener('DOMContentLoaded', async function() {

    await getAllColaborators()
 // Salvar novo usuário
 document.getElementById('userForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    const userData = Object.fromEntries(formData.entries());
    await makeRequest(apiUrl, 'POST', userData);

    window.close()
});

    document.querySelector('#loader2').classList.add('d-none')
});
