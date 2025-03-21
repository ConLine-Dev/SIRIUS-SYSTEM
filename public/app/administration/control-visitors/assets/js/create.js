// Função para salvar e fechar a janela
function salvarEFechar() {
    const form = document.getElementById('visitanteForm');
    const formData = new FormData(form);
    
    const visitante = {
        id: Date.now(),
        nome: formData.get('nome'),
        cpf: formData.get('cpf'),
        cnpj: formData.get('cnpj'),
        telefone: formData.get('telefone'),
        bl: formData.get('bl'),
        responsavel: formData.get('responsavel'),
        filial: formData.get('filial'),
        dataEntrada: formData.get('dataEntrada'),
        dataSaida: formData.get('dataSaida'),
        observacao: formData.get('observacao'),
        anexo: formData.get('anexo').name
    };

    // Envia os dados para a janela principal
    window.opener.receberDadosVisitante(visitante);
    window.close();
}

// Máscaras para CPF, CNPJ e telefone
document.addEventListener('DOMContentLoaded', function() {
    const cpfInput = document.querySelector('input[name="cpf"]');
    const cnpjInput = document.querySelector('input[name="cnpj"]');
    const telefoneInput = document.querySelector('input[name="telefone"]');

    cpfInput.addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            this.value = value;
        }
    });

    cnpjInput.addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        if (value.length <= 14) {
            value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
            this.value = value;
        }
    });

    telefoneInput.addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
            this.value = value;
        }
    });
});











// let sAllResponsible

// // Função para listar os responsáveis
// async function getAllUsersActive() {
//     const listAllUsersActive = await makeRequest(`/api/users/listAllUsersActive`);

//     const listUsers = listAllUsersActive.map(function (element) {
//         return {
//             value: `${element.id_colab}`,
//             label: `${element.username + ' ' + element.familyName}`,
//         }
//     });

//     if (sAllResponsible) {
//         sAllResponsible.destroy();
//     }

//     sAllResponsible = new Choices('select[name="responsible"]', {
//         choices: listUsers,
//         shouldSort: false,
//         removeItemButton: false,
//         noChoicesText: 'Não há opções disponíveis',
//     });
// };

// // Função para preenchimento automático dos responsáveis
// async function setDefaultValues() {
//     const user = await getInfosLogin()
//     const idCollaborator = (user.system_collaborator_id).toString();

//     sAllResponsible.setChoicesByValue(idCollaborator)
// };

// // Verifica informações no localStorage do usuario logado
// async function getInfosLogin() {
//     const StorageGoogleData = localStorage.getItem('StorageGoogle');
//     const StorageGoogle = JSON.parse(StorageGoogleData);
//     return StorageGoogle;
// };

// // Função para os valores de qualquer selected
// async function getSelectValues(selectName) {
//     const selectElement = document.querySelector(`select[name="${selectName}"]`);
//     if (selectElement) {
//        const selectedOptions = Array.from(selectElement.selectedOptions);
//        if (!selectedOptions || selectedOptions.length === 0 || selectedOptions[0].value === '') {
//           return undefined;
//        } else {
//           const selectedValues = selectedOptions.map(option => option.value);
//           return selectedValues;
//        }
//     } else {
//        return undefined;
//     }
// };

// // Função para verificar se os selects estão preenchidos
// async function getValuesFromSelects() {

//     let selectNames = [
//         {name: 'responsible', message: 'O campo RESPONSÁVEL é obrigatório.'},
//     ];

//     let allValid = true;

//     for (let i = 0; i < selectNames.length; i++) {
//         const selectName = selectNames[i];
//         const values = await getSelectValues(selectName.name);
//         if (!values || values.length === 0) {
//             Swal.fire(`${selectName.message}`);
//             allValid = false;
//             break;
//         }
        
//     }

//     return allValid;
    
// };

// // Inicializa os componentes do editor de texto Quill e FilePond.
// async function initializeComponents() {
//     // Configuração do editor Quill
//     const toolbarOptions = [
//         [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
//         [{ 'font': [] }],
//         ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
//         ['blockquote', 'code-block'],
//         [{ 'header': 1 }, { 'header': 2 }],               // custom button values
//         [{ 'list': 'ordered' }, { 'list': 'bullet' }],
//         [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
//         [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
//         [{ 'align': [] }],
//         ['image'],
//         ['clean']                                         // remove formatting button
//     ];

