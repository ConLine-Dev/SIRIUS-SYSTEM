//Função para cadastrar novo desconto folha pagamento
function createNewVisitor() {
    // URL da página que será aberta
    const url = '/app/administration/control-visitors/create';

    // Alvo da janela (nova aba/janela)
    const target = '_blank';

    // Configurações da nova janela
    const features = 'width=1200,height=600,resizable=yes,scrollbars=yes,toolbar=no,menubar=no';

    // Abrir a nova janela com os parâmetros definidos
    window.open(url, target, features);
};

// Campo de data
async function initializeDatePicker() {
    flatpickr("#effectiveDate", {
        dateFormat: "Y-m-d", // Formato enviado ao banco
        altFormat: "d-m-Y", // Formato exibido ao usuário
        altInput: true, // Exibe o formato alternativo no input
        locale: "pt", // Define o idioma para português
    });
    
};

// Esta função adiciona um evento de clique ao botão de salvar
async function eventClick() {
    // ==== Salvar ==== //
    document.getElementById('btn-save').addEventListener('click', async function (){
        const inputsValid = await getValuesInputs();
        const selectsValid = await getValuesFromSelects();

        if (inputsValid && selectsValid) {
            await getDiscount();
        }
        
    })
    // ==== /Salvar ==== //
};

document.addEventListener("DOMContentLoaded", async () => {

})

