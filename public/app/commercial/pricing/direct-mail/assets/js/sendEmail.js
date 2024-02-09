let choicesInstance, inputSelectProposal, groupSend, modelEmail, bccSend,bccoSend,fileSend, quillEmailModel, selected = {model: false, title: false};
const StorageGoogleData = localStorage.getItem('StorageGoogle');
const StorageGoogle = JSON.parse(StorageGoogleData);
console.log(StorageGoogle)



document.addEventListener("DOMContentLoaded", async () => {
    await GenerateEditorText();
    await GenerateToEmail();
    await loadGroupSend();
    await loadModelsEmails();
    await createMask();
    await getAllProposalByRef();
    await createClicks();
    // await getAllGroups();
    // await ListModelsEditing();
    // await ListAllEmails()
    
})

async function GenerateEditorText(){
  /* mail editor */
  var toolbarOptions = [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    // [{ 'font': [] }],
    ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
    ['blockquote', 'code-block'],

    [{ 'header': 1 }, { 'header': 2 }],               // custom button values
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],

    [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
    [{ 'align': [] }],

    // ['image', 'video'],
    ['clean']                                         // remove formatting button
];

    const newQiall = new Quill('#mail-compose-editor', {
        modules: {
            toolbar: toolbarOptions,
            table: true,
        },
        theme: 'snow'
    });

    newQiall.on('editor-change', function(eventName, delta, oldDelta, source) {
        if (eventName === 'text-change' && source === 'user') {
            // Obtém todos os parágrafos no editor
            var paragraphs = document.querySelectorAll('#mail-compose-editor .ql-editor p');

            // Itera sobre cada parágrafo e adiciona o estilo de margem zero
            paragraphs.forEach(function(paragraph) {
                paragraph.style.margin = '0';
            });
        }
    });


 
}

async function GenerateToEmail(id = 0){


    const getContactsByGroup = await makeRequest(`/api/direct_mail_pricing/getContactsByGroup/${id}`)

    // Formate o array para ser usado com o Choices.js
    var listaDeOpcoes = getContactsByGroup.map(function(element) {
        return {
            customProperties:{name:element.name},
            value: `${element.email}`,
            label: `${element.name} [${element.email}]`,
            selected: true,
        };
    });

    
    // listaDeOpcoes.push({value:0, label:'Selecione', selected: true, disabled: true})

     // Destrua a instância anterior do Choices (se existir)
     if (choicesInstance) {
        choicesInstance.destroy();
    }

    choicesInstance = new Choices('select[name="emailTO"]', {
        choices: listaDeOpcoes,
        // allowHTML: true,
        allowSearch: true,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis'
    });
}

GenerateFileToProposal()

async function GenerateFileToProposal(id = 0){

    // const getContactsByGroup = await makeRequest(`/api/direct_mail_pricing/getContactsByGroup/${id}`)

    // Formate o array para ser usado com o Choices.js
    // var listaDeOpcoesFile = getContactsByGroup.map(function(element) {
    //     return {
    //         customProperties:{name:element.name},
    //         value: `${element.email}`,
    //         label: `${element.name} [${element.email}]`,
    //         selected: true,
    //     };
    // });

    
    // listaDeOpcoes.push({value:0, label:'Selecione', selected: true, disabled: true})

     // Destrua a instância anterior do Choices (se existir)
     if (fileSend) {
        fileSend.destroy();
    }

    fileSend = new Choices('select[name="fileSend"]', {
        // choices: [], //listaDeOpcoesFile,
        // allowHTML: true,
        allowSearch: true,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis'
    });

    console.log(fileSend)

    // Adicione um ouvinte de evento 'search'
    fileSend.passedElement.element.addEventListener('search', async function(event) {
        // event.detail.value contém o valor da pesquisa
        var searchTerm = event.detail.value;
        console.log(searchTerm)

        // Execute a sua lógica de pesquisa dinâmica aqui
        // Por exemplo, você pode chamar uma função que faz uma requisição AJAX para obter resultados de pesquisa com base em 'searchTerm'
        await performDynamicSearch(searchTerm);
    });
}

// Função para realizar a pesquisa dinâmica (exemplo com AJAX)
async function performDynamicSearch(searchTerm) {
    searchTerm = searchTerm || '';

    const optionsData = [
        { value: 'opcao1', label: 'Casa' },
        { value: 'opcao2', label: 'Carro' },
        { value: 'opcao3', label: 'Moto' },
        // Adicione mais opções conforme necessário
    ];

    const filteredOptions = optionsData.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    fileSend.setChoices(filteredOptions, 'value', 'label', true);
    // const getContactsByGroup = await makeRequest(`/api/direct_mail_pricing/getContactsByGroup/${id}`)


}

