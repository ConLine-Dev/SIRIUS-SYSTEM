let selectDepts, selectModules;

async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);

    return StorageGoogle;
}

async function sendComment() {

    let login = await getInfosLogin();
    const collabId = login.system_collaborator_id;
    const title = document.querySelector('input[name="title"]').value;
    const date = document.querySelector('input[name="commentDate"]').value;
    const dept = document.querySelector('select[name="depts"]').value;
    const modules = document.querySelector('select[name="modules"]').value;
    const comment = document.querySelector('textarea[name="comment"]').value;
    let valid = 1;
    let errorMessage = '';

    if (!title) {
        valid = 0;
        errorMessage += `O comentário deve ter um título para ser salvo; <br>`;
    }
    if (!date) {
        valid = 0;
        errorMessage += `Precisamos de uma data de vigência do comentário; <br>`
    }
    if (!dept && !modules) {
        valid = 0;
        errorMessage += `Você precisa vincular o comentário a um departamento ou módulo; <br>`
    }
    if (!comment) {
        valid = 0;
        errorMessage += `O mais importante aqui é o comentário, escreva algo para seguir; <br>`
    }

    if (valid == 0) {
        Swal.fire({
            icon: "error",
            title: "Não foi possível enviar!",
            html: errorMessage,
        });
    } else if (valid == 1) {
        const answer = {title, date, dept, modules, comment, collabId};
        await makeRequest(`/api/internal-comments/saveComment`, 'POST', answer);

        Swal.fire({
            icon: "success",
            title: "Comentário enviado!",
        });
        await resetInputs(login);
    }
}

async function resetInputs(login) {
    document.querySelector('input[name="title"]').value = ''
    document.querySelector('input[name="commentDate"]').value = ''
    document.querySelector('textarea[name="comment"]').value = ''

    await getDepartments(login.system_collaborator_id);
    await getModules(login.system_userID);
    await listAccordion(login.system_collaborator_id);

}

async function getDepartments(collabId) {

    const depts = await makeRequest(`/api/internal-comments/deptsByUser`, 'POST', { collabId: collabId });

    const selectList = [
        { value: '', label: 'Selecione um departamento', disabled: true, selected: true }, // Item vazio inicial
        ...depts.map(element => ({
            value: `${element.department_id}`,
            label: `${element.name}`,
        })),
    ];

    if (selectDepts) {
        selectDepts.destroy();
    }

    selectDepts = new Choices('select[name="depts"]', {
        choices: selectList,
        shouldSort: false,
        removeItemButton: false,
        noChoicesText: 'Não há opções disponíveis',
        searchEnabled: false,
        allowHTML: true,
    });
}

async function getModules(userId) {
    const modules = await makeRequest(`/api/internal-comments/modulesByUser`, 'POST', { userId: userId });

    const selectList = [
        { value: '', label: 'Selecione um módulo', disabled: true, selected: true }, // Item vazio inicial
        ...modules.map(element => ({
            value: `${element.modules_id}`,
            label: `${element.title}`,
        })),
    ];

    if (selectModules) {
        selectModules.destroy();
    }

    selectModules = new Choices('select[name="modules"]', {
        choices: selectList,
        shouldSort: false,
        removeItemButton: false,
        noChoicesText: 'Não há opções disponíveis',
        searchEnabled: true,
        allowHTML: true,
    });
}

async function createTable(deptId) {
    const comments = await makeRequest(`/api/internal-comments/commentsByDept`, 'POST', { deptId: deptId });
    let accordionData = '';
    
    for (let index = 0; index < comments.length; index++) {
        let moduleLine = '';
        comments[index].comment_date = new Date(comments[index].comment_date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });

        if (comments[index].module) {
            moduleLine = `<span class="float-end fs-11 text-muted">Módulo: ${comments[index].module}</span><br>`
        }

        accordionData += `<li>
                            <div> <span class="avatar avatar-sm avatar-rounded profile-timeline-avatar">
                                <img src="https://cdn.conlinebr.com.br/colaboradores/${comments[index].id_headcargo}" alt=""> </span>
                                <p class="mb-1"><b>${comments[index].name} ${comments[index].family_name}</b></p>
                                <p class="mb-1">${comments[index].title}
                                    ${moduleLine}
                                    <span class="float-end fs-11 text-muted">${comments[index].comment_date}</span>
                                </p>
                                <p class="text-muted">${comments[index].description}</p>
                            </div>
                        </li>`
    }
    return accordionData;
}

async function listAccordion(collabId) {
    const listDiv = document.getElementById('listAccordion');
    let listData = '';

    const depts = await makeRequest(`/api/internal-comments/deptsByUser`, 'POST', { collabId: collabId });

    for (let index = 0; index < depts.length; index++) {
        let data = await createTable(depts[index].department_id);
        listData += `<div class="accordion-item">
                        <h2 class="accordion-header" id="${depts[index].department_id}">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                data-bs-target="#accordion${depts[index].department_id}" aria-expanded="true"
                                aria-controls="collapsePrimaryOne">Comentários ${depts[index].name}</button>
                        </h2>
                        <div id="accordion${depts[index].department_id}" class="accordion-collapse collapse" style="margin-top: 1%;"
                            aria-labelledby="headingPrimaryOne" data-bs-parent="#accordionPrimaryExample">
                            <ul class="list-unstyled profile-timeline">
                                ${data}
                            </ul>
                        </div>
                    </div>`
    }

    listDiv.innerHTML = listData;

    document.querySelector('.accordion-button').click();
    
}

async function initializeDatePicker() {
    flatpickr("#commentDate", {
        dateFormat: "d-m-Y",
    });
};

window.addEventListener("load", async () => {

    let login = await getInfosLogin();
    await initializeDatePicker();
    await getDepartments(login.system_collaborator_id);
    await getModules(login.system_userID);
    await listAccordion(login.system_collaborator_id);

    introMain();

    document.querySelector('#loader2').classList.add('d-none')

})