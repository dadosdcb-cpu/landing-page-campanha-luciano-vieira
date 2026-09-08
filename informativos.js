const feedback = document.querySelector('#share-feedback');
async function shareCurrentPage() {
  const data = {
    title: document.body.dataset.shareTitle || document.title,
    text: 'Veja o informativo de Luciano Vieira.',
    url: window.location.href.split('#')[0].split('?')[0]
  };
  try {
    if (navigator.share) {
      await navigator.share(data);
      if (feedback) feedback.textContent = 'Link compartilhado.';
      return;
    }
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(data.url);
    } else {
      const area = document.createElement('textarea');
      area.value = data.url;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    if (feedback) feedback.textContent = 'Link copiado. Agora é só enviar.';
  } catch (error) {
    if (error.name !== 'AbortError' && feedback) feedback.textContent = 'Não foi possível compartilhar. Tente novamente.';
  }
}
document.querySelectorAll('#share-informativo, #share-informativo-bottom').forEach((button) => button.addEventListener('click', shareCurrentPage));