async function loadGroupSend(){
    const getGroups = await makeRequest('/api/direct_mail_pricing/getGroups')


    // Formate o array para ser usado com o Choices.js
    var listaDeOpcoes = getGroups.map(function(element) {
        return {
            value: `${element.id}`,
            label: `${element.name}`,
        };
    });

    listaDeOpcoes.push({value:0, label:'Selecione', selected: true, disabled: true})
    // Ordena a array usando a função de comparação
    listaDeOpcoes.sort(compareChoices);

    if (groupSend) {
        groupSend.destroy();
    }
    
    groupSend = new Choices('select[name="groupSend"]', {
        choices: listaDeOpcoes,
        // allowHTML: true,
        allowSearch: true,
        shouldSort: false,
        // removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        
    });

groupSend.passedElement.element.addEventListener('addItem',async function(event) {
    // do something creative here...
    // console.log(event.detail.id);
    // console.log(event.detail.value);
    // console.log(event.detail.label);
    // console.log(event.detail.customProperties);
    // console.log(event.detail.groupValue);
    await GenerateToEmail(event.detail.value)

  },false,);

}

async function loadModelsEmails(){
    const getAllModel = await makeRequest('/api/direct_mail_pricing/getAllModel')


    // Formate o array para ser usado com o Choices.js
    var listaDeOpcoes = getAllModel.map(function(element) {
        return {
            value: `${element.id}`,
            label: `${element.name}`,
        };
    });

    listaDeOpcoes.push({value:0, label:'Selecione', selected: true, disabled: false})

    // Ordena a array usando a função de comparação
    listaDeOpcoes.sort(compareChoices);

    if (modelEmail) {
        modelEmail.destroy();
    }
    
    modelEmail = new Choices('select[name="modelEmail"]', {
        choices: listaDeOpcoes,
        allowSearch: true,
        shouldSort: false,
        noChoicesText: 'Não há opções disponíveis'
    });

    modelEmail.passedElement.element.addEventListener('addItem',async function(event) {
        // do something creative here...
        // console.log(event.detail.id);
        // console.log(event.detail.value);
        // console.log(event.detail.label);
        // console.log(event.detail.customProperties);
        // console.log(event.detail.groupValue);
        if(event.detail.value != 0){
            await GenerateToModel(event.detail.value)
        }
        
    
      },false,);
}

async function createMask(){
    /* prefix */
    // new Cleave('input[name="RefProposta"]', {
    //     prefix: 'PF',
    //     delimiter: '/',
    //     blocks: [8, 2],
    //     uppercase: true
    // });
}

