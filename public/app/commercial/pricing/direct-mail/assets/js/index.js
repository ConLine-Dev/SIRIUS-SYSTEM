let choicesInstance, groupSend, modelEmail, bccSend;
document.addEventListener("DOMContentLoaded", async () => {
    await GenerateEditorText();
    await GenerateToEmail();
    await loadGroupSend();
    await loadModelsEmails();
    await createMask();
    await createClicks();
    
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
       

        getModelById[0].body += `<p><br></p><p><p>Atenciosamente / Kind regards / Mit freundlichen Grüßen / Saludos cordiales <br> <p><img src="https://cdn.conlinebr.com.br/assinatura/LOGO" alt="signature"><img src="https://cdn.conlinebr.com.br/assinatura/182" alt="signature"></p><p><img src="https://cdn.conlinebr.com.br/assinatura/GRUPOS" alt="signature"></p><p><img src="https://cdn.conlinebr.com.br/assinatura/AVISOS" alt="signature"><p></p>`
       
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
            }else if(chave == 'Valor_Mercadoria'){
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

