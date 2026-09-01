document.documentElement.classList.add('js-ready');

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

const revealElements = document.querySelectorAll('.reveal-heading, .reveal-card');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -10% 0px' });
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

const campaignVideo = document.querySelector('#campaign-video');
if (campaignVideo && 'IntersectionObserver' in window) {
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        campaignVideo.play().catch(() => {});
      } else if (!campaignVideo.ended) {
        campaignVideo.pause();
      }
    });
  }, { threshold: 0.35 });
  videoObserver.observe(campaignVideo);
}
const candidateCache = new Map();
const fields = [...document.querySelectorAll('.candidate-field:not(.fixed)')];
const viewButton = document.querySelector('#view-ballot');
const formStatus = document.querySelector('#form-status');
const modal = document.querySelector('#ballot-modal');
const canvas = document.querySelector('#ballot-canvas');
const modalFeedback = document.querySelector('#modal-feedback');
const confirmationSound = document.querySelector('#confirmation-sound');
const informativosModal = document.querySelector('#informativos-modal');
const canonicalBallotUrl = 'https://lucianovieira4545.com.br/#minha-colinha';

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
    ? 'Colinha pronta! Clique para conferir, baixar ou compartilhar.'
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

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function drawFittedText(context, text, x, y, maxWidth, startSize, minimumSize, color, align = 'center', weight = 900) {
  let size = startSize;
  context.textAlign = align;
  context.textBaseline = 'middle';
  context.fillStyle = color;
  do {
    context.font = `${weight} ${size}px Montserrat, Arial, sans-serif`;
    if (context.measureText(text).width <= maxWidth) break;
    size -= 2;
  } while (size > minimumSize);
  context.fillText(text, x, y);
}

async function renderBallotImage() {
  if (!canvas) return;
  await document.fonts?.ready;
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const rows = ballotRows();
  const blue = '#284a9b';
  const orange = '#f5841f';
  const cyan = '#08abe0';
  const yellow = '#ffd100';
  const light = '#eef1f7';

  context.clearRect(0, 0, width, height);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);

  drawFittedText(context, 'MINHA COLINHA', width / 2, 72, 880, 72, 50, orange);
  drawFittedText(context, 'ELEIÇÕES 2026', width / 2, 132, 520, 34, 26, blue, 'center', 800);
  context.fillStyle = blue;
  context.fillRect(190, 166, 700, 10);

  const startY = 200;
  const rowHeight = 205;
  rows.forEach((row, index) => {
    const y = startY + index * rowHeight;
    const dark = index % 2 === 0;
    context.fillStyle = dark ? blue : light;
    context.fillRect(0, y, width, rowHeight);

    const labelColor = dark ? '#ffffff' : blue;
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = labelColor;
    context.font = '900 30px Montserrat, Arial, sans-serif';
    context.fillText(row.office.toUpperCase(), 72, y + 28);

    context.fillStyle = orange;
    roundedRect(context, 70, y + 74, 330, 92, 4);
    context.fill();
    drawFittedText(context, row.number, 235, y + 121, 285, 65, 42, '#ffffff');

    drawFittedText(context, row.name.toUpperCase(), 720, y + 105, 560, 42, 24, labelColor);
    drawFittedText(context, 'NOME DO CANDIDATO', 720, y + 153, 460, 19, 16, labelColor, 'center', 600);
  });

  const footerY = startY + rows.length * rowHeight;
  context.fillStyle = orange;
  context.fillRect(0, footerY, width, height - footerY);
  drawFittedText(context, 'FAÇA TAMBÉM A SUA COLINHA', width / 2, footerY + 60, 920, 44, 30, '#ffffff');
  drawFittedText(context, 'lucianovieira4545.com.br/#minha-colinha', width / 2, footerY + 112, 860, 25, 19, '#ffffff', 'center', 700);
  drawFittedText(context, 'Compartilhe com sua família e seus amigos.', width / 2, footerY + 151, 760, 22, 17, '#ffffff', 'center', 600);

  context.fillStyle = yellow;
  context.fillRect(270, height - 10, 180, 10);
  context.fillStyle = cyan;
  context.fillRect(450, height - 10, 180, 10);
  context.fillStyle = blue;
  context.fillRect(630, height - 10, 180, 10);
}

function canvasBlob() {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Imagem indisponível')), 'image/png');
  });
}

async function saveBallotImage() {
  await renderBallotImage();
  const blob = await canvasBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'minha-colinha-luciano-vieira-4545.png';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  modalFeedback.textContent = 'Imagem salva no seu aparelho.';
}

viewButton?.addEventListener('click', async () => {
  modalFeedback.textContent = '';
  if (confirmationSound) {
    confirmationSound.currentTime = 0;
    confirmationSound.volume = 0.85;
    confirmationSound.play().catch(() => {});
  }
  await renderBallotImage();
  modal.showModal();
});

modal?.querySelector('.modal-close')?.addEventListener('click', () => modal.close());
modal?.addEventListener('click', (event) => {
  if (event.target === modal) modal.close();
});

document.querySelector('#open-informativos')?.addEventListener('click', () => informativosModal?.showModal());
informativosModal?.querySelector('.modal-close')?.addEventListener('click', () => informativosModal.close());
informativosModal?.addEventListener('click', (event) => {
  if (event.target === informativosModal) informativosModal.close();
});
document.querySelector('#save-ballot')?.addEventListener('click', async () => {
  try {
    await saveBallotImage();
  } catch {
    modalFeedback.textContent = 'Não foi possível salvar. Tente novamente.';
  }
});

document.querySelector('#share-ballot')?.addEventListener('click', async () => {
  const shareText = 'Monte também a sua colinha eleitoral com Luciano Vieira — Deputado Federal 4545.';
  try {
    await renderBallotImage();
    const blob = await canvasBlob();
    const file = new File([blob], 'minha-colinha-luciano-vieira-4545.png', { type: 'image/png' });
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      await navigator.share({ title: 'Minha colinha eleitoral', text: shareText, url: canonicalBallotUrl, files: [file] });
      modalFeedback.textContent = 'Colinha compartilhada.';
      return;
    }
    await saveBallotImage();
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${canonicalBallotUrl}`)}`, '_blank', 'noopener,noreferrer');
    modalFeedback.textContent = 'A imagem foi salva. Anexe-a à conversa junto com o link.';
  } catch (error) {
    if (error?.name !== 'AbortError') modalFeedback.textContent = 'Compartilhamento cancelado ou indisponível.';
  }
});

document.querySelector('#copy-ballot-link')?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(canonicalBallotUrl);
    modalFeedback.textContent = 'Link copiado!';
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = canonicalBallotUrl;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
    modalFeedback.textContent = 'Link copiado!';
  }
});

document.querySelector('#access-site')?.addEventListener('click', () => modal.close());
document.querySelector('#edit-ballot')?.addEventListener('click', () => modal.close());

fields.forEach((field) => loadCandidates(field.dataset.file).catch(() => {}));