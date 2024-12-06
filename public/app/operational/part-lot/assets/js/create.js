let searchedProcess, searchedRates, ratesByProcess = {}; // Armazena os processos e taxas que retornaram da pesquisa
let usedRates = {}; // Armazena as taxas já usadas para cada tipo de cobrança
let originalRates = {}; // Armazena os valores originais das taxas modificadas
let selectedRates = {}; // Armazena as taxas selecionadas junto com seus valores

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

// Função que carrega as taxas de acordo com o processo selecionado
async function loadRatesByProcess(IdLogistica_House) {
   const rates = await makeRequest(`/api/part-lot/listRatesByProcess`, 'POST', { IdLogistica_House: IdLogistica_House });

   // O restante da função permanece inalterado, com a criação do selectRates e agrupamento das taxas
   const selectRates = document.getElementById('selectRates');
   const placeHolderOption = selectRates.querySelector('option[disabled]');
   const placeholderHTML = placeHolderOption ? placeHolderOption.outerHTML : '<option value="" disabled selected>Selecione uma Taxa</option>';
   selectRates.innerHTML = placeholderHTML;

   // Agrupa as taxas e insere no selectRates (sem mudanças)
   const groupedRates = rates.reduce((acc, rate) => {
      if (!acc[rate.IdTaxa_Logistica_Exibicao]) {
         acc[rate.IdTaxa_Logistica_Exibicao] = rate;
         acc[rate.IdTaxa_Logistica_Exibicao].TiposDisponiveis = [];
      }
      acc[rate.IdTaxa_Logistica_Exibicao].TiposDisponiveis.push(rate.Tipo);
      return acc;
   }, {});

   const availableRates = Object.values(groupedRates).filter(rate => {
      const isUsed = usedRates[IdLogistica_House]?.[rate.IdTaxa_Logistica_Exibicao] || [];
      const tiposDisponiveis = rate.TiposDisponiveis;
      const isFullyUsed = tiposDisponiveis.every(tipo => isUsed.includes(tipo));
      return !isFullyUsed;
   });

   for (let i = 0; i < availableRates.length; i++) {
      const item = availableRates[i];
      const option = document.createElement('option');
      option.value = item.IdTaxa_Logistica_Exibicao;
      option.textContent = item.Taxa;
      selectRates.appendChild(option);
   }
};

// Função para os valores de qualquer selected
function getSelectValues(selectName) {
   const selectElement = document.querySelector(`select[name="${selectName}"]`);
   if (selectElement) {
      const selectedOptions = Array.from(selectElement.selectedOptions);
      if (selectedOptions.length === 0 || selectedOptions[0].value === '') {
         return undefined;
      } else {
         const selectedValues = selectedOptions.map(option => option.value);
         return selectedValues;
      }
   } else {
      return undefined;
   }
};

// Função para verificar se os selects estão preenchidos
function getValuesFromSelects() {
   // Array com os names dos selects que não devem ficar em branco e suas mensagens personalizadas
   let selectNames = [
      { name: 'selectPrincipalProcess', message: 'Precisa selecionar um PROCESSO' },
      { name: 'selectRates', message: 'Precisa selecionar uma TAXA' },
      { name: 'selectType', message: 'Precisa selecionar um TIPO de COBRANÇA' },
      { name: 'selectFormCob', message: 'Precisa selecionar uma FORMA de COBRANÇA' },
      { name: 'selectRep', message: 'Precisa selecionar se será DIVIDO ou REPLICADO' },
   ];

   let allValid = true;

   for (let i = 0; i < selectNames.length; i++) {
      const selectName = selectNames[i];
      const values = getSelectValues(selectName.name);
      if (!values || values.length === 0) {
         Swal.fire(`${selectName.message}`);
         allValid = false;
         break;
      }
   }

   return allValid;
};