//     quillEditor = new Quill('#project-descriptioin-editor', {
//         modules: { toolbar: toolbarOptions },
//         theme: 'snow'
//     });

//     // Configuração do FilePond
//     FilePond.registerPlugin(
//         FilePondPluginImagePreview,
//         FilePondPluginImageExifOrientation,
//         FilePondPluginFileValidateSize,
//         FilePondPluginFileEncode,
//         FilePondPluginImageEdit,
//         FilePondPluginFileValidateType,
//         FilePondPluginImageCrop,
//         FilePondPluginImageResize,
//         FilePondPluginImageTransform
//     );

//     const inputElement = document.querySelector('.multiple-filepond-Attachments');
//     if (inputElement) {
//         fileAttachments = FilePond.create(inputElement, {
//             allowMultiple: true,
//             maxFiles: 5,
//             labelIdle: 'Arraste e solte seus arquivos aqui ou <span class="filepond--label-action">Procure</span>'
//         });

//         fileAttachments.on('addfile', (error, file) => {
//             if (error) {
//                 console.error('Erro ao adicionar arquivo:', error);
//             } else {
//                 // console.log('Arquivo adicionado:', file.filename);
//             }
//         });
//     }
// };

// // Função para aplicar máscara dinâmica nos campos de CPF, CNPJ e telefone
// function aplicarMascara(input, tipo) {
//     const valor = input.value.replace(/\D/g, ""); // Remove caracteres não numéricos
//     let resultado = "";

//     if (tipo === "documento") {
//         if (valor.length <= 11) {
//             // Máscara para CPF: XXX.XXX.XXX-XX
//             resultado = valor
//                 .replace(/(\d{3})(\d)/, "$1.$2")
//                 .replace(/(\d{3})(\d)/, "$1.$2")
//                 .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
//         } else {
//             // Máscara para CNPJ: XX.XXX.XXX/XXXX-XX
//             resultado = valor
//                 .replace(/(\d{2})(\d)/, "$1.$2")
//                 .replace(/(\d{3})(\d)/, "$1.$2")
//                 .replace(/(\d{3})(\d)/, "$1/$2")
//                 .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
//         }
//     } else if (tipo === "telefone") {
//         if (valor.length <= 10) {
//             // Máscara para telefone fixo: (XX) XXXX-XXXX
//             resultado = valor
//                 .replace(/(\d{2})(\d)/, "($1) $2")
//                 .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
//         } else {
//             // Máscara para celular: (XX) XXXXX-XXXX
//             resultado = valor
//                 .replace(/(\d{2})(\d)/, "($1) $2")
//                 .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
//         }
//     }

//     input.value = resultado;
// }

// // Adiciona eventos nos campos
// document.getElementById("documento").addEventListener("input", function () {
//     aplicarMascara(this, "documento");
// });

// document.getElementById("telefone").addEventListener("input", function () {
//     aplicarMascara(this, "telefone");
// });

// // Função para formatar campos específicos
// document.getElementById("cpf").addEventListener("input", function () {
//     aplicarMascara(this, "XXX.XXX.XXX-XX");
// });

// document.getElementById("cnpj").addEventListener("input", function () {
//     aplicarMascara(this, "XX.XXX.XXX/XXXX-XX");
// });

// document.getElementById("telefone").addEventListener("input", function () {
//     aplicarMascara(this, "(XX) XXXXX-XXXX");
// });


// // Esta função adiciona um evento de clique ao botão de salvar
// async function eventClick() {
//     // ==== Salvar ==== //
//     document.getElementById('btn-save').addEventListener('click', async function (){
//         const inputsValid = await getValuesFromInputs();
//         const selectsValid = await getValuesFromSelects();

//         if (inputsValid && selectsValid) {
//             await getForm();
//         }
        
//     })
//     // ==== /Salvar ==== //
// };


// document.addEventListener("DOMContentLoaded", async () => {

//     await getAllUsersActive();
//     await setDefaultValues();
//     await eventClick();

//     await initializeComponents();

// })