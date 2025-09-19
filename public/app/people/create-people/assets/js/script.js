async function getInfosLogin() {
   const StorageGoogleData = localStorage.getItem('StorageGoogle');
   const StorageGoogle = JSON.parse(StorageGoogleData);

   return StorageGoogle;
}

async function savePerson() {
   let type = document.getElementById('typePeople').value;
   let realName = document.getElementById('realName').value;
   let fantasyName = document.getElementById('fantasyName').value;
   let cpfCnpj = document.getElementById('cpfCnpj').value;
   cpfCnpj = formatCpfCnpj(cpfCnpj);
   let userData = await getInfosLogin()
   let userId = userData.system_collaborator_id;

   let names = document.querySelectorAll('.name')
   let cpfs = document.querySelectorAll('.cpf')
   let emails = document.querySelectorAll('.email')
   const name = []
   const cpf = []
   const email = []

   for (let index = 0; index < contador - 1; index++) {
      name[index] = names[index].value
      cpf[index] = formatCpfCnpj(cpfs[index].value);
      email[index] = emails[index].value
   }

   let details = { type, realName, fantasyName, cpfCnpj, userId, name, cpf, email };

   let save = await makeRequest(`/api/people/insertPeople`, 'POST', details);
}

function formatCpfCnpj(cpfCnpj) {
   return cpfCnpj.replace(/\D/g, "");
}

function applyMask(tipo) {
   const $input = $("#cpfCnpj");
   $input.unmask(); // remove máscara anterior

   if (tipo === "0") { // Pessoa Jurídica (CNPJ)
      $input.prop("disabled", false);
      $input.mask("00.000.000/0000-00");
   } else if (tipo === "1") { // Pessoa Física (CPF)
      $input.prop("disabled", false);
      $input.mask("000.000.000-00");
   } else if (tipo === "2") { // Internacional
      $input.prop("disabled", true);
      $input.val(""); // limpa campo
   }
}

let contador = 1;

function addRow() {

   const tabela = document.getElementById("minhaTabela").getElementsByTagName("tbody")[0];
   const novaLinha = tabela.insertRow();

   const celula1 = novaLinha.insertCell(0);
   const celula2 = novaLinha.insertCell(1);
   const celula3 = novaLinha.insertCell(2);
   const celula4 = novaLinha.insertCell(3);
   const celula5 = novaLinha.insertCell(4);

   celula1.textContent = contador;
   celula2.innerHTML = `<input type="text" class="name form-control">`;
   celula3.innerHTML = `<input type="text" class="cpf form-control">`;
   celula4.innerHTML = `<input type="text" class="email form-control">`;
   celula5.innerHTML = `<button class="btn btn-danger btn-sm" onclick="deleteRow(this)">X</button>`;

   $('.cpf').mask('000.000.000-00');

   contador++;
}

function deleteRow(botao) {
   const linha = botao.closest("tr"); // pega a linha do botão
   linha.remove(); // remove a linha
   contador--;
}

$("#typePeople").on("change", function () {
   applyMask($(this).val());
});

applyMask($("#typePeople").val());

window.addEventListener("load", async () => {

   document.querySelector('#loader2').classList.add('d-none')
})