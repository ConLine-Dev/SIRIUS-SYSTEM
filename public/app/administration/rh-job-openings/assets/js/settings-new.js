(function(){
  const apiBase = '/api/hr-job-openings';
  let socket = null;

  // Mapeamento de tipos para nomes de tabela
  const tableMapping = {
    'departments': 'hr_departments',
    'locations': 'hr_locations',
    'modalities': 'hr_modalities',
    'levels': 'hr_levels',
    'contracts': 'hr_contract_types'
  };

  // Variáveis de template
  let currentDepartmentId = null;
  let currentTemplates = {};
  let templateMode = 'department'; // 'global' ou 'department'

  // Inicializar Socket.IO
  function initializeSocket() {
    try {
      socket = io();
      
      socket.on('connect', () => {
        console.log('Socket.IO conectado');
      });

      socket.on('hr:settings_updated', (data) => {
        console.log('Configurações atualizadas:', data);
        // Recarregar a lista atual
        const activeTab = document.querySelector('.settings-tab.active');
        if (activeTab) {
          const tabName = activeTab.getAttribute('data-tab');
          if (tabName !== 'templates') {
            loadItems(tabName);
          }
        }
      });

    } catch (error) {
      console.error('Erro ao inicializar Socket.IO:', error);
    }
  }

  // Alternar entre abas
  function switchTab(tabName) {
    // Remover classe active de todas as abas
    document.querySelectorAll('.settings-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    document.querySelectorAll('.settings-content').forEach(content => {
      content.classList.remove('active');
    });
    
    // Adicionar classe active na aba selecionada
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    // Carregar dados da aba
    if (tabName !== 'templates') {
      loadItems(tabName);
    } else {
      // Para templates, carregar departamentos e mostrar info
      loadDepartments();
      document.getElementById('templatesInfo').style.display = 'block';
      document.getElementById('templatesContent').style.display = 'none';
    }
  }

  // Carregar itens de uma aba
  async function loadItems(type) {
    try {
      showLoading();
      
      const tableName = tableMapping[type];
      const response = await fetch(`${apiBase}/settings/${tableName}`);
      const data = await response.json();
      
      if (data.success) {
        renderItems(type, data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error(`Erro ao carregar ${type}:`, error);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: `Não foi possível carregar ${type}`
      });
    } finally {
      hideLoading();
    }
  }

  // Renderizar itens
  function renderItems(type, items) {
    const container = document.getElementById(`${type}-list`);
    if (!container) return;
    
    if (items.length === 0) {
      container.innerHTML = '<p class="text-muted">Nenhum item encontrado.</p>';
      return;
    }
    
    container.innerHTML = items.map(item => `
      <div class="item-card">
        <div>
          <div class="item-name">${item.name}</div>
          <div class="item-status">
            <span class="badge bg-${item.is_active ? 'success' : 'secondary'}">
              ${item.is_active ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-primary" onclick="editItem('${type}', ${item.id}, '${item.name}')" title="Editar">
            <i class="ri-edit-line"></i>
          </button>
          <button class="btn btn-outline-danger" onclick="deleteItem('${type}', ${item.id}, '${item.name}')" title="Excluir">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  // Mostrar loading
  function showLoading() {
    document.getElementById('loadingSpinner').classList.remove('d-none');
  }

  // Esconder loading
  function hideLoading() {
    document.getElementById('loadingSpinner').classList.add('d-none');
  }

  // Abrir modal para adicionar/editar
  window.openAddModal = function(type, title) {
    document.getElementById('modalTitle').textContent = `Adicionar ${title}`;
    document.getElementById('itemId').value = '';
    document.getElementById('itemType').value = type;
    document.getElementById('itemName').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('itemModal'));
    modal.show();
  };

  // Editar item
  window.editItem = function(type, id, name) {
    document.getElementById('modalTitle').textContent = `Editar ${name}`;
    document.getElementById('itemId').value = id;
    document.getElementById('itemType').value = type;
    document.getElementById('itemName').value = name;
    
    const modal = new bootstrap.Modal(document.getElementById('itemModal'));
    modal.show();
  };

  // Salvar item
  window.saveItem = async function() {
    const id = document.getElementById('itemId').value;
    const type = document.getElementById('itemType').value;
    const name = document.getElementById('itemName').value.trim();
    
    if (!name) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo obrigatório',
        text: 'O nome é obrigatório'
      });
      return;
    }
    
    try {
      showLoading();
      
      const tableName = tableMapping[type];
      const url = id ? `${apiBase}/settings/${tableName}/${id}` : `${apiBase}/settings/${tableName}`;
      const method = id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: name })
      });
      
      if (response.ok) {
        hideLoading();
        bootstrap.Modal.getInstance(document.getElementById('itemModal')).hide();
        
        await Swal.fire({
          icon: 'success',
          title: id ? 'Item atualizado!' : 'Item criado!',
          timer: 1500,
          showConfirmButton: false
        });
        
        loadItems(type);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar item');
      }
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      hideLoading();
      Swal.fire({
        icon: 'error',
        title: 'Erro ao salvar',
        text: error.message
      });
    }
  };

  // Função para deletar item
  window.deleteItem = async function(type, id, name) {
    const result = await Swal.fire({
      title: 'Confirmar exclusão',
      text: `Tem certeza que deseja excluir "${name}"? Esta ação não pode ser desfeita.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        showLoading();
        
        const tableName = tableMapping[type];
        const response = await fetch(`${apiBase}/settings/${tableName}/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          hideLoading();
          await Swal.fire({
            icon: 'success',
            title: 'Item excluído!',
            timer: 1500,
            showConfirmButton: false
          });
          loadItems(type);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao excluir item');
        }
      } catch (error) {
        console.error('Erro ao excluir item:', error);
        hideLoading();
        Swal.fire({
          icon: 'error',
          title: 'Erro ao excluir',
          text: error.message
        });
      }
    }
  };

  // ========== FUNÇÕES DE TEMPLATES ==========

  // Alternar modo de template
  window.switchTemplateMode = function(mode) {
    templateMode = mode;
    
    // Atualizar botões
    document.getElementById('btnGlobalMode').classList.toggle('btn-primary', mode === 'global');
    document.getElementById('btnGlobalMode').classList.toggle('btn-outline-primary', mode !== 'global');
    document.getElementById('btnDepartmentMode').classList.toggle('btn-primary', mode === 'department');
    document.getElementById('btnDepartmentMode').classList.toggle('btn-outline-primary', mode !== 'department');
    
    // Mostrar/ocultar seletor de departamento
    document.getElementById('departmentSelector').style.display = mode === 'department' ? 'block' : 'none';
    
    // Limpar conteúdo atual
    document.getElementById('templatesContent').style.display = 'none';
    document.getElementById('templatesInfo').style.display = 'block';
    
    // Carregar templates baseado no modo
    if (mode === 'global') {
      loadGlobalTemplates();
    } else {
      loadDepartments();
    }
  };

  // Carregar templates globais
  async function loadGlobalTemplates() {
    try {
      showLoading();
      
      const response = await fetch(`${apiBase}/templates/global`);
      const data = await response.json();
      
      if (data.success) {
        currentTemplates = data.data || {
          responsibilities: [],
          requirements: [],
          benefits: [],
          niceToHave: []
        };
        
        renderTemplates();
        document.getElementById('templatesContent').style.display = 'block';
        document.getElementById('templatesInfo').style.display = 'none';
      } else {
        // Se não existir template global, criar um vazio
        currentTemplates = {
          responsibilities: [],
          requirements: [],
          benefits: [],
          niceToHave: []
        };
        renderTemplates();
        document.getElementById('templatesContent').style.display = 'block';
        document.getElementById('templatesInfo').style.display = 'none';
      }
    } catch (error) {
      console.error('Erro ao carregar templates globais:', error);
      // Criar template vazio em caso de erro
      currentTemplates = {
        responsibilities: [],
        requirements: [],
        benefits: [],
        niceToHave: []
      };
      renderTemplates();
      document.getElementById('templatesContent').style.display = 'block';
      document.getElementById('templatesInfo').style.display = 'none';
    } finally {
      hideLoading();
    }
  }

  // Carregar departamentos
  async function loadDepartments() {
    try {
      const response = await fetch(`${apiBase}/settings/hr_departments`);
      const data = await response.json();
      
      if (data.success) {
        const select = document.getElementById('departmentSelect');
        select.innerHTML = '<option value="">Escolha um departamento...</option>';
        
        data.data.forEach(dept => {
          const option = document.createElement('option');
          option.value = dept.id;
          option.textContent = dept.name;
          select.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
    }
  }

  // Carregar templates de um departamento
  window.loadTemplates = async function() {
    if (templateMode === 'global') {
      await loadGlobalTemplates();
      return;
    }
    
    if (!currentDepartmentId) {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Selecione um departamento primeiro'
      });
      return;
    }
    
    try {
      showLoading();
      
      const response = await fetch(`${apiBase}/templates/departments/${currentDepartmentId}`);
      const data = await response.json();
      
      if (data.success) {
        currentTemplates = data.data;
        renderTemplates();
      } else {
        // Se não existir template, criar um vazio
        currentTemplates = {
          responsibilities: [],
          requirements: [],
          benefits: [],
          niceToHave: []
        };
        renderTemplates();
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      // Criar template vazio em caso de erro
      currentTemplates = {
        responsibilities: [],
        requirements: [],
        benefits: [],
        niceToHave: []
      };
      renderTemplates();
    } finally {
      hideLoading();
    }
  };

  // Renderizar templates
  function renderTemplates() {
    ['responsibilities', 'requirements', 'benefits', 'niceToHave'].forEach(type => {
      const container = document.getElementById(`${type}Container`);
      if (container) {
        container.innerHTML = '';
        
        const items = currentTemplates[type] || [];
        
        // Sempre ter pelo menos um item vazio
        if (items.length === 0) {
          addTemplateItem(type, '');
        } else {
          items.forEach(item => {
            addTemplateItem(type, item);
          });
        }
      }
    });
  }

  // Adicionar item de template
  window.addTemplateItem = function(type, text = '') {
    const container = document.getElementById(`${type}Container`);
    if (!container) return;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'template-item';
    itemDiv.innerHTML = `
      <i class="ri-drag-move-2-line drag-handle"></i>
      <input type="text" class="form-control text" value="${text}" placeholder="Digite o texto...">
      <div class="actions">
        <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeTemplateItem(this)">
          <i class="ri-delete-bin-line"></i>
        </button>
      </div>
    `;
    
    container.appendChild(itemDiv);
  };

  // Remover item de template
  window.removeTemplateItem = function(button) {
    const itemDiv = button.closest('.template-item');
    const container = itemDiv.parentElement;
    
    // Não permitir remover se for o último item
    if (container.children.length > 1) {
      itemDiv.remove();
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Deve haver pelo menos um item em cada seção'
      });
    }
  };

  // Coletar dados dos templates
  function collectTemplateData() {
    const data = {
      responsibilities: [],
      requirements: [],
      benefits: [],
      niceToHave: []
    };
    
    ['responsibilities', 'requirements', 'benefits', 'niceToHave'].forEach(type => {
      const container = document.getElementById(`${type}Container`);
      if (container) {
        const inputs = container.querySelectorAll('input[type="text"]');
        inputs.forEach(input => {
          const text = input.value.trim();
          if (text) {
            data[type].push(text);
          }
        });
      }
    });
    
    return data;
  }

  // Salvar todos os templates
  window.saveAllTemplates = async function() {
    if (templateMode === 'global') {
      await saveGlobalTemplates();
      return;
    }
    
    if (!currentDepartmentId) {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Selecione um departamento primeiro'
      });
      return;
    }
    
    const data = collectTemplateData();
    
    try {
      showLoading();
      
      // Salvar responsabilidades
      await fetch(`${apiBase}/templates/departments/${currentDepartmentId}/responsibilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responsibilities: data.responsibilities })
      });
      
      // Salvar requisitos
      await fetch(`${apiBase}/templates/departments/${currentDepartmentId}/requirements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirements: data.requirements })
      });
      
      // Salvar benefícios
      await fetch(`${apiBase}/templates/departments/${currentDepartmentId}/benefits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ benefits: data.benefits })
      });
      
      // Salvar diferenciais
      await fetch(`${apiBase}/templates/departments/${currentDepartmentId}/nice-to-have`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niceToHave: data.niceToHave })
      });
      
      hideLoading();
      
      // Atualizar templates locais
      currentTemplates = data;
      
      Swal.fire({
        icon: 'success',
        title: 'Sucesso!',
        text: 'Todos os templates foram salvos',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Erro ao salvar templates:', error);
      hideLoading();
      Swal.fire({
        icon: 'error',
        title: 'Erro ao salvar',
        text: 'Não foi possível salvar os templates'
      });
    }
  };

  // Salvar templates globais
  async function saveGlobalTemplates() {
    const data = collectTemplateData();
    
    try {
      showLoading();
      
      const response = await fetch(`${apiBase}/templates/global`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        hideLoading();
        currentTemplates = data;
        
        Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          text: 'Template global foi salvo',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error('Erro ao salvar template global');
      }
    } catch (error) {
      console.error('Erro ao salvar template global:', error);
      hideLoading();
      Swal.fire({
        icon: 'error',
        title: 'Erro ao salvar',
        text: 'Não foi possível salvar o template global'
      });
    }
  }

  // Visualizar templates
  window.previewTemplates = function() {
    const data = collectTemplateData();
    const preview = document.getElementById('templatePreview');
    const content = document.getElementById('previewContent');
    
    let html = '';
    
    if (data.responsibilities.length > 0) {
      html += '<h6 class="text-primary">Responsabilidades:</h6><ul>';
      data.responsibilities.forEach(item => {
        html += `<li>${item}</li>`;
      });
      html += '</ul>';
    }
    
    if (data.requirements.length > 0) {
      html += '<h6 class="text-success">Requisitos:</h6><ul>';
      data.requirements.forEach(item => {
        html += `<li>${item}</li>`;
      });
      html += '</ul>';
    }
    
    if (data.benefits.length > 0) {
      html += '<h6 class="text-warning">Benefícios:</h6><ul>';
      data.benefits.forEach(item => {
        html += `<li>${item}</li>`;
      });
      html += '</ul>';
    }
    
    if (data.niceToHave.length > 0) {
      html += '<h6 class="text-info">Diferenciais:</h6><ul>';
      data.niceToHave.forEach(item => {
        html += `<li>${item}</li>`;
      });
      html += '</ul>';
    }
    
    content.innerHTML = html;
    preview.style.display = 'block';
  };

  // Event listeners
  document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Socket.IO
    initializeSocket();
    
    // Event listeners para as abas
    document.querySelectorAll('.settings-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab');
        switchTab(tabName);
      });
    });

    // Event listener para mudança de departamento
    const departmentSelect = document.getElementById('departmentSelect');
    if (departmentSelect) {
      departmentSelect.addEventListener('change', function() {
        currentDepartmentId = this.value;
        if (currentDepartmentId) {
          document.getElementById('templatesContent').style.display = 'block';
          document.getElementById('templatesInfo').style.display = 'none';
          loadTemplates();
        } else {
          document.getElementById('templatesContent').style.display = 'none';
          document.getElementById('templatesInfo').style.display = 'block';
        }
      });
    }

    // Carregar dados iniciais
    loadItems('departments');
  });

})(); 