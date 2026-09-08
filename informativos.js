const feedback = document.querySelector('#share-feedback');
document.querySelector('#share-informativo')?.addEventListener('click', async () => {
  const data = {
    title: document.body.dataset.shareTitle || document.title,
    text: 'Veja o informativo de Luciano Vieira.',
    url: window.location.href.split('#')[0].split('?')[0]
  };
  try {
    if (navigator.share) {
      await navigator.share(data);
      feedback.textContent = 'Link compartilhado.';
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
    feedback.textContent = 'Link copiado. Agora é só enviar.';
  } catch (error) {
    if (error.name !== 'AbortError') feedback.textContent = 'Não foi possível compartilhar. Tente novamente.';
  }
});