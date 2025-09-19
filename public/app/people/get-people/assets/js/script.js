async function getInfosLogin() {
  const StorageGoogleData = localStorage.getItem('StorageGoogle');
  const StorageGoogle = JSON.parse(StorageGoogleData);

  return StorageGoogle;
};

function getLinkParams() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  return id;
}

function completeDetails() {
  document.querySelector('#personDetails').classList.remove('d-none');
}

function formatCpfCnpj(cpfCnpj) {
  return cpfCnpj.replace(/\D/g, "");
}

let citySelect, cityChoices;
let statesSelect, statesChoices;
let countrySelect, countryChoices;

async function createSelects() {

  citySelect = document.getElementById('city');
  cityChoices = new Choices(citySelect, {
    searchEnabled: true,
    itemSelectText: '',
    placeholderValue: 'Cidade',
  });

  citySelect.addEventListener('search', function (event) {
    const searchTerm = event.detail.value;

    if (searchTerm.length > 2) {
      fetchCities(searchTerm);
    }
  });

  statesSelect = document.getElementById('state');
  statesChoices = new Choices(statesSelect, {
    searchEnabled: true,
    itemSelectText: '',
    placeholderValue: 'Estado',
  });

  statesSelect.addEventListener('search', function (event) {
    const searchTerm = event.detail.value;

    if (searchTerm.length > 2) {
      fetchStates(searchTerm);
    }
  });

  countrySelect = document.getElementById('country');
  countryChoices = new Choices(countrySelect, {
    searchEnabled: true,
    itemSelectText: '',
    placeholderValue: 'País',
  });

  countrySelect.addEventListener('search', function (event) {
    const searchTerm = event.detail.value;

    if (searchTerm.length > 2) {
      fetchCountries(searchTerm);
    }
  });
}

async function fetchCities(search) {
  let cities = await makeRequest(`/api/people/getCities`, 'POST', { search })

  for (let index = 0; index < cities.length; index++) {
    cityChoices.setChoices([{ value: cities[index].id, label: cities[index].name }], 'value', 'label', false);
  }
}

async function fetchStates(search) {
  let states = await makeRequest(`/api/people/getStates`, 'POST', { search })

  for (let index = 0; index < states.length; index++) {
    statesChoices.setChoices([{ value: states[index].id, label: states[index].name }], 'value', 'label', false);
  }
}

async function fetchCountries(search) {
  let countries = await makeRequest(`/api/people/getCountries`, 'POST', { search })

  for (let index = 0; index < countries.length; index++) {
    countryChoices.setChoices([{ value: countries[index].id, label: countries[index].name }], 'value', 'label', false);
  }
}

async function printOcurrenceDetails() {
  const id = getLinkParams();
  const getDetails = await makeRequest(`/api/people/getById`, 'POST', { id });

  let collabName = `${getDetails[0].name} ${getDetails[0].family_name}`;

  document.getElementById('realName').value = getDetails[0].real_name;
  document.getElementById('fantasyName').value = getDetails[0].fantasy_name;
  document.getElementById('createdBy').value = collabName;
  document.getElementById('address').value = getDetails[0].address;
  document.getElementById('complement').value = getDetails[0].complement;
  document.getElementById('city').value = getDetails[0].city;
  document.getElementById('state').value = getDetails[0].state;
  document.getElementById('country').value = getDetails[0].country;
  document.getElementById('email').value = getDetails[0].email;

  const $input = $("#cpfCnpj");
  $input.val(getDetails[0].cnpj_cpf);
  if (getDetails[0].type_people == '1') {
    $input.mask("000.000.000-00");
  }
  else if (getDetails[0].type_people == '0') {
    $input.mask("00.000.000/0000-00");
  }

  const $cepMask = $("#cep");
  $cepMask.val(getDetails[0].cep)
  $cepMask.mask("00000-000")

  const $phoneMask = $("#phone");
  $phoneMask.val(getDetails[0].phone)
  $phoneMask.mask("(00) 00000-0000");

}

async function update() {
  const id = getLinkParams();
  let realName = document.getElementById('realName').value;
  let fantasyName = document.getElementById('fantasyName').value;
  let cpfCnpj = document.getElementById('cpfCnpj').value;
  cpfCnpj = formatCpfCnpj(cpfCnpj);
  let createdBy = document.getElementById('createdBy').value;

  let cep = document.getElementById('cep').value;
  let address = document.getElementById('address').value;
  let complement = document.getElementById('complement').value;
  let city = document.getElementById('city').value;
  let state = document.getElementById('state').value;
  let country = document.getElementById('country').value;
  let email = document.getElementById('email').value;
  let phone = document.getElementById('phone').value;

  const details = { id, realName, fantasyName, cpfCnpj, createdBy, cep, address, complement, city, state, country, email, phone }
  const update = await makeRequest(`/api/people/update`, 'POST', details);
}

document.addEventListener('DOMContentLoaded', async function () {

  // const socket = io();

  // socket.on('updateCalendarEvents', (data) => {
  //   calendar.refetchEvents();
  // })

  await printOcurrenceDetails()
  await createSelects();

  document.querySelector('#loader2').classList.add('d-none')
});