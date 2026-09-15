const partners = [
  { name: 'Léo Vieira Filho', number: '45456' },
  { name: 'Alan Lopes', number: '22377' },
  { name: 'Alessandra Oliveira', number: '45077' },
  { name: 'Alessandro Mutante', number: '45222' },
  { name: 'Alexandre Knoploch', number: '22722' },
  { name: 'Anderson Moraes', number: '22120' },
  { name: 'Andre Ceciliano', number: '13567' },
  { name: 'Betão Pezão', number: '12999' },
  { name: 'Bim Bim Portela', number: '27000' },
  { name: 'Bruno Boaretto', number: '22369' },
  { name: 'Claudio Caiado', number: '55622' },
  { name: 'Carlos Russo', number: '27777' },
  { name: 'Claudia Vasconcellos', number: '55001' },
  { name: 'Comissário Marcio Garcia', number: '45555' },
  { name: 'Cris Kaizer', number: '55180' },
  { name: 'Cristiano Santos', number: '70931' },
  { name: 'Dani Leal', number: '45333' },
  { name: 'Danielzinho', number: '36222' },
  { name: 'Diego Alba', number: '45455' },
  { name: 'Diogo Ventura', number: '45554' },
  { name: 'Dr. Pedro Ricardo', number: '22000' },
  { name: 'Dr. Henrique Paes', number: '45999' },
  { name: 'Dra. Gabriela', number: '22122' },
  { name: 'Edson Albertassi', number: '15088' },
  { name: 'Felipe dos Aposentados', number: '45444' },
  { name: 'Fiscal do Povo', number: '45450' },
  { name: 'Glauber Rocha', number: '45079' },
  { name: 'Guilerme Delaroli', number: '22222' },
  { name: 'Gustavo Tutuca', number: '11212' },
  { name: 'Alexandre Isquierdo Malafaia', number: '22077' },
  { name: 'Jarro Pipas', number: '45003' },
  { name: 'João Drumond', number: '25777' },
  { name: 'Jorge Felippe Neto', number: '22800' },
  { name: 'Julio Rocha', number: '36036' },
  { name: 'Junior da Lucinha', number: '55620' },
  { name: 'Jussie da Cesta Básica', number: '45101' },
  { name: 'Laura da Saúde', number: '45876' },
  { name: 'Lessa', number: '45777' },
  { name: 'Luiz Martins', number: '45200' },
  { name: 'Marcelo Lajes', number: '36444' },
  { name: 'Maria Helena Cabo', number: '45125' },
  { name: 'Neto Bronson', number: '45390' },
  { name: 'O Pracinha', number: '45055' },
  { name: 'Paulo Melo', number: '44288' },
  { name: 'Ricardo da Karol', number: '45123' },
  { name: 'Rodrigo Dinamite', number: '45210' },
  { name: 'Rodrigo Medeiros', number: '22333' },
  { name: 'Sandrinho Abdala', number: '45277' },
  { name: 'Serginho Legado', number: '45244' },
  { name: 'Thiago Moura', number: '45045' },
  { name: 'Tio Carlos', number: '45888' },
  { name: 'Val Ceasa', number: '25888' },
  { name: 'Vandro Família', number: '45500' },
  { name: 'Vantoil', number: '40999' },
].map((partner) => ({ ...partner, slug: slugify(partner.name) }));

const partnerGrid = document.querySelector('#partner-grid');
const partnerSearch = document.querySelector('#partner-search');
const partnerResultsCount = document.querySelector('#partner-results-count');
const partnerEmpty = document.querySelector('#partner-empty');
const partnerPanel = document.querySelector('#partner-ballot-panel');
const selectedPartnerTitle = document.querySelector('#selected-partner-title');
const selectedPartnerName = document.querySelector('#selected-partner-name');
const stateInput = document.querySelector('#estadual-parceiro');
const ballotForm = document.querySelector('#ballot-form');
const viewBallotButton = document.querySelector('#view-ballot');
const formStatusMessage = document.querySelector('#form-status');
let activePartner = null;