async function GenerateToModel(id = 0){
    const getModelById = await makeRequest(`/api/direct_mail_pricing/getModelById/${id}`)

    const refProposal = inputSelectProposal.getValue(true); //document.querySelector('input[name="RefProposta"]').value;
    if(!refProposal){
        // return false;
        document.querySelectorAll('input[name="subject"]')[0].value = getModelById[0].title;
        // getModelById[0].body += `<p><br></p><p><p>Atenciosamente / Kind regards / Mit freundlichen Grüßen / Saludos cordiales <br> <p><img src="https://cdn.conlinebr.com.br/assinatura/LOGO" alt="signature"><img src="https://cdn.conlinebr.com.br/assinatura/${StorageGoogle.system_id_headcargo}" alt="signature"></p><p><img src="https://cdn.conlinebr.com.br/assinatura/GRUPOS" alt="signature"></p><p><img src="https://cdn.conlinebr.com.br/assinatura/AVISOS" alt="signature"><p></p>`
        document.querySelectorAll('#mail-compose-editor .ql-editor')[0].innerHTML = getModelById[0].body;
    }else{
        document.querySelector('input[name="subject"]').value = 'Consultando, aguarde...'
        document.querySelectorAll('#mail-compose-editor .ql-editor')[0].innerHTML = 'Consultando, aguarde...'

        // Codifica a referência para garantir que as barras sejam tratadas corretamente na URL
        const refProposalEncoded = encodeURIComponent(refProposal);

        const getAllDetailsProposal = await makeRequest(`/api/direct_mail_pricing/getProposal`, 'POST', {body:refProposalEncoded})


        const getProposal = getAllDetailsProposal.result;
        const getProposalDetails = getAllDetailsProposal.table;


        if(getModelById.length > 0 && getProposal.length > 0 && validarFormatoString(refProposal)){

            const subject = await substituirValoresNaString(getModelById[0].title, getProposal[0]);
            document.querySelectorAll('input[name="subject"]')[0].value = subject;

            if(getProposalDetails.length > 0 && getProposalDetails[0].Quantidade != null){
                let quant = 0
                let comp = 0
                let larg = 0
                let alt = 0
                let met = 0
                let peso = 0
                getModelById[0].body += `<table id="tableCotation" style="border-collapse: collapse !important;font-size: small !important;"><tbody><tr><td data-row="row-v49i" style="border: 1px solid #000 !important; padding: 2px 5px !important;"><strong>VOLUME</strong></td><td data-row="row-v49i" style="border: 1px solid #000 !important; padding: 2px 5px !important;"><strong>COMPRIMENTO</strong></td><td data-row="row-v49i" style="border: 1px solid #000 !important; padding: 2px 5px !important;"><strong>LARGURA</strong></td><td data-row="row-v49i" style="border: 1px solid #000 !important; padding: 2px 5px !important;"><strong>ALTURA</strong></td><td data-row="row-v49i" style="border: 1px solid #000 !important; padding: 2px 5px !important;"><strong>CBM</strong></td><td data-row="row-v49i" style="border: 1px solid #000 !important; padding: 2px 5px !important;"><strong>PESO BRUTO</strong></td></tr>`;
                getProposalDetails.forEach(element => {
                    quant += element.Quantidade ? element.Quantidade : 0
                    comp += element.Comprimento ? element.Comprimento : 0
                    larg += element.Largura ? element.Largura : 0
                    alt += element.Altura ? element.Altura : 0
                    met += element.Metros_Cubicos ? element.Metros_Cubicos : 0
                    peso += element.Peso_Bruto ? element.Peso_Bruto : 0
                    getModelById[0].body += `<tr>
                                                <td data-row="row-nqh7" style="border: 1px solid #000 !important; padding: 2px 5px !important;">${element.Quantidade}x ${element.Embalagem}</td>
                                                <td data-row="row-nqh7" style="border: 1px solid #000 !important; padding: 2px 5px !important;">${element.Comprimento ? element.Comprimento.toFixed(2)+'cm' : '-'}</td>
                                                <td data-row="row-nqh7" style="border: 1px solid #000 !important; padding: 2px 5px !important;">${element.Largura ? element.Largura.toFixed(2)+'cm' : '-'}</td>
                                                <td data-row="row-nqh7" style="border: 1px solid #000 !important; padding: 2px 5px !important;">${element.Altura ? element.Altura.toFixed(2)+'cm' : '-'}</td>
                                                <td data-row="row-nqh7" style="border: 1px solid #000 !important; padding: 2px 5px !important;">${element.Metros_Cubicos ? element.Metros_Cubicos.toFixed(2)+'m³' : '-'}</td>
                                                <td data-row="row-nqh7" style="border: 1px solid #000 !important; padding: 2px 5px !important;">${element.Peso_Bruto ? element.Peso_Bruto.toFixed(2)+'kg' : '-'}</td>
                                            </tr>`
                });

                getModelById[0].body += `<tr style="border: 0px solid #000;">
                                                <td data-row="row-nqh7" style="border: 0px solid #000 !important; padding: 2px 5px !important;font-weight: bold;"></td>
                                                <td data-row="row-nqh7" style="border: 0px solid #000 !important; padding: 2px 5px !important;font-weight: bold;"></td>
                                                <td data-row="row-nqh7" style="border: 0px solid #000 !important; padding: 2px 5px !important;font-weight: bold;"></td>
                                                <td data-row="row-nqh7" style="border: 0px solid #000 !important; padding: 2px 5px !important;font-weight: bold;"></td>
                                                <td data-row="row-nqh7" style="border: 0px solid #000 !important; padding: 2px 5px !important;font-weight: bold;"></td>
                                                <td data-row="row-nqh7" style="border: 0px solid #000 !important; padding: 2px 5px !important;font-weight: bold;">TOTAL</td>
                                            </tr>`
                getModelById[0].body += `<tr>
                                                <td data-row="row-nqh7" style="border: 1px solid #000 !important; padding: 2px 5px !important;font-weight: bold;">${quant}x</td>
                                                <td data-row="row-nqh7" style="border: 1px solid #000 !important; padding: 2px 5px !important;font-weight: bold;">${comp != 0 ? comp.toFixed(2)+'cm' : '-'}</td>
                                                <td data-row="row-nqh7" style="border: 1px solid #000 !important; padding: 2px 5px !important;font-weight: bold;">${larg != 0 ? larg.toFixed(2)+'cm' : '-'}</td>
                                                <td data-row="row-nqh7" style="border: 1px solid #000 !important; padding: 2px 5px !important;font-weight: bold;">${alt != 0 ? alt.toFixed(2)+'cm' : '-'}</td>
                                                <td data-row="row-nqh7" style="border: 1px solid #000 !important; padding: 2px 5px !important;font-weight: bold;">${met != 0 ? met.toFixed(2)+'m³' : '-'}</td>
                                                <td data-row="row-nqh7" style="border: 1px solid #000 !important; padding: 2px 5px !important;font-weight: bold;">${peso != 0 ? peso.toFixed(2)+'kg' : '-'}</td>
                                            </tr>`
                getModelById[0].body += `</tbody></table>`
            }
            
            let emailBody = await substituirValoresNaString(getModelById[0].body, getProposal[0]);

            // emailBody += `<p><br></p><p><p>Atenciosamente / Kind regards / Mit freundlichen Grüßen / Saludos cordiales <br> <p><img src="https://cdn.conlinebr.com.br/assinatura/LOGO" alt="signature"><img src="https://cdn.conlinebr.com.br/assinatura/${StorageGoogle.system_id_headcargo}" alt="signature"></p><p><img src="https://cdn.conlinebr.com.br/assinatura/GRUPOS" alt="signature"></p><p><img src="https://cdn.conlinebr.com.br/assinatura/AVISOS" alt="signature"><p></p>`

            document.querySelectorAll('#mail-compose-editor .ql-editor')[0].innerHTML = emailBody;

        }else{
            document.querySelector('input[name="subject"]').value = 'Proposta não encontrada'
            document.querySelectorAll('#mail-compose-editor .ql-editor')[0].innerHTML = 'Proposta não encontrada';
            setTimeout(() => {
                document.querySelector('input[name="subject"]').value = '';
                document.querySelectorAll('#mail-compose-editor .ql-editor')[0].innerHTML = '';
            }, 2000);
        }
    }

    

 
}

