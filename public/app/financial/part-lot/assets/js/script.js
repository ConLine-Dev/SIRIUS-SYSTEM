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

// Calcula a quantidade e o valor total por taxa, separado por pagamento e recebimento
function calculateTotalsRates() {
   const totals = {
      Pagamento: {}
   };

   // Itera sobre todas as linhas de taxas nos detalhes dos processos
   document.querySelectorAll('.files-list .details-row tbody tr').forEach(rateRow => {
      const taxa = rateRow.querySelector('td:nth-child(1)').textContent.trim(); // Nome da taxa
      const taxaId = rateRow.querySelector('td:nth-child(1)').getAttribute('data-rateid'); // ID da taxa
      const typeBadge = rateRow.querySelector('td:nth-child(2) span.badge'); // Tipo (Pagamento/Recebimento)
      const type = typeBadge ? typeBadge.textContent.trim() : null;

      const moedaElement = rateRow.querySelector('td:nth-child(3)'); // Moeda
      const moeda = moedaElement ? moedaElement.textContent.trim() : '';

      const quantityElement = rateRow.querySelector('td:nth-child(4)'); // Quantidade
      const quantity = quantityElement ? parseFloat(quantityElement.textContent.trim()) || 0 : 0;

      const totalValue = rateRow.querySelector('td:nth-child(5)'); // Valor total
      const rawValue = totalValue ? totalValue.textContent.replace(/[^\d,-]/g, '').replace(',', '.') : '0';
      const total = parseFloat(rawValue) || 0;

      const totalValueConverted = rateRow.querySelector('td:nth-child(7)'); // Valor total Convertido
      const rawValueConverted = totalValueConverted ? totalValueConverted.textContent.replace(/[^\d,-]/g, '').replace(',', '.') : '0';
      const totalConverted = parseFloat(rawValueConverted) || 0;

      if (!type || (type !== "Pagamento")) {
         return; // Ignorar se o tipo não for válido
      }

      // Inicializa os dados da taxa caso não existam
      if (!totals[type][taxaId]) {
         totals[type][taxaId] = {
            taxaId: taxaId,
            taxaName: taxa,
            quantity: 0,
            total: 0,
            totalConverted: 0,
            type: type,
            currency: moeda,
         };
      }

      // Acumula os valores
      totals[type][taxaId].quantity += quantity;
      totals[type][taxaId].total += total;
      totals[type][taxaId].totalConverted += totalConverted;
   });

   return totals;
};

// Função que calcula o total de processos, peso cubado e Bruto
function calculateTotalProcess() {
   const totals = {
      totalProcesses: 0,
      totalPesoCubado: 0,
      totalPesoBruto: 0
   };

   // Itera sobre cada linha de processo
   document.querySelectorAll('.files-list tr[data-process-id]').forEach(process => {
      // Incrementa o número total de processos
      totals.totalProcesses += 1;

      // Obtém o valor do peso cubado e bruto como números
      const pesoCubadoElement = process.querySelector('.data-peso-cubado');
      const pesoBrutoElement = process.querySelector('.data-peso-bruto');

      const pesoCubado = pesoCubadoElement ? parseFloat(pesoCubadoElement.textContent.trim()) || 0 : 0;
      const pesoBruto = pesoBrutoElement ? parseFloat(pesoBrutoElement.textContent.trim()) || 0 : 0;

      // Acumula os valores no objeto totals
      totals.totalPesoCubado += pesoCubado;
      totals.totalPesoBruto += pesoBruto;
   });

   return totals;
};

