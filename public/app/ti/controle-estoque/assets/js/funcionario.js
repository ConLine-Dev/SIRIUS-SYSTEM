// Função lista todos os colaboradores 
async function listCollaborators(data) {
    const collaborators = document.getElementById('listCollaborators');

    let html = '';

    //Essa funçao faz a busca no banco para puxar todos os colaboradores
    for (let i = 0; i < data.length; i++) {
        const item = data[i];

        html += `<li class="files-type" data-collaborator-id="${item.id}">
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

// Função lista os cards de adicionar novo produto e categoria
async function sales_cards(collaborator_id, data) {
    const cards = document.getElementById('cards')

    let html_cards = ''

    html_cards += `<div class="col-xxl-3 col-xl-6 col-lg-6 col-md-6" collaborator-id="${collaborator_id}">
                        <div class="card border custom-card shadow-none">
                            <div class="card-body bg-primary-transparent">
                                <div class="mb-4 folder-svg-container d-flex flex-wrap justify-content-center align-items-top">
                                    <div>
                                        <div class="dropdown">
                                        <button class="btn btn-primary me-2" data-bs-toggle="modal" data-bs-target="#add-product" style="margin-top: 50%;">+</button>
                                        </div>
                                    </div>
                                </div>   
                            </div>
                        </div>
                    </div>`


    for (let i = 0; i < data.length; i++) {
        const item = data[i];

        html_cards += `<div class="col-xxl-3 col-xl-6 col-lg-6 col-md-6">
                                <div class="card border custom-card shadow-none">
                                    <div class="card-body bg-primary-transparent" style="position: relative; padding: 3rem !important;">
                                        <div class="mb-4 folder-svg-container d-flex flex-wrap justify-content-center align-items-center">
                                            <div style="position: absolute; top: 50%; transform: translateY(-50%);">
                                                <span style="font-size: 1.25rem; font-weight: bold; text-transform: uppercase;">${item.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>`
    }

    cards.innerHTML = html_cards

}


// Função é executada quando for pesquisar e selecionar um colaborador  
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


    // ========== SELEÇAO VENDEDOR ========== // 
    const sales_selected = document.querySelectorAll('.files-type')
    sales_selected.forEach(item => {
        item.addEventListener('click', async function () {
            sales_selected.forEach(selected => {
                selected.classList.remove('active')
            });

            item.classList.add('active')

            const collaborator_id = this.getAttribute('data-collaborator-id')
            const getProductCategoryByCollaborator = await makeRequest(`/api/product/getProductCategory/${collaborator_id}`, 'POST',);
            await sales_cards(collaborator_id, getProductCategoryByCollaborator)

            const img_cards = document.getElementById('img-cards')
            const cards = document.getElementById('cards')

            if (!img_cards.classList.contains('d-none')) {
                img_cards.classList.add('d-none')
                cards.classList.remove('d-none')
            }
        })
    });
    // ========== FIM SELEÇAO VENDEDOR ========== // 


}


// Função executada após toda a página ser executada
window.addEventListener("load", async () => {

    const getAllCollaborators = await makeRequest('/api/collaborators/listAllCollaborators', 'POST',);


    await listCollaborators(getAllCollaborators)

    eventClick()


    // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
    document.querySelector('#loader2').classList.add('d-none')

})