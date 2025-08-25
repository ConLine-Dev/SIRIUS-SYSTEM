(function(){
  const apiBase = '/api/hr-job-openings';
  let choiceInstances = [];

  function initChoices(){
    document.querySelectorAll('select[data-choices]').forEach(sel => {
      const inst = new Choices(sel, { searchEnabled: true, itemSelectText: '', noResultsText: 'Sem resultados' });
      choiceInstances.push(inst);
    });
  }

  function setChoicesValue(selector, id){
    const el = document.querySelector(selector);
    if(!el) return;
    el.value = id;
    el.dispatchEvent(new Event('change'));
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

  // Função para carregar templates do departamento
  async function loadDepartmentTemplates(departmentId) {
    try {
      const response = await fetch(`${apiBase}/templates/departments/${departmentId}`);
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      return null;
    }
  }

  // Função para preencher campos com templates
  function fillWithTemplates(templates) {
    if (!templates) return;
    
    // Preencher responsabilidades
    if (templates.responsibilities && templates.responsibilities.length > 0) {
      const container = document.getElementById('responsibilities-container');
      container.innerHTML = '';
      
      templates.responsibilities.forEach(text => {
        addItem('responsibilities-container', 'responsibility-input', 'Adicione uma responsabilidade', text);
      });
    }
    
    // Preencher requisitos
    if (templates.requirements && templates.requirements.length > 0) {
      const container = document.getElementById('requirements-container');
      container.innerHTML = '';
      
      templates.requirements.forEach(text => {
        addItem('requirements-container', 'requirement-input', 'Adicione um requisito', text);
      });
    }
    
    // Preencher benefícios
    if (templates.benefits && templates.benefits.length > 0) {
      const container = document.getElementById('benefits-container');
      container.innerHTML = '';
      
      templates.benefits.forEach(text => {
        addItem('benefits-container', 'benefit-input', 'Adicione um benefício', text);
      });
    }
    
    // Preencher diferenciais
    if (templates.niceToHave && templates.niceToHave.length > 0) {
      const container = document.getElementById('nice-to-have-container');
      container.innerHTML = '';
      
      templates.niceToHave.forEach(text => {
        addItem('nice-to-have-container', 'nice-to-have-input', 'Adicione um diferencial', text);
      });
    }
  }

  // Função para carregar templates quando departamento é selecionado
  async function onDepartmentChange() {
    const departmentSelect = document.querySelector('select[name="department_id"]');
    const btnLoadTemplates = document.getElementById('btnLoadTemplates');
    
    if (departmentSelect.value) {
      // Mostrar botão de templates
      btnLoadTemplates.style.display = 'inline-block';
      
      // Verificar se há templates disponíveis
      const templates = await loadDepartmentTemplates(departmentSelect.value);
      if (templates && (
        (templates.responsibilities && templates.responsibilities.length > 0) ||
        (templates.requirements && templates.requirements.length > 0) ||
        (templates.benefits && templates.benefits.length > 0) ||
        (templates.niceToHave && templates.niceToHave.length > 0)
      )) {
        btnLoadTemplates.innerHTML = '<i class="ri-magic-line me-1"></i>Preencher com Templates do Departamento';
        btnLoadTemplates.className = 'btn btn-outline-primary btn-sm';
        
        // Carregar templates automaticamente
        await loadTemplatesForDepartment();
      } else {
        btnLoadTemplates.innerHTML = '<i class="ri-information-line me-1"></i>Nenhum template configurado para este departamento';
        btnLoadTemplates.className = 'btn btn-outline-secondary btn-sm';
      }
    } else {
      btnLoadTemplates.style.display = 'none';
    }
  }

  // Função para carregar templates automaticamente
  async function loadTemplatesForDepartment() {
    const departmentSelect = document.querySelector('select[name="department_id"]');
    
    if (!departmentSelect.value) {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Selecione um departamento primeiro'
      });
      return;
    }
    
    try {
      const templates = await loadDepartmentTemplates(departmentSelect.value);
      
      if (templates && (
        (templates.responsibilities && templates.responsibilities.length > 0) ||
        (templates.requirements && templates.requirements.length > 0) ||
        (templates.benefits && templates.benefits.length > 0) ||
        (templates.niceToHave && templates.niceToHave.length > 0)
      )) {
        fillWithTemplates(templates);
        
        Swal.fire({
          icon: 'success',
          title: 'Templates Carregados!',
          text: 'Os campos foram preenchidos automaticamente com os templates do departamento',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Nenhum Template',
          text: 'Este departamento não possui templates configurados'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Não foi possível carregar os templates'
      });
    }
  }

  // Funções para gerenciar itens dinâmicos
  function addItem(containerId, inputClass, placeholder, initialValue = '') {
    const container = document.getElementById(containerId);
    const itemDiv = document.createElement('div');
    itemDiv.className = 'mb-2';
    itemDiv.innerHTML = `
      <div class="input-group">
        <input type="text" class="form-control ${inputClass}" placeholder="${placeholder}" value="${initialValue}">
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

  async function submitForm(){
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
    body.status = 'Draft';

    // Coletar dados dos itens dinâmicos
    body.responsibilities = collectItems('responsibilities-container', 'responsibility-input');
    body.requirements = collectItems('requirements-container', 'requirement-input');
    body.benefits = collectItems('benefits-container', 'benefit-input');
    body.niceToHave = collectItems('nice-to-have-container', 'nice-to-have-input');

    const res = await fetch(apiBase, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if(res.ok){
      Swal.fire({ icon: 'success', title: 'Vaga criada!', timer: 1200, showConfirmButton: false }).then(() => window.close());
    } else {
      const errorData = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
      Swal.fire({ icon: 'error', title: 'Falha ao salvar', text: errorData.message });
    }
  }

  document.getElementById('btn-save').addEventListener('click', async () => {
    await submitForm();
  });

  // Expor funções globalmente para os onclick
  window.addResponsibility = addResponsibility;
  window.addRequirement = addRequirement;
  window.addBenefit = addBenefit;
  window.addNiceToHave = addNiceToHave;
  window.removeItem = removeItem;
  window.onDepartmentChange = onDepartmentChange;
  window.loadTemplatesForDepartment = loadTemplatesForDepartment;

  (async function init(){
    await loadMeta();
    initChoices();
    
    // Adicionar event listener para mudança de departamento
    const departmentSelect = document.querySelector('select[name="department_id"]');
    if (departmentSelect) {
      departmentSelect.addEventListener('change', onDepartmentChange);
    }
  })();
})(); 