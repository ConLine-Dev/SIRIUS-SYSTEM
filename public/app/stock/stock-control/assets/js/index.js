// Função para entrar na tela de entrada no estoque
async function stockEntry() {
    const body = {
        url: `/app/stock/stock-entry`,
        width: 900, 
        height: 500,
        resizable:false
    }
    window.ipcRenderer.invoke('open-exWindow', body);
};

document.getElementById('stock-entry').addEventListener('click', async function () {
    await stockEntry();
});

// Função executada após toda a página ser executada
window.addEventListener("load", async () => {

    // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
    document.querySelector('#loader2').classList.add('d-none')

})