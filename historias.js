const pageUrl = 'https://lucianovieira4545.com.br/historias.html';
const pageFeedback = document.querySelector('#stories-page-feedback');
const storyModal = document.querySelector('#story-share-modal');
const storyDownload = document.querySelector('#download-story-video');
const storyFeedback = document.querySelector('#story-share-feedback');
let selectedStoryLink = '';
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return; }
  const area = document.createElement('textarea');
  area.value = text; area.style.position = 'fixed'; area.style.opacity = '0';
  document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove();
}
async function shareLink(data, feedback) {
  try {
    if (navigator.share) { await navigator.share(data); feedback.textContent = 'Link compartilhado.'; }
    else { await copyText(data.url); feedback.textContent = 'Link copiado. Agora é só enviar.'; }
  } catch (error) {
    if (error.name !== 'AbortError') feedback.textContent = 'Não foi possível compartilhar. Tente novamente.';
  }
}
document.querySelector('#share-stories-page')?.addEventListener('click', () => {
  shareLink({ title: 'Histórias que Ficam — Luciano Vieira', text: 'Assista às Histórias que Ficam de Luciano Vieira.', url: pageUrl }, pageFeedback);
});
document.querySelectorAll('.story-share-button').forEach((button) => {
  button.addEventListener('click', () => {
    const story = button.dataset.story;
    selectedStoryLink = pageUrl + '#historia-' + story;
    storyDownload.href = button.dataset.video;
    storyDownload.download = 'historia-' + String(story).padStart(2, '0') + '-luciano-vieira.mp4';
    document.querySelector('#story-share-title').textContent = button.dataset.title;
    storyFeedback.textContent = ''; storyModal.showModal();
  });
});
storyModal?.querySelector('.modal-close')?.addEventListener('click', () => storyModal.close());
storyModal?.addEventListener('click', (event) => { if (event.target === storyModal) storyModal.close(); });
document.querySelector('#share-story-link')?.addEventListener('click', () => {
  shareLink({ title: 'Histórias que Ficam — Luciano Vieira', text: 'Assista a esta história de Luciano Vieira.', url: selectedStoryLink }, storyFeedback);
});