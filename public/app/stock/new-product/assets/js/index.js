// Função para entrar na tela de entrada no estoque
async function newCategory() {
   const body = {
      url: `/app/stock/new-category`,
      width: 930, 
      height: 200,
      resizable:false
   }
   window.ipcRenderer.invoke('open-exWindow', body);
};

document.getElementById('createCategory').addEventListener('click', async function () {
      await newCategory();
});

// Função executada após toda a página ser executada
window.addEventListener("load", async () => {

   // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
   document.querySelector('#loader2').classList.add('d-none')
})