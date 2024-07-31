const apiUrl = '/api/user-management';
let idUser = 0, sAllColaborators

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
    idUser = urlParams.get('id');

    const user = await makeRequest(apiUrl+`/${idUser}`);

    document.getElementById('username').value = user.username;
    document.getElementById('email').value = user.email;
    document.getElementById('password').value = user.password;
    document.getElementById('emailPassword').value = user.email_password;
    
    sAllColaborators.setChoiceByValue((user.collaborator_id).toString())
    // document.getElementById('collaborator').value = ;
}







document.addEventListener('DOMContentLoaded', async function() {
    await getAllColaborators()

    await getOccurenceInfo()

    // Salvar novo usuário
    document.getElementById('userForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const formData = new FormData(this);
        const userData = Object.fromEntries(formData.entries());
        await makeRequest(apiUrl+'/'+idUser, 'PUT', userData);

        window.close()
    });


    document.getElementById('delete-btn').addEventListener('click', async function(event) {
        await makeRequest(`${apiUrl}/${idUser}`, 'DELETE');
        
        window.close()
    });

    document.querySelector('#loader2').classList.add('d-none')
});
