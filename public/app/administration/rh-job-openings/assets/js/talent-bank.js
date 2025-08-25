(function() {
  'use strict';

  // Configurações
  const apiBase = '/api/hr-job-openings';
  let meta = {};
  let candidates = [];
  let filteredCandidates = [];
  let currentPage = 1;
  const itemsPerPage = 20;
  let currentUser = null;

  // Elementos DOM
  const loadingSpinner = document.getElementById('loadingSpinner');
  const candidatesList = document.getElementById('candidatesList');
  const pagination = document.getElementById('pagination');

  // Funções utilitárias
  function showLoading() {
    loadingSpinner.classList.add('show');
  }

  function hideLoading() {
    loadingSpinner.classList.remove('show');
  }

  function showNotification(message, type = 'info') {
    // Verificar se existe um container de notificações
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
      toastContainer.style.zIndex = '9999';
      document.body.appendChild(toastContainer);
    }
    
    // Criar toast
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
      <div id="${toastId}" class="toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'primary'} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Mostrar toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
      autohide: true,
      delay: 3000
    });
    toast.show();
    
    // Remover elemento após esconder
    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  function getStatusBadgeClass(status) {
    const statusClasses = {
      'Recebidos': 'bg-secondary',
      'Em Triagem': 'bg-info',
      'Entrevista': 'bg-warning',
      'Oferta': 'bg-primary',
      'Aprovado': 'bg-success'
    };
    return statusClasses[status] || 'bg-secondary';
  }

  // Funções de API
  async function fetchMeta() {
    try {
      const response = await fetch(`${apiBase}/meta`);
      if (!response.ok) throw new Error('Falha ao carregar metadados');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar metadados:', error);
      throw error;
    }
  }

  async function fetchAllCandidates() {
    try {
      const response = await fetch(`${apiBase}/talent-bank/candidates`);
      if (!response.ok) throw new Error('Falha ao carregar candidatos');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar candidatos:', error);
      throw error;
    }
  }

  async function fetchTalentBankStats() {
    try {
      const response = await fetch(`${apiBase}/talent-bank/stats`);
      if (!response.ok) throw new Error('Falha ao carregar estatísticas');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      throw error;
    }
  }

  // Funções de filtro
  function applyFilters() {
    const filters = {
      keyword: document.getElementById('filter-keyword').value.toLowerCase().trim(),
      department: document.getElementById('filter-department').value,
      modality: document.getElementById('filter-modality').value,
      location: document.getElementById('filter-location').value,
      status: document.getElementById('filter-status').value
    };

    filteredCandidates = candidates.filter(candidate => {
      // Filtro por palavra-chave
      if (filters.keyword) {
        const searchText = `${candidate.name} ${candidate.email} ${candidate.job_titles.join(' ')}`.toLowerCase();
        if (!searchText.includes(filters.keyword)) return false;
      }

      // Filtro por departamento - verificar se o candidato tem alguma candidatura no departamento
      if (filters.department) {
        const hasDepartment = candidate.applications.some(app => {
          // Buscar o ID do departamento pelo nome
          const deptMeta = meta.departments.find(d => d.name === app.department);
          return deptMeta && deptMeta.id.toString() === filters.department;
        });
        if (!hasDepartment) return false;
      }

      // Filtro por modalidade - verificar se o candidato tem alguma candidatura na modalidade
      if (filters.modality) {
        // Buscar o nome da modalidade pelo ID
        const modalityMeta = meta.modalities.find(m => m.id.toString() === filters.modality);
        if (modalityMeta) {
          const hasModality = candidate.applications.some(app => {
            // Buscar a vaga correspondente para verificar a modalidade
            const jobMeta = meta.jobs.find(j => j.title === app.title);
            return jobMeta && jobMeta.modality_name === modalityMeta.name;
          });
          if (!hasModality) return false;
        }
      }

      // Filtro por local - verificar se o candidato tem alguma candidatura no local
      if (filters.location) {
        const hasLocation = candidate.applications.some(app => {
          // Buscar o ID do local pelo nome
          const locMeta = meta.locations.find(l => l.name === app.location);
          return locMeta && locMeta.id.toString() === filters.location;
        });
        if (!hasLocation) return false;
      }

      // Filtro por status - verificar se o candidato tem alguma candidatura com o status
      if (filters.status) {
        const hasStatus = candidate.applications.some(app => app.status === filters.status);
        if (!hasStatus) return false;
      }

      return true;
    });

    currentPage = 1;
    renderCandidates();
    updatePagination();
  }

  // Funções de renderização (AGRUPADO POR EMAIL)
  function renderCandidates() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageCandidates = filteredCandidates.slice(startIndex, endIndex);

    if (pageCandidates.length === 0) {
      candidatesList.innerHTML = `
        <div class="text-center py-5">
          <i class="ri-user-line" style="font-size: 4rem; color: #6c757d;"></i>
          <h4 class="mt-3 text-muted">Nenhum candidato encontrado</h4>
          <p class="text-muted">Tente ajustar os filtros ou adicionar novos candidatos.</p>
        </div>
      `;
      return;
    }

    candidatesList.innerHTML = pageCandidates.map(candidate => `
      <div class="candidate-card">
        <div class="row align-items-center">
          <div class="col-md-1">
            <div class="candidate-avatar">
              ${getInitials(candidate.name)}
            </div>
          </div>
          <div class="col-md-3">
            <h6 class="mb-1 fw-bold">${candidate.name}</h6>
            <div class="text-muted small">
              <i class="ri-mail-line me-1"></i>${candidate.email}
            </div>
            ${candidate.phone ? `<div class="text-muted small"><i class="ri-phone-line me-1"></i>${candidate.phone}</div>` : ''}
            ${candidate.linkedin_url ? `<div class="text-muted small"><i class="ri-linkedin-box-line me-1"></i><a href="${candidate.linkedin_url}" target="_blank">LinkedIn</a></div>` : ''}
          </div>
          <div class="col-md-3">
            <div class="fw-bold text-primary">${candidate.total_applications} candidatura(s)</div>
            <div class="text-muted small">
              ${candidate.primary_department} • ${candidate.primary_location}
            </div>
            <div class="text-muted small">
              <i class="ri-calendar-line me-1"></i>Última: ${formatDate(candidate.last_application_date)}
            </div>
            ${candidate.job_titles.length > 1 ? `
              <div class="text-muted small">
                <i class="ri-briefcase-line me-1"></i>${candidate.job_titles.slice(0, 2).join(', ')}
                ${candidate.job_titles.length > 2 ? ` +${candidate.job_titles.length - 2} mais` : ''}
              </div>
            ` : ''}
          </div>
          <div class="col-md-2">
            <span class="badge ${getStatusBadgeClass(candidate.current_status)} status-badge">
              ${candidate.current_status}
            </span>
            <div class="text-muted small mt-1">
              ${candidate.statuses.length > 1 ? `${candidate.statuses.length} status diferentes` : ''}
            </div>
          </div>
          <div class="col-md-2">
            <div class="text-muted small">
              <i class="ri-file-text-line me-1"></i>${candidate.total_attachments || 0} anexos
            </div>
            <div class="text-muted small">
              <i class="ri-chat-1-line me-1"></i>${candidate.total_notes || 0} observações
            </div>
          </div>
          <div class="col-md-1 text-end">
            <div class="dropdown">
              <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="dropdown">
                <i class="ri-more-2-line"></i>
              </button>
                              <ul class="dropdown-menu">
                  <li><a class="dropdown-item" href="#" onclick="viewCandidateByEmail('${candidate.email}')">
                    <i class="ri-eye-line me-2"></i>Ver detalhes
                  </a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item text-danger" href="#" onclick="removeCandidateByEmail('${candidate.email}')">
                    <i class="ri-delete-bin-line me-2"></i>Remover
                  </a></li>
                </ul>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  function updatePagination() {
    const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
    
    if (totalPages <= 1) {
      pagination.innerHTML = '';
      return;
    }

    let paginationHtml = '';
    
    // Botão anterior
    paginationHtml += `
      <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Anterior</a>
      </li>
    `;

    // Páginas
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
      paginationHtml += '<li class="page-item"><a class="page-link" href="#" onclick="changePage(1)">1</a></li>';
      if (startPage > 2) {
        paginationHtml += '<li class="page-item disabled"><span class="page-link">...</span></li>';
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationHtml += `
        <li class="page-item ${i === currentPage ? 'active' : ''}">
          <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
        </li>
      `;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHtml += '<li class="page-item disabled"><span class="page-link">...</span></li>';
      }
      paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${totalPages})">${totalPages}</a></li>`;
    }

    // Botão próximo
    paginationHtml += `
      <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Próximo</a>
      </li>
    `;

    pagination.innerHTML = paginationHtml;
  }

  function updateStats(stats) {
    document.getElementById('totalCandidates').textContent = stats.total_candidates || 0;
    document.getElementById('activeCandidates').textContent = stats.active_candidates || 0;
    document.getElementById('totalJobs').textContent = stats.total_jobs || 0;
    document.getElementById('avgApplications').textContent = stats.avg_applications || 0;
  }

  function fillSelects() {
    // Departamento
    const departmentSelect = document.getElementById('filter-department');
    if (meta.departments) {
      const opt0 = document.createElement('option');
      opt0.value = '';
      opt0.textContent = 'Todos os departamentos';
      departmentSelect.appendChild(opt0);
      
      meta.departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.name;
        departmentSelect.appendChild(option);
      });
    }

    // Modalidade
    const modalitySelect = document.getElementById('filter-modality');
    if (meta.modalities) {
      const opt0 = document.createElement('option');
      opt0.value = '';
      opt0.textContent = 'Todas as modalidades';
      modalitySelect.appendChild(opt0);
      
      meta.modalities.forEach(mod => {
        const option = document.createElement('option');
        option.value = mod.id;
        option.textContent = mod.name;
        modalitySelect.appendChild(option);
      });
    }

    // Local
    const locationSelect = document.getElementById('filter-location');
    if (meta.locations) {
      const opt0 = document.createElement('option');
      opt0.value = '';
      opt0.textContent = 'Todos os locais';
      locationSelect.appendChild(opt0);
      
      meta.locations.forEach(loc => {
        const option = document.createElement('option');
        option.value = loc.id;
        option.textContent = loc.name;
        locationSelect.appendChild(option);
      });
    }

    // Status
    const statusSelect = document.getElementById('filter-status');
    if (meta.statuses) {
      const opt0 = document.createElement('option');
      opt0.value = '';
      opt0.textContent = 'Todos os status';
      statusSelect.appendChild(opt0);
      
      meta.statuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status.name;
        option.textContent = status.name;
        statusSelect.appendChild(option);
      });
    }

    // Inicializar Choices.js
    document.querySelectorAll('[data-choices]').forEach(select => {
      new Choices(select, {
        searchEnabled: true,
        itemSelectText: '',
        noResultsText: 'Sem resultados'
      });
    });
  }

  // Funções de ação
  function changePage(page) {
    currentPage = page;
    renderCandidates();
    updatePagination();
  }

  // Variável para o modal de detalhes
  let candidateDetailsModal = null;
  let currentApplicationId = null;

  async function viewCandidate(applicationId) {
    try {
      console.log('Abrindo detalhes do candidato:', applicationId);
      currentApplicationId = applicationId;
      
      // Buscar dados do candidato
      const candidate = candidates.find(c => c.application_id == applicationId);
      if (!candidate) {
        showNotification('Candidato não encontrado', 'error');
        return;
      }
      
      // Buscar detalhes completos via API
      const response = await fetch(`${apiBase}/applications/${applicationId}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar detalhes do candidato');
      }
      
      const applicationData = await response.json();
      console.log('Dados da aplicação:', applicationData);
      
      // Preencher o modal com os dados (EDITÁVEL)
      const detailsContent = document.getElementById('candidateDetailsContent');
      detailsContent.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h5 class="card-title mb-3">
              <i class="ri-user-line me-2"></i>
              Dados do Candidato
            </h5>
            
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Nome *</label>
                <input type="text" class="form-control" id="detail_name" value="${candidate.name}">
              </div>
              <div class="col-md-6">
                <label class="form-label">Email *</label>
                <input type="email" class="form-control" id="detail_email" value="${candidate.email}">
              </div>
            </div>
            
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Telefone</label>
                <input type="text" class="form-control" id="detail_phone" value="${candidate.phone || ''}">
              </div>
              <div class="col-md-6">
                <label class="form-label">LinkedIn</label>
                <input type="url" class="form-control" id="detail_linkedin" value="${candidate.linkedin_url || ''}" placeholder="https://linkedin.com/in/...">
              </div>
            </div>
            
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Status</label>
                <select class="form-select" id="detail_status">
                  ${meta.statuses ? meta.statuses.map(s => 
                    `<option value="${s.id}" ${s.name === candidate.status ? 'selected' : ''}>${s.name}</option>`
                  ).join('') : ''}
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Vaga Atual</label>
                <div class="form-control-plaintext">
                  <strong class="text-primary">${candidate.job_title}</strong>
                  <br>
                  <small class="text-muted">${candidate.department_name} • ${candidate.location_name}</small>
                </div>
              </div>
            </div>
            
            <div class="row mb-3">
              <div class="col-12">
                <label class="form-label">Carta de Apresentação</label>
                <textarea class="form-control" id="detail_cover_letter" rows="3">${applicationData.cover_letter || ''}</textarea>
              </div>
            </div>
            
            <div class="row mb-3">
              <div class="col-12">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <label class="form-label mb-0">Anexos</label>
                  <button class="btn btn-sm btn-outline-primary" onclick="uploadAttachment()">
                    <i class="ri-upload-2-line me-1"></i>Adicionar Anexo
                  </button>
                </div>
                <div id="attachmentsList" class="list-group">
                  <!-- Anexos serão carregados aqui -->
                </div>
              </div>
            </div>
            
            <div class="row">
              <div class="col-12">
                <button class="btn btn-success" onclick="saveDetailChanges()">
                  <i class="ri-save-line me-1"></i>Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Carregar anexos
      await loadAttachments(candidate.applicant_id);
      
      // Preencher datas de entrevista e oferta
      if (candidate.interview_date) {
        document.getElementById('detail_interview_date').value = 
          new Date(candidate.interview_date).toISOString().slice(0, 16);
      } else {
        document.getElementById('detail_interview_date').value = '';
      }
      
      if (candidate.offer_date) {
        document.getElementById('detail_offer_date').value = 
          new Date(candidate.offer_date).toISOString().slice(0, 16);
      } else {
        document.getElementById('detail_offer_date').value = '';
      }
      
      // Carregar notas internas
      await loadInternalNotes(applicationId);
      
      // Abrir modal
      if (!candidateDetailsModal) {
        candidateDetailsModal = new bootstrap.Modal(document.getElementById('candidateDetailsModal'));
      }
      candidateDetailsModal.show();
      
    } catch (error) {
      console.error('Erro ao abrir detalhes do candidato:', error);
      showNotification('Erro ao carregar detalhes do candidato', 'error');
    }
  }
  
  // Função para carregar anexos
  async function loadAttachments(applicantId) {
    try {
      const response = await fetch(`${apiBase}/applicants/${applicantId}/attachments`);
      if (!response.ok) throw new Error('Erro ao buscar anexos');
      
      const attachments = await response.json();
      const attachmentsList = document.getElementById('attachmentsList');
      
      if (!attachments || attachments.length === 0) {
        attachmentsList.innerHTML = '<div class="text-muted text-center p-3">Nenhum anexo disponível</div>';
      } else {
        attachmentsList.innerHTML = attachments.map(att => `
          <div class="list-group-item">
            <div class="d-flex justify-content-between align-items-center">
              <div class="flex-grow-1">
                <div class="fw-semibold">
                  <i class="ri-file-text-line me-1"></i>
                  ${att.file_name || 'Arquivo'}
                </div>
                <small class="text-muted">
                  ${att.file_type || 'Documento'} • ${formatFileSize(att.file_size || 0)}
                  ${att.is_resume == 1 ? ' • <span class="badge bg-primary">Currículo</span>' : ''}
                </small>
              </div>
              <div class="btn-group btn-group-sm">
                <a href="${apiBase}/attachments/${att.id}/download" class="btn btn-outline-primary" target="_blank" title="Baixar">
                  <i class="ri-download-line"></i>
                </a>
                <a href="${apiBase}/attachments/${att.id}/view" class="btn btn-outline-info" target="_blank" title="Visualizar">
                  <i class="ri-eye-line"></i>
                </a>
                <button class="btn btn-outline-danger" onclick="removeAttachment(${att.id})" title="Remover">
                  <i class="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Erro ao carregar anexos:', error);
      document.getElementById('attachmentsList').innerHTML = 
        '<div class="text-danger text-center p-3">Erro ao carregar anexos</div>';
    }
  }
  
  // Função para formatar tamanho de arquivo
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
  
  // Função para salvar alterações do candidato
  async function saveDetailChanges() {
    try {
      if (!currentApplicationId) return;
      
      const candidate = candidates.find(c => c.application_id == currentApplicationId);
      if (!candidate) return;
      
      // Coletar dados do formulário
      const updatedData = {
        name: document.getElementById('detail_name').value.trim(),
        email: document.getElementById('detail_email').value.trim(),
        phone: document.getElementById('detail_phone').value.trim(),
        linkedin_url: document.getElementById('detail_linkedin').value.trim(),
        status_id: document.getElementById('detail_status').value,
        cover_letter: document.getElementById('detail_cover_letter').value.trim()
      };
      
      // Validações
      if (!updatedData.name || !updatedData.email) {
        showNotification('Nome e email são obrigatórios', 'error');
        return;
      }
      
      // Atualizar candidato
      const applicantResponse = await fetch(`${apiBase}/applicants/${candidate.applicant_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedData.name,
          email: updatedData.email,
          phone: updatedData.phone,
          linkedin_url: updatedData.linkedin_url
        })
      });
      
      if (!applicantResponse.ok) {
        throw new Error('Erro ao atualizar dados do candidato');
      }
      
      // Atualizar aplicação (status e carta)
      const applicationResponse = await fetch(`${apiBase}/applications/${currentApplicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status_id: updatedData.status_id,
          cover_letter: updatedData.cover_letter
        })
      });
      
      if (!applicationResponse.ok) {
        throw new Error('Erro ao atualizar aplicação');
      }
      
      showNotification('Dados salvos com sucesso', 'success');
      
      // Recarregar dados
      await loadData();
      
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      showNotification('Erro ao salvar alterações', 'error');
    }
  }
  
  // Função para remover anexo
  async function removeAttachment(attachmentId) {
    if (!confirm('Remover este anexo?')) return;
    
    try {
      const response = await fetch(`${apiBase}/attachments/${attachmentId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const candidate = candidates.find(c => c.application_id == currentApplicationId);
        if (candidate) {
          await loadAttachments(candidate.applicant_id);
        }
        showNotification('Anexo removido', 'success');
      } else {
        throw new Error('Erro ao remover anexo');
      }
    } catch (error) {
      console.error('Erro ao remover anexo:', error);
      showNotification('Erro ao remover anexo', 'error');
    }
  }

  // Função para carregar notas internas (IGUAL À VIEW)
  async function loadInternalNotes(applicationId) {
    try {
      const response = await fetch(`${apiBase}/applications/${applicationId}/notes`);
      if (!response.ok) throw new Error('Erro ao buscar notas');
      
      const data = await response.json();
      const notes = data.notes || data || [];
      const notesList = document.getElementById('detailNotesList');
      
      if (notes.length === 0) {
        notesList.innerHTML = '<li class="list-group-item text-muted">Sem notas</li>';
        return;
      }
      
      // Renderizar exatamente como na view.html
      notesList.innerHTML = notes.map(n => `
        <li class='list-group-item'>
          <div class='d-flex justify-content-between align-items-start mb-1'>
            <div class='d-flex align-items-center'>
              <span class='fw-semibold text-primary'>${n.author_name || 'Sistema'}</span>
              <small class='text-muted ms-2'>${new Date(n.created_at).toLocaleString('pt-BR')}</small>
            </div>
            <button class='btn btn-outline-danger btn-sm' onclick='removeDetailNote(${n.id})' title='Remover observação'>
              <i class='ri-delete-bin-line'></i>
            </button>
          </div>
          <div>${n.note}</div>
        </li>
      `).join('');
      
      // Scroll para o final da lista
      const notesContainer = document.querySelector('#candidateDetailsModal .notes-container');
      if (notesContainer) {
        notesContainer.scrollTop = notesContainer.scrollHeight;
      }
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
      document.getElementById('detailNotesList').innerHTML = 
        '<li class="list-group-item text-danger">Erro ao carregar observações</li>';
    }
  }
  
  // Função para obter usuário atual
  async function getCurrentUser() {
    try {
      const response = await fetch('/api/users/current');
      if (response.ok) {
        const user = await response.json();
        return user;
      }
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error);
    }
    return { id: 0, name: 'Sistema' };
  }
  
  // Função para adicionar nota (IGUAL À VIEW)
  async function addDetailNote() {
    const noteText = document.getElementById('detailNoteText').value.trim();
    if (!noteText || !currentApplicationId) return;
    
    try {
      // Obter informações do usuário logado
      if (!currentUser) {
        currentUser = await getCurrentUser();
      }
      
      // OTIMISTIC UPDATE: Adicionar nota imediatamente na interface
      const notesList = document.getElementById('detailNotesList');
      const tempNoteId = 'temp_' + Date.now();
      const tempNote = document.createElement('li');
      tempNote.className = 'list-group-item';
      tempNote.id = tempNoteId;
      tempNote.innerHTML = `
        <div class='d-flex justify-content-between align-items-start mb-1'>
          <div class='d-flex align-items-center'>
            <span class='fw-semibold text-primary'>${currentUser.name || 'Sistema'}</span>
            <small class='text-muted ms-2'>${new Date().toLocaleString('pt-BR')}</small>
          </div>
          <button class='btn btn-outline-danger btn-sm' disabled title='Salvando...'>
            <i class='ri-loader-4-line'></i>
          </button>
        </div>
        <div>${noteText}</div>
      `;
      
      // Remover mensagem de "Sem notas" se existir
      if (notesList.innerHTML.includes('Sem notas')) {
        notesList.innerHTML = '';
      }
      notesList.appendChild(tempNote);
      
      // Limpar campo e fazer scroll
      document.getElementById('detailNoteText').value = '';
      const notesContainer = document.querySelector('#candidateDetailsModal .notes-container');
      if (notesContainer) {
        notesContainer.scrollTop = notesContainer.scrollHeight;
      }
      
      // Fazer requisição ao backend
      const response = await fetch(`${apiBase}/applications/${currentApplicationId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          note: noteText,
          author_id: currentUser.id || 0
        })
      });
      
      if (response.ok) {
        // Recarregar todas as notas para garantir sincronização
        await loadInternalNotes(currentApplicationId);
        showNotification('Observação adicionada', 'success');
      } else {
        // Se falhou, remover nota temporária
        document.getElementById(tempNoteId)?.remove();
        
        // Se não há mais notas, mostrar mensagem
        if (notesList.children.length === 0) {
          notesList.innerHTML = '<li class="list-group-item text-muted">Sem notas</li>';
        }
        
        throw new Error('Erro ao adicionar observação');
      }
    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
      showNotification('Erro ao adicionar observação', 'error');
      
      // Restaurar o texto no campo
      document.getElementById('detailNoteText').value = noteText;
    }
  }
  
  // Função para remover nota
  async function removeDetailNote(noteId) {
    if (!confirm('Remover esta observação?')) return;
    
    try {
      const response = await fetch(`${apiBase}/applications/notes/${noteId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadInternalNotes(currentApplicationId);
        showNotification('Observação removida', 'success');
      } else {
        throw new Error('Erro ao remover nota');
      }
    } catch (error) {
      console.error('Erro ao remover nota:', error);
      showNotification('Erro ao remover observação', 'error');
    }
  }
  
  // Função para abrir a vaga completa
  function openJobView() {
    if (currentApplicationId) {
      const candidate = candidates.find(c => c.application_id == currentApplicationId);
      if (candidate) {
        window.open(`/app/administration/rh-job-openings/view.html?id=${candidate.job_id}`, '_blank');
      }
    }
  }

  function viewJob(jobId) {
    // Abrir a página de detalhes da vaga
    window.open(`/app/administration/rh-job-openings/view.html?id=${jobId}`, '_blank');
  }

  async function removeCandidate(applicationId, candidateName) {
    const result = await Swal.fire({
      title: 'Remover Candidato',
      text: `Tem certeza que deseja remover "${candidateName}" do banco de talentos?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      showLoading();
      
      const response = await fetch(`${apiBase}/applications/${applicationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        showNotification('Candidato removido com sucesso', 'success');
        await loadData();
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Erro ao remover candidato',
          text: errorData.message || 'Erro desconhecido'
        });
      }
    } catch (error) {
      console.error('Erro ao remover candidato:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro ao remover candidato',
        text: error.message
      });
    } finally {
      hideLoading();
    }
  }

  async function exportData() {
    try {
      showLoading();
      
      const response = await fetch(`${apiBase}/talent-bank/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            keyword: document.getElementById('filter-keyword').value,
            department: document.getElementById('filter-department').value,
            modality: document.getElementById('filter-modality').value,
            location: document.getElementById('filter-location').value,
            status: document.getElementById('filter-status').value
          }
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `banco-talentos-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification('Exportação realizada com sucesso', 'success');
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Erro na exportação',
          text: errorData.message || 'Erro desconhecido'
        });
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro na exportação',
        text: error.message
      });
    } finally {
      hideLoading();
    }
  }

  // Função principal de carregamento (AGRUPADO POR EMAIL)
  async function loadData() {
    try {
      showLoading();
      
      // Carregar metadados e estatísticas em paralelo
      const [metaData, statsData, candidatesData] = await Promise.all([
        fetchMeta(),
        fetchTalentBankStats(),
        fetchAllCandidates()
      ]);

      meta = metaData;
      candidates = candidatesData.candidates || [];
      filteredCandidates = [...candidates];

      // Debug: verificar se os dados estão sendo carregados
      console.log('Meta carregado:', meta);
      console.log('Candidatos agrupados por email:', candidates.length);
      console.log('Exemplo de candidato:', candidates[0]);

      // Atualizar interface
      updateStats(statsData);
      fillSelects();
      renderCandidates();
      updatePagination();

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro ao carregar dados',
        text: 'Não foi possível carregar os dados do banco de talentos. Tente novamente.'
      });
    } finally {
      hideLoading();
    }
  }

  // Event listeners
  document.addEventListener('DOMContentLoaded', () => {
    // Filtros
    document.addEventListener('input', (ev) => {
      if(['filter-keyword'].includes(ev.target.id)){
        applyFilters();
      }
    });
    
    document.addEventListener('change', (ev) => {
      if(['filter-department','filter-modality','filter-location','filter-status'].includes(ev.target.id)){
        applyFilters();
      }
    });

    // Botões
    document.getElementById('btn-clear-filters').addEventListener('click', () => {
      document.getElementById('filter-keyword').value = '';
      ['filter-department','filter-modality','filter-location','filter-status'].forEach(id => { 
        const el = document.getElementById(id); 
        el.value=''; 
        el.dispatchEvent(new Event('change')); 
      });
      applyFilters();
    });

    document.getElementById('btn-export').addEventListener('click', exportData);

    // Botão de confirmar remanejamento
    document.getElementById('btnConfirmReassign').addEventListener('click', confirmReassign);
    
    // Botão de adicionar nota no modal de detalhes
    document.getElementById('btnAddDetailNote').addEventListener('click', addDetailNote);
    
    // Enter para adicionar nota
    document.getElementById('detailNoteText').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addDetailNote();
      }
    });

    // Carregar dados iniciais
    loadData();

    // Inicializar Socket.IO para atualizações em tempo real
    initializeSocket();
  });

  // Função para inicializar Socket.IO
  function initializeSocket() {
    const socket = io();
    
    socket.on('hr:application_reassigned', (data) => {
      console.log('Candidato remanejado:', data);
      showNotification(`Candidato ${data.candidate_name} remanejado de "${data.old_job_title}" para "${data.new_job_title}"`, 'info');
      loadData(); // Recarregar dados
    });

    socket.on('hr:application_created', (data) => {
      console.log('Nova candidatura criada:', data);
      showNotification(`Nova candidatura: ${data.candidate_name}`, 'success');
      loadData(); // Recarregar dados
    });

        socket.on('hr:application_deleted', (data) => {
      console.log('Candidatura removida:', data);
      showNotification(`Candidatura removida: ${data.candidate_name}`, 'warning');
      loadData(); // Recarregar dados
    });
  }

  // Variáveis para remanejamento
  let reassignModal = null;
  let currentReassignData = null;

  // Função para abrir modal de remanejamento
  async function reassignCandidate(applicationId, candidateName, currentJobId) {
    console.log('=== INICIANDO REASSIGN CANDIDATE ===');
    console.log('Application ID:', applicationId);
    console.log('Candidate Name:', candidateName);
    console.log('Current Job ID:', currentJobId);
    console.log('Candidates array:', candidates);
    console.log('Meta object:', meta);
    
    try {
      // Buscar dados do candidato
      const candidate = candidates.find(c => c.application_id == applicationId);
      console.log('Candidate found:', candidate);
      
      if (!candidate) {
        showNotification('Candidato não encontrado', 'error');
        return;
      }

      // Armazenar dados para uso posterior
      currentReassignData = {
        applicationId,
        candidateName,
        currentJobId,
        candidate
      };

      // Preencher dados do candidato no modal
      const avatarEl = document.getElementById('reassignCandidateAvatar');
      const nameEl = document.getElementById('reassignCandidateName');
      const emailEl = document.getElementById('reassignCandidateEmail');
      const jobEl = document.getElementById('reassignCurrentJob');
      const statusEl = document.getElementById('reassignCurrentStatus');
      
      console.log('DOM elements found:', {
        avatar: avatarEl,
        name: nameEl,
        email: emailEl,
        job: jobEl,
        status: statusEl
      });
      
      if (avatarEl) avatarEl.innerHTML = getInitials(candidate.name);
      if (nameEl) nameEl.textContent = candidate.name;
      if (emailEl) emailEl.textContent = candidate.email;
      if (jobEl) jobEl.textContent = candidate.job_title;
      if (statusEl) {
        statusEl.textContent = candidate.status;
        statusEl.className = `badge ${getStatusBadgeClass(candidate.status)}`;
      }

      // Preencher select de vagas (excluindo a vaga atual)
      const jobSelect = document.getElementById('reassignJobSelect');
      const statusSelect = document.getElementById('reassignStatusSelect');
      
      console.log('Select elements found:', {
        jobSelect: jobSelect,
        statusSelect: statusSelect
      });
      
      if (!jobSelect || !statusSelect) {
        console.error('Selects não encontrados!');
        showNotification('Erro: elementos do modal não encontrados', 'error');
        return;
      }
      
      // Limpar selects completamente
      jobSelect.innerHTML = '<option value="">Selecione uma vaga...</option>';
      statusSelect.innerHTML = '<option value="">Selecione um status...</option>';
      
      // Remover classes do Choices.js
      jobSelect.className = 'form-select';
      statusSelect.className = 'form-select';
      
      console.log('Debug - Meta jobs:', meta.jobs);
      console.log('Debug - Current job ID:', currentJobId);
      console.log('Debug - Total jobs available:', meta.jobs ? meta.jobs.length : 0);
      
      if (meta.jobs) {
        let availableJobs = 0;
        meta.jobs.forEach(job => {
          console.log('Debug - Job:', job);
          if (job.id != currentJobId) {
            const option = document.createElement('option');
            option.value = job.id;
            
            // Adicionar status da vaga ao texto
            let statusText = '';
            if (job.status) {
              const statusMap = {
                'Draft': '(Rascunho)',
                'Published': '(Publicada)',
                'Closed': '(Encerrada)',
                'Archived': '(Arquivada)'
              };
              statusText = statusMap[job.status] || `(${job.status})`;
            }
            
            option.textContent = `${job.title} ${statusText}`;
            
            // Adicionar classe visual para vagas fechadas/arquivadas
            if (job.status === 'Closed' || job.status === 'Archived') {
              option.className = 'text-muted';
            }
            
            jobSelect.appendChild(option);
            availableJobs++;
          }
        });
        console.log('Debug - Available jobs for reassignment:', availableJobs);
        
        if (availableJobs === 0) {
          const option = document.createElement('option');
          option.value = '';
          option.textContent = 'Nenhuma outra vaga disponível';
          option.disabled = true;
          jobSelect.appendChild(option);
        }
      }

      // Preencher select de status
      statusSelect.innerHTML = '<option value="">Selecione um status...</option>';
      
      if (meta.statuses) {
        meta.statuses.forEach(status => {
          const option = document.createElement('option');
          option.value = status.name;
          option.textContent = status.name;
          statusSelect.appendChild(option);
        });
      }

      // NÃO inicializar Choices.js por enquanto - usar selects nativos
      console.log('Usando selects nativos sem Choices.js');

      // Limpar campos
      document.getElementById('reassignCoverLetter').value = '';

      // Abrir modal
      const modalElement = document.getElementById('reassignModal');
      console.log('Modal element found:', modalElement);
      
      if (!reassignModal) {
        reassignModal = new bootstrap.Modal(modalElement);
        console.log('Modal instance created:', reassignModal);
      }
      reassignModal.show();
      console.log('Modal should be visible now');

    } catch (error) {
      console.error('Erro ao abrir modal de remanejamento:', error);
      showNotification('Erro ao abrir modal de remanejamento', 'error');
    }
  }

  // Função para confirmar remanejamento
  async function confirmReassign() {
    if (!currentReassignData) return;

    const newJobId = document.getElementById('reassignJobSelect').value;
    const newStatus = document.getElementById('reassignStatusSelect').value;
    const coverLetter = document.getElementById('reassignCoverLetter').value.trim();

    if (!newJobId) {
      showNotification('Selecione uma nova vaga', 'error');
      return;
    }

    if (!newStatus) {
      showNotification('Selecione um status inicial', 'error');
      return;
    }

    try {
      showLoading();
      
      const response = await fetch(`${apiBase}/applications/${currentReassignData.applicationId}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_job_id: newJobId,
          new_status: newStatus,
          cover_letter: coverLetter
        })
      });

      if (response.ok) {
        showNotification('Candidato remanejado com sucesso', 'success');
        reassignModal.hide();
        await loadData(); // Recarregar dados
      } else {
        const errorData = await response.json();
        showNotification(errorData.message || 'Erro ao remanejar candidato', 'error');
      }
    } catch (error) {
      console.error('Erro ao remanejar candidato:', error);
      showNotification('Erro ao remanejar candidato', 'error');
    } finally {
      hideLoading();
    }
  }

  // Função para upload de anexo
  function uploadAttachment() {
    if (!currentApplicationId) return;
    
    const candidate = candidates.find(c => c.application_id == currentApplicationId);
    if (!candidate) return;
    
    // Criar input file temporário
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('applicant_id', candidate.applicant_id);
      formData.append('description', file.name);
      
      try {
        showNotification('Enviando arquivo...', 'info');
        
        const response = await fetch(`${apiBase}/applicants/${candidate.applicant_id}/attachments`, {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          await loadAttachments(candidate.applicant_id);
          showNotification('Arquivo enviado com sucesso', 'success');
        } else {
          throw new Error('Erro ao enviar arquivo');
        }
      } catch (error) {
        console.error('Erro ao fazer upload:', error);
        showNotification('Erro ao enviar arquivo', 'error');
      }
    };
    
    input.click();
  }

  // Função para visualizar candidato por email - ABRE PÁGINA COMPLETA DIRETAMENTE
  async function viewCandidateByEmail(email) {
    try {
      // Abrir diretamente a página de detalhes
      window.open(`candidate-details.html?email=${encodeURIComponent(email)}`, '_blank');
    } catch (error) {
      console.error('Erro ao abrir página de detalhes:', error);
      showNotification('Erro ao abrir página de detalhes', 'error');
    }
  }
  

  
  // Função para remover candidato por email
  async function removeCandidateByEmail(email) {
    try {
      // Buscar dados do candidato
      const response = await fetch(`${apiBase}/talent-bank/candidates?search=${encodeURIComponent(email)}&limit=1`);
      const data = await response.json();
      
      if (!data.success || !data.candidates.length) {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Candidato não encontrado'
        });
        return;
      }
      
      const candidate = data.candidates[0];
      
      // Confirmação detalhada
      const result = await Swal.fire({
        icon: 'warning',
        title: 'Remover Candidato',
        html: `
          <div class="text-start">
            <p><strong>Tem certeza que deseja remover o candidato?</strong></p>
            <div class="mt-3">
              <p><strong>Nome:</strong> ${candidate.name}</p>
              <p><strong>Email:</strong> ${candidate.email}</p>
            </div>
            <div class="mt-3 p-3 bg-light rounded">
              <p class="text-danger mb-2"><strong>⚠️ ATENÇÃO: Esta ação irá remover permanentemente:</strong></p>
              <ul class="text-start mb-0">
                <li><strong>${candidate.total_applications}</strong> candidatura(s)</li>
                <li><strong>${candidate.total_attachments}</strong> anexo(s)</li>
                <li><strong>${candidate.total_notes}</strong> observação(ões)</li>
                <li>Todos os arquivos físicos do servidor</li>
              </ul>
            </div>
            <div class="mt-3">
              <p class="text-danger"><strong>Esta ação não pode ser desfeita!</strong></p>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, remover candidato',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        focusCancel: true
      });
      
      if (result.isConfirmed) {
        // Mostrar loading
        Swal.fire({
          title: 'Removendo candidato...',
          html: 'Por favor, aguarde enquanto removemos todos os dados.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        // Fazer requisição de remoção
        const deleteResponse = await fetch(`${apiBase}/applicants/${candidate.id}`, {
          method: 'DELETE'
        });
        
        const deleteResult = await deleteResponse.json();
        
        if (deleteResponse.ok && deleteResult.success) {
          Swal.fire({
            icon: 'success',
            title: 'Candidato removido!',
            html: `
              <div class="text-start">
                <p><strong>${deleteResult.data.applicant_name}</strong> foi removido com sucesso.</p>
                <div class="mt-3">
                  <p><strong>Dados removidos:</strong></p>
                  <ul class="text-start mb-0">
                    <li>${deleteResult.data.total_applications} candidatura(s)</li>
                    <li>${deleteResult.data.total_attachments} anexo(s)</li>
                    <li>${deleteResult.data.total_notes} observação(ões)</li>
                    <li>${deleteResult.data.files_removed} arquivo(s) físico(s)</li>
                  </ul>
                </div>
              </div>
            `,
            confirmButtonText: 'OK'
          }).then(() => {
            // Recarregar dados do Banco de Talentos
            loadData();
          });
        } else {
          throw new Error(deleteResult.message || 'Erro ao remover candidato');
        }
      }
    } catch (error) {
      console.error('Erro ao remover candidato:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro ao remover candidato',
        text: error.message || 'Erro interno do servidor'
      });
    }
  }

  // Função para abrir página completa de detalhes do candidato
  function openCandidateFullView(email) {
    window.open(`candidate-details.html?email=${encodeURIComponent(email)}`, '_blank');
  }

  // Expor funções globalmente
  window.changePage = changePage;
  window.viewCandidate = viewCandidate;
  window.viewJob = viewJob;
  window.removeCandidate = removeCandidate;
  window.reassignCandidate = reassignCandidate;
  window.removeDetailNote = removeDetailNote;
  window.openJobView = openJobView;
  window.saveDetailChanges = saveDetailChanges;
  window.removeAttachment = removeAttachment;
  window.uploadAttachment = uploadAttachment;
  window.viewCandidateByEmail = viewCandidateByEmail;
  window.removeCandidateByEmail = removeCandidateByEmail;
  window.openCandidateFullView = openCandidateFullView;
  
  // Função de teste para debug
  window.testReassign = function() {
    console.log('=== TESTE DE REASSIGN ===');
    console.log('Meta disponível:', meta);
    console.log('Candidates disponível:', candidates);
    
    if (candidates && candidates.length > 0) {
      const firstCandidate = candidates[0];
      console.log('Testando com primeiro candidato:', firstCandidate);
      reassignCandidate(firstCandidate.application_id, firstCandidate.name, firstCandidate.job_id);
    } else {
      console.log('Nenhum candidato disponível para teste');
    }
  };

})(); 