function normalizeText(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function slugify(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function partnerUrl(partner) {
  return `https://lucianovieira4545.com.br/parceiros.html#colinha-${partner.slug}`;
}

function partnerShareText(partner) {
  return `Monte sua colinha com Luciano Vieira 4545 e ${partner.name} ${partner.number}. Complete apenas os votos restantes.`;
}

function partnerCard(partner) {
  return `
    <article class="partner-card" data-partner="${partner.slug}">
      <div class="partner-card-top"><p>Parceria disponível</p><h2>Luciano Vieira + ${partner.name}</h2></div>
      <div class="partner-numbers">
        <div class="partner-number-card"><span>Deputado Federal</span><strong>4545</strong><span>Luciano Vieira</span></div>
        <div class="partner-number-card"><span>Deputado Estadual</span><strong>${partner.number}</strong><span>${partner.name}</span></div>
      </div>
      <button class="partner-card-action" type="button" data-action="mount" data-slug="${partner.slug}" aria-controls="partner-ballot-panel"><img src="ICONS/ICONS%20USADOS-02.svg" alt="" /> Montar esta colinha</button>
      <button class="partner-share-action" type="button" data-action="share" data-slug="${partner.slug}"><img src="ICONS/ICONS%20USADOS-02.svg" alt="" /> Compartilhar esta colinha</button>
      <p class="partner-share-feedback" aria-live="polite"></p>
    </article>`;
}

function renderPartners(query = '') {
  const normalizedQuery = normalizeText(query);
  const matches = partners.filter((partner) =>
    !normalizedQuery
    || normalizeText(partner.name).includes(normalizedQuery)
    || partner.number.includes(normalizedQuery)
  );

  partnerGrid.innerHTML = matches.map(partnerCard).join('');
  partnerEmpty.hidden = matches.length !== 0;
  partnerResultsCount.textContent = `${matches.length} ${matches.length === 1 ? 'parceria encontrada' : 'parcerias encontradas'}`;
}

function resetBallotFields() {
  document.querySelectorAll('.candidate-field:not(.fixed):not(.partner-fixed)').forEach((field) => {
    const input = field.querySelector('input');
    const button = field.querySelector('button');
    const name = field.querySelector('.candidate-name');
    field.classList.remove('confirmed');
    input.value = '';
    input.disabled = false;
    button.disabled = false;
    button.textContent = 'Confirmar';
    name.textContent = '';
    name.classList.remove('error');
  });

  viewBallotButton.disabled = true;
  formStatusMessage.textContent = 'Confirme os quatro números restantes para liberar o compartilhamento.';
  document.querySelector('#ballot-modal')?.close();
}

function showPartnerBallot(partner, direct = false) {
  if (!partnerPanel || !partner) return;
  activePartner = partner;
  resetBallotFields();

  selectedPartnerTitle.textContent = `+ ${partner.name}`;
  selectedPartnerName.textContent = partner.name;
  stateInput.value = partner.number;
  ballotForm.setAttribute('aria-label', `Monte sua colinha com Luciano Vieira e ${partner.name}`);

  const url = partnerUrl(partner);
  document.body.dataset.ballotUrl = url;
  document.body.dataset.ballotDisplayUrl = `lucianovieira4545.com.br/parceiros.html#colinha-${partner.slug}`;
  document.body.dataset.ballotShareText = partnerShareText(partner);
  document.title = `Colinha Luciano Vieira + ${partner.name}`;

  partnerPanel.hidden = false;
  document.body.classList.toggle('direct-partner-mode', direct);
  if (window.location.hash !== `#colinha-${partner.slug}`) history.replaceState(null, '', `#colinha-${partner.slug}`);
  window.setTimeout(() => partnerPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

async function copyPartnerLink(partner, feedback) {
  const text = `${partnerShareText(partner)} ${partnerUrl(partner)}`;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
  }
  feedback.textContent = 'Link desta colinha copiado!';
}

async function sharePartnerBallot(partner, feedback) {
  const shareData = { title: `Colinha Luciano Vieira + ${partner.name}`, text: partnerShareText(partner), url: partnerUrl(partner) };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      feedback.textContent = 'Colinha compartilhada!';
      return;
    }
    await copyPartnerLink(partner, feedback);
  } catch (error) {
    if (error?.name !== 'AbortError') await copyPartnerLink(partner, feedback);
  }
}

partnerGrid?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const partner = partners.find((item) => item.slug === button.dataset.slug);
  if (!partner) return;

  if (button.dataset.action === 'mount') showPartnerBallot(partner, false);
  if (button.dataset.action === 'share') {
    document.querySelectorAll('.partner-share-feedback').forEach((item) => { item.textContent = ''; });
    sharePartnerBallot(partner, button.closest('.partner-card').querySelector('.partner-share-feedback'));
  }
});

partnerSearch?.addEventListener('input', () => renderPartners(partnerSearch.value));
renderPartners();

const requestedSlug = window.location.hash.startsWith('#colinha-') ? window.location.hash.slice(9) : '';
const requestedPartner = partners.find((partner) => partner.slug === requestedSlug);
if (requestedPartner) showPartnerBallot(requestedPartner, true);