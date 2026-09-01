const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');

menuButton?.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
});

navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  navigation.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
}));

const candidateCache = new Map();
const fields = [...document.querySelectorAll('.candidate-field:not(.fixed)')];
const viewButton = document.querySelector('#view-ballot');
const formStatus = document.querySelector('#form-status');
const modal = document.querySelector('#ballot-modal');
const summary = document.querySelector('#ballot-summary');

async function loadCandidates(path) {
  if (candidateCache.has(path)) return candidateCache.get(path);
  const response = await fetch(encodeURI(path));
  if (!response.ok) throw new Error('Não foi possível carregar a lista.');
  const text = await response.text();
  const map = new Map();
  text.split(/\r?\n/).forEach((line) => {
    const match = line.trim().match(/^(.*?)\s+[—-]\s+(\d+)$/);
    if (match) map.set(match[2], match[1].trim());
  });
  candidateCache.set(path, map);
  return map;
}

function updateCompletion() {
  const complete = fields.every((field) => field.classList.contains('confirmed'));
  viewButton.disabled = !complete;
  formStatus.textContent = complete
    ? 'Colinha pronta! Clique para conferir e compartilhar.'
    : 'Confirme todos os números para liberar o compartilhamento.';
}

fields.forEach((field) => {
  const input = field.querySelector('input');
  const button = field.querySelector('button');
  const name = field.querySelector('.candidate-name');
  const expectedLength = Number(field.dataset.length);

  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(0, expectedLength);
    name.textContent = '';
    name.classList.remove('error');
  });

  button.addEventListener('click', async () => {
    if (field.classList.contains('confirmed')) {
      field.classList.remove('confirmed');
      input.disabled = false;
      input.focus();
      button.textContent = 'Confirmar';
      name.textContent = '';
      updateCompletion();
      return;
    }

    if (input.value.length !== expectedLength) {
      name.textContent = `Digite ${expectedLength} números`;
      name.classList.add('error');
      input.focus();
      return;
    }

    button.disabled = true;
    button.textContent = 'Buscando';
    try {
      const candidates = await loadCandidates(field.dataset.file);
      const candidate = candidates.get(input.value);
      if (!candidate) {
        name.textContent = 'Candidato não encontrado';
        name.classList.add('error');
      } else {
        name.textContent = candidate;
        name.classList.remove('error');
        field.classList.add('confirmed');
        input.disabled = true;
        button.textContent = 'Alterar';
      }
    } catch {
      name.textContent = 'Lista indisponível. Tente novamente.';
      name.classList.add('error');
    } finally {
      button.disabled = false;
      if (!field.classList.contains('confirmed')) button.textContent = 'Confirmar';
      updateCompletion();
    }
  });
});

function ballotRows() {
  return [
    { office: 'Deputado Federal', number: '4545', name: 'Luciano Vieira' },
    ...fields.map((field) => ({
      office: field.dataset.office,
      number: field.querySelector('input').value,
      name: field.querySelector('.candidate-name').textContent,
    })),
  ];
}

viewButton?.addEventListener('click', () => {
  summary.innerHTML = ballotRows().map((row) => `<div class="summary-row"><span><b>${row.office}</b><br>${row.name}</span><strong>${row.number}</strong></div>`).join('');
  modal.showModal();
});

modal?.querySelector('.modal-close').addEventListener('click', () => modal.close());
modal?.addEventListener('click', (event) => { if (event.target === modal) modal.close(); });

document.querySelector('#share-whatsapp')?.addEventListener('click', () => {
  const text = ['MINHA COLINHA ELEITORAL', '', ...ballotRows().map((row) => `${row.office}: ${row.number} — ${row.name}`), '', 'Luciano Vieira — Deputado Federal 4545', window.location.href].join('\n');
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
});

fields.forEach((field) => loadCandidates(field.dataset.file).catch(() => {}));