// Função para criar o totalizador
function createTotalizer() {
   const totals = calculateTotalsRates();
   const totalsProcesses = calculateTotalProcess();

   let ratesHTML = '';

   // Pagamentos
   for (const [taxa, item] of Object.entries(totals.Pagamento)) {
      ratesHTML += `
         <tr rateIdAndType="${item.taxaId}-${item.type}">
            <td>${item.taxaName}</td>
            <td><span class="badge bg-danger-transparent" data-type="Pagamento">Pagamento</span></td>
            <td>${item.currency}</td>
            <td>${(item.quantity).toFixed(2) || ''}</td>
            <td>${(item.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: item.currency })}</td>
            <td>${(item.totalConverted || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
         </tr>`;
   }

   const tableTotalizer = `
       <tbody class="files-list">
           <tr>
               <td class="bg-danger-transparent" style="width: 15px !important;">
                  <button onclick="toggleDetails(this)" class="btn btn-icon btn-danger-transparent rounded-pill btn-wave waves-effect waves-light" title="Visualizar Detalhes">
                     <i class="ri-eye-close-line"></i>
                  </button>
               </td>
               <td class="bg-danger-transparent">
                  <div>
                     <span class="d-block fw-normal">Quantidade Processos:</span> 
                     <span class="d-block fw-bold">${totalsProcesses.totalProcesses}</span>
                  </div>
               </td>
               <td class="bg-danger-transparent">
                  <div>
                     <span class="d-block fw-normal">Total Peso Cubado:</span> 
                     <span class="d-block fw-bold data-peso-cubado">${totalsProcesses.totalPesoCubado.toFixed(3)}</span>
                  </div>
               </td>
               <td class="bg-danger-transparent">
                  <div>
                     <span class="d-block fw-normal">Total Peso Bruto:</span> 
                     <span class="d-block fw-bold data-peso-bruto">${totalsProcesses.totalPesoBruto.toFixed(3)}</span>
                  </div>
               </td>
           </tr>
           <tr class="details-row totalizador" style="display: none;">
               <td colspan="10">
                  <table class="table table-sm table-bordered mt-2">
                     <thead>
                        <tr>
                           <th>Taxa</th>
                           <th>Tipo</th>
                           <th>Moeda</th>
                           <th>Quantidade</th>
                           <th>Valor Total</th>
                           <th>Valor Convertido</th>
                        </tr>
                     </thead>
                     <tbody>
                        ${ratesHTML}
                     </tbody>
                  </table>
               </td>
           </tr>
       </tbody>`;

   const tableControlProcess = document.getElementById('tableControlProcess');
   tableControlProcess.insertAdjacentHTML('beforeend', tableTotalizer);
};