// Função para calcular e distribuir o valor proporcional de acordo com o peso cubado
function distributeRateByCubedWeight(rateId, rateType, totalRateValue, processes) {
   const totalWeight = processes.reduce((sum, process) => sum + parseFloat(process.Peso_Cubado || 0), 0);   

   processes.forEach((process) => {
      const proportion = parseFloat(process.Peso_Cubado || 0) / totalWeight;
      const distributedValue = (proportion * totalRateValue).toFixed(2);      

      // Localizar o `tr` principal do processo
      const processRow = document.querySelector(`tr[data-process-id="${process.IdLogistica_House}"]`);

      // Navegar para o próximo `tr` (detalhes-row) que contém os inputs
      const detailsRow = processRow.nextElementSibling;

      // Localizar o `tbody` dentro do `detailsRow`
      const detailsTbody = detailsRow.querySelector('tbody');

      // Atualizar os inputs correspondentes dentro do `tbody`
      const rateRows = detailsTbody.querySelectorAll('tr');
      rateRows.forEach((rateRow) => {         
         const badge = rateRow.querySelector('span.badge');
         const badgeType = badge ? badge.textContent.trim().toLowerCase() : null;

         // Verificar se a taxa e o tipo correspondem
         if ((rateType === "Pagamento" && badgeType === "pagamento") || (rateType === "Recebimento" && badgeType === "recebimento")) {
            const totalInput = rateRow.querySelector(`input[name="total-${rateId}"]`);
            
            const formCob = rateRow.querySelector(`td[name="formCob=${rateId}"]`)
            const quant = rateRow.querySelector(`td[name="quant=${rateId}"]`)

            if (totalInput) {
               totalInput.value = distributedValue;
            }

            if (formCob) {
               formCob.textContent = 'Livre';
            }

            if (quant) {
               quant.textContent = 1;
            }
         }
      });
   });
};

// Função para calcular e distribuir o valor proporcional de acordo com o peso Considerado
function distributeRateByConsideredWeight(rateId, rateType, totalRateValue, processes) {
   const totalWeight = processes.reduce((sum, process) => sum + parseFloat(process.Peso_Considerado || 0), 0);   

   processes.forEach((process) => {
      const proportion = parseFloat(process.Peso_Considerado || 0) / totalWeight;
      const distributedValue = (proportion * totalRateValue).toFixed(2);

      // Localizar o `tr` principal do processo
      const processRow = document.querySelector(`tr[data-process-id="${process.IdLogistica_House}"]`);

      // Navegar para o próximo `tr` (detalhes-row) que contém os inputs
      const detailsRow = processRow.nextElementSibling;

      // Localizar o `tbody` dentro do `detailsRow`
      const detailsTbody = detailsRow.querySelector('tbody');

      // Atualizar os inputs correspondentes dentro do `tbody`
      const rateRows = detailsTbody.querySelectorAll('tr');
      rateRows.forEach((rateRow) => {
         const badge = rateRow.querySelector('span.badge');
         const badgeType = badge ? badge.textContent.trim().toLowerCase() : null;

         // Verificar se a taxa e o tipo correspondem
         if ((rateType === "Pagamento" && badgeType === "pagamento") || (rateType === "Recebimento" && badgeType === "recebimento")) {
            const totalInput = rateRow.querySelector(`input[name="total-${rateId}"]`);

            const formCob = rateRow.querySelector(`td[name="formCob=${rateId}"]`)
            const quant = rateRow.querySelector(`td[name="quant=${rateId}"]`)

            if (totalInput) {
               totalInput.value = distributedValue;
            }

            if (formCob) {
               formCob.textContent = 'Livre';
            }

            if (quant) {
               quant.textContent = 1;
            }
         }
      });
   });
};

// Função para calcular e distribuir o valor proporcional de acordo com a participação de container por processo
function distributeRateByContainers(rateId, rateType, totalRateValue, process) {
   const containerMap = {}; // Mapa para rastrear a quantidade de processos por container

   // Passo 1: Criar o mapa de container
   process.forEach(process => {
      const containers = process.Containers.split(',').map(c => c.trim()); // Lista de containers do processo
      containers.forEach(container => {
         if(!containerMap[container]) {
            containerMap[container] = 0
         }
         containerMap[container] += 1; // Incrementa o contador de processos que compartilham o container
      })
   })

   // Passo 2: Calcular a proporção de cada container
   const containerValues = {}; // Mapa para armazenar o valor proporcional de cada container
   const totalContainers = Object.keys(containerMap).length;
   const containerUnitValue = totalRateValue / totalContainers;

   Object.keys(containerMap).forEach(container => {
      containerValues[container] = containerUnitValue / containerMap[container];
   })

   // Passo 3: Distribuir o valor para os processos
   process.forEach(process => {
      const containers = process.Containers.split(',').map(c => c.trim());
      let processValue = 0;

      containers.forEach(container => {
         processValue += containerValues[container] || 0;
      });

      processValue = processValue.toFixed(2); // Adiciona as casas decimais

      // Atualizar os inputs correspondentes no DOM
      const processRow = document.querySelector(`tr[data-process-id="${process.IdLogistica_House}"]`);
      const detailsRow = processRow.nextElementSibling;
      const detailsTbody = detailsRow.querySelector('tbody');

      const rateRows = detailsTbody.querySelectorAll('tr');
      rateRows.forEach(rateRow => {
         const badge = rateRow.querySelector('span.badge');
         const badgeType = badge ? badge.textContent.trim().toLowerCase() : null;

         if ((rateType === "Pagamento" && badgeType === "pagamento") || (rateType === "Recebimento" && badgeType === "recebimento")) {
            const totalInput = rateRow.querySelector(`input[name="total-${rateId}"]`);
            const formCob = rateRow.querySelector(`td[name="formCob=${rateId}"]`)
            const quant = rateRow.querySelector(`td[name="quant=${rateId}"]`)

            if (totalInput) {
               totalInput.value = processValue;
            }

            if (formCob) {
               formCob.textContent = 'Livre';
            }

            if (quant) {
               quant.textContent = 1;
            }
         }
      });
   })
};

