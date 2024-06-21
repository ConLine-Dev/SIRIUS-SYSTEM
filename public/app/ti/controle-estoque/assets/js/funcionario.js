async function listCollaborators(data) {
    const collaborators = document.getElementById('listCollaborators');
    let html = '';

    for (let i = 0; i < data.length; i++) {
        const item = data[i];

        html += `<li class="files-type">
                    <a href="javascript:void(0)">
                        <div class="d-flex align-items-center">
                            <div class="me-2"> 
                                <span class="avatar bg-light avatar-md mb-1"> 
                                    <img src="https://cdn.conlinebr.com.br/colaboradores/${item.id_headcargo}" alt="">
                                </span>
                            </div> 
                            <span class="name flex-fill text-nowrap"> ${item.name} ${item.family_name} </span>
                        </div>
                    </a>
                </li>`
    }

    collaborators.innerHTML = html;
}

function eventClick() {

    // ========== PESQUISA ========== //    
    const input_search = document.querySelector('#search');
    input_search.addEventListener('keyup', function (e) {
        e.preventDefault();
        let term_search = this.value.toLowerCase(); // Obtém o valor do input em maiúscula
        // Itera sobre os itens da lista e mostra/oculta com base no termo de pesquisa
        let list_items = document.querySelectorAll('.list-unstyled .files-type');
        list_items.forEach(function (item) {
            let textoItem = item.querySelector('.name').textContent.toLowerCase();

            // Verifica se o texto do item contém o termo de pesquisa
            if (textoItem.includes(term_search)) {
                item.style.display = 'block'; // Mostra o item
            } else {
                item.style.display = 'none'; // Oculta o item
            }
        });
    })
    // ========== FIM PESQUISA ========== // 
}


// Esta função é executada após toda a página ser executada
window.addEventListener("load", async () => {

    const getAllCollaborators = await makeRequest('/api/collaborators/listAllCollaborators', 'POST',);

    await listCollaborators(getAllCollaborators)

    eventClick()


    // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
    document.querySelector('#loader2').classList.add('d-none')

})