$(document).ready(function () {
    // Função utilitária para obter parâmetro da URL
    function getUrlParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    const pdiId = getUrlParam('id');
    if (!pdiId) {
        Swal.fire('Erro', 'ID do PDI não informado na URL.', 'error');
        return;
    }

    // Loader
    function showLoader(show) {
        if (show) $('#loader').show();
        else $('#loader').hide();
    }

    // Carregar colaboradores e supervisores
    function loadCollaboratorsAndSupervisors(selectedColab, selectedSup) {
        $.get('/api/pdi-hub/getAllActiveCollaborators', function (res) {
            if (res.success) {
                const select = $('#collaborator_id');
                select.empty().append('<option value="">Selecione um colaborador</option>');
                res.data.forEach(function (c) {
                    select.append(`<option value="${c.id}">${c.name} (${c.job_position || ''})</option>`);
                });
                if (selectedColab) select.val(selectedColab);
            }
        });
        $.get('/api/pdi-hub/getSupervisors', function (res) {
            if (res.success) {
                const select = $('#supervisor_id');
                select.empty().append('<option value="">Selecione um supervisor</option>');
                res.data.forEach(function (s) {
                    select.append(`<option value="${s.id}">${s.name} (${s.job_position || ''})</option>`);
                });
                if (selectedSup) select.val(selectedSup);
            }
        });
    }

    // Carregar dados do PDI
    function loadPDI() {
        showLoader(true);
        $.ajax({
            url: '/api/pdi-hub/getPDIView',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ id: pdiId }),
            success: function (res) {
                if (res.success && res.data) {
                    const pdi = res.data;
                    // Preencher campos
                    loadCollaboratorsAndSupervisors(pdi.collaborator_id, pdi.supervisor_id);
                    $('#academic_summary').val(pdi.academic_summary || '');
                    $('#who_are_you').val(pdi.who_are_you || '');
                    $('#strengths').val(pdi.strengths || '');
                    $('#improvement_points').val(pdi.improvement_points || '');
                    $('#development_goals').val(pdi.development_goals || '');
                    // Selecionar perfil
                    if (pdi.profile_type) {
                        $('.profile-image-container').removeClass('selected');
                        $(`.profile-image-container[data-type="${pdi.profile_type}"]`).addClass('selected');
                    }
                } else {
                    Swal.fire('Erro', 'PDI não encontrado.', 'error');
                }
                showLoader(false);
            },
            error: function () {
                Swal.fire('Erro', 'Erro ao carregar dados do PDI.', 'error');
                showLoader(false);
            }
        });
    }

    // Seleção de perfil
    $(document).on('click', '.profile-image-container', function () {
        $('.profile-image-container').removeClass('selected');
        $(this).addClass('selected');
    });

    // Cancelar
    $('#btnCancel').on('click', function () {
        window.location.href = 'index.html';
    });

    // Salvar alterações
    $('#btnSave').on('click', function () {
        // Validação básica
        const collaborator_id = $('#collaborator_id').val();
        const supervisor_id = $('#supervisor_id').val();
        const academic_summary = $('#academic_summary').val();
        const who_are_you = $('#who_are_you').val();
        const strengths = $('#strengths').val();
        const improvement_points = $('#improvement_points').val();
        const development_goals = $('#development_goals').val();
        const profile_type = $('.profile-image-container.selected').data('type') || '';
        if (!collaborator_id || !supervisor_id) {
            Swal.fire('Atenção', 'Selecione colaborador e supervisor.', 'warning');
            return;
        }
        showLoader(true);
        $.ajax({
            url: '/api/pdi-hub/updatePDI',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                id: pdiId,
                collaborator_id,
                supervisor_id,
                academic_summary,
                who_are_you,
                strengths,
                improvement_points,
                development_goals,
                profile_type
            }),
            success: function (res) {
                showLoader(false);
                if (res.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Sucesso',
                        text: 'PDI atualizado com sucesso!',
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        window.close();
                    });
                } else {
                    Swal.fire('Erro', res.message || 'Erro ao atualizar PDI.', 'error');
                }
            },
            error: function () {
                showLoader(false);
                Swal.fire('Erro', 'Erro ao atualizar PDI.', 'error');
            }
        });
    });

    // Inicialização
    loadPDI();
}); 