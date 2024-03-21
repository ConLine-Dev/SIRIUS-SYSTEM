let choicesInstance, inputSelectProposal,inputFileSelectProposal, groupSend, modelEmail, bccSend,bccoSend,fileSend, quillEmailModel, selected = {model: false, title: false};
const StorageGoogleData = localStorage.getItem('StorageGoogle');
const StorageGoogle = JSON.parse(StorageGoogleData);

const socket = io();

document.addEventListener("DOMContentLoaded", async () => {
    await ListModelsEditing()
    await getAllGroups();
    await createClicks();
})

async function createClicks(){

}


async function getAllGroups(){
    const getAllGroups = await makeRequest('/api/direct_mail_pricing/getAllGroups/')
  
    let allgroups = '';
    let count = 0;
    getAllGroups.forEach(element => {
        
        const classe = count == 0 ? 'active' : ''
        allgroups += `<li class="files-type ${classe}" id="${element.id}">
                                    <a href="javascript:void(0)" >
                                        <div class="d-flex align-items-center">
                                            <div class="me-2"> 
                                                <i class="ri-star-s-line fs-16"></i> 
                                            </div> 
                                            <span class="flex-fill text-nowrap">${element.name}</span> 
                                            <div class="me-2 removeGroup" id="${element.id}" onclick="removeGroup(this)"> 
                                                <i class="ri-close-circle-line text-muted"></i>
                                            </div> 
                                            
                                        </div>
                                    </a>
                                </li>`;
        count++
    });

    bodyGroups.innerHTML = allgroups




    document.querySelectorAll('#bodyGroups li').forEach(element => {
        element.addEventListener('click', async function(e){
            document.querySelectorAll('#bodyGroups li').forEach(element2 => {
                element2.classList.remove('active')
            });

            element.classList.add('active')
            const id = element.getAttribute('id')
            await getContactByGroup(id);

        })

        element.addEventListener('dblclick', async function (e) {
            const id = element.getAttribute('id');
            const spanElement = element.querySelector('span');
            const text = spanElement.textContent;
        
            // Criar um novo input e atribuir o valor atual do span
            const inputElement = document.createElement('input');
            inputElement.type = 'text';
            inputElement.className = 'form-control bg-light border-0';
            inputElement.value = text;
        
            // Substituir o span pelo input
            spanElement.replaceWith(inputElement);
        
            // Adicionar ouvinte de eventos para o evento blur no novo input
            inputElement.addEventListener('blur', async function () {
                // Atualizar o textContent do span com o valor do input
                const value = inputElement.value
                spanElement.textContent = inputElement.value;
        
                // Substituir o input pelo span novamente
                inputElement.replaceWith(spanElement);

                await editingNameGroup(id, value)
            });
        
            // Focar no novo input para que o usuário possa editar imediatamente
            inputElement.focus();
        });
    });

    if(document.querySelectorAll('#bodyGroups li.files-type.active')[0]){
        document.querySelectorAll('#bodyGroups li.files-type.active')[0].click();
    }else{
        bodyContacts.innerHTML = '';
    }
    

}

async function ListModelsEditing(){
    const getAllModel = await makeRequest(`/api/direct_mail_pricing/getAllModel`)

    ListModelsEmails.innerHTML = ''
    let allModelsEmails = '';
    let count = 0;
    getAllModel.forEach(element => {
        
        // const classe = count == 0 ? 'active' : ''
        allModelsEmails += `<li class="files-type " id="${element.id}" onclick="selectModelByID(${element.id}, this, '${element.name}')">
                                    <a href="javascript:void(0)" >
                                        <div class="d-flex align-items-center">
                                            <div class="me-2"> 
                                                <i class="ri-star-s-line fs-16"></i> 
                                            </div> 
                                            <span class="flex-fill text-nowrap"> ${element.name}
                                            </span> 
                                            <div class="me-2 removeModel" id="${element.id}" style="z-index:9999999999" onclick="removeModel(this, event)"> 
                                                <i class="ri-close-circle-line text-muted"></i>
                                            </div> 
                                            
                                        </div>
                                    </a>
                                </li>`;
        if(count == 0){
            // selectModelByID(element.id)
        }
        count++
    });

    ListModelsEmails.innerHTML = allModelsEmails

  
}

async function selectModelByID(id, e, name){
    const getModel = await makeRequest(`/api/direct_mail_pricing/getModelById/${id}`)

    
    document.querySelectorAll('.bodyModelEmailEditing').forEach(element => {
        element.style.display = 'flex'
    });

    document.querySelectorAll('.projects-tracking-card').forEach(element => {
        element.style.display = 'none'
    });


    document.querySelectorAll('#ListModelsEmails li').forEach(element => {
        // element.style.display = 'none'
        element.classList.remove('active')
    });

    e?.classList.add('active')

    nameModel.value = name;;
    document.querySelector('.btnSaveModelEmail').setAttribute('id', id)
    document.querySelector('#detailsModelsEmails input[name="subjectModel"]').value = getModel[0].title
    document.querySelectorAll('#detailsModelsEmails .ql-editor')[0].innerHTML = getModel[0].body;
    
}

async function getContactByGroup(id){
    const getContactByGroup = await makeRequest('/api/direct_mail_pricing/getContactByGroup/'+id)
    console.log(getContactByGroup)

    let allContats = ''
    getContactByGroup.forEach(element => {
        allContats += `<div class="col-4">
        <div class="card custom-card">
            <div class="card-body contact-action">
                <div class="contact-overlay"></div>
                <div class="d-flex align-items-top">
                    <div class="d-flex flex-fill flex-wrap gap-3">
                        <!-- <div class="avatar avatar-rounded bg-primary"> PW </div> -->
                        <div>
                            <h6 class="mb-1 fw-semibold"> ${element.name} </h6>
                            <p class="mb-1 text-muted contact-mail text-truncate">${element.email}</p>
                            <!-- <p class="fw-semibold fs-11 mb-0 text-primary"> +1(555) 238 2342 </p> -->
                        </div>
                    </div>
                
                </div>
                <div class="d-flex align-items-center justify-content-center gap-2 contact-hover-buttons">
                    <button type="button" id="${element.id}" onclick="editContact(this)" class="btn btn-sm btn-light contact-hover-btn"> <i class="ri-heart-3-fill text-danger"></i> Editar</button>
                    <button type="button" id="${element.id}" onclick="removeContact(this)" class="btn btn-sm btn-light contact-hover-btn"> <i class="ri-heart-3-fill text-danger"></i> Remover</button>
                </div>
            </div>
        </div>
    </div>`;
    });

    bodyContacts.innerHTML = allContats 

}


