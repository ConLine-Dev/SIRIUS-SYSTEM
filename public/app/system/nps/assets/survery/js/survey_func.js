jQuery(function($) {
    "use strict";
    $('form#wrapped').attr("action", "phpmailer/survey_phpmailer_template_smpt.php");
    $('#wizard_container').wizard({
        stepsWrapper: "#wrapped",
        submit: ".submit",
        beforeSelect: function(event, state) {
            if ($('input#website').val().length != 0) {
                return false;
            }
            if (!state.isMovingForward) {
                return true;
            }
            var $inputs = $(this).wizard('state').step.find(':input');
            return !$inputs.length || $inputs.valid();
        }
    }).validate({
        errorPlacement: function(error, element) {
            if (element.is(':radio') || element.is(':checkbox')) {
                error.insertBefore(element.next());
            } else {
                error.insertAfter(element);
            }
        }
    });
    $('#progressbar').progressbar();
    $('#wizard_container').wizard({
        afterSelect: function(event, state) {
            if (state.stepsComplete === state.stepsPossible) {
                $('.submit').show();
                $('.submit').attr('disabled', false);
            } else{
                $('.submit').hide();
            }
            $('#progressbar').progressbar("value", state.percentComplete);
            $('#location').text("(" + state.stepsComplete + "/" + state.stepsPossible + ")");
        }
    });
    $('#wrapped').validate({
        ignore: [],
        rules: {
            select: {
                required: true
            }
        },
        errorPlacement: function(error, element) {
            if (element.is('select:hidden')) {
                error.insertAfter(element.next('.nice-select'));
            } else {
                error.insertAfter(element);
            }
        }
    });
});

let savedValues = [];

function getVals(elem, question) {
    switch (question) {
    case "question_1":
        var value = $(elem).val();
        savedValues[question] = value.toString().padStart(2, '0');
        $('#question_1').text(value.toString().padStart(2, '0'));
        dados[question] = savedValues[question];
        break;
    case "question_2":
        var value = $(elem).val();
        savedValues[question] = value.toString().padStart(2, '0');
        $('#question_2').text(value.toString().padStart(2, '0'));
        dados[question] = savedValues[question];
        break;
    case "question_3":
        var value = $(elem).val();
        savedValues[question] = value.toString().padStart(2, '0');
        $('#question_3').text(value.toString().padStart(2, '0'));
        dados[question] = savedValues[question];
        break;
    case "question_4":
        var nameAttr = $(elem).attr('name');
        var values = [];
        $("input[name*='" + nameAttr + "']").each(function() {
            if (jQuery(this).is(':checked')) {
                savedValues[question] = $(this).val();
                values.push($(this).val());
            }
        });
        break;
    }
}

document.querySelector('#wrapped').addEventListener('submit', function(e) {
    e.preventDefault();
    document.querySelector('#loader_form').style.display = 'none';
});

dados = [];
const queryString = window.location.search;
const parametro = new URLSearchParams(queryString);
const id = parametro.get('id');
dados['id'] = id;

function changeBackground(satisfaction){
    if(satisfaction.id == 'satsYes'){
        document.body.style.backgroundColor = "rgba(0, 255, 85, 0.8)";
        document.body.style.transition = "0.7s";
        dados['satisfaction'] = 1;
    } else if(satisfaction.id == 'satsNo'){
        document.body.style.backgroundColor = "rgba(29, 29, 29, 0.8)";
        document.body.style.transition = "0.7s";
        dados['satisfaction'] = 0;
    }
}

function ThefetchAPI(url) {
    return new Promise((resolve, reject) => {
        fetch(url, {
            method: 'get',
            headers: { 'Content-Type': 'application/json' },
        })
            .then(response => response.json())
            .then(data => resolve(data))
            .catch(error => reject(error));
    });
}

function confirmar(){
    const retorno = document.getElementById("question_5");
    const feedback = retorno.value;
    dados['feedback'] = feedback;
    if(dados['id']){
        Swal.fire({
            title: 'Agradecemos a sua participação!',
            icon: 'success',
            showConfirmButton: false,
            timer: 2000
        });
   

        let url = `/api/nps/answers`;

        let data = {
            idempresa: dados['id'],
            p1: dados['question_1'],
            p2: dados['question_2'],
            p3: dados['question_3'],
            satisfaction: dados['satisfaction'],
            feedback: dados['feedback']
        };
        
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Erro:', error));

    
        setTimeout(function() {
            window.location.href = "https://conlinebr.com.br";
        }, 2100);
    } else{
        Swal.fire({
            title: 'Link inválido',
            icon: 'error',
            showConfirmButton: false,
            timer: 2000
        });
    }
}