// Função para calcular e distribuir o valor proporcional de acordo com a participação de container por processo
function distributeRateByConhecimentos(rateId, rateType, totalRateValue, process) {
   const conhecimentoMap = {}; // Mapa para rastrear a quantidade de processos por conhecimento

   // Passo 1: Criar o mapa de conhecimento
   process.forEach(process => {
      const conhecimentos = process.Conhecimentos.split(',').map(c => c.trim()); // Lista de conhecimentos do processo
      conhecimentos.forEach(conhecimento => {
         if(!conhecimentoMap[conhecimento]) {
            conhecimentoMap[conhecimento] = 0
         }
         conhecimentoMap[conhecimento] += 1; // Incrementa o contador de processos que compartilham o conhecimento
      })
   })

   // Passo 2: Calcular a proporção de cada Conhecimento
   const ConhecimentoValues = {}; // Mapa para armazenar o valor proporcional de cada Conhecimento
   const totalConhecimentos = Object.keys(conhecimentoMap).length;
   const ConhecimentoUnitValue = totalRateValue / totalConhecimentos;

   Object.keys(conhecimentoMap).forEach(conhecimento => {
      ConhecimentoValues[conhecimento] = ConhecimentoUnitValue / conhecimentoMap[conhecimento];
   })

   // Passo 3: Distribuir o valor para os processos
   process.forEach(process => {
      const containers = process.Conhecimentos.split(',').map(c => c.trim());
      let processValue = 0;

      containers.forEach(conhecimento => {
         processValue += ConhecimentoValues[conhecimento] || 0;
      });
      
      processValue = processValue.toFixed(2); // Adiciona as casas decimais

      // Atualizar os inputs correspondentes no DOM
      const processRow = document.querySelector(`tr[data-process-id="${process.IdLogistica_House}"]`);
      const detailsRow = processRow.nextElementSibling;
      const detailsTbody = detailsRow.querySelector('tbody');

      const rateRows = detailsTbody.querySelectorAll('tr');
      rateRows.forEach(rateRow => {
         const badge = rateRow.querySelector('span.badge');
         const badgeType = badge ? badge.textContent.trim().toLowerCase() : null;

         if ((rateType === "Pagamento" && badgeType === "pagamento") || (rateType === "Recebimento" && badgeType === "recebimento")) {
            const totalInput = rateRow.querySelector(`input[name="total-${rateId}"]`);
            const formCob = rateRow.querySelector(`td[name="formCob=${rateId}"]`)
            const quant = rateRow.querySelector(`td[name="quant=${rateId}"]`)

            if (totalInput) {
               totalInput.value = processValue;
            }

            if (formCob) {
               formCob.textContent = 'Livre';
            }

            if (quant) {
               quant.textContent = 1;
            }
         }
      });
   })
};

function replicateRateToAllProcesses(rateId, rateType, rateValue) {
   // Percorre todos os processos exibidos na tabela
   const processRows = document.querySelectorAll('.files-list');

   processRows.forEach(processRow => {
      const detailsRow = processRow.querySelector('.details-row');

      if (detailsRow) {
         const detailsTbody = detailsRow.querySelector('tbody');

         if (detailsTbody) {
            const rateRows = detailsTbody.querySelectorAll('tr');

            rateRows.forEach(rateRow => {
                  const badge = rateRow.querySelector('span.badge');
                  const badgeType = badge ? badge.textContent.trim().toLowerCase() : null;

                  // Verificar se o tipo de cobrança corresponde
                  if ((rateType === "Pagamento" && badgeType === "pagamento") || (rateType === "Recebimento" && badgeType === "recebimento")) {
                     const totalInput = rateRow.querySelector(`input[name="total-${rateId}"]`);

                     if (totalInput) {
                        totalInput.value = rateValue.toFixed(2);
                     }
                  }
            });
         }
      }
   });
};