async function createClicks(){

    
  


    const buttonSendEmail = document.querySelector('#buttonSendEmail');
    buttonSendEmail.addEventListener('click', async function(e){
        e.preventDefault();
        buttonSendEmail.disabled = true;
        buttonSendEmail.textContent = 'Enviando...'
        let bodyEmail = document.querySelectorAll('#mail-compose-editor .ql-editor')[0].innerHTML;

        // Obtenha as opções selecionadas
        const opcoesSelecionadas = choicesInstance.getValue();
        const opcoesSelecionadasCC = bccSend.getValue(true);
        const opcoesSelecionadasCCO = bccoSend.getValue(true);
        
        
        // Mapeie para obter apenas os IDs
        const idsSelecionados = opcoesSelecionadas.map(function(opcao) {
            return {
                email:opcao.value,
                name: opcao.customProperties && opcao.customProperties.name
            };
        });


        bodyEmail += `<p><br></p><p><p>Atenciosamente / Kind regards / Mit freundlichen Grüßen / Saludos cordiales <br> <p><img src="https://cdn.conlinebr.com.br/assinatura/LOGO" alt="signature"><img src="https://cdn.conlinebr.com.br/assinatura/${StorageGoogle.system_id_headcargo}" alt="signature"></p><p><img src="https://cdn.conlinebr.com.br/assinatura/GRUPOS" alt="signature"></p><p><img src="https://cdn.conlinebr.com.br/assinatura/AVISOS" alt="signature"><p></p>`

        const formBody = {
            body:bodyEmail, 
            EmailTO:idsSelecionados, 
            subject:document.querySelector('input[name="subject"]').value, 
            ccAddress:opcoesSelecionadasCC, 
            ccOAddress:opcoesSelecionadasCCO,
            system_userID:StorageGoogle.system_userID,
            proposalRef:inputSelectProposal.getValue(true)
        }

        const result = await makeRequest('/api/direct_mail_pricing/sendMail', 'POST', formBody)

        // buttonSendEmail.textContent = 'Enviar';
        // buttonSendEmail.disabled = false;
        await window.ipcRenderer.invoke('closeWindow');
        // await ListAllEmails()
        // document.querySelectorAll('.listEmails li')[0].click()

        // $('#mail-Compose').modal('hide');
        // console.log(result)
    })


     /* email address only */
     bccSend = new Choices('input[name="mailCC"]', {
        allowHTML: true,
        editItems: true,
        customAddItemText: 'Apenas valores que correspondam a condições específicas podem ser adicionados',
        // removeItemButton: true,
        addItemText: (value) => {
            return `Pressione Enter para adicionar <b>"${value}"</b>`;
          },
        addItemFilter: function (value) {
        if (!value) {
            return false;
        }
        const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const expression = new RegExp(regex.source, 'i');
        return expression.test(value);
        },
    }).setValue(['pricing.impo@conlinebr.com.br']);

    bccoSend = new Choices('input[name="mailCCO"]', {
        allowHTML: true,
        editItems: true,
        customAddItemText: 'Apenas valores que correspondam a condições específicas podem ser adicionados',
        // removeItemButton: true,
        addItemText: (value) => {
            return `Pressione Enter para adicionar <b>"${value}"</b>`;
          },
        addItemFilter: function (value) {
        if (!value) {
            return false;
        }
        const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const expression = new RegExp(regex.source, 'i');
        return expression.test(value);
        },
    })






}

