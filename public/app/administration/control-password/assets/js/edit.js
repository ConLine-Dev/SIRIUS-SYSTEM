// Variaveis globais para gerenciamento de selects com o Choices
// s antes da variavel se refere a select
let sAllResponsible, sAllDepartments;


async function getAllResponsible() {
    // carrega os usuarios responsaveis
    const Responsible = await makeRequest(`/api/users/listAllUsers`);

    // Formate o array para ser usado com o Choices.js
    const listaDeOpcoes = Responsible.map(function (element) {
        return {
            value: `${element.id_colab}`,
            label: `${element.username + ' ' + element.familyName}`,
        };
    });



    // verifica se o select ja existe, caso exista destroi
    if (sAllResponsible) {
        sAllResponsible.destroy();
    }


    // renderiza o select com as opções formatadas
    sAllResponsible = new Choices('select[name="responsible"]', {
        choices: listaDeOpcoes,
        // allowHTML: true,
        // allowSearch: true,
        shouldSort: false,
        removeItemButton: false,
        noChoicesText: 'Não há opções disponíveis',

    });


}

async function getAllDepartments() {
    // carrega os usuarios responsaveis
    const Departments = await makeRequest(`/api/users/getAllDept`);
    console.log(Departments)

    // Formate o array para ser usado com o Choices.js
    const listaDeOpcoes = Departments.map(function (element) {
        return {
            value: `${element.id}`,
            label: `${element.name}`,
        };
    });


    // verifica se o select ja existe, caso exista destroi
    if (sAllDepartments) {
        sAllDepartments.destroy();
    }


    // renderiza o select com as opções formatadas
    sAllDepartments = new Choices('select[name="departments"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',

    });


}





// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {
    // inicio da função verificar tempo de carregamento da pagina e suas consultas no banco
    console.time(`A página "${document.title}" carregou em`)


    // carrega os usuarios responsaveis
    await getAllResponsible();

    // carrega os usuarios departamentos
    await getAllDepartments();

    
    // remover loader
    document.querySelector('#loader2').classList.add('d-none');


    // fim da função verificar tempo de carregamento da pagina e suas consultas no banco
    console.timeEnd(`A página "${document.title}" carregou em`);
})