// Função para salvar taxas e verificar discrepâncias
async function saveRates() {
   const processId = document.getElementById('selectPrincipalProcess').value;

   if (!processId) {
       Swal.fire('Selecione um processo principal antes de salvar!');
       return;
   }

   // Recupera as taxas selecionadas para o processo atual
   const savedRates = selectedRates[processId];

   if (!savedRates) {
       Swal.fire('Erro!', 'As taxas do processo selecionado não foram encontradas. Tente novamente.', 'error');
       return;
   }

   // Calcula os valores totais no totalizador
   const totals = calculateTotalsRates();

   let hasDifferences = false;
   let message = "As seguintes discrepâncias foram encontradas:\n";

   // Verifica discrepâncias para pagamentos
   for (const [taxaId, item] of Object.entries(totals.Pagamento)) {
       const savedRate = savedRates.find(rate =>
           rate.IdTaxa_Logistica_Exibicao == taxaId &&
           rate.Tipo === "Pagamento"
       );

       if (!savedRate) continue;

       const totalValue = parseFloat(item.total || 0);
       const originalValue = parseFloat(savedRate.ValorTotal || 0); // Valor da taxa salvo originalmente
       const difference = totalValue - originalValue; // Calcula a diferença

       if (Math.abs(difference) > 0.01) { // Apenas diferenças acima de 1 centavo
           hasDifferences = true;
           message += `Taxa: ${item.taxaName} (Pagamento) - Diferença: R$ ${difference.toFixed(2)}\n`;
       }
   }

   // Verifica discrepâncias para recebimentos
   for (const [taxaId, item] of Object.entries(totals.Recebimento)) {
       const savedRate = savedRates.find(rate =>
           rate.IdTaxa_Logistica_Exibicao == taxaId &&
           rate.Tipo === "Recebimento"
       );

       if (!savedRate) continue;

       const totalValue = parseFloat(item.total || 0);
       const originalValue = parseFloat(savedRate.ValorTotal || 0); // Valor da taxa salvo originalmente
       const difference = totalValue - originalValue; // Calcula a diferença

       if (Math.abs(difference) > 0.01) { // Apenas diferenças acima de 1 centavo
           hasDifferences = true;
           message += `Taxa: ${item.taxaName} (Recebimento) - Diferença: R$ ${difference.toFixed(2)}\n`;
       }
   }

   if (hasDifferences) {
       Swal.fire({
           title: 'Atenção!',
           text: message,
           icon: 'warning',
           confirmButtonText: 'Ok'
       });
   } else {
       Swal.fire('Sucesso!', 'Valores das taxas estão corretos e foram salvos!', 'success');

       // Enviar dados para o backend, se necessário
       // await saveToBackend(processId, totals);
   }
}



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

function calculateTotalProcess() {
   const totals = {
      totalProcesses: 0,
      totalPesoCubado: 0,
      totalPesoConsiderado: 0
   };

   // Itera sobre cada linha de processo
   document.querySelectorAll('.files-list tr[data-process-id]').forEach(process => {
      // Incrementa o número total de processos
      totals.totalProcesses += 1;

      // Obtém o valor do peso cubado e considerado como números
      const pesoCubadoElement = process.querySelector('.data-peso-cubado');
      const pesoConsideradoElement = process.querySelector('.data-peso-considerado');

      const pesoCubado = pesoCubadoElement ? parseFloat(pesoCubadoElement.textContent.trim()) || 0 : 0;
      const pesoConsiderado = pesoConsideradoElement ? parseFloat(pesoConsideradoElement.textContent.trim()) || 0 : 0;

      // Acumula os valores no objeto totals
      totals.totalPesoCubado += pesoCubado;
      totals.totalPesoConsiderado += pesoConsiderado;
   });

   return totals;
};

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
               <td>${item.quantity || ''}</td>
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
               <td>${item.quantity || ''}</td>
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
                       <span class="d-block fw-bold">${totalsProcesses.totalPesoCubado}</span>
                   </div>
               </td>
               <td class="bg-success-transparent">
                   <div>
                       <span class="d-block fw-normal">Total Peso Considerado:</span> 
                       <span class="d-block fw-bold">${totalsProcesses.totalPesoConsiderado}</span>
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

