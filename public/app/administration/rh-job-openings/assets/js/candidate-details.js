(function() {
  'use strict';

  // Configurações
  const apiBase = '/api/hr-job-openings';
  // Variáveis globais
  let candidateData = null;
  let currentEmail = null;
  let currentUser = null; // Adicionar variável para usuário atual

  // Função para obter usuário atual
  function getCurrentUser() {
    try {
      const StorageGoogleData = localStorage.getItem('StorageGoogle');
      if (StorageGoogleData) {
        const StorageGoogle = JSON.parse(StorageGoogleData);
        return {
          id: StorageGoogle.system_collaborator_id || 0,
          name: StorageGoogle.given_name || StorageGoogle.name || 'Sistema'
        };
      }
    } catch (error) {
      console.error('Erro ao obter usuário atual do localStorage:', error);
    }
    return { id: 0, name: 'Sistema' };
  }

  // Elementos DOM
  const candidateAvatar = document.getElementById('candidateAvatar');
  const candidateName = document.getElementById('candidateName');
  const candidateEmail = document.getElementById('candidateEmail');
  const candidatePhone = document.getElementById('candidatePhone');
  const candidateLinkedIn = document.getElementById('candidateLinkedIn');
  const candidateCreatedAt = document.getElementById('candidateCreatedAt');
  const totalApplications = document.getElementById('totalApplications');
  const totalAttachments = document.getElementById('totalAttachments');
  const totalNotes = document.getElementById('totalNotes');
  const applicationsList = document.getElementById('applicationsList');
  const attachmentsList = document.getElementById('attachmentsList');
  const notesList = document.getElementById('notesList');
  const timelineList = document.getElementById('timelineList');

  // Verificar se todos os elementos foram encontrados
  const requiredElements = {
    candidateAvatar,
    candidateName,
    candidateEmail,
    candidatePhone,
    candidateLinkedIn,
    candidateCreatedAt,
    totalApplications,
    totalAttachments,
    totalNotes,
    applicationsList,
    attachmentsList,
    notesList,
    timelineList
  };

  // Verificar elementos ausentes
  const missingElements = Object.entries(requiredElements)
    .filter(([name, element]) => !element)
    .map(([name]) => name);

  if (missingElements.length > 0) {
    console.error('Elementos DOM não encontrados:', missingElements);
    document.body.innerHTML = `
      <div class="alert alert-danger m-3">
        <h4>Erro de Carregamento</h4>
        <p>Alguns elementos da página não foram encontrados: ${missingElements.join(', ')}</p>
        <p>Por favor, recarregue a página.</p>
      </div>
    `;
    return;
  }

  // Funções utilitárias
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function showLoading(element) {
    if (!element) {
      console.error('Elemento não encontrado para mostrar loading');
      return;
    }
    element.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Carregando...</span>
        </div>
        <p class="mt-2 text-muted">Carregando dados...</p>
      </div>
    `;
  }

  function showError(element, message) {
    if (!element) {
      console.error('Elemento não encontrado para mostrar erro');
      return;
    }
    element.innerHTML = `
      <div class="text-center py-4">
        <i class="ri-error-warning-line text-danger" style="font-size: 3rem;"></i>
        <p class="mt-2 text-danger">${message}</p>
        <button class="btn btn-outline-primary" onclick="loadData()">Tentar Novamente</button>
      </div>
    `;
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  function getStatusBadgeClass(status) {
    const statusMap = {
      'Recebidos': 'status-received',
      'Em Triagem': 'status-screening',
      'Entrevista': 'status-interview',
      'Oferta': 'status-offer',
      'Aprovado': 'status-approved',
      'Rejeitado': 'status-rejected'
    };
    return statusMap[status] || 'status-received';
  }

  function getFileIcon(fileType) {
    if (fileType?.includes('pdf')) return 'ri-file-pdf-line text-danger';
    if (fileType?.includes('word')) return 'ri-file-word-line text-primary';
    if (fileType?.includes('image')) return 'ri-image-line text-success';
    return 'ri-file-text-line text-secondary';
  }

  // Função principal de carregamento
  async function loadData() {
    try {
      // Obter email da URL
      const urlParams = new URLSearchParams(window.location.search);
      currentEmail = urlParams.get('email');
      
      if (!currentEmail) {
        throw new Error('Email do candidato não fornecido');
      }

      // Carregar dados do candidato
      const response = await fetch(`${apiBase}/talent-bank/candidates?search=${currentEmail}&limit=1`);
      const data = await response.json();
      
      if (!data.success || !data.candidates.length) {
        throw new Error('Candidato não encontrado');
      }

      candidateData = data.candidates[0];
      
      // Atualizar interface
      updateCandidateProfile();
      loadApplications();
      loadAttachments();
      loadNotes();
      loadTimeline();
      
      // Inicializar FilePond após carregar os dados
      setTimeout(() => {
        initializeFilePond();
      }, 500);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showError(document.body, 'Erro ao carregar dados do candidato');
    }
  }

  // Atualizar perfil do candidato
  function updateCandidateProfile() {
    if (!candidateData) {
      console.error('Dados do candidato não disponíveis');
      return;
    }

    // Avatar
    if (candidateAvatar) {
      candidateAvatar.innerHTML = getInitials(candidateData.name);
    }
    
    // Informações básicas
    if (candidateName) {
      candidateName.textContent = candidateData.name || 'Nome não informado';
    }
    if (candidateEmail) {
      candidateEmail.textContent = candidateData.email || 'Email não informado';
    }
    if (candidatePhone) {
      candidatePhone.textContent = candidateData.phone || 'Não informado';
    }
    if (candidateLinkedIn) {
      candidateLinkedIn.innerHTML = candidateData.linkedin_url ? 
        `<a href="${candidateData.linkedin_url}" target="_blank">Ver perfil</a>` : 
        'Não informado';
    }
    if (candidateCreatedAt) {
      candidateCreatedAt.textContent = formatDate(candidateData.candidate_created_at);
    }
    
    // Estatísticas
    if (totalApplications) {
      totalApplications.textContent = candidateData.total_applications || 0;
    }
    if (totalAttachments) {
      totalAttachments.textContent = candidateData.total_attachments || 0;
    }
    if (totalNotes) {
      totalNotes.textContent = candidateData.total_notes || 0;
    }
    
    // Título da página
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
      pageTitle.textContent = `Detalhes do Candidato - ${candidateData.name || 'Candidato'}`;
    }
  }

  // Carregar candidaturas
  async function loadApplications() {
    try {
      if (!applicationsList) {
        console.error('Elemento applicationsList não encontrado');
        return;
      }
      showLoading(applicationsList);
      
      // Usar a nova rota específica para candidaturas
      const response = await fetch(`${apiBase}/applicants/${candidateData.id}/applications`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Erro ao carregar candidaturas');
      }

      if (!data.applications || data.applications.length === 0) {
        applicationsList.innerHTML = `
          <div class="text-center py-4">
            <i class="ri-briefcase-line text-muted" style="font-size: 3rem;"></i>
            <p class="mt-2 text-muted">Nenhuma candidatura encontrada</p>
          </div>
        `;
        return;
      }

      applicationsList.innerHTML = data.applications.map((app, index) => `
        <div class="application-item fade-in">
          <div class="application-header">
            <h6 class="application-title">${app.job_title}</h6>
            <span class="badge ${getStatusBadgeClass(app.status_name)} application-status">
              ${app.status_name}
            </span>
          </div>
          <div class="row">
            <div class="col-md-6">
              <small class="text-muted">
                <i class="ri-building-line me-1"></i>${app.department_name || 'N/A'}
              </small>
            </div>
            <div class="col-md-6">
              <small class="text-muted">
                <i class="ri-map-pin-line me-1"></i>${app.location_name || 'N/A'}
              </small>
            </div>
          </div>
          <div class="row mt-2">
            <div class="col-md-6">
              <button class="btn btn-sm btn-outline-danger" onclick="removeFromJob('${app.job_title}', ${app.application_id})" title="Remover da Vaga">
                <i class="ri-delete-bin-line me-1"></i>Remover da Vaga
              </button>
            </div>
            <div class="col-md-6 text-end">
              ${app.rejection_email_sent ? 
                `<span class="badge bg-secondary" title="Email de rejeição enviado em ${formatDate(app.rejection_email_sent)}">
                  <i class="ri-mail-check-line me-1"></i>Email de Rejeição Enviado
                </span>` : 
                `<button class="btn btn-sm btn-outline-warning" onclick="sendRejectionEmailForJob(${app.application_id}, '${app.job_title}', ${app.job_posting_id})" title="Enviar email de rejeição">
                  <i class="ri-mail-send-line me-1"></i>Enviar Rejeição
                </button>`
              }
            </div>
          </div>
        </div>
      `).join('');
      
    } catch (error) {
      console.error('Erro ao carregar candidaturas:', error);
      showError(applicationsList, 'Erro ao carregar candidaturas');
    }
  }

  // Carregar anexos
  async function loadAttachments() {
    try {
      if (!attachmentsList) {
        console.error('Elemento attachmentsList não encontrado');
        return;
      }
      showLoading(attachmentsList);
      
      // Usar os dados do candidato já carregados
      if (!candidateData || !candidateData.id) {
        throw new Error('Dados do candidato não disponíveis');
      }

      // Buscar anexos usando o ID do candidato
      const response = await fetch(`${apiBase}/applicants/${candidateData.id}/attachments`);
      const attachments = await response.json();
      
      if (!attachments || attachments.length === 0) {
        attachmentsList.innerHTML = `
          <div class="text-center py-4">
            <i class="ri-attachment-line text-muted" style="font-size: 3rem;"></i>
            <p class="mt-2 text-muted">Nenhum anexo encontrado</p>
          </div>
        `;
        return;
      }

      attachmentsList.innerHTML = attachments.map(att => `
        <div class="attachment-item slide-in">
          <div class="attachment-icon">
            <i class="${getFileIcon(att.file_type)}"></i>
          </div>
          <div class="attachment-info">
            <div class="attachment-name">${att.file_name}</div>
            <div class="attachment-meta">
              ${att.file_type || 'Documento'} • ${formatFileSize(att.file_size || 0)}
              ${att.is_resume == 1 ? ' • <span class="badge bg-primary">Currículo</span>' : ''}
            </div>
          </div>
          <div class="attachment-actions">
            <a href="${apiBase}/attachments/${att.id}/download" class="btn btn-sm btn-outline-primary" target="_blank" title="Baixar">
              <i class="ri-download-line"></i>
            </a>
            <a href="${apiBase}/attachments/${att.id}/view" class="btn btn-sm btn-outline-info" target="_blank" title="Visualizar">
              <i class="ri-eye-line"></i>
            </a>
            <button class="btn btn-sm btn-outline-danger" onclick="removeAttachment(${att.id})" title="Remover">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </div>
      `).join('');
      
    } catch (error) {
      console.error('Erro ao carregar anexos:', error);
      showError(attachmentsList, 'Erro ao carregar anexos');
    }
  }

  // Carregar observações
  async function loadNotes() {
    try {
      if (!notesList) {
        console.error('Elemento notesList não encontrado');
        return;
      }
      showLoading(notesList);
      
      const response = await fetch(`${apiBase}/candidates/${encodeURIComponent(currentEmail)}/notes`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Erro ao carregar observações');
      }

      if (!data.notes || data.notes.length === 0) {
        notesList.innerHTML = `
          <div class="text-center py-4">
            <i class="ri-chat-1-line text-muted" style="font-size: 3rem;"></i>
            <p class="mt-2 text-muted">Nenhuma observação encontrada</p>
          </div>
        `;
        return;
      }

      notesList.innerHTML = data.notes.map(note => `
        <div class="note-item fade-in">
          <div class="note-header">
            <span class="note-author">${note.author_name || 'Sistema'}</span>
            <span class="note-date">${formatDate(note.created_at)}</span>
          </div>
          <div class="note-job">
            <i class="ri-briefcase-line me-1"></i>${note.job_title}
          </div>
          <div class="note-content">${note.note}</div>
        </div>
      `).join('');
      
    } catch (error) {
      console.error('Erro ao carregar observações:', error);
      showError(notesList, 'Erro ao carregar observações');
    }
  }

  // Carregar timeline
  async function loadTimeline() {
    try {
      if (!timelineList) {
        console.error('Elemento timelineList não encontrado');
        return;
      }
      showLoading(timelineList);
      
      // Buscar candidaturas específicas (sem duplicatas)
      const response = await fetch(`${apiBase}/applicants/${candidateData.id}/applications`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Erro ao carregar dados da timeline');
      }
      
      // Criar timeline baseada apenas nas candidaturas (sem observações internas)
      const timeline = [];
      
      // Adicionar candidaturas
      if (data.applications && data.applications.length > 0) {
        data.applications.forEach((app) => {
          timeline.push({
            type: 'application',
            title: `Candidatura para ${app.job_title}`,
            date: app.applied_at,
            description: `Candidato se inscreveu para a vaga de ${app.job_title} no departamento ${app.department_name || 'N/A'}`,
            status: app.status_name,
            department: app.department_name,
            location: app.location_name
          });
        });
      }
      
      // Ordenar por data (mais recente primeiro)
      timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      if (timeline.length === 0) {
        timelineList.innerHTML = `
          <div class="text-center py-4">
            <i class="ri-time-line text-muted" style="font-size: 3rem;"></i>
            <p class="mt-2 text-muted">Nenhuma atividade encontrada</p>
          </div>
        `;
        return;
      }

      timelineList.innerHTML = timeline.map(item => `
        <div class="timeline-item fade-in">
          <div class="timeline-content">
            <div class="timeline-title">${item.title}</div>
            <div class="timeline-date">${formatDate(item.date)}</div>
            <div class="timeline-description">${item.description}</div>
            ${item.status ? `<span class="badge ${getStatusBadgeClass(item.status)}">${item.status}</span>` : ''}
          </div>
        </div>
      `).join('');
      
    } catch (error) {
      console.error('Erro ao carregar timeline:', error);
      showError(timelineList, 'Erro ao carregar timeline');
    }
  }

  // Funções auxiliares
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    
    if (body.getAttribute('data-theme-mode') === 'dark') {
      body.setAttribute('data-theme-mode', 'light');
      themeIcon.className = 'ri-moon-line';
    } else {
      body.setAttribute('data-theme-mode', 'dark');
      themeIcon.className = 'ri-sun-line';
    }
  }

  // Funções de ação
  // Função para adicionar nova observação
  async function addNewNote() {
    try {
      const noteText = document.getElementById('newNoteText');
      if (!noteText) {
        console.error('Elemento newNoteText não encontrado');
        return;
      }
      
      const note = noteText.value.trim();
      if (!note) {
        Swal.fire({
          icon: 'warning',
          title: 'Atenção',
          text: 'Digite uma observação'
        });
        return;
      }

      // Obter informações do usuário logado
      if (!currentUser) {
        currentUser = getCurrentUser();
      }

      console.log('🔍 Debug - Dados do usuário:', currentUser);
      console.log('🔍 Debug - StorageGoogle completo:', localStorage.getItem('StorageGoogle'));

      // Mostrar loading
      Swal.fire({
        title: 'Adicionando observação...',
        html: 'Por favor, aguarde.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Fazer requisição de adição de nota
      const response = await fetch(`${apiBase}/candidates/${encodeURIComponent(currentEmail)}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          note: note,
          author_id: currentUser.id || 0
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Limpar campo
        noteText.value = '';
        
        // Recarregar observações
        await loadNotes();
        
        Swal.fire({
          icon: 'success',
          title: 'Observação adicionada!',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error(result.message || 'Erro ao adicionar observação');
      }
    } catch (error) {
      console.error('Erro ao adicionar observação:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro ao adicionar observação',
        text: error.message
      });
    }
  }

  async function removeAttachment(attachmentId) {
    if (!confirm('Remover este anexo?')) return;
    
    try {
      const response = await fetch(`${apiBase}/attachments/${attachmentId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadAttachments();
        Swal.fire({
          icon: 'success',
          title: 'Anexo removido!',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error('Erro ao remover anexo');
      }
    } catch (error) {
      console.error('Erro ao remover anexo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro ao remover anexo',
        text: error.message
      });
    }
  }

  function editCandidate() {
    // Preencher modal de edição
    document.getElementById('editName').value = candidateData.name;
    document.getElementById('editEmail').value = candidateData.email;
    document.getElementById('editPhone').value = candidateData.phone || '';
    document.getElementById('editLinkedIn').value = candidateData.linkedin_url || '';
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('editCandidateModal'));
    modal.show();
  }

  async function saveCandidateEdit() {
    try {
      const formData = {
        name: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value,
        phone: document.getElementById('editPhone').value,
        linkedin_url: document.getElementById('editLinkedIn').value
      };
      
      // Usar o ID do candidato já carregado
      if (!candidateData || !candidateData.id) {
        throw new Error('Dados do candidato não disponíveis');
      }

      const response = await fetch(`${apiBase}/applicants/${candidateData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        // Fechar modal e recarregar dados
        const modal = bootstrap.Modal.getInstance(document.getElementById('editCandidateModal'));
        modal.hide();
        
        await loadData();
        
        Swal.fire({
          icon: 'success',
          title: 'Dados atualizados!',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error('Erro ao atualizar dados');
      }
    } catch (error) {
      console.error('Erro ao atualizar candidato:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro ao atualizar dados',
        text: error.message
      });
    }
  }

  async function removeCandidate() {
    try {
      // Buscar estatísticas do candidato
      const statsResponse = await fetch(`${apiBase}/talent-bank/candidates?search=${encodeURIComponent(currentEmail)}&limit=1`);
      const statsData = await statsResponse.json();
      
      if (!statsData.success || !statsData.candidates.length) {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível obter dados do candidato'
        });
        return;
      }
      
      const candidate = statsData.candidates[0];
      
      // Confirmação detalhada
      const result = await Swal.fire({
        icon: 'warning',
        title: 'Remover Candidato',
        html: `
          <div class="text-start">
            <p><strong>Tem certeza que deseja remover o candidato?</strong></p>
            <div class="mt-3">
              <p><strong>Nome:</strong> ${candidateData.name}</p>
              <p><strong>Email:</strong> ${candidateData.email}</p>
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
        const response = await fetch(`${apiBase}/applicants/${candidateData.id}`, {
          method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          Swal.fire({
            icon: 'success',
            title: 'Candidato removido!',
            html: `
              <div class="text-start">
                <p><strong>${result.data.applicant_name}</strong> foi removido com sucesso.</p>
                <div class="mt-3">
                  <p><strong>Dados removidos:</strong></p>
                  <ul class="text-start mb-0">
                    <li>${result.data.total_applications} candidatura(s)</li>
                    <li>${result.data.total_attachments} anexo(s)</li>
                    <li>${result.data.total_notes} observação(ões)</li>
                    <li>${result.data.files_removed} arquivo(s) físico(s)</li>
                  </ul>
                </div>
              </div>
            `,
            confirmButtonText: 'OK'
          }).then(() => {
            // Fechar a janela atual
            window.close();
          });
        } else {
          throw new Error(result.message || 'Erro ao remover candidato');
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



  function viewJobDetails(jobTitle) {
    Swal.fire({
      icon: 'info',
      title: 'Detalhes da Vaga',
      text: `Detalhes da vaga: ${jobTitle}`
    });
  }

  function reassignToJob(jobTitle) {
    Swal.fire({
      icon: 'info',
      title: 'Remanejamento',
      text: `Remanejar candidato para: ${jobTitle}`
    });
  }

  // Função para abrir modal de remanejamento
  async function openReassignModal() {
    try {
      // Buscar todas as vagas disponíveis
      const response = await fetch(`${apiBase}/metadata`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Erro ao carregar vagas');
      }
      
      const jobSelect = document.getElementById('reassignJobSelect');
      if (!jobSelect) {
        console.error('Elemento reassignJobSelect não encontrado');
        return;
      }
      
      // Limpar opções existentes
      jobSelect.innerHTML = '<option value="">Selecione uma vaga...</option>';
      
      // Adicionar vagas disponíveis
      if (data.jobs && data.jobs.length > 0) {
        data.jobs.forEach(job => {
          const option = document.createElement('option');
          option.value = job.id;
          
          // Usar os novos campos com nomes já resolvidos
          const department = job.department_name || 'Sem Departamento';
          const location = job.location_name || 'Sem Localização';
          
          // Formato mais claro: Título | Departamento | Localização
          option.textContent = `${job.title} | ${department} | ${location}`;
          jobSelect.appendChild(option);
        });
        
        console.log(`✅ ${data.jobs.length} vagas carregadas no select`);
      } else {
        console.warn('⚠️ Nenhuma vaga encontrada');
        jobSelect.innerHTML = '<option value="">Nenhuma vaga disponível</option>';
      }
      
      // Abrir modal
      const modal = new bootstrap.Modal(document.getElementById('reassignModal'));
      modal.show();
      
    } catch (error) {
      console.error('Erro ao abrir modal de remanejamento:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro ao carregar vagas disponíveis'
      });
    }
  }

  // Função para confirmar remanejamento
  async function confirmReassign() {
    try {
      const jobSelect = document.getElementById('reassignJobSelect');
      const selectedJobId = jobSelect.value;
      
      if (!selectedJobId) {
        Swal.fire({
          icon: 'warning',
          title: 'Atenção',
          text: 'Selecione uma vaga para remanejar o candidato'
        });
        return;
      }
      
      // Buscar status "Em Triagem"
      const statusResponse = await fetch(`${apiBase}/metadata`);
      const statusData = await statusResponse.json();
      
      if (!statusData.success || !statusData.statuses) {
        throw new Error('Erro ao carregar status');
      }
      
      const triagemStatus = statusData.statuses.find(s => s.name.toLowerCase() === 'em triagem');
      if (!triagemStatus) {
        throw new Error('Status "Em Triagem" não encontrado');
      }
      
      // Mostrar loading
      Swal.fire({
        title: 'Remanejando candidato...',
        html: 'Por favor, aguarde.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      // Fazer requisição de remanejamento
      const response = await fetch(`${apiBase}/applicants/${candidateData.id}/reassign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job_id: parseInt(selectedJobId),
          status_id: triagemStatus.id
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('reassignModal'));
        modal.hide();
        
        Swal.fire({
          icon: 'success',
          title: 'Candidato remanejado!',
          text: 'O candidato foi vinculado à nova vaga com status "Em Triagem".',
          timer: 2000,
          showConfirmButton: false
        });
        
        // Recarregar dados
        await loadData();
        
      } else {
        throw new Error(result.message || 'Erro ao remanejar candidato');
      }
      
    } catch (error) {
      console.error('Erro ao remanejar candidato:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro ao remanejar',
        text: error.message
      });
    }
  }

  // Função para remover candidato de uma vaga específica
  async function removeFromJob(jobTitle, applicationId) {
    try {
      const result = await Swal.fire({
        icon: 'warning',
        title: 'Remover da Vaga',
        html: `
          <div class="text-start">
            <p><strong>Tem certeza que deseja remover o candidato da vaga?</strong></p>
            <div class="mt-3">
              <p><strong>Vaga:</strong> ${jobTitle}</p>
              <p><strong>Candidato:</strong> ${candidateData.name}</p>
            </div>
            <div class="mt-3 p-3 bg-light rounded">
              <p class="text-warning mb-2"><strong>⚠️ ATENÇÃO:</strong></p>
              <ul class="text-start mb-0">
                <li>A candidatura será removida permanentemente</li>
                <li>Observações específicas desta vaga serão perdidas</li>
                <li>O candidato permanecerá no sistema</li>
              </ul>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, remover da vaga',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        focusCancel: true
      });
      
      if (result.isConfirmed) {
        // Mostrar loading
        Swal.fire({
          title: 'Removendo da vaga...',
          html: 'Por favor, aguarde.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        // Fazer requisição de remoção da vaga usando application_id
        const response = await fetch(`${apiBase}/applications/${applicationId}`, {
          method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          Swal.fire({
            icon: 'success',
            title: 'Removido da vaga!',
            text: 'O candidato foi removido da vaga com sucesso.',
            timer: 2000,
            showConfirmButton: false
          });
          
          // Recarregar dados
          await loadData();
          
        } else {
          throw new Error(result.message || 'Erro ao remover da vaga');
        }
      }
    } catch (error) {
      console.error('Erro ao remover da vaga:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro ao remover da vaga',
        text: error.message
      });
    }
  }

  // Função para remover observação
  async function removeNote(noteId) {
    try {
      const result = await Swal.fire({
        icon: 'warning',
        title: 'Remover Observação',
        text: 'Tem certeza que deseja remover esta observação?',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, remover',
        cancelButtonText: 'Cancelar'
      });
      
      if (result.isConfirmed) {
        const response = await fetch(`${apiBase}/notes/${noteId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await loadNotes();
          Swal.fire({
            icon: 'success',
            title: 'Observação removida!',
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          throw new Error('Erro ao remover observação');
        }
      }
    } catch (error) {
      console.error('Erro ao remover observação:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro ao remover observação',
        text: error.message
      });
    }
  }

  // Inicializar FilePond
  function initializeFilePond() {
    if (typeof FilePond !== 'undefined') {
      // Registrar plugins
      FilePond.registerPlugin(FilePondPluginImagePreview);
      
      // Configurar FilePond
      const pond = FilePond.create(document.getElementById('attachmentUpload'), {
        server: {
          url: `${apiBase}/applicants/${candidateData.id}/attachments`,
          process: {
            method: 'POST',
            withCredentials: false,
            headers: {},
            onload: (response) => {
              const result = JSON.parse(response);
              return result.id;
            },
            onerror: (response) => {
              return response.data;
            }
          },
          revert: {
            url: `${apiBase}/attachments/`,
            method: 'DELETE',
            onload: (response) => {
              loadAttachments();
            }
          }
        },
        allowMultiple: true,
        maxFiles: 10,
        acceptedFileTypes: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        labelIdle: 'Arraste arquivos aqui ou <span class="filepond--label-action">clique para selecionar</span>',
        labelFileProcessing: 'Enviando...',
        labelFileProcessingComplete: 'Enviado com sucesso',
        labelTapToCancel: 'Clique para cancelar',
        labelTapToRetry: 'Clique para tentar novamente',
        labelTapToUndo: 'Clique para desfazer',
        onaddfile: (error, file) => {
          if (error) {
            console.error('Erro ao adicionar arquivo:', error);
          }
        },
        onprocessfile: (error, file) => {
          if (error) {
            console.error('Erro ao processar arquivo:', error);
            Swal.fire({
              icon: 'error',
              title: 'Erro ao enviar arquivo',
              text: error.body || 'Erro desconhecido'
            });
          } else {
            loadAttachments();
            Swal.fire({
              icon: 'success',
              title: 'Arquivo enviado!',
              timer: 1500,
              showConfirmButton: false
            });
          }
        }
      });
    }
  }

  // Funções para email de rejeição
  async function openRejectionEmailModal() {
    try {
      // Carregar vagas disponíveis
      await loadAvailableJobs();
      
      // Preencher campos com informações padrão
      const subject = document.getElementById('rejectionEmailSubject');
      const content = document.getElementById('rejectionEmailContent');
      
      // Assunto padrão
      subject.value = '[CONLINE]Resposta à sua candidatura';
      
      // Conteúdo padrão personalizado
      const candidateName = candidateData.name || 'Candidato';
      const currentDate = new Date().toLocaleDateString('pt-BR');
      
      content.value = `Prezado(a) ${candidateName},

Agradecemos seu interesse em fazer parte da nossa equipe e o tempo dedicado ao processo seletivo.

Após uma cuidadosa análise do seu perfil e experiência, informamos que, infelizmente, não foi possível avançar com sua candidatura para esta posição no momento.

Esta decisão foi baseada em critérios específicos da vaga e na comparação com outros candidatos que participaram do processo seletivo.

Boa notícia! Seu currículo foi adicionado ao nosso banco de talentos e será considerado para futuras oportunidades que sejam compatíveis com seu perfil.

Continuaremos acompanhando seu desenvolvimento profissional e entraremos em contato caso surjam vagas adequadas ao seu perfil.

Agradecemos novamente seu interesse em nossa empresa.

Atenciosamente,
Equipe de Recursos Humanos
`;
      
      // Abrir modal
      const modal = new bootstrap.Modal(document.getElementById('rejectionEmailModal'));
      modal.show();
    } catch (error) {
      console.error('Erro ao abrir modal de rejeição:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro ao abrir modal de rejeição'
      });
    }
  }

  async function loadAvailableJobs() {
    try {
      const response = await fetch(`${apiBase}/jobs/active`);
      const data = await response.json();
      
      if (data.success) {
        const select = document.getElementById('rejectionJobSelect');
        select.innerHTML = '<option value="">Selecione uma vaga...</option>';
        
        data.jobs.forEach(job => {
          const option = document.createElement('option');
          option.value = job.id;
          option.textContent = job.title;
          select.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Erro ao carregar vagas:', error);
    }
  }

  async function sendRejectionEmail() {
    const jobId = document.getElementById('rejectionJobSelect').value;
    const subject = document.getElementById('rejectionEmailSubject').value;
    const content = document.getElementById('rejectionEmailContent').value;
    
    if (!jobId) {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Selecione uma vaga'
      });
      return;
    }
    
    if (!subject.trim() || !content.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Preencha o assunto e conteúdo do email'
      });
      return;
    }
    
    try {
      // Mostrar loading
      Swal.fire({
        title: 'Enviando Email...',
        text: 'Aguarde enquanto enviamos o email de rejeição',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      const response = await fetch(`${apiBase}/applicants/${candidateData.id}/rejection-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_posting_id: jobId,
          subject: subject,
          content: content
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('rejectionEmailModal'));
        modal.hide();
        
        // Resetar modal
        resetRejectionEmailModal();
        
        Swal.fire({
          icon: 'success',
          title: 'Email Enviado!',
          text: 'O email de rejeição foi enviado com sucesso ao candidato',
          timer: 3000,
          showConfirmButton: false
        });
        
        // Recarregar candidaturas para atualizar status
        loadApplications();
      } else {
        throw new Error(result.message || 'Erro ao enviar email');
      }
    } catch (error) {
      console.error('Erro ao enviar email de rejeição:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro ao Enviar',
        text: error.message || 'Não foi possível enviar o email de rejeição'
      });
    }
  }

  async function sendRejectionEmailForJob(applicationId, jobTitle, jobPostingId) {
    try {
      // Preencher modal com dados da vaga específica
      const select = document.getElementById('rejectionJobSelect');
      const subject = document.getElementById('rejectionEmailSubject');
      const content = document.getElementById('rejectionEmailContent');
      
      // Limpar e configurar o select apenas com a vaga específica
      select.innerHTML = '';
      const option = document.createElement('option');
      option.value = jobPostingId;
      option.textContent = jobTitle;
      option.selected = true;
      select.appendChild(option);
      
      // Desabilitar o select para não permitir mudança
      select.disabled = true;
      
     
      // Assunto padrão com nome da vaga
      subject.value = `[CONLINE]Resposta à sua candidatura - ${jobTitle}`;
      
      // Conteúdo padrão personalizado
      const candidateName = candidateData.name || 'Candidato';
      const currentDate = new Date().toLocaleDateString('pt-BR');
      
      content.value = `Prezado(a) ${candidateName},

Agradecemos seu interesse em fazer parte da nossa equipe e o tempo dedicado ao processo seletivo para a vaga de ${jobTitle}.

Após uma cuidadosa análise do seu perfil e experiência, informamos que, infelizmente, não foi possível avançar com sua candidatura para esta posição no momento.

Esta decisão foi baseada em critérios específicos da vaga e na comparação com outros candidatos que participaram do processo seletivo.

Boa notícia! Seu currículo foi adicionado ao nosso banco de talentos e será considerado para futuras oportunidades que sejam compatíveis com seu perfil.

Continuaremos acompanhando seu desenvolvimento profissional e entraremos em contato caso surjam vagas adequadas ao seu perfil.

Agradecemos novamente seu interesse em nossa empresa.

Atenciosamente,
Equipe de Recursos Humanos`;
      
      // Abrir modal
      const modal = new bootstrap.Modal(document.getElementById('rejectionEmailModal'));
      modal.show();
    } catch (error) {
      console.error('Erro ao abrir modal de rejeição para vaga específica:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro ao abrir modal de rejeição'
      });
    }
  }

  // Função para resetar o modal de email de rejeição
  function resetRejectionEmailModal() {
    const select = document.getElementById('rejectionJobSelect');
    const subject = document.getElementById('rejectionEmailSubject');
    const content = document.getElementById('rejectionEmailContent');
    
    // Reabilitar o select
    select.disabled = false;
    
    
    // Limpar campos
    select.innerHTML = '<option value="">Selecione uma vaga...</option>';
    subject.value = '[CONLINE]Resposta à sua candidatura';
    content.value = `Prezado(a) candidato(a),

Agradecemos seu interesse em fazer parte da nossa equipe e pelo tempo dedicado ao processo seletivo.

Após uma cuidadosa análise de seu perfil e experiência, informamos que, infelizmente, não poderemos prosseguir com sua candidatura para esta posição.

Gostaríamos de destacar que seu currículo foi muito bem avaliado e será mantido em nosso banco de dados para futuras oportunidades que possam surgir.

Desejamos sucesso em sua carreira profissional.

Atenciosamente,
Equipe de Recursos Humanos`;
  }

  // Event listeners
  document.addEventListener('DOMContentLoaded', async () => {
    // Verificar se todos os elementos estão disponíveis antes de continuar
    if (missingElements.length > 0) {
      console.error('Elementos DOM não encontrados no DOMContentLoaded:', missingElements);
      return;
    }

    // Inicializar usuário atual
    currentUser = getCurrentUser();
    console.log('Usuário atual carregado:', currentUser);

    // Enter para adicionar nota
    const newNoteText = document.getElementById('newNoteText');
    if (newNoteText) {
      newNoteText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          addNewNote();
        }
      });
    }
    
    // Event listener para resetar modal de rejeição quando fechado
    const rejectionModal = document.getElementById('rejectionEmailModal');
    if (rejectionModal) {
      rejectionModal.addEventListener('hidden.bs.modal', function () {
        resetRejectionEmailModal();
      });
    }
    
    // Carregar dados iniciais
    loadData();
  });

  // Expor funções globalmente (fora do DOMContentLoaded para disponibilidade imediata)
  window.saveCandidateEdit = saveCandidateEdit;
  window.addNewNote = addNewNote;
  window.removeNote = removeNote;
  window.removeAttachment = removeAttachment;
  window.removeCandidate = removeCandidate;
  window.viewJobDetails = viewJobDetails;
  window.reassignToJob = reassignToJob;
  window.removeFromJob = removeFromJob;
  window.openReassignModal = openReassignModal;
  window.confirmReassign = confirmReassign;
  window.editCandidate = editCandidate;
  window.openRejectionEmailModal = openRejectionEmailModal;
  window.sendRejectionEmail = sendRejectionEmail;
  window.sendRejectionEmailForJob = sendRejectionEmailForJob;

})(); 