async function getAllProposalByRef(){
    
     // Destrua a instância anterior do Choices (se existir)
     if (inputSelectProposal) {
        inputSelectProposal.destroy();
    }

   

    inputSelectProposal = new Choices('select[name="RefProposta"]', {
        // choices: [], //listaDeOpcoesFile,
        // allowHTML: true,
        // allowSearch: true,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis'
    });

    console.log('aqui', inputSelectProposal)

    
    new Cleave(inputSelectProposal.input.element, {
        // prefix: 'PF',
        // delimiter: '/',
        // blocks: [8, 2],
        uppercase: true
    });


    // Adicione um ouvinte de evento 'search'
    inputSelectProposal.passedElement.element.addEventListener('search', async function(event) {
        // event.detail.value contém o valor da pesquisa
        const searchTerm = event.detail.value || '';

        if(searchTerm.length > 5){
            const filteredOptions = await makeRequest(`/api/direct_mail_pricing/getAllProposalByRef`, 'POST', {body:searchTerm})
        
            inputSelectProposal.setChoices(filteredOptions, 'value', 'label', true);
        }

       
    });
}


function selectMark(value) {
 
    
    // Obtemos a posição do cursor dentro do editor
    const cursorPosition = quillEmailModel.selection.savedRange.index;

    // Verificamos se o cursor está dentro do input com o atributo name="subjectModel"
    const inputSubjectModel = document.querySelector('input[name="subjectModel"]');

    if (selected.title) {
        // Se sim, adicionamos o valor no input
        inputSubjectModel.value += value;
        inputSubjectModel.focus();
    } else if(selected.model) {
        // Caso contrário, adicionamos o valor no editor
        quillEmailModel.clipboard.dangerouslyPasteHTML(cursorPosition, value);

        // Calculamos a nova posição do cursor (após a inserção)
        const newPositionCursor = cursorPosition + value.length;

        // Definimos a nova posição do cursor
        quillEmailModel.setSelection(newPositionCursor);

        // Mantemos o foco no editor
        quillEmailModel.focus();
    }
}

// Função para verificar se a posição do cursor está dentro de um input específico
function isCursorInsideInput(cursorPosition, inputElement) {
    const inputStart = inputElement.selectionStart || 0;
    const inputEnd = inputElement.selectionEnd || 0;

    console.log(inputStart, inputEnd, cursorPosition)

    return cursorPosition >= inputStart && cursorPosition <= inputEnd;
}


async function newGroup(value){
    const registerGroup = await makeRequest('/api/direct_mail_pricing/registerGroup', 'POST', {body:value})

    await getAllGroups();
    await loadGroupSend();
      
}

async function newModelEmail(value){
    const registerGroup = await makeRequest('/api/direct_mail_pricing/registerModelEmail', 'POST', {body:value})

    await ListModelsEditing();
    // const newgroup = `<li class="files-type">
    //                     <a href="javascript:void(0)">
    //                         <div class="d-flex align-items-center">
    //                             <div class="me-2"> 
    //                                 <i class="ri-star-s-line fs-16"></i> 
    //                             </div> 
    //                             <span class="flex-fill text-nowrap"> ${value}
    //                             </span> 
    //                         </div>
    //                     </a>
    //                 </li>`;

    // bodyGroups.insertAdjacentHTML('afterbegin', newgroup)


            
}

async function newContact(name, email, groupID){
    const registerContact = await makeRequest('/api/direct_mail_pricing/registerContact', 'POST', {name:name, email:email, groupID:groupID})

    await getContactByGroup(groupID)




//     const newcontact = `<div class="col-4">
//     <div class="card custom-card">
//         <div class="card-body contact-action">
//             <div class="contact-overlay"></div>
//             <div class="d-flex align-items-top">
//                 <div class="d-flex flex-fill flex-wrap gap-3">
//                     <!-- <div class="avatar avatar-rounded bg-primary"> PW </div> -->
//                     <div>
//                         <h6 class="mb-1 fw-semibold"> ${name} </h6>
//                         <p class="mb-1 text-muted contact-mail text-truncate">${email}</p>
//                         <!-- <p class="fw-semibold fs-11 mb-0 text-primary"> +1(555) 238 2342 </p> -->
//                     </div>
//                 </div>
            
//             </div>
//             <div class="d-flex align-items-center justify-content-center gap-2 contact-hover-buttons">
//                 <button type="button" class="btn btn-sm btn-light contact-hover-btn"> <i class="ri-heart-3-fill text-danger"></i> Editar</button>
//                 <button type="button" class="btn btn-sm btn-light contact-hover-btn"> <i class="ri-heart-3-fill text-danger"></i> Remover</button>
//             </div>
//         </div>
//     </div>
// </div>`;

// bodyContacts.insertAdjacentHTML('afterbegin', newcontact)
}