function updateTotalizerInputs() {
   const totals = calculateTotalsRates();

   // Atualiza os valores de pagamento e recebimento no totalizador
   for (const [type, rates] of Object.entries(totals)) {
      for (const [taxa, item] of Object.entries(rates)) {
         const inputTotal = document.querySelector(`input[data-taxa="${taxa}"][data-type="${type}"]`);
         const quantityElement = document.querySelector(`td[data-taxa="${taxa}"][data-type="${type}"]`);

         if (inputTotal) {
            inputTotal.value = item.total.toFixed(2);
         }

         if (quantityElement) {
            quantityElement.textContent = item.quantity;
         }
      }
   }
};

function monitorTotalInputs() {
   const container = document.getElementById('tableControlProcess');

   // Adiciona o evento 'input' ao contêiner
   container.addEventListener('input', (event) => {
      if (
         event.target &&
         event.target.tagName === 'INPUT' &&
         event.target.type === 'number'
      ) {
         // Atualiza o totalizador apenas para a taxa correspondente
         updateTotalizerInputs();
      }
   });
};

function addUndoButton(rateId, rateType) {
   const rowSelector = document.querySelector(`.totalizador [rateIdAndType="${rateId}-${rateType}"]`);
   const rateRow = rowSelector ? rowSelector.closest('tr') : null;

   if (rateRow) {
      let undoCell = rateRow.querySelector(`.undo-button-cell-${rateType}`);
      if (!undoCell) {
         undoCell = document.createElement('td');
         undoCell.className = `undo-button-cell-${rateType}`;
         undoCell.style.textAlign = 'center';

         const undoButton = document.createElement('button');
         undoButton.className = 'btn btn-warning btn-sm';
         undoButton.textContent = `Desfazer ${rateType}`;

         // Adiciona o evento de clique com a lógica para remover o botão após clicar
         undoButton.onclick = () => {
            undoChanges(rateId, rateType); // Chama a função para desfazer
            undoCell.remove(); // Remove a célula contendo o botão
         };

         undoCell.appendChild(undoButton);
         rateRow.appendChild(undoCell);
      }
   }
};

function undoChanges(rateId, rateType) {
   // Localizar os processos relacionados à taxa e ao tipo
   const processes = searchedProcess.filter(process => {
      const detailsRow = document.querySelector(`tr[data-process-id="${process.IdLogistica_House}"]`).nextElementSibling;
      const detailsTbody = detailsRow?.querySelector("tbody");
      return detailsTbody?.querySelector(`[rateIdAndType='${rateId}-${rateType}']`);
   });

   // Restaurar os valores originais nos inputs e remover classes destacadas
   processes.forEach(process => {
      const processRow = document.querySelector(`tr[data-process-id="${process.IdLogistica_House}"]`);
      const detailsRow = processRow.nextElementSibling;
      const detailsTbody = detailsRow.querySelector("tbody");
      const rateRows = detailsTbody.querySelectorAll(`[rateIdAndType='${rateId}-${rateType}']`);

      rateRows.forEach(rateRow => {
         const inputElement = rateRow.querySelector("input");
         const originalEntry = originalRates[rateId].find(entry => entry.element === rateRow);

         if (inputElement && originalEntry) {
            inputElement.value = parseFloat(originalEntry.originalValue).toFixed(2);
         }

         // Remove a classe de destaque
         rateRow.classList.remove("bg-warning-transparent");
      });
   });

   // Atualizar o objeto `usedRates` removendo o tipo de cobrança
   const processId = processes[0]?.IdLogistica_House; // Assume que todos os processos são do mesmo grupo
   if (processId && usedRates[processId]?.[rateId]) {
      const index = usedRates[processId][rateId].indexOf(rateType);
      if (index > -1) {
         usedRates[processId][rateId].splice(index, 1);
         if (usedRates[processId][rateId].length === 0) {
            delete usedRates[processId][rateId];
         }
      }
   }

   // Atualizar o totalizador
   updateTotalizerInputs();

   // Remover o botão "Desfazer"
   const rateRow = document.querySelector(`.totalizador [rateIdAndType="${rateId}-${rateType}"]`)?.closest("tr");
   if (rateRow) {
      const undoCell = rateRow.querySelector(`.undo-button-cell-${rateType}`);
      if (undoCell) {
         undoCell.remove();
      }
   }

   // Limpar o registro de valores originais para o tipo atual
   originalRates[rateId] = originalRates[rateId].filter(entry => {
      const badge = entry.element.querySelector("span.badge");
      const entryType = badge ? badge.textContent.trim().toLowerCase() : null;
      return entryType !== rateType.toLowerCase();
   });

   // Remover do objeto `originalRates` se não houver mais registros
   if (originalRates[rateId].length === 0) {
      delete originalRates[rateId];
   }
};

