async function active_tooltip() {
    const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]'
    );
    const tooltipList = [...tooltipTriggerList].map(
        (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
    );
};

// Função para criar um novo produto!
async function createProduct() {
    const body = {
        url: `/app/stock/new-product`,
        width: 900, 
        height: 200,
        resizable:false
    }
    window.ipcRenderer.invoke('open-exWindow', body);
};

async function eventClick() {
    // ========== CRIAR PRODUTO ========== // 
    document.getElementById('create-product').addEventListener('click', async function () {
        await createProduct();
    });
    // ========== / CRIAR PRODUTO ========== // 
}


// Função executada após toda a página ser executada
window.addEventListener("load", async () => {

    await active_tooltip();
    await eventClick();

    // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
    document.querySelector('#loader2').classList.add('d-none')

})