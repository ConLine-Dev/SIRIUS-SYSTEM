document.addEventListener("DOMContentLoaded", async () => {




    
    document.querySelector('#loader2').classList.add('d-none')
})

// Obter o modal
var modal = document.getElementById("modal");

// Obter o botão que abre o modal
var btn = document.getElementById("openModalBtn");

// Obter o <span> que fecha o modal
var span = document.getElementsByClassName("close")[0];

// Quando o usuário clicar no botão, abrir o modal 
btn.onclick = function() {
  modal.style.display = "block";
}

// Quando o usuário clicar no <span> (x), fechar o modal
span.onclick = function() {
  modal.style.display = "none";
}

// Quando o usuário clicar fora do modal, fechá-lo
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

// Capturar o envio do formulário
document.getElementById("cadastroForm").addEventListener("submit", function(event) {
  event.preventDefault(); // Impede o envio padrão do formulário

  // Aqui você pode processar os dados do formulário e salvá-los

  // Fechar o modal após salvar
  modal.style.display = "none";
});