// Busca os processos pela referencia externa e insere na tela
document.getElementById('searchProcess').addEventListener('click', async function () {
   document.querySelector('#loader').classList.remove('d-none');

   const tableControlProcess = document.getElementById('tableControlProcess'); // Div que vai inserir os processos dentro
   const searchInput = document.getElementById('searchInput').value;

   searchedProcess = ''; // Limpa a variavel a cada consulta para poder inserir novos valores
   searchedRates = ''; // Limpa a variavel a cada consulta para poder inserir novos valores
   usedRates = {}; // Limpa a variavel a cada consulta para poder inserir novos valores
   const process = await makeRequest(`/api/part-lot/processByRef`, 'POST', { externalRef: searchInput});
   const processIds = process.map(p => p.IdLogistica_House); // Pega o ID de todos os processos
   const rates = await makeRequest(`/api/part-lot/listAllRates`, 'POST', { IdLogistica_House: processIds }); // Busca todas as taxas em uma única consulta
   searchedProcess = process; // Atualizado os valores da variavel
   searchedRates = rates; // Atualizado os valores da variavel

   // Organiza as taxas por processo
   const ratesByProcess = rates.reduce((acc, rate) => {
      if (!acc[rate.IdLogistica_House]) acc[rate.IdLogistica_House] = [];
      acc[rate.IdLogistica_House].push(rate);
      return acc;
   }, {});

   // Insere os processos na tela
   tableControlProcess.innerHTML = '';
   let processHTML = '';

   const selectPrincipalProcess = document.getElementById('selectPrincipalProcess'); // Insere os processos no selectPrincipalProcess
   const placeHolderOption = selectPrincipalProcess.querySelector('option[disabled]'); // Mantém o placeholder no select
   const placeholderHTML = placeHolderOption ? placeHolderOption.outerHTML : '<option value="" disabled selected>Selecione um processo</option>';
   // Remove as opções existentes
   selectPrincipalProcess.innerHTML = placeholderHTML;

   for (let i = 0; i < process.length; i++) {
      const item = process[i];

      // Adiciona um indicador de carregamento
      const option = document.createElement('option');
      option.value = item.IdLogistica_House;
      option.textContent = item.Numero_Processo;
      selectPrincipalProcess.appendChild(option);

      // Obtem as taxas do processo atual
      const processRates = ratesByProcess[item.IdLogistica_House] || [];

      // Gera o HTML para as taxas
      let ratesHTML = processRates.map((rate) => `
         <tr>
            <td rateIdAndType="${rate.IdTaxa_Logistica_Exibicao}-${rate.Tipo}" data-rateId="${rate.IdTaxa_Logistica_Exibicao}" data-name-taxa="${rate.Taxa}" data-IdLogistica-House="${rate.IdLogistica_House}">${rate.Taxa}</td>
            <td rateIdAndType="${rate.IdTaxa_Logistica_Exibicao}-${rate.Tipo}"><span class="badge bg-${rate.Tipo === 'Recebimento' ? 'success' : 'danger'}-transparent" data-type="${rate.Tipo}">${rate.Tipo}</span></td>
            <td rateIdAndType="${rate.IdTaxa_Logistica_Exibicao}-${rate.Tipo}" name="formCob=${rate.IdTaxa_Logistica_Exibicao}" data-IdTaxa-Logistica-Exibicao="${rate.IdTaxa_Logistica_Exibicao}">${rate.Forma_Cobranca || '(Sem Cobrança)'}</td>
            <td rateIdAndType="${rate.IdTaxa_Logistica_Exibicao}-${rate.Tipo}" data-coin=""${rate.Moeda}>${rate.Moeda || ''}</td>
            <td rateIdAndType="${rate.IdTaxa_Logistica_Exibicao}-${rate.Tipo}" name="quant=${rate.IdTaxa_Logistica_Exibicao}" data-quant="${rate.Quantidade}">${rate.Quantidade || ''}</td>
            <td rateIdAndType="${rate.IdTaxa_Logistica_Exibicao}-${rate.Tipo}"><input class="form-control" name="total-${rate.IdTaxa_Logistica_Exibicao}" type="number" step="0.01" value="${(rate.Valor_Total || 0).toFixed(2)}" placeholder="Insira um Valor"/></td>
         </tr>
      `).join('');

      processHTML += `
         <tbody class="files-list">
            <tr data-process-id="${item.IdLogistica_House}" class="odd">
               <td class="data-peso-cubado d-none">${item.Peso_Cubado}</td>
               <td class="data-peso-considerado d-none">${item.Peso_Considerado}</td>
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
   // FIM - Insere os processos na tela

   // Atualiza o totalizador ao final
   createTotalizer();

   calculateTotalProcess()

   document.querySelector('#loader').classList.add('d-none');
});

// Adiciona um evento para carregar as opções quando o dropdown do select é exibido
document.querySelector('#selectRates').addEventListener('focus', async function() {
   const selectPrincipalProcess = document.getElementById('selectPrincipalProcess');
   const processId = selectPrincipalProcess.value;
   
   if (!processId) return;

   await loadRatesByProcess(processId);
});

// Função para selecionar os tipos cobrança disponivel por taxa/processo
document.getElementById('selectType').addEventListener('focus', function () {
   const selectPrincipalProcess = document.getElementById('selectPrincipalProcess');
   const selectRates = document.getElementById('selectRates');
   const processId = selectPrincipalProcess.value;
   const rateId = selectRates.value;

   if (!processId || !rateId) return;

   const selectType = document.getElementById('selectType');
   const placeholderHTML = '<option value="" disabled selected>Selecione uma Opção</option>';
   selectType.innerHTML = placeholderHTML;

   // Obtém os tipos de cobrança já usados para a taxa selecionada
   const used = usedRates[processId]?.[rateId] || [];
   const availableRates = searchedRates.filter(rate => rate.IdTaxa_Logistica_Exibicao == rateId);

   // Garantir que o tipo de cobrança correto seja adicionado
   const hasPagamento = availableRates.some(rate => rate.Tipo === "Pagamento" && !used.includes("Pagamento"));
   const hasRecebimento = availableRates.some(rate => rate.Tipo === "Recebimento" && !used.includes("Recebimento"));

   if (hasPagamento) {
      selectType.innerHTML += '<option value="0">Pagamento</option>';
   }
   if (hasRecebimento) {
      selectType.innerHTML += '<option value="1">Recebimento</option>';
   }
});

// Adiciona evento ao selecionar o tipo de cobrança
document.getElementById('selectType').addEventListener('change', function () {
   const selectPrincipalProcess = document.getElementById('selectPrincipalProcess');
   const selectRates = document.getElementById('selectRates');
   const inputValue = document.getElementById('inputValue');

   const processId = selectPrincipalProcess.value;
   const rateId = selectRates.value; // Este é o IdTaxa_Logistica_Exibicao
   const rateType = this.value === "0" ? "Pagamento" : this.value === "1" ? "Recebimento" : '';

   // Verifica se os campos obrigatórios estão preenchidos
   if (!processId || !rateId || !rateType) {
      inputValue.value = '';
      console.error('Processo, taxa ou tipo não selecionado corretamente.');
      return;
   }

   // Busca os detalhes da taxa selecionada
   const selectedRate = searchedRates.find(rate => rate.IdTaxa_Logistica_Exibicao == rateId && rate.Tipo == rateType);
   if (!selectedRate) {
      console.error('Taxa não encontrada');
      inputValue.value = '';
      return;
   }

   // Verifica qual valor usar com base no tipo selecionado
   let valueToInsert = 0;
   if (rateType === "Pagamento") {
      // Certifique-se de que o campo correto está sendo usado
      valueToInsert = selectedRate.Valor_Pagamento || selectedRate.Valor_Total || 0; 
   } else if (rateType === "Recebimento") {
      valueToInsert = selectedRate.Valor_Recebimento || selectedRate.Valor_Total || 0; 
   }

   // Atualiza o input com o valor correspondente
   inputValue.value = valueToInsert.toFixed(2);
});

// Adiciona evento ao selecionar a forma de cobrança
document.getElementById('selectFormCob').addEventListener('change', function () {
   const selectDivRep = document.getElementById('selectDivRep');
   const formCobId = this.value;
   
   const placeholderHTML = '<option value="" disabled selected>Selecione uma Opção</option>';
   selectDivRep.innerHTML = placeholderHTML;

   if (formCobId == 0) {
      selectDivRep.innerHTML += '<option value="0">Dividir</option>';
      selectDivRep.innerHTML += '<option value="1">Replicar</option>';
   }

   if (formCobId != 0) {
      selectDivRep.innerHTML += '<option value="0">Dividir</option>';
   }
});

// Função para inserir uma taxa
document.getElementById('insertRate').addEventListener('click', async function () {
   const selectPrincipalProcess = document.getElementById('selectPrincipalProcess');
   const selectRates = document.getElementById('selectRates');
   const selectType = document.getElementById('selectType');
   const selectFormCob = document.getElementById('selectFormCob');
   const selectDivRep = document.getElementById('selectDivRep');
   const inputValue = document.getElementById('inputValue');

   const processId = selectPrincipalProcess.value;
   const rateId = selectRates.value;
   const rateType = selectType.value === "0" ? "Pagamento" : selectType.value === "1" ? "Recebimento" : '';
   const formCobId = selectFormCob.value;
   const divOrRepId = selectDivRep.value;
   const totalRateValue = parseFloat(inputValue.value);

   // Validações obrigatórias
   if (!processId || !rateId || !rateType || !formCobId || !divOrRepId || isNaN(totalRateValue)) {
      getValuesFromSelects(); // Mostra alertas para campos faltantes
      return;
   }

   // Salvar valores originais antes de modificar
   if (!originalRates[rateId]) {
      originalRates[rateId] = [];
   }
   document.querySelectorAll(`[rateIdAndType='${rateId}-${rateType}']`).forEach(td => {
      originalRates[rateId].push({
         element: td,
         originalValue: td.querySelector('input') ? td.querySelector('input').value : td.textContent.trim()
      });
   });

   // Atualiza o objeto usedRates
   if (!usedRates[processId]) {
      usedRates[processId] = {};
   }

   if (!usedRates[processId][rateId]) {
      usedRates[processId][rateId] = [];
   }

   usedRates[processId][rateId].push(rateType);

   // Aplicar as alterações
   if (divOrRepId == 0 /* Dividir */ && formCobId == 3 /* Peso Cubado */) {
      distributeRateByCubedWeight(rateId, rateType, totalRateValue, searchedProcess);
   } else if (divOrRepId == 0 /* Dividir */ && formCobId == 2 /* Peso Considerado */) {
      distributeRateByConsideredWeight(rateId, rateType, totalRateValue, searchedProcess);
   } else if (divOrRepId == 0 /* Dividir */ && formCobId == 1 /* Container */) {
      distributeRateByContainers(rateId, rateType, totalRateValue, searchedProcess);
   } else if (divOrRepId == 0 /* Dividir */ && formCobId == 0 /* Conhecimento */) {
      distributeRateByConhecimentos(rateId, rateType, totalRateValue, searchedProcess);
   } else if (divOrRepId == 1 /* Replicar */ && formCobId == 0) {
      replicateRateToAllProcesses(rateId, rateType, totalRateValue, searchedProcess);
   }

   // Recarrega as taxas disponíveis para o processo principal
   await loadRatesByProcess(processId);

   // Adiciona a classe 'bg-warning-transparent' aos <td> correspondentes à taxa alterada
   document.querySelectorAll(`[rateIdAndType='${rateId}-${rateType}']`).forEach(td => {
      td.classList.add('bg-warning-transparent');
   });

   // Adiciona o botão "Desfazer" no totalizador
   addUndoButton(rateId, rateType);

   // Função de atualizar os inputs do totalizador
   updateTotalizerInputs();

   // Reseta os selects (exceto o processo principal)
   document.getElementById('selectRates').value = '';
   document.getElementById('selectType').value = '';
   document.getElementById('selectFormCob').value = '';
   document.getElementById('selectDivRep').value = '';
   document.getElementById('inputValue').value = '';
});

document.getElementById('selectPrincipalProcess').addEventListener('change', async function () {
   const processId = this.value; // Obtém o ID do processo selecionado

   // Chama o endpoint para obter as taxas do processo
   const rates = await makeRequest(`/api/part-lot/listRatesByProcess`, 'POST', { IdLogistica_House: processId });

   // Log de depuração para verificar os dados recebidos
   console.log("Dados retornados pelo endpoint:", rates);

   // Salva as taxas no selectedRates para comparação futura
   selectedRates[processId] = rates.map(rate => ({
      IdTaxa_Logistica_Exibicao: rate.IdTaxa_Logistica_Exibicao,
      Tipo: rate.Tipo,
      ValorTotal: rate.Valor_Pagamento_Total || 0
   }));

   // Log de depuração para verificar o armazenamento
   console.log(`Taxas salvas para o processo ${processId}:`, selectedRates[processId]);
});

// Evento para salvar as taxas ao clicar no botão "Salvar"
document.getElementById('saveButton').addEventListener('click', saveRates);

document.addEventListener("DOMContentLoaded", async () => {

   monitorTotalInputs();
   document.querySelector('#loader2').classList.add('d-none');
});