let searchedProcess, searchedRates, ratesByProcess = {}; // Armazena os processos e taxas que retornaram da pesquisa
let usedRates = {}; // Armazena as taxas já usadas para cada tipo de cobrança

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

   const selectRates = document.getElementById('selectRates');
   // Mantém o placeholder no select
   const placeHolderOption = selectRates.querySelector('option[disabled]');
   const placeholderHTML = placeHolderOption ? placeHolderOption.outerHTML : '<option value="" disabled selected>Selecione uma Taxa</option>';
   // Remove as opções existentes
   selectRates.innerHTML = placeholderHTML;

   // Filtra as taxas não utilizadas completamente
   const availableRates = rates.filter(rate => {
      const used = usedRates[IdLogistica_House]?.[rate.IdTaxa_Logistica_Exibicao] || [];
      return !(used.includes('Pagamento') && used.includes('Recebimento')); // Exclui taxas com ambos os tipos usados
   });

   // Adiciona as taxas disponíveis ao select usando IdTaxa_Logistica_Exibicao
   for (let i = 0; i < availableRates.length; i++) {
      const item = availableRates[i];
      const option = document.createElement('option');
      option.value = item.IdTaxa_Logistica_Exibicao; // Agora usamos IdTaxa_Logistica_Exibicao
      option.textContent = item.Taxa;
      selectRates.appendChild(option);
   }

   ratesByProcess = rates.reduce((acc, rate) => {
      if (!acc[rate.IdLogistica_House]) acc[rate.IdLogistica_House] = [];
      acc[rate.IdLogistica_House].push(rate);
      return acc;
   }, {});
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
            const unitInput = rateRow.querySelector(`input[name="unit-${rateId}"]`);
            const totalInput = rateRow.querySelector(`input[name="total-${rateId}"]`);
            
            const formCob = rateRow.querySelector(`td[name="formCob=${rateId}"]`)
            const quant = rateRow.querySelector(`td[name="quant=${rateId}"]`)

            if (unitInput) {
               unitInput.value = distributedValue;
            }

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
            const unitInput = rateRow.querySelector(`input[name="unit-${rateId}"]`);
            const totalInput = rateRow.querySelector(`input[name="total-${rateId}"]`);

            const formCob = rateRow.querySelector(`td[name="formCob=${rateId}"]`)
            const quant = rateRow.querySelector(`td[name="quant=${rateId}"]`)

            if (unitInput) {
               unitInput.value = distributedValue;
            }

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
            const unitInput = rateRow.querySelector(`input[name="unit-${rateId}"]`);
            const totalInput = rateRow.querySelector(`input[name="total-${rateId}"]`);

            const formCob = rateRow.querySelector(`td[name="formCob=${rateId}"]`)
            const quant = rateRow.querySelector(`td[name="quant=${rateId}"]`)

            if (unitInput) {
               unitInput.value = processValue;
            }

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
            const unitInput = rateRow.querySelector(`input[name="unit-${rateId}"]`);
            const totalInput = rateRow.querySelector(`input[name="total-${rateId}"]`);

            const formCob = rateRow.querySelector(`td[name="formCob=${rateId}"]`)
            const quant = rateRow.querySelector(`td[name="quant=${rateId}"]`)

            if (unitInput) {
               unitInput.value = processValue;
            }

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
                     const unitInput = rateRow.querySelector(`input[name="unit-${rateId}"]`);
                     const totalInput = rateRow.querySelector(`input[name="total-${rateId}"]`);

                     // Atualizar os inputs com o valor replicado
                     if (unitInput) {
                        unitInput.value = rateValue.toFixed(2);
                     }

                     if (totalInput) {
                        totalInput.value = rateValue.toFixed(2);
                     }
                  }
            });
         }
      }
   });
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
            <td>${rate.Taxa}</td>
            <td><span class="badge bg-${rate.Tipo === 'Recebimento' ? 'success' : 'danger'}-transparent">${rate.Tipo}</span></td>
            <td name="formCob=${rate.IdTaxa_Logistica_Exibicao}">${rate.Forma_Cobranca || '(Sem Cobrança)'}</td>
            <td>${rate.Moeda || ''}</td>
            <td name="quant=${rate.IdTaxa_Logistica_Exibicao}">${rate.Quantidade || ''}</td>
            <td><input class="form-control" name="unit-${rate.IdTaxa_Logistica_Exibicao}" type="number" step="0.01" value="${(rate.Valor_Unitario || 0).toFixed(2)}" placeholder="Insira um Valor"/></td>
            <td><input class="form-control" name="total-${rate.IdTaxa_Logistica_Exibicao}" type="number" step="0.01" value="${(rate.Valor_Total || 0).toFixed(2)}" placeholder="Insira um Valor"/></td>
         </tr>
      `).join('');
   

      processHTML += `
         <tbody class="files-list">
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
               <td colspan="10">
                     <table class="table table-sm table-bordered mt-2">
                        <thead>
                           <tr>
                              <th>Taxa</th>
                              <th>Tipo</th>
                              <th>Forma de Cobrança</th>
                              <th>Moeda</th>
                              <th>Quantidade</th>
                              <th>Valor Unitário</th>
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

   const used = usedRates[processId]?.[rateId] || [];
   if (!used.includes('Pagamento')) {
      selectType.innerHTML += '<option value="0">Pagamento</option>';
   }
   if (!used.includes('Recebimento')) {
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

   // Atualiza o objeto usedRates
   if (!usedRates[processId]) {
      usedRates[processId] = {};
   }

   if (!usedRates[processId][rateId]) {
      usedRates[processId][rateId] = [];
   }

   usedRates[processId][rateId].push(rateType);

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

   // Reseta os selects (exceto o processo principal)
   document.getElementById('selectRates').value = '';
   document.getElementById('selectType').value = '';
   document.getElementById('selectFormCob').value = '';
   document.getElementById('selectDivRep').value = '';
   document.getElementById('inputValue').value = '';
});

document.addEventListener("DOMContentLoaded", async () => {

   document.querySelector('#loader2').classList.add('d-none');
});