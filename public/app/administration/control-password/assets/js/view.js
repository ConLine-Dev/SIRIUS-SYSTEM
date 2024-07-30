

async function getPassword(id) {
    const Password = await makeRequest(`/api/control-password/getView`, 'POST', {id_password: id});
    console.log(Password)

    document.querySelector('div[name="title"]').textContent = Password.title
    document.querySelector('input[name="login"]').value = Password.login
    document.querySelector('input[name="password"]').value = Password.password
    document.querySelector('input[name="link"]').value = Password.link
} 



// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {
    // inicio da função verificar tempo de carregamento da pagina e suas consultas no banco
    console.time(`A página "${document.title}" carregou em`)


    // carrega os usuarios responsaveis
    await getPassword(21);

    
    // remover loader
    document.querySelector('#loader2').classList.add('d-none');


    // fim da função verificar tempo de carregamento da pagina e suas consultas no banco
    console.timeEnd(`A página "${document.title}" carregou em`);
})

