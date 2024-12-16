// Função para abrir uma nova janela
function openWindow(url, width, height) {
   // Alvo da janela (nova aba/janela)
   const target = '_blank';
 
   // Configurações da nova janela
   const features = `width=${width},height=${height},resizable=yes,scrollbars=yes,toolbar=no,menubar=no`;
 
   // Abrir a nova janela com os parâmetros definidos
   window.open(url, target, features);
};

// Função para listar todos os colaboradores
async function listAllParteLote() {
   const dataParteLote = await makeRequest(`/api/part-lot/listAllParteLote`, 'POST');
   
   const divlistParteLote = document.querySelector('.listParteLote');
   const searchInput = document.querySelector('.searchInput');

   divlistParteLote.innerHTML = '';
   let userHTML = '';

   for (let i = 0; i < dataParteLote.length; i++) {
       const item = dataParteLote[i];

       userHTML += `<li class="list-group-item" data-parte-lote="${item.id}" data-ref-externa="${item.external_reference}">
                        <div class="d-flex align-items-center justify-content-between flex-wrap">
                              <div class="d-flex w-100 justify-content-between align-items-center">
                                 <div> 
                                    <span class="d-block fw-bold">${item.external_reference}</span> 
                                    <span class="d-block fw-normal">Processo(s): ${item.total_process}</span> 
                                 </div>
                                 <div style="text-align: right;"> 
                                    <span class="d-block fw-normal">${item.total_containers} Container(s)</span>   
                                    <span class="d-block fw-normal">${item.total_hbl} HBL(s)</span>   
                                 </div>
                              </div>
                        </div>
                    </li>`;
   }

   divlistParteLote.innerHTML = userHTML;

   // Adiciona o evento de input para filtrar usuários
   searchInput.addEventListener('input', function () {
      const searchTerm = this.value.toLowerCase();
      const listItems = divlistParteLote.querySelectorAll('.list-group-item');

      listItems.forEach(item => {
         const process = item.getAttribute('data-parte-lote');
         const refExterna = item.getAttribute('data-ref-externa')?.toLowerCase();

         // Verifica se o termo de busca está em `data-parte-lote` ou `data-ref-externa`
         if (
            (process && process.includes(searchTerm)) || 
            (refExterna && refExterna.includes(searchTerm))
         ) {
            item.style.display = 'block'; // Mostra o item
         } else {
            item.style.display = 'none'; // Esconde o item
         }
      });
   });
};

// Função para exibir os detalhes abaixo dos descontos - Essa funçã oé chamada no front end
function toggleDetails(button) {
   const detailsRow = button.closest("tr").nextElementSibling;
   const icon = button.querySelector("i");

   if (detailsRow.style.display === "none" || !detailsRow.style.display) {
     detailsRow.style.display = "table-row"; // Exibe a linha de detalhes
     icon.classList.remove("ri-eye-close-line"); // Alterna o ícone para "olho aberto"
     icon.classList.add("ri-eye-line");
   } else {
     detailsRow.style.display = "none"; // Oculta a linha de detalhes
     icon.classList.remove("ri-eye-line"); // Alterna o ícone para "olho fechado"
     icon.classList.add("ri-eye-close-line");
   }
};

