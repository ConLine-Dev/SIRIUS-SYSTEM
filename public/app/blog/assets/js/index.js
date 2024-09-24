/**
 * Event listener que é acionado quando o conteúdo do DOM é carregado.
 * Chama a função listAllPosts e oculta o elemento de carregamento.
 */
document.addEventListener("DOMContentLoaded", async () => {
 
    await listAllPosts() 
    document.querySelector('#loader2').classList.add('d-none')
})


/**
 * Busca todas as postagens da API e as renderiza na página.
 * @returns {Promise<void>} Uma promise que é resolvida quando as postagens são renderizadas.
 */

async function listAllPosts(){
    const AllPosts = await makeRequest(`/api/posts/listAll`);

    const bodyPosts = document.querySelector('.bodyPosts');
    let posts = '';
    AllPosts.forEach(element => {
        posts += `<div class="row">
        <div class="col-xl-12">
          <div class="card custom-card">
            <div class="card-body">
              <p class="fs-18 fw-semibold mb-1">${element.title}</p>
              <div class="d-sm-flex align-items-cneter">
                <div class="d-flex align-items-center flex-fill">
                  <span class="avatar avatar-sm avatar-rounded me-3">
                    <img src="https://cdn.conlinebr.com.br/colaboradores/${element.id_headcargo}" alt="">
                  </span>
                  <div>
                    <p class="mb-0 fw-semibold">${element.name} - <span class="fs-11 text-muted fw-normal">${element.date}</span>
                    </p>
                    <p class="mb-0 text-muted"></p>
                  </div>
                </div>
             
              </div>
            </div>
          

            <div class="card-body">
            
              <p class="mb-4 text-muted"> 
              ${element.body}
               </p>

            
            </div>

            <div class="card-body border-bottom border-block-end-dashed">
              <div class="d-sm-flex d-block align-items-center justify-content-between">
                <div class="d-flex align-items-cener">
                  <button class="btn btn-icon btn-sm btn-primary-light" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Curtir">
                      <i class="ri-thumb-up-line"></i>
                    </button>
                
                </div>
                <div class="btn-list mt-sm-0 mt-2">
                  <span class="badge bg-success-transparent me-3">
                      <i class="ri-thumb-up-line me-1 align-middle d-inline-block"></i> ${element.num_likes} Curtida${element.num_likes.length > 1 ? '' : 's'} </span>
                </div>
              </div>
            </div>
          </div>
        </div>
   
      </div>`
    });

    bodyPosts.innerHTML = posts+posts+posts+posts+posts+posts+posts+posts+posts+posts+posts+posts+posts+posts+posts
}