async function getContactByGroup(id){
    const getContactByGroup = await makeRequest('/api/direct_mail_pricing/getContactByGroup/'+id)

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
                                            <span class="flex-fill text-nowrap"> ${element.name}
                                            </span> 
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
    });

    if(document.querySelectorAll('#bodyGroups li.files-type.active')[0]){
        document.querySelectorAll('#bodyGroups li.files-type.active')[0].click();
    }else{
        bodyContacts.innerHTML = '';
    }
    

}


async function removeGroup(e){
    const id = e.getAttribute('id')
    const result = await makeRequest(`/api/direct_mail_pricing/removeGroup/${id}`)

    await getAllGroups();
}

async function removeContact(e){
    const id = e.getAttribute('id')

    const result = await makeRequest(`/api/direct_mail_pricing/removeContact/${id}`)


    const groupID = document.querySelectorAll('#bodyGroups li.files-type.active')[0].getAttribute('id');
    

    if(result.affectedRows == 1){
        //sucesso
        await getContactByGroup(groupID)
    }

 
}

async function editContact(e){
    const id = e.getAttribute('id')

    const contactInf = await makeRequest(`/api/direct_mail_pricing/getContactByID/${id}`)

    document.querySelectorAll('#inputAddContact input')[0].value = contactInf[0].name;
    document.querySelectorAll('#inputAddContact input')[1].value = contactInf[0].email;

    // <i class="ri-add-circle-line text-muted"></i>

    document.querySelectorAll('#inputAddContact button i')[0].classList.remove('ri-add-circle-line')
    document.querySelectorAll('#inputAddContact button i')[0].classList.add('ri-save-line')
    document.querySelectorAll('#inputAddContact button')[0].setAttribute('editing', true)
    document.querySelectorAll('#inputAddContact button')[0].setAttribute('id', id)

    buttonAddContact.style.display = 'none';
    inputAddContact.style.display = 'flex';

    
}

async function saveContact(body){

    const result = await makeRequest('/api/direct_mail_pricing/editContact', 'POST', {body:{name:body.name, email:body.email, id:body.id}})

    if(result.changedRows == 1){
        //sucesso
        const groupID = document.querySelectorAll('#bodyGroups li.files-type.active')[0].getAttribute('id');
        await getContactByGroup(groupID)
    }

}

function search(e){
    var termoPesquisa = e.value.toLowerCase(); // Obtém o valor do input em minúsculas
    // Itera sobre os itens da lista e mostra/oculta com base no termo de pesquisa
    var listaItems = document.querySelectorAll('#bodyGroups li');
    listaItems.forEach(function(item) {
        var textoItem = item.querySelector('.flex-fill').textContent.toLowerCase();

        // Verifica se o texto do item contém o termo de pesquisa
        if (textoItem.includes(termoPesquisa)) {
            item.style.display = 'block'; // Mostra o item
        } else {
            item.style.display = 'none'; // Oculta o item
        }
    });
}

