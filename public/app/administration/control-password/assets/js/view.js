// Função para pegar os dados do password
async function getPassword(id) {
    const Password = await makeRequest(`/api/control-password/getView`, 'POST', {id_password: id});

    document.querySelector('div[name="title"]').textContent = Password.title
    document.querySelector('input[name="login"]').value = Password.login
    document.querySelector('input[name="password"]').value = Password.password
    document.querySelector('input[name="link"]').value = Password.link
} 

// Função para receber o id da pessoa que esta sendo aberta nesta janela
async function getPasswordInfo() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const id = urlParams.get('id');
    return id;
 };


// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {
    const password_id = await getPasswordInfo()
    // carrega os dados da senha 
    await getPassword(password_id);

    // remover loader
    document.querySelector('#loader2').classList.add('d-none');
})


