async function listCollaborators(data) {
    const collaborators = document.getElementById('listCollaborators');
    let html = '';

    for (let i = 0; i < data.length; i++) {
        const item = data[i];

        html += `<li class=" files-type">
                    <a href="javascript:void(0)">
                        <div class="d-flex align-items-center">
                            <div class="me-2"> 
                                <span class="avatar bg-light avatar-md mb-1"> 
                                    <img src="https://cdn.conlinebr.com.br/colaboradores/${item.id_headcargo}" alt="">
                                </span>
                            </div> 
                            <span class="flex-fill text-nowrap"> ${item.name} ${item.family_name} </span>
                        </div>
                    </a>
                </li>`
    }

    collaborators.innerHTML = html;
}

// Esta função é executada após toda a página ser executada
window.addEventListener("load", async () => {

    const getAllCollaborators = await makeRequest('/api/collaborators/listAllCollaborators', 'POST',);

    await listCollaborators(getAllCollaborators)







    // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
    document.querySelector('#loader2').classList.add('d-none')

})