async function eventClick() {
   // Botao de novo
   document.getElementById('createPartLot').addEventListener('click', function () {
      const screenWidth = window.screen.width; // Largura total da tela
      const screenHeight = window.screen.height; // Altura total da tela
      openWindow('./create', screenWidth, screenHeight)
   })

   // Click na lista de parte lote para abrir as taxas
   const listParteLoteHTML = document.querySelectorAll('[data-parte-lote]');
   listParteLoteHTML.forEach(li => {
      li.addEventListener('click', async function () {
         document.querySelector('#loader').classList.remove('d-none');

         const tableControlProcess = document.getElementById('tableControlProcess'); // Div que vai inserir os processos dentro
         const dataParteLoteId = this.getAttribute('data-parte-lote'); // Pega o id do parte lote
         
         const parteLote = await makeRequest(`/api/part-lot/listProcessesParteLoteById`, 'POST', { id: dataParteLoteId});
         
         const processIds = parteLote.map(p => p.process_id); // Pega o ID de todos os processos
         
         const listAllRatesByParteLote = await makeRequest(`/api/part-lot/listAllRatesByParteLote`, 'POST', { IdLogistica_House: processIds, parte_lote_id: parteLote[0].parte_lote_id});

         // Organiza as taxas por processo
         const ratesByProcess = listAllRatesByParteLote.reduce((acc, rate) => {
            if (!acc[rate.process_id]) acc[rate.process_id] = [];
            acc[rate.process_id].push(rate);
            return acc;
         }, {});

         // Insere os processos na tela
         tableControlProcess.innerHTML = '';
         let processHTML = '';

         for (let i = 0; i < parteLote.length; i++) {
            const item = parteLote[i];
            
            // Obtem as taxas do processo atual
            const processRates = ratesByProcess[item.process_id] || [];
      
            // Gera o HTML para as taxas
            let ratesHTML = processRates.map((rate) => `
               <tr data-rateId-Line="${rate.mov_rate_id}">
                  <td rateIdAndType="${rate.rate_id}-${rate.type}" data-rateId="${rate.rate_id}" data-name-taxa="${rate.rate}" data-IdLogistica-House="${rate.process_id}">${rate.rate}</td>
                  <td rateIdAndType="${rate.rate_id}-${rate.type}" data-IdRegistro-Financeiro="${rate.register_financial_id}"><span class="badge bg-${rate.type === 'Recebimento' ? 'success' : 'danger'}-transparent" data-type="${rate.type}">${rate.type}</span></td>
                  <td rateIdAndType="${rate.rate_id}-${rate.type}" name="formCob=${rate.rate_id}" data-IdTaxa-Logistica-Exibicao="${rate.rate_id}" data-Tipo_Cobrança="${rate.type_charge_id}">${rate.type_charge || '(Sem Cobrança)'}</td>
                  <td rateIdAndType="${rate.rate_id}-${rate.type}" data-IdMoeda="${rate.coin_id}">${rate.coin || ''}</td>
                  <td rateIdAndType="${rate.rate_id}-${rate.type}" name="quant=${rate.rate_id}" data-quant="${rate.quantity}">${rate.quantity || ''}</td>
                  <td rateIdAndType="${rate.rate_id}-${rate.type}"><input disabled class="form-control" name="total-${rate.rate_id}" type="number" step="0.01" value="${(rate.value || 0).toFixed(2)}" placeholder="Insira um Valor"/></td>
               </tr>
            `).join('');
      
            processHTML += `
               <tbody class="files-list">
                  <tr data-process-id="${item.process_id}" class="odd">
                     <td class="data-peso-cubado d-none">${parteLote[0].cubed_weight}</td>
                     <td class="data-peso-bruto d-none">${parteLote[0].gross_weight}</td>
                     <td style="width: 15px !important;">
                        <button onclick="toggleDetails(this)" class="btn btn-icon btn-primary-transparent rounded-pill btn-wave waves-effect waves-light" title="Visualizar Detalhes">
                           <i class="ri-eye-close-line"></i>
                        </button>
                     </td>
                     <td style="max-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        <div>
                           <span class="d-block fw-normal">Processo:</span> 
                           <span class="d-block fw-bold" style="max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" data-process-number="${item.process_number}">${item.process_number}</span> 
                        </div>
                     </td>
                     <td style="max-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                           <div>
                              <span class="d-block fw-normal" data-quant-containers="${item.total_containers}">Quantidade Container(s): ${item.total_containers}</span> 
                              <span class="d-block fw-bold" style="max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" data-containers="${item.containers}">${item.containers}</span> 
                           </div>
                     </td>
                     <td style="max-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                           <div>
                              <span class="d-block fw-normal" data-quant-conhecimentos="${item.total_hbl}">Quantidade HBL(s): ${item.total_hbl}</span> 
                              <span class="d-block fw-bold" style="max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" data-conhecimentos="${item.hbls}">${item.hbls}</span> 
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
                                    <th>Forma de Cobrança</th>
                                    <th>Moeda</th>
                                    <th>Quantidade</th>
                                    <th>Valor Total</th>
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
         // Atualiza o totalizador ao final
         createTotalizer();

         document.querySelector('#loader').classList.add('d-none');
      })
   });
   
};

// Calcula a quantidade e o valor total por taxa, separado por pagamento e recebimento
function calculateTotalsRates() {
   const totals = {
      Pagamento: {},
      Recebimento: {}
   };

   // Itera sobre todas as linhas de taxas nos detalhes dos processos
   document.querySelectorAll('.files-list .details-row tbody tr').forEach(rateRow => {
      const taxa = rateRow.querySelector('td:nth-child(1)').textContent.trim(); // Nome da taxa
      const taxaId = rateRow.querySelector('td:nth-child(1)').getAttribute('data-rateid'); // ID da taxa
      const typeBadge = rateRow.querySelector('td:nth-child(2) span.badge'); // Tipo (Pagamento/Recebimento)
      const type = typeBadge ? typeBadge.textContent.trim() : null;

      const formCobElement = rateRow.querySelector('td:nth-child(3)'); // Forma de Cobrança
      const formaCobranca = formCobElement ? formCobElement.textContent.trim() : '(Sem Cobrança)';

      const moedaElement = rateRow.querySelector('td:nth-child(4)'); // Moeda
      const moeda = moedaElement ? moedaElement.textContent.trim() : '';

      const quantityElement = rateRow.querySelector('td:nth-child(5)'); // Quantidade
      const quantity = quantityElement ? parseFloat(quantityElement.textContent.trim()) || 0 : 0;

      const totalInput = rateRow.querySelector('td:nth-child(6) input'); // Valor total
      const total = totalInput ? parseFloat(totalInput.value.trim()) || 0 : 0;

      if (!type || (type !== "Pagamento" && type !== "Recebimento")) {
         return; // Ignorar se o tipo não for válido
      }

      // Inicializa os dados da taxa caso não existam
      if (!totals[type][taxaId]) {
         totals[type][taxaId] = {
            taxaId: taxaId,
            taxaName: taxa,
            quantity: 0,
            total: 0,
            type: type,
            currency: moeda,
            formaCobranca: formaCobranca
         };
      }

      // Acumula os valores
      totals[type][taxaId].quantity += quantity;
      totals[type][taxaId].total += total;
   });

   return totals;
};

// Função que calcula o total de processos, peso cubado e bruto
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

   });

   // Obtém o valor do peso cubado e bruto como números
   const pesoCubadoElement = document.querySelector('.data-peso-cubado');
   const pesoBrutoElement = document.querySelector('.data-peso-bruto');

   const pesoCubado = pesoCubadoElement ? parseFloat(pesoCubadoElement.textContent.trim()) || 0 : 0;
   const pesoBruto = pesoBrutoElement ? parseFloat(pesoBrutoElement.textContent.trim()) || 0 : 0;

   // Acumula os valores no objeto totals
   totals.totalPesoCubado += pesoCubado;
   totals.totalPesoBruto += pesoBruto;

   return totals;
};

// Função para criar o totalizador
function createTotalizer() {
   const totals = calculateTotalsRates();
   const totalsProcesses = calculateTotalProcess();

   let ratesHTML = '';

   // Recebimentos
   for (const [taxa, item] of Object.entries(totals.Recebimento)) {
       ratesHTML += `
           <tr rateIdAndType="${item.taxaId}-${item.type}">
               <td>${item.taxaName}</td>
               <td><span class="badge bg-success-transparent" data-type="Recebimento">Recebimento</span></td>
               <td>${item.formaCobranca}</td>
               <td>${item.currency}</td>
               <td>${(item.quantity).toFixed(2) || ''}</td>
               <td><input class="form-control" type="number" data-taxa="${taxa}" data-type="${item.type}" step="0.01" value="${(item.total || 0).toFixed(2)}" placeholder="Insira um Valor" disabled/></td>
           </tr>`;
   }

   // Pagamentos
   for (const [taxa, item] of Object.entries(totals.Pagamento)) {
       ratesHTML += `
           <tr rateIdAndType="${item.taxaId}-${item.type}">
               <td>${item.taxaName}</td>
               <td><span class="badge bg-danger-transparent" data-type="Pagamento">Pagamento</span></td>
               <td>${item.formaCobranca}</td>
               <td>${item.currency}</td>
               <td>${(item.quantity).toFixed(2) || ''}</td>
               <td><input class="form-control" type="number" data-taxa="${taxa}" data-type="${item.type}" step="0.01" value="${(item.total || 0).toFixed(2)}" placeholder="Insira um Valor" disabled/></td>
           </tr>`;
   }

   const tableTotalizer = `
       <tbody class="files-list">
           <tr>
               <td class="bg-success-transparent" style="width: 15px !important;">
                   <button onclick="toggleDetails(this)" class="btn btn-icon btn-success-transparent rounded-pill btn-wave waves-effect waves-light" title="Visualizar Detalhes">
                       <i class="ri-eye-close-line"></i>
                   </button>
               </td>
               <td class="bg-success-transparent">
                   <div>
                       <span class="d-block fw-normal">Quantidade Processos:</span> 
                       <span class="d-block fw-bold">${totalsProcesses.totalProcesses}</span>
                   </div>
               </td>
               <td class="bg-success-transparent">
                   <div>
                       <span class="d-block fw-normal">Total Peso Cubado:</span> 
                       <span class="d-block fw-bold data-peso-cubado">${totalsProcesses.totalPesoCubado}</span>
                   </div>
               </td>
               <td class="bg-success-transparent">
                   <div>
                       <span class="d-block fw-normal">Total Peso Bruto:</span> 
                       <span class="d-block fw-bold data-peso-bruto">${totalsProcesses.totalPesoBruto}</span>
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
                              <th>Forma de Cobrança</th>
                              <th>Moeda</th>
                              <th>Quantidade</th>
                              <th>Valor Total</th>
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
 
document.addEventListener("DOMContentLoaded", async () => {

   await listAllParteLote();
   await eventClick();
   document.querySelector('#loader2').classList.add('d-none');
});