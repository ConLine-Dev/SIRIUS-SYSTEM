(function(){
  const apiBase = '/api/hr-job-openings';
  const url = new URL(window.location.href);
  const id = url.searchParams.get('id');
  let choiceInstances = [];

  function initChoices(){
    // Limpar instâncias anteriores
    choiceInstances.forEach(instance => {
      if (instance && instance.destroy) {
        instance.destroy();
      }
    });
    choiceInstances = [];
    
    document.querySelectorAll('select[data-choices]').forEach(sel => {
      const inst = new Choices(sel, { 
        searchEnabled: true, 
        itemSelectText: '', 
        noResultsText: 'Sem resultados',
        removeItemButton: false
      });
      choiceInstances.push(inst);
    });
  }

  async function loadMeta(){
    const r = await fetch(apiBase + '/meta');
    const meta = await r.json();
    const fill = (sel, items) => {
      const el = document.querySelector(sel);
      items.forEach(i => { const o = document.createElement('option'); o.value=i.id; o.textContent=i.name; el.appendChild(o); });
    };
    fill('select[name="department_id"]', meta.departments);
    fill('select[name="location_id"]', meta.locations);
    fill('select[name="modality_id"]', meta.modalities);
    fill('select[name="level_id"]', meta.levels);
    fill('select[name="contract_type_id"]', meta.contracts);
  }

  // Funções para gerenciar itens dinâmicos
  function addItem(containerId, inputClass, placeholder) {
    const container = document.getElementById(containerId);
    const itemDiv = document.createElement('div');
    itemDiv.className = 'mb-2';
    itemDiv.innerHTML = `
      <div class="input-group">
        <input type="text" class="form-control ${inputClass}" placeholder="${placeholder}">
        <button type="button" class="btn btn-outline-danger remove-item" onclick="removeItem(this)">
          <i class="ri-delete-bin-line"></i>
        </button>
      </div>
    `;
    container.appendChild(itemDiv);
  }

  function removeItem(button) {
    const itemDiv = button.closest('.mb-2');
    if (itemDiv) {
      itemDiv.remove();
    }
  }

  function addResponsibility() {
    addItem('responsibilities-container', 'responsibility-input', 'Adicione uma responsabilidade');
  }

  function addRequirement() {
    addItem('requirements-container', 'requirement-input', 'Adicione um requisito');
  }

  function addBenefit() {
    addItem('benefits-container', 'benefit-input', 'Adicione um benefício');
  }

  function addNiceToHave() {
    addItem('nice-to-have-container', 'nice-to-have-input', 'Adicione um diferencial');
  }

  function populateItems(containerId, inputClass, items) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} não encontrado!`);
      return;
    }
    
    container.innerHTML = ''; // Limpar container
    
    if (items && items.length > 0) {
      items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'mb-2';
        itemDiv.innerHTML = `
          <div class="input-group">
            <input type="text" class="form-control ${inputClass}" value="${item}" placeholder="Adicione um item">
            <button type="button" class="btn btn-outline-danger remove-item" onclick="removeItem(this)">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        `;
        container.appendChild(itemDiv);
      });
    } else {
      // Adicionar um item vazio
      addItem(containerId, inputClass, 'Adicione um item');
    }
  }

  // Função para coletar dados dos itens dinâmicos
  function collectItems(containerId, inputClass) {
    const container = document.getElementById(containerId);
    const inputs = container.querySelectorAll(`.${inputClass}`);
    const items = [];
    inputs.forEach(input => {
      if (input.value.trim()) {
        items.push(input.value.trim());
      }
    });
    return items;
  }

  async function loadJob(){
    const r = await fetch(`${apiBase}/${id}`);
    const j = await r.json();
    
    console.log('Dados da vaga carregados:', j);
    console.log('IDs dos campos:', {
      department_id: j.department_id,
      location_id: j.location_id,
      modality_id: j.modality_id,
      level_id: j.level_id,
      contract_type_id: j.contract_type_id
    });
    
    document.querySelector('input[name="title"]').value = j.title;
    document.querySelector('input[name="openings"]').value = j.openings;
    document.querySelector('input[name="posted_at"]').value = j.posted_at_ymd;
    document.querySelector('textarea[name="description"]').value = j.description || '';

    // Função para definir valores dos selects
    const setSelectValues = () => {
      console.log('Definindo valores dos selects...');
      console.log('Instâncias do Choices:', choiceInstances.length);
      
      // Mapear valores diretamente por índice
      const values = [
        j.department_id,
        j.location_id, 
        j.modality_id,
        j.level_id,
        j.contract_type_id
      ];
      
      console.log('Valores a serem definidos:', values);
      
              choiceInstances.forEach((instance, index) => {
          const value = values[index];
          if (value) {
            console.log(`Definindo instância ${index} com valor: ${value}`);
            try {
              // Tentar diferentes métodos
              if (instance.setChoiceByValue) {
                instance.setChoiceByValue(value.toString());
                console.log(`✅ Valor ${value} definido com sucesso na instância ${index} (setChoiceByValue)`);
              } else if (instance.setValue) {
                instance.setValue([{ value: value.toString(), label: '' }]);
                console.log(`✅ Valor ${value} definido com sucesso na instância ${index} (setValue)`);
              } else {
                console.error(`❌ Método não encontrado na instância ${index}`);
              }
            } catch (error) {
              console.error(`❌ Erro ao definir valor ${value} na instância ${index}:`, error);
            }
          }
        });
    };

    // Tentar definir valores imediatamente
    setSelectValues();
    
    // Se não funcionou, tentar novamente após um delay
    setTimeout(setSelectValues, 200);
    setTimeout(setSelectValues, 500);

    // Carregar itens dinâmicos
    populateItems('responsibilities-container', 'responsibility-input', j.responsibilities || []);
    populateItems('requirements-container', 'requirement-input', j.requirements || []);
    populateItems('benefits-container', 'benefit-input', j.benefits || []);
    populateItems('nice-to-have-container', 'nice-to-have-input', j.niceToHave || []);
  }

  async function save(){
    const form = document.getElementById('jobForm');
    const fd = new FormData(form); 
    const body = Object.fromEntries(fd.entries());
    
    // Validar campos obrigatórios
    const requiredFields = ['title', 'department_id', 'location_id', 'modality_id', 'level_id', 'contract_type_id', 'posted_at'];
    const missingFields = requiredFields.filter(field => !body[field] || body[field].trim() === '');
    
    if (missingFields.length > 0) {
      Swal.fire({ 
        icon: 'warning', 
        title: 'Campos obrigatórios', 
        text: 'Por favor, preencha todos os campos obrigatórios antes de salvar.' 
      });
      return;
    }
    
    // Limpar apenas campos opcionais vazios, mantendo campos obrigatórios
    const optionalFields = ['description'];
    Object.keys(body).forEach(key => {
      if (optionalFields.includes(key) && (body[key] === '' || body[key] === null || body[key] === undefined)) {
        delete body[key];
      }
    });
    
    body.openings = parseInt(body.openings || '1', 10);
    body.is_active = parseInt(body.is_active || '1', 10);

    // Coletar dados dos itens dinâmicos
    body.responsibilities = collectItems('responsibilities-container', 'responsibility-input');
    body.requirements = collectItems('requirements-container', 'requirement-input');
    body.benefits = collectItems('benefits-container', 'benefit-input');
    body.niceToHave = collectItems('nice-to-have-container', 'nice-to-have-input');

    const r = await fetch(`${apiBase}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if(r.ok){
      Swal.fire({ icon: 'success', title: 'Vaga salva!', timer: 1200, showConfirmButton: false }).then(() => window.close());
    } else {
      const errorData = await r.json().catch(() => ({ message: 'Erro desconhecido' }));
      Swal.fire({ icon: 'error', title: 'Falha ao salvar', text: errorData.message });
    }
  }

  document.getElementById('btn-save').addEventListener('click', save);
  document.getElementById('btn-board').addEventListener('click', () => {
    const w = 1200, h = 800, left=(screen.width-w)/2, top=(screen.height-h)/2;
    window.open(`/app/administration/rh-job-openings/view.html?id=${id}#board`, '_blank', `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`);
  });

  // Expor funções globalmente para os onclick
  window.addResponsibility = addResponsibility;
  window.addRequirement = addRequirement;
  window.addBenefit = addBenefit;
  window.addNiceToHave = addNiceToHave;
  window.removeItem = removeItem;

  (async function init(){
    await loadMeta();
    initChoices();
    await loadJob();
  })();
})(); 