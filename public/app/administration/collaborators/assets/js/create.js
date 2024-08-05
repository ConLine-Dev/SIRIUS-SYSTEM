let sAllcompanie, sAllLanguages;

async function getAllCompanie() {
    // carrega os usuarios responsaveis
    const Companie = await makeRequest(`/api/non-compliance/AllUnit`);

    document.querySelector('select[name="companie"]').innerHTML = ''
    for (let index = 0; index < Companie.length; index++) {
        const element = Companie[index];
        document.querySelector('select[name="companie"]').innerHTML += `<option value="${element.id}">${element.city +' | '+ element.country}</option>`
    }
}

async function getAllContractType() {
    // carrega os usuarios responsaveis
    const ContractType = await makeRequest(`/api/collaborators-management/getAllContractType`);

    document.querySelector('select[name="contractType"]').innerHTML = ''
    for (let index = 0; index < ContractType.length; index++) {
        const element = ContractType[index];
        document.querySelector('select[name="contractType"]').innerHTML += `<option value="${element.id}">${element.name}</option>`
    }
}

async function getAllDepartments() {
    // carrega os usuarios responsaveis
    const Departaments = await makeRequest(`/api/collaborators-management/getAllDepartments`);

    document.querySelector('select[name="department"]').innerHTML = ''
    for (let index = 0; index < Departaments.length; index++) {
        const element = Departaments[index];
        document.querySelector('select[name="department"]').innerHTML += `<option value="${element.id}">${element.name}</option>`
    }
}

async function getAllImmediateSupervisor() {
    // carrega os usuarios responsaveis
    const ImmediateSupervisor = await makeRequest(`/api/users/listAllUsers`);

    document.querySelector('select[name="immediateSupervisor"]').innerHTML = ''
    for (let index = 0; index < ImmediateSupervisor.length; index++) {
        const element = ImmediateSupervisor[index];
        document.querySelector('select[name="immediateSupervisor"]').innerHTML += `<option value="${element.id_colab}">${element.username + ' ' + element.familyName}</option>`
    }
}

async function geAllLanguages(){
   // carrega os usuarios responsaveis


   // Formate o array para ser usado com o Choices.js (Biblioteca)
   const listaDeOpcoes = [
    { value: 'mandarim', label: 'Mandarim' },
    { value: 'espanhol', label: 'Espanhol' },
    { value: 'ingles', label: 'Inglês' },
    { value: 'hindi', label: 'Hindi' },
    { value: 'arabe', label: 'Árabe' },
    { value: 'portugues', label: 'Português' },
    { value: 'bengali', label: 'Bengali' },
    { value: 'russo', label: 'Russo' },
    { value: 'japones', label: 'Japonês' },
    { value: 'panjabi', label: 'Panjabi' },
    { value: 'alemão', label: 'Alemão' },
    { value: 'javanes', label: 'Javanês' },
    { value: 'wu', label: 'Wu (Shanghainês)' },
    { value: 'malai', label: 'Malai' },
    { value: 'telugu', label: 'Telugu' },
    { value: 'vietnamita', label: 'Vietnamita' },
    { value: 'coreano', label: 'Coreano' },
    { value: 'frances', label: 'Francês' },
    { value: 'marata', label: 'Marata' },
    { value: 'tamil', label: 'Tâmil' }
];



   // verifica se o select ja existe, caso exista destroi
   if (sAllLanguages) {
    sAllLanguages.destroy();
   }


   // renderiza o select com as opções formatadas
   sAllLanguages = new Choices('select[name="languages"]', {
       choices: listaDeOpcoes,
       // allowHTML: true,
       // allowSearch: true,
       shouldSort: false,
       removeItemButton: true,
       noChoicesText: 'Não há opções disponíveis',

   });
}

async function getAllResponsible() {
    // carrega os usuarios responsaveis
    const Responsible = await makeRequest(`/api/users/listAllUsers`);

    // Formate o array para ser usado com o Choices.js (Biblioteca)
    const listaDeOpcoes = Responsible.map(function (element) {
        return {
            value: `${element.id_colab}`,
            label: `${element.username + ' ' + element.familyName}`,
        };
    });



    // verifica se o select ja existe, caso exista destroi
    if (sAllResponsible) {
        sAllResponsible.destroy();
    }


    // renderiza o select com as opções formatadas
    sAllResponsible = new Choices('select[name="responsible"]', {
        choices: listaDeOpcoes,
        // allowHTML: true,
        // allowSearch: true,
        shouldSort: false,
        removeItemButton: false,
        noChoicesText: 'Não há opções disponíveis',

    });


}

async function eventChangeImgProfile(){
    /* Image upload */
    let loadFile = function (event) {
        var reader = new FileReader();
        reader.onload = function () {
        var output = document.getElementById("profile-img");
        if (event.target.files[0].type.match("image.*")) {
            output.src = reader.result;
        } else {
            event.target.value = "";
            alert("please select a valid image");
        }
        };
        if (event.target.files[0]) {
        reader.readAsDataURL(event.target.files[0]);
        }
    };
    
    // for profile photo update
    let ProfileChange = document.querySelector("#profile-change");
    ProfileChange.addEventListener("change", loadFile);
  
}


async function eventInputProfile(){

     let fullName = document.querySelector('input[name="fullName"]');
     fullName.addEventListener("input", function (event) {
        if(this.value.trim() == ''){
            document.querySelector('.textFullName').innerHTML = '<br>'
        }else{
            document.querySelector('.textFullName').textContent = this.value
        }
    });

    let emailBusiness = document.querySelector('input[name="emailBusiness"]');
    emailBusiness.addEventListener("input", function (event) {
       if(this.value.trim() == ''){
           document.querySelector('.textEmailBusiness').textContent = '-'
       }else{
           document.querySelector('.textEmailBusiness').textContent = this.value
       }
   });


   // Adiciona um event listener para capturar a alteração do select e obter o label da opção selecionada
    document.querySelector('select[name="companie"]').addEventListener('change', function(event) {
        const selectedValue = event.target.value;
        const selectedLabel = event.target.selectedOptions[0].label;
        document.querySelector('.textCompanie').textContent = selectedLabel
        
    });

    // Adiciona um event listener para capturar a alteração do select e obter o label da opção selecionada
    document.querySelector('select[name="contractType"]').addEventListener('change', function(event) {
        const selectedValue = event.target.value;
        const selectedLabel = event.target.selectedOptions[0].label;
        document.querySelector('.textContractType').textContent = selectedLabel
        
    });
}


// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {
    // inicio da função verificar tempo de carregamento da pagina e suas consultas no banco
    console.time(`A página "${document.title}" carregou em`)


    // carrega os usuarios responsaveis
    // await getAllResponsible();

    // carrega os usuarios departamentos
    await getAllCompanie();
    await getAllContractType();
    await getAllDepartments();
    await getAllImmediateSupervisor();
    await geAllLanguages();

    await eventChangeImgProfile();


    await eventInputProfile();
    


    
    // remover loader
    // document.querySelector('#loader2').classList.add('d-none');


    // fim da função verificar tempo de carregamento da pagina e suas consultas no banco
    console.timeEnd(`A página "${document.title}" carregou em`);
})

