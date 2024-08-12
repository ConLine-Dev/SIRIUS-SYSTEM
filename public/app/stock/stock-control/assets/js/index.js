async function active_tooltip() {
    const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]'
    );
    const tooltipList = [...tooltipTriggerList].map(
        (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
    );
};

// Função que cria o select para selecionar os comerciais
let selectCollaborator;
async function createSelectCollaborator(data) {
    // Formate o array para ser usado com o Choices.js
    const options = data.map(function(element) {
        return {
            value: `${element.commercial_id}`,
            label: `${element.commercial}`,
        };
    });

    // verifica se o select ja existe, caso exista destroi
    if (selectCollaborator) {
        selectCollaborator.destroy();
    }

    // renderiza o select com as opções formatadas
    selectCollaborator = new Choices('#selectCollaborator', {
        choices: options,
        allowHTML: true,
        allowSearch: true,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        noResultsText: 'Não há opções disponíveis'
    });
};

// Função executada após toda a página ser executada
window.addEventListener("load", async () => {
    // const getAllCollaborator = await makeRequest('/api/stock/getAllCollaborator', 'POST',);

    await active_tooltip();
    // await createSelectCommercial(getAllCollaborator);

    // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
    document.querySelector('#loader2').classList.add('d-none')

})