// Função para abrir uma nova janela
function openWindow(url, width, height) {
   // Alvo da janela (nova aba/janela)
   const target = '_blank';
 
   // Configurações da nova janela
   const features = `width=${width},height=${height},resizable=yes,scrollbars=yes,toolbar=no,menubar=no`;
 
   // Abrir a nova janela com os parâmetros definidos
   window.open(url, target, features);
};

// Função para exibir os detalhes abaixo dos descontos
function toggleDetails(button) {
   const detailsRow = button.closest("tr").nextElementSibling;
   const icon = button.querySelector("i");

   if (detailsRow && detailsRow.classList.contains('details-row')) {
      if (detailsRow.style.display === "none" || !detailsRow.style.display) {
         detailsRow.style.display = "table-row"; // Exibe a linha de detalhes
         icon.classList.remove("ri-eye-close-line"); // Alterna o ícone para "olho aberto"
         icon.classList.add("ri-eye-line");
      } else {
         detailsRow.style.display = "none"; // Oculta a linha de detalhes
         icon.classList.remove("ri-eye-line"); // Alterna o ícone para "olho fechado"
         icon.classList.add("ri-eye-close-line");
      }
   } else {
      console.error("Linha de detalhes não encontrada.");
   }
};

// Busca os processos pela referencia externa e insere na tela
document.getElementById('searchProcess').addEventListener('click', async function () {
   document.querySelector('#loader').classList.remove('d-none');

   const tableControlProcess = document.getElementById('tableControlProcess'); // Div que vai inserir os processos dentro
   const searchInput = document.getElementById('searchInput').value;
   
   tableControlProcess.innerHTML = '';
   let processHTML = '';

   const process = await makeRequest(`/api/part-lot/processByRef`, 'POST', { externalRef: searchInput});

   for (let i = 0; i < process.length; i++) {
      const item = process[i];      
   
      processHTML += `<tbody class="files-list">
                        <tr data-process-id="${item.IdLogistica_House}" class="odd">
                           <td style="width: 15px !important;">
                              <button onclick="toggleDetails(this)" class="btn btn-icon btn-primary-transparent rounded-pill btn-wave waves-effect waves-light" title="Visualizar Detalhes">
                                 <i class="ri-eye-close-line"></i>
                              </button>
                           </td>
                           <td style="max-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                              <div>
                                 <span class="d-block fw-normal">Processo:</span> 
                                 <span class="d-block fw-bold" style="max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.Numero_Processo}</span> 
                              </div>
                           </td>
                           <td style="max-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                              <div>
                                 <span class="d-block fw-normal">Quantidade Container(s): ${item.Qtd_Containers}</span> 
                                 <span class="d-block fw-bold" style="max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.Containers}</span> 
                              </div>
                           </td>
                           <td style="max-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                              <div>
                                 <span class="d-block fw-normal">Quantidade HBL(s): ${item.Qtd_Conhecimentos}</span> 
                                 <span class="d-block fw-bold" style="max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.Conhecimentos}</span> 
                              </div>
                           </td>
                        </tr>
                        <tr class="details-row" style="display: none;">
                           <td colspan="4">
                              <div>
                                 Detalhes adicionais do processo: ${item.Detalhes}
                              </div>
                           </td>
                        </tr>
                     </tbody>`;
   };
   
   tableControlProcess.innerHTML = processHTML;

   document.querySelector('#loader').classList.add('d-none');
});

document.addEventListener("DOMContentLoaded", async () => {

   document.querySelector('#loader2').classList.add('d-none');
});