// Busca os processos pela referencia externa e insere na tela
async function searchProcess() {
   document.querySelector('#loader').classList.remove('d-none');

   const tableControlProcess = document.getElementById('tableControlProcess'); // Div que vai inserir os processos dentro
   const searchInput = document.getElementById('searchInput').value;

   // Pesquisa os processos a partir da referência externa
   const process = await makeRequest(`/api/part-lot-financial/processByRef`, 'POST', { externalRef: searchInput});
   
   // Caso não localize nenhum processo com a referencia informada, irá apresentar um alert
   if (!process || process.length === 0) {
      document.querySelector('#loader').classList.add('d-none');
      Swal.fire('Erro!', 'Nenhum processo localizado com a referência informada.', 'error');
      tableControlProcess.innerHTML = ''; // Limpa o campo onde é inserido os processos e taxas
      return;
   }

   const processIds = process.map(p => p.IdLogistica_House); // Pega o ID de todos os processos
   const rates = await makeRequest(`/api/part-lot-financial/listAllPaymentRates`, 'POST', { IdLogistica_House: processIds }); // Busca todas as taxas em uma única consulta
   
   // Organiza as taxas por processo
   const ratesByProcess = rates.reduce((acc, rate) => {
      if (!acc[rate.IdLogistica_House]) acc[rate.IdLogistica_House] = [];
      acc[rate.IdLogistica_House].push(rate);
      return acc;
   }, {});

   // Insere os processos na tela
   tableControlProcess.innerHTML = '';
   let processHTML = '';

   for (let i = 0; i < process.length; i++) {
      const item = process[i];

      // Obtem as taxas do processo atual
      const processRates = ratesByProcess[item.IdLogistica_House] || [];

      // Gera o HTML para as taxas
      let ratesHTML = processRates.map((rate) => `
         <tr data-rateId-Line="${rate.IdLogistica_Taxa}">
            <td rateIdAndType="${rate.IdTaxa_Logistica_Exibicao}-${rate.Tipo}" data-rateId="${rate.IdTaxa_Logistica_Exibicao}" data-name-taxa="${rate.Taxa}" data-IdLogistica-House="${rate.IdLogistica_House}">${rate.Taxa}</td>
            <td rateIdAndType="${rate.IdTaxa_Logistica_Exibicao}-${rate.Tipo}" data-IdRegistro-Financeiro="${rate.IdRegistro_Financeiro}"><span class="badge bg-${rate.Tipo === 'Recebimento' ? 'success' : 'danger'}-transparent" data-type="${rate.Tipo}">${rate.Tipo}</span></td>
            <td rateIdAndType="${rate.IdTaxa_Logistica_Exibicao}-${rate.Tipo}" data-IdMoeda="${rate.IdMoeda}">${rate.Moeda || ''}</td>
            <td rateIdAndType="${rate.IdTaxa_Logistica_Exibicao}-${rate.Tipo}" name="quant=${rate.IdTaxa_Logistica_Exibicao}" data-quant="${rate.Quantidade}">${rate.Quantidade || ''}</td>
            <td rateIdAndType="${rate.IdTaxa_Logistica_Exibicao}-${rate.Tipo}">${(rate.Valor_Total.toLocaleString('pt-BR', { style: 'currency', currency: rate.Moeda }) || 0)}</td>
            <td rateIdAndType="${rate.IdTaxa_Logistica_Exibicao}-${rate.Tipo}">${(rate.Fator_Corrente || 0)}</td>
            <td rateIdAndType="${rate.IdTaxa_Logistica_Exibicao}-${rate.Tipo}">${((rate.Valor_Total * rate.Fator_Corrente).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 0)}</td>
         </tr>
      `).join('');

      processHTML += `
         <tbody class="files-list">
            <tr data-process-id="${item.IdLogistica_House}" class="odd">
               <td class="data-peso-cubado d-none">${item.Peso_Cubado}</td>
               <td class="data-peso-bruto d-none">${item.Peso_Bruto}</td>
               <td style="width: 15px !important;">
                     <button onclick="toggleDetails(this)" class="btn btn-icon btn-primary-transparent rounded-pill btn-wave waves-effect waves-light" title="Visualizar Detalhes">
                        <i class="ri-eye-close-line"></i>
                     </button>
               </td>
               <td style="max-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                     <div>
                        <span class="d-block fw-normal">Processo:</span> 
                        <span class="d-block fw-bold" style="max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" data-process-number="${item.Numero_Processo}">${item.Numero_Processo}</span> 
                     </div>
               </td>
               <td style="max-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                     <div>
                        <span class="d-block fw-normal" data-quant-containers="${item.Qtd_Containers}">Quantidade Container(s): ${item.Qtd_Containers}</span> 
                        <span class="d-block fw-bold" style="max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" data-containers="${item.Containers}">${item.Containers}</span> 
                     </div>
               </td>
               <td style="max-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                     <div>
                        <span class="d-block fw-normal" data-quant-conhecimentos="${item.Qtd_Conhecimentos}">Quantidade HBL(s): ${item.Qtd_Conhecimentos}</span> 
                        <span class="d-block fw-bold" style="max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" data-conhecimentos="${item.Conhecimentos}">${item.Conhecimentos}</span> 
                     </div>
               </td>
            </tr>
            <tr class="details-row" style="display: none;">
               <td colspan="10">
                     <table class="table table-sm table-bordered mt-2">
                        <thead>
                           <tr>
                              <th>Taxa</th>
                              <th>Tipo</th>
                              <th>Moeda</th>
                              <th>Quantidade</th>
                              <th>Valor Total</th>
                              <th>Fator</th>
                              <th>Valor Convertido</th>
                           </tr>
                        </thead>
                        <tbody>
                           ${ratesHTML}
                        </tbody>
                     </table>
               </td>
            </tr>
         </tbody>`;
   }
   
   tableControlProcess.innerHTML = processHTML;
   // FIM - Insere os processos na tela

   // Atualiza o totalizador ao final
   createTotalizer();

   calculateTotalProcess()

   document.querySelector('#loader').classList.add('d-none');
};

document.getElementById('searchProcess').addEventListener('click', searchProcess);

// Adiciona evento de tecla Enter no campo de busca
document.getElementById('searchInput').addEventListener('keypress', function(event) {
   if (event.key === 'Enter') {
      event.preventDefault();
      searchProcess();
   }
});

document.addEventListener("DOMContentLoaded", async () => {
   document.querySelector('#loader2').classList.add('d-none');
});