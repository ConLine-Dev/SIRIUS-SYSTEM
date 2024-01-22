let choicesInstance, groupSend, modelEmail;
document.addEventListener("DOMContentLoaded", async () => {
    await GenerateEditorText();
    await GenerateToEmail();
    await loadGroupSend()
    await loadModelsEmails()
    await createMask()
    
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
            toolbar: toolbarOptions
        },
        theme: 'snow'
    });
}

async function GenerateToEmail(id = 0){


    const getContactsByGroup = await makeRequest(`/api/direct_mail_pricing/getContactsByGroup/${id}`)

    // Formate o array para ser usado com o Choices.js
    var listaDeOpcoes = getContactsByGroup.map(function(element) {
        return {
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
    // console.log(listaDeOpcoes)
    
    groupSend = new Choices('select[name="groupSend"]', {
        choices: listaDeOpcoes,
        // allowHTML: true,
        allowSearch: true,
        // removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        
    });

groupSend.passedElement.element.addEventListener(
  'addItem',
  async function(event) {
    // do something creative here...
    // console.log(event.detail.id);
    // console.log(event.detail.value);
    // console.log(event.detail.label);
    // console.log(event.detail.customProperties);
    // console.log(event.detail.groupValue);
    await GenerateToEmail(event.detail.value)



  },
  false,
);
}

async function loadModelsEmails(){
    
    modelEmail = new Choices('select[name="modelEmail"]', {
        choices: [
            {value:0, label:'Selecione', selected: true, disabled: true},
            {value:'teste', label:'teste'},
            {value:'teste', label:'teste'},
            {value:'teste', label:'teste'},
            {value:'teste', label:'teste'},
            {value:'teste', label:'teste'},
            {value:'teste', label:'teste'}
        ],
        // allowHTML: true,
        allowSearch: true,
        // removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis'
    });
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