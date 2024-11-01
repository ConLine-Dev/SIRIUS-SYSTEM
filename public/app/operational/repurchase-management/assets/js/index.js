/**
 * Inicialização da página
 * Carrega os dados, e esconde o loader após o carregamento.
 */
document.addEventListener("DOMContentLoaded", async () => {
  

    hideLoader();


});

/**
 * Função para ocultar o loader da página.
 */
function hideLoader() {
    document.querySelector('#loader2').classList.add('d-none');
}


function openNewrepurchase() {

    openWindow('/app/operational/repurchase-management/new-repurchase', 800, 600);

}

function openWindow(url, width, height) {
    const options = `width=${width},height=${height},resizable=yes`;
    window.open(url, '_blank', options);
}



function formatarData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        // hour: '2-digit',
        // minute: '2-digit'
    });
}
