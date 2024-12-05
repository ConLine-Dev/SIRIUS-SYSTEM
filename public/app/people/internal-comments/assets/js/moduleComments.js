let selectDepts, selectModules;

async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);

    return StorageGoogle;
}

async function listAccordion() {
    const listDiv = document.getElementById('listAccordion');
    let listData = '';

    const comments = await makeRequest(`/api/pricing-main/commentsByModule`, 'POST', { moduleId: 59 });
    let accordionData = '';
    
    for (let index = 0; index < comments.length; index++) {
        comments[index].comment_date = new Date(comments[index].comment_date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });

        accordionData += `<li>
                            <div> <span class="avatar avatar-sm avatar-rounded profile-timeline-avatar">
                                <img src="https://cdn.conlinebr.com.br/colaboradores/${comments[index].id_headcargo}" alt=""> </span>
                                <p class="mb-1"><b>${comments[index].name} ${comments[index].family_name}</b></p>
                                <p class="mb-1">${comments[index].title}
                                    <span class="float-end fs-11 text-muted">Módulo: ${comments[index].module}</span><br>
                                    <span class="float-end fs-11 text-muted">${comments[index].comment_date}</span>
                                </p>
                                <p class="text-muted">${comments[index].description}</p>
                            </div>
                        </li>`
    }
    
    listData += `<div class="accordion-item">
                    <h2 class="accordion-header" id="0">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                            data-bs-target="#accordion0" aria-expanded="true"
                            aria-controls="collapsePrimaryOne">Comentários</button>
                    </h2>
                    <div id="accordion0" class="accordion-collapse collapse" style="margin-top: 1%;"
                        aria-labelledby="headingPrimaryOne" data-bs-parent="#accordionPrimaryExample">
                        <ul class="list-unstyled profile-timeline">
                            ${accordionData}
                        </ul>
                    </div>
                </div>`

    listDiv.innerHTML = listData;

    document.querySelector('.accordion-button').click();
}

window.addEventListener("load", async () => {

    let login = await getInfosLogin();
    await listAccordion();

    document.querySelector('#loader2').classList.add('d-none')

})