function searchModelEmail(e){
    var termoPesquisa = e.value.toLowerCase(); // Obtém o valor do input em minúsculas
    // Itera sobre os itens da lista e mostra/oculta com base no termo de pesquisa
    var listaItems = document.querySelectorAll('#bodyGroups li');
    listaItems.forEach(function(item) {
        var textoItem = item.querySelector('.flex-fill').textContent.toLowerCase();

        // Verifica se o texto do item contém o termo de pesquisa
        if (textoItem.includes(termoPesquisa)) {
            item.style.display = 'block'; // Mostra o item
        } else {
            item.style.display = 'none'; // Oculta o item
        }
    });
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

async function removeModel(e,event){
    // Evita a propagação do evento para o pai
    event.stopPropagation();

    const id = e.getAttribute('id');

    document.querySelectorAll('#ListModelsEmails li').forEach(async element => {
       if(element.getAttribute('id') == id && element.classList.contains('active')){
        document.querySelectorAll('.bodyModelEmailEditing').forEach(element => {
            element.style.display = 'none'
        });
    
        document.querySelectorAll('.projects-tracking-card').forEach(element => {
            element.style.display = 'flex'
        });

        element.remove()
        await makeRequest(`/api/direct_mail_pricing/removeModelEmail/${id}`)
        await loadModelsEmails();
       }else if(element.getAttribute('id') == id){
        element.remove()
        await makeRequest(`/api/direct_mail_pricing/removeModelEmail/${id}`)
        await loadModelsEmails();
       }

       
    });


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

async function SaveModelEmail(e){
    // e.preventDefault()

    const id = e.getAttribute('id');
    const subjectModel = document.querySelector('#detailsModelsEmails input[name="subjectModel"]').value;
    const name = nameModel.value
    const body = document.querySelectorAll('#detailsModelsEmails .ql-editor')[0].innerHTML;

    const saveModel = await makeRequest(`/api/direct_mail_pricing/editModelEmail`, 'POST', {body:{id:id, subject:subjectModel, name:name, body:body}})


    await ListModelsEditing()
    await selectModelByID(id, null, name)
    await loadModelsEmails();

    const listItem = document.querySelector(`#ListModelsEmails li[id="${id}"]`);
    if (listItem) {
        // Adicione a classe 'active'
        listItem.classList.add('active');
    }

}

function inputSearchContacts(e){
    var termoPesquisa = e.value.toLowerCase(); // Obtém o valor do input em minúsculas
    // Itera sobre os itens da lista e mostra/oculta com base no termo de pesquisa
    var listaItems = document.querySelectorAll('#bodyContacts div');
    listaItems.forEach(function(item) {
        var textoItem = item.querySelector('.flex-fill')?.textContent.toLowerCase();

        // Verifica se o texto do item contém o termo de pesquisa
        if (textoItem && textoItem.includes(termoPesquisa)) {
            item.style.display = 'flex'; // Mostra o item
        } else if(textoItem) {
            item.style.display = 'none'; // Oculta o item
        }
    });
}


async function ListAllEmailsByDept(){
    const ListAllEmailsByDept = await makeRequest('/api/direct_mail_pricing/ListAllEmailsByDept')
}

async function ListAllEmails(id){
    const ListAllEmails = await makeRequest('/api/direct_mail_pricing/ListAllEmails')
    // console.log(ListAllEmails)
    let listEmail = ''
    ListAllEmails.forEach(element => {
        // Cria um elemento temporário
        const tempElement = document.createElement('div');

        // Define o conteúdo HTML do elemento temporário
        tempElement.innerHTML = element.body;

        // Obtém o texto do elemento (sem interpretar as tags HTML)
        const textoInline = tempElement.textContent || tempElement.innerText;

        const classe = id && id == element.id ? 'active' : ''

        listEmail += `<li class="${classe}" style="cursor:pointer;" onclick="selectEmail(this,${element.id})">
        <div class="d-flex align-items-top">
        
            <div class="me-1 lh-1"> <span class="avatar avatar-md online me-2 avatar-rounded mail-msg-avatar"> 
                <img src="https://cdn.conlinebr.com.br/colaboradores/${element.id_headcargo}" alt=""> 
            </span> 
        </div>
            <div class="flex-fill">
                <a href="javascript:void(0);">
                    <p class="mb-1 fs-12"> ${element.name} <span class="float-end text-muted fw-normal fs-11">${formatarData(element.send_date)}</span> </p>
                </a>
                <p class=" mb-0"> 
                    <span class="d-block mb-0 fw-semibold">${element.subject}</span> 
                    <span class="fs-11 text-muted text-wrap">
                    ${(textoInline).slice(0,100)}...
                    </span>                                                            
                </p>
            </div>
        </div>
    </li>`;
    });


    


    document.querySelector('.listEmails').innerHTML = listEmail;
   
}


async function selectEmail(e,id){
    const getEmailById = await makeRequest(`/api/direct_mail_pricing/getEmailById/${id}`)

    
    document.querySelectorAll('.listEmails li').forEach(element => {
        element.classList.remove('active')
    });
    if(e){
        e.classList.add('active')
        document.querySelector('#defaultEmailsSelecte').style.display = 'none'
        document.querySelector('#emaildetails').style.display = 'block'
    }else{
        document.querySelector('#defaultEmailsSelecte').style.display = 'block'
        document.querySelector('#emaildetails').style.display = 'none'
    }
    
    

    document.querySelector('.subjectSelected').textContent = getEmailById[0].subject
    let bodyAllemailsSend = '<div class="accordion accordion-primary" id="accordionPrimaryExample">'
    let listTO = ''
    getEmailById.forEach(element => {
        listTO += element.to + ',';
        bodyAllemailsSend += `<div class="accordion-item">
                                    <h2 class="accordion-header" id="headingPrimaryOne"> 
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapsePrimaryOne${element.id} " aria-expanded="true" aria-controls="collapsePrimaryOne"> 
                                        ${element.to} 
                                   
                                        </button> 
                                    </h2>
                                    <div id="collapsePrimaryOne${element.id}" class="accordion-collapse collapse" aria-labelledby="headingPrimaryOne" data-bs-parent="#accordionPrimaryExample">
                                        <div class="" style="padding: 0.75rem 1rem;"> 
                                        ${element.body}
                                        </div>
                                    </div>
                             </div>`;
    });

    bodyAllemailsSend += '</div>'

    // Remova a vírgula extra no final, se houver
    listTO = listTO.slice(0, -1);

    
    document.querySelector('#imgEmailSelected').setAttribute('src',`https://cdn.conlinebr.com.br/colaboradores/${getEmailById[0].id_headcargo}`);
    document.querySelector('.emailsFromName').innerHTML = getEmailById[0].name;
    document.querySelector('.dateEmailSelectd').innerHTML = formatarData(getEmailById[0].send_date);
    document.querySelector('.emailsTO').innerHTML = listTO;
    document.querySelector('.bodyAllemailsSend').innerHTML = bodyAllemailsSend;
}

function searchMailList(e){
    var termoPesquisa = e.value.toLowerCase(); // Obtém o valor do input em minúsculas
    // Itera sobre os itens da lista e mostra/oculta com base no termo de pesquisa
    var listaItems = document.querySelectorAll('.listEmails li');
    listaItems.forEach(function(item) {
        var textoItem = item.textContent.toLowerCase();

        // Verifica se o texto do item contém o termo de pesquisa
        if (textoItem.includes(termoPesquisa)) {
            item.style.display = 'block'; // Mostra o item
        } else {
            item.style.display = 'none'; // Oculta o item
        }
    });
}

// SUPORTES ↓

function validarFormatoString(str) {
    // Define a expressão regular para o formato desejado
    const regex = /^PF\d{6}\/\d{2}$/;

    // Testa se a string corresponde à expressão regular
    return regex.test(str);
}

 function compareChoices(a, b) {
    if (a.value === 0) {
        return -1; // Move o item com value 0 para o início
    } else if (b.value === 0) {
        return 1; // Move o item com value 0 para o início
    } else {
        return a.label.localeCompare(b.label); // Ordena os outros itens por label
    }
}

async function substituirValoresNaString(str, parametros) {
    // Itera sobre as chaves do objeto de parâmetros
    for (const chave in parametros) {
        if (parametros.hasOwnProperty(chave)) {
            // Constrói o padrão a ser substituído, por exemplo, '@nome'
            const padrao = `@${chave}`;

            // Obtém o valor correspondente ao padrão
   
            let valor;

            if(parametros[chave] == null){
                parametros[chave] = 'A SER CONFIRMADO';
            }
            
            if(chave == 'Mercadoria'){
                if(contemPalavra(parametros[chave])){
                    valor = '<strong style="color: rgb(230, 0, 0);">'+parametros[chave]+'</strong>';
                }else{
                    valor = parametros[chave];
                }
            }else if(chave == 'Valor_Mercadoria'){
                if(parametros['Moeda_Mercadoria'] != null){
                    valor = parametros[chave].toLocaleString('pt-BR', { style: 'currency', currency: parametros['Moeda_Mercadoria'] });
                }else{
                    valor = 'A SER CONFIRMADO';
                }
                
            }else if(chave == 'NCM_Descricao'){
                if(parametros['NCM_Descricao'] != null){
                    valor = parametros[chave];
                }else{
                    valor = 'A SER CONFIRMADO';
                }
                
            }else{
                valor = parametros[chave];
            }
            
            

            // Substitui todas as ocorrências do padrão pelo valor na string
            str = str.split(padrao).join(valor);
        }
    }





    return str;
}

function contemPalavra(str) {
    const regex = /\bNAO EMPILHAVEL\b/;
    return regex.test(str);
}

function formatarData(dataStr) {
    // Dividir a string de data em partes
    const partesDataHora = dataStr.split(' ');
    const partesData = partesDataHora[0].split('-');
    const partesHora = partesDataHora[1].split(':');
  
    // Criar um objeto Date com as partes
    const dataObj = new Date(
      partesData[0],
      partesData[1] - 1, // Os meses em JavaScript são de 0 a 11
      partesData[2],
      partesHora[0],
      partesHora[1],
      partesHora[2]
    );
  
    // Formatar a data no estilo desejado (DD/MM/YYYY HH:mm:ss)
    const dataFormatada = `${zeroEsquerda(dataObj.getDate())}/${zeroEsquerda(
      dataObj.getMonth() + 1
    )}/${dataObj.getFullYear()} ${zeroEsquerda(dataObj.getHours())}:${zeroEsquerda(
      dataObj.getMinutes()
    )}:${zeroEsquerda(dataObj.getSeconds())}`;
  
    return dataFormatada;
  }
  
  // Função auxiliar para adicionar zero à esquerda, se necessário
  function zeroEsquerda(valor) {
    return valor < 10 ? `0${valor}` : valor;
  }

