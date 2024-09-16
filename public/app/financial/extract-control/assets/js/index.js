function createFolder() {
    const folderName = document.getElementById("create-folder1").value;

    if (folderName.trim() === "") {
        alert("Por favor, insira um nome para a pasta.");
        return;
    }

    const FoldersContainer = document.querySelector("#folders-container");

    FoldersContainer.innerHTML += `<div class="col-xxl-2 col-xl-4 col-lg-4 col-md-6">
                                        <div class="card border custom-card shadow-none">
                                            <div class="card-body bg-primary-transparent">
                                            <div class="mb-4 folder-svg-container d-flex flex-wrap justify-content-between align-items-top">
                                                <div>
                                                <svg xmlns="http://www.w3.org/2000/svg" class="svg-primary" data-name="Layer 1" viewBox="0 0 24 24">
                                                    <path opacity="1" d="M19.97586,10V9a3,3,0,0,0-3-3H10.69678l-.31622-.94868A3,3,0,0,0,7.53451,3H3.97586a3,3,0,0,0-3,3V19a2,2,0,0,0,2,2H3.3067a2,2,0,0,0,1.96774-1.64223l1.40283-7.71554A2,2,0,0,1,8.645,10Z"></path>
                                                    <path opacity="0.3" d="M22.02386,10H8.645a2,2,0,0,0-1.96777,1.64221L5.27441,19.35773A2,2,0,0,1,3.3067,21H19.55292a2,2,0,0,0,1.96771-1.64227l1.48712-8.17884A1,1,0,0,0,22.02386,10Z"></path>
                                                </svg>
                                                </div>
                                                <div>
                                                <div class="dropdown">
                                                    <button class="btn btn-sm btn-icon btn-primary btn-wave waves-light waves-effect waves-light" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                    <i class="ri-more-2-fill"></i>
                                                    </button>
                                                    <ul class="dropdown-menu">
                                                    <li>
                                                        <a class="dropdown-item" href="javascript:void(0);">Abrir</a>
                                                    </li>
                                                    <li>
                                                        <a class="dropdown-item" href="javascript:void(0);">Excluir</a>
                                                    </li>
                                                    <li>
                                                        <a class="dropdown-item" href="javascript:void(0);">Renomear</a>
                                                    </li>
                                                    <li>
                                                        <a class="dropdown-item" href="javascript:void(0);">Inativar</a>
                                                    </li>
                                                    </ul>
                                                </div>
                                                </div>
                                            </div>
                                            <p class="fs-14 fw-semibold mb-1 lh-1">
                                                <a href="javascript:void(0);">${folderName}</a>
                                            </p>
                                            <div class="d-flex align-items-center justify-content-between flex-wrap">
                                                <div>
                                                <span class="text-muted fs-12"> 246 Files </span>
                                                </div>
                                                <div>
                                                <span class="text-default fw-semibold"> 214.32MB </span>
                                                </div>
                                            </div>
                                            </div>
                                        </div>
                                        </div>`;


     // Limpa o input e fecha o modal
     document.getElementById("create-folder1").value = "";


     $('#create-folder').modal('hide')
}

function openModalCreateFolder(){
    $('#create-folder').modal('show')
}

document.addEventListener("DOMContentLoaded", async () => {

    //Chama a função
    // createFolder()
    
    // document.querySelector('#loader2').classList.add('d-none')
})