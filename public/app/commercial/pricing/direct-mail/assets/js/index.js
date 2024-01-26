let choicesInstance, groupSend, modelEmail, bccSend;
const StorageGoogleData = localStorage.getItem('StorageGoogle');
const StorageGoogle = JSON.parse(StorageGoogleData);
document.addEventListener("DOMContentLoaded", async () => {
    await GenerateEditorText();
    await GenerateToEmail();
    await loadGroupSend();
    await loadModelsEmails();
    await createMask();
    await createClicks();
    await getAllGroups();
    
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

    new Quill('#mail-compose-editor', {
        modules: {
            toolbar: toolbarOptions,
            table: true,
        },
        theme: 'snow'
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
    new Cleave('input[name="RefProposta"]', {
        prefix: 'PF',
        delimiter: '/',
        blocks: [8, 2],
        uppercase: true
    });
}

async function GenerateToModel(id = 0){
    const getModelById = await makeRequest(`/api/direct_mail_pricing/getModelById/${id}`)

    const refProposal = document.querySelector('input[name="RefProposta"]').value;
    document.querySelector('input[name="subject"]').value = 'Consultando, aguarde...'
    document.querySelectorAll('#mail-compose-editor .ql-editor')[0].innerHTML = 'Consultando, aguarde...'

    // Codifica a referência para garantir que as barras sejam tratadas corretamente na URL
    const refProposalEncoded = encodeURIComponent(refProposal);
    const getAllDetailsProposal = await makeRequest(`/api/direct_mail_pricing/getProposal/${refProposalEncoded}`)
    const getProposal = getAllDetailsProposal.result;
    const getProposalDetails = getAllDetailsProposal.table;

    console.log(getProposal)

    if(getModelById.length > 0 && getProposal.length > 0 && validarFormatoString(refProposal)){

        const subject = await substituirValoresNaString(getModelById[0].title, getProposal[0]);
        document.querySelectorAll('input[name="subject"]')[0].value = subject;

        if(getProposalDetails.length > 0 && getProposalDetails[0].Quantidade != null){
            getModelById[0].body += `<table id="tableCotation" style="border-collapse: collapse;"><tbody><tr><td data-row="row-v49i" style="border: 1px solid #000; padding: 2px 5px;"><strong>VOLUME</strong></td><td data-row="row-v49i" style="border: 1px solid #000; padding: 2px 5px;"><strong>COMPRIMENTO</strong></td><td data-row="row-v49i" style="border: 1px solid #000; padding: 2px 5px;"><strong>LARGURA</strong></td><td data-row="row-v49i" style="border: 1px solid #000; padding: 2px 5px;"><strong>ALTURA</strong></td><td data-row="row-v49i" style="border: 1px solid #000; padding: 2px 5px;"><strong>CBM</strong></td><td data-row="row-v49i" style="border: 1px solid #000; padding: 2px 5px;"><strong>PESO BRUTO</strong></td></tr>`;
            getProposalDetails.forEach(element => {
                getModelById[0].body += `<tr>
                                            <td data-row="row-nqh7" style="border: 1px solid #000; padding: 2px 5px;">${element.Quantidade}x ${element.Embalagem}</td>
                                            <td data-row="row-nqh7" style="border: 1px solid #000; padding: 2px 5px;">${element.Comprimento.toFixed(2)}cm</td>
                                            <td data-row="row-nqh7" style="border: 1px solid #000; padding: 2px 5px;">${element.Largura.toFixed(2)}cm</td>
                                            <td data-row="row-nqh7" style="border: 1px solid #000; padding: 2px 5px;">${element.Altura.toFixed(2)}cm</td>
                                            <td data-row="row-nqh7" style="border: 1px solid #000; padding: 2px 5px;">${element.Metros_Cubicos.toFixed(2)}m³</td>
                                            <td data-row="row-nqh7" style="border: 1px solid #000; padding: 2px 5px;">${element.Peso_Bruto.toFixed(2)}kb</td>
                                        </tr>`
            });
            getModelById[0].body += `</tbody></table>`
        }
       

        getModelById[0].body += `<p><br></p><p><p>Atenciosamente / Kind regards / Mit freundlichen Grüßen / Saludos cordiales <br> <p><img src="https://cdn.conlinebr.com.br/assinatura/LOGO" alt="signature"><img src="https://cdn.conlinebr.com.br/assinatura/${StorageGoogle.system_id_headcargo}" alt="signature"></p><p><img src="https://cdn.conlinebr.com.br/assinatura/GRUPOS" alt="signature"></p><p><img src="https://cdn.conlinebr.com.br/assinatura/AVISOS" alt="signature"><p></p>`
       
        const emailBody = await substituirValoresNaString(getModelById[0].body, getProposal[0]);
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

async function createClicks(){
    const buttonSendEmail = document.querySelector('#buttonSendEmail');
    buttonSendEmail.addEventListener('click', async function(e){
        e.preventDefault();

        const bodyEmail = document.querySelectorAll('#mail-compose-editor .ql-editor')[0].innerHTML;

        // Obtenha as opções selecionadas
        const opcoesSelecionadas = choicesInstance.getValue();
        const opcoesSelecionadasCC = bccSend.getValue(true);
        
        
        // Mapeie para obter apenas os IDs
        const idsSelecionados = opcoesSelecionadas.map(function(opcao) {
            return {
                email:opcao.value,
                name: opcao.customProperties && opcao.customProperties.name
            };
        });


        const teste = await makeRequest('/api/direct_mail_pricing/sendMail', 'POST', {body:bodyEmail, EmailTO:idsSelecionados, subject:document.querySelector('input[name="subject"]').value, ccAddress:opcoesSelecionadasCC})
        // console.log(teste)
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
    }).setValue(['ti@conlinebr.com.br']);



    buttonAddGroup.addEventListener('click', function(e){
        e.preventDefault();
        buttonAddGroup.style.display = 'none';
        inputAddGroup.style.display = 'flex';
        document.querySelector('#inputAddGroup input').focus()
    })

    document.querySelector('#inputAddGroup button').addEventListener('click', async function(e){
        e.preventDefault();
        const value = document.querySelector('#inputAddGroup input').value
        if(value != ''){
            await newGroup(value)
            document.querySelector('#inputAddGroup input').value = ''
            buttonAddGroup.style.display = 'flex';
            inputAddGroup.style.display = 'none';
        }
        
    })

    document.querySelector('#inputAddGroup input').addEventListener('keyup', async function(e){
        e.preventDefault();

        if(e.keyCode === 13 && this.value != ''){
            await newGroup(this.value)
            this.value = ''
            buttonAddGroup.style.display = 'flex';
            inputAddGroup.style.display = 'none';
        }
        
    })



    buttonAddContact.addEventListener('click', function(e){
        e.preventDefault();
        buttonAddContact.style.display = 'none';
        inputAddContact.style.display = 'flex';
        document.querySelectorAll('#inputAddContact input')[0].focus()
    })

    document.querySelector('#inputAddContact button').addEventListener('click', async function(e){
        e.preventDefault();
        const name = document.querySelectorAll('#inputAddContact input')[0].value;
        const email = document.querySelectorAll('#inputAddContact input')[1].value;
        const groupID = document.querySelectorAll('#bodyGroups li.files-type.active')[0].getAttribute('id');
 
        if(name != '' && email != ''){
            await newContact(name, email, groupID)
            document.querySelectorAll('#inputAddContact input')[0].value = ''
            document.querySelectorAll('#inputAddContact input')[1].value = ''
            buttonAddContact.style.display = 'flex';
            inputAddContact.style.display = 'none';
        }
        
    })

    document.querySelectorAll('#inputAddContact input').forEach(element => {
        element.addEventListener('keyup', async function(e){
            e.preventDefault();
            const name = document.querySelectorAll('#inputAddContact input')[0].value
            const email = document.querySelectorAll('#inputAddContact input')[1].value
            const groupID = document.querySelectorAll('#bodyGroups li.files-type.active')[0].getAttribute('id');
            if(e.keyCode === 13 && name != '' && email != ''){
                await newContact(name, email, groupID)
                document.querySelectorAll('#inputAddContact input')[0].value = ''
                document.querySelectorAll('#inputAddContact input')[1].value = ''
                buttonAddContact.style.display = 'flex';
                inputAddContact.style.display = 'none';
            }
            
        })
    });



}

async function newGroup(value){
    const registerGroup = await makeRequest('/api/direct_mail_pricing/registerGroup', 'POST', {body:value})

    await getAllGroups();
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

    const newcontact = `<div class="col-4">
    <div class="card custom-card">
        <div class="card-body contact-action">
            <div class="contact-overlay"></div>
            <div class="d-flex align-items-top">
                <div class="d-flex flex-fill flex-wrap gap-3">
                    <!-- <div class="avatar avatar-rounded bg-primary"> PW </div> -->
                    <div>
                        <h6 class="mb-1 fw-semibold"> ${name} </h6>
                        <p class="mb-1 text-muted contact-mail text-truncate">${email}</p>
                        <!-- <p class="fw-semibold fs-11 mb-0 text-primary"> +1(555) 238 2342 </p> -->
                    </div>
                </div>
            
            </div>
            <div class="d-flex align-items-center justify-content-center gap-2 contact-hover-buttons">
                <button type="button" class="btn btn-sm btn-light contact-hover-btn"> <i class="ri-heart-3-fill text-danger"></i> Editar</button>
                <button type="button" class="btn btn-sm btn-light contact-hover-btn"> <i class="ri-heart-3-fill text-danger"></i> Remover</button>
            </div>
        </div>
    </div>
</div>`;

bodyContacts.insertAdjacentHTML('afterbegin', newcontact)
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
                    <button type="button" class="btn btn-sm btn-light contact-hover-btn"> <i class="ri-heart-3-fill text-danger"></i> Editar</button>
                    <button type="button" class="btn btn-sm btn-light contact-hover-btn"> <i class="ri-heart-3-fill text-danger"></i> Remover</button>
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


    document.querySelectorAll('#bodyGroups li.files-type.active')[0].click();

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
            
            if(chave == 'Mercadoria'){
                if(contemPalavra(parametros[chave])){
                    valor = '<strong style="color: rgb(230, 0, 0);">'+parametros[chave]+'</strong>';
                }else{
                    valor = parametros[chave];
                }
            }else if(chave == 'Valor_Mercadoria' && parametros['Moeda_Mercadoria'] != null){
                valor = parametros[chave].toLocaleString('pt-BR', { style: 'currency', currency: parametros['Moeda_Mercadoria'] });
                console.log('valor formatado', valor)
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

