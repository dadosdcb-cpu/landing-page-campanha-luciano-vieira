// Google Analytics 4 — medição agregada da campanha.
// Não envia nomes de visitantes, números digitados na colinha ou outros dados pessoais.
(function () {
  'use strict';

  var MEASUREMENT_ID = 'G-MRKY4XZJ58';

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    anonymize_ip: true,
    send_page_view: true
  });

  var loader = document.createElement('script');
  loader.async = true;
  loader.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
  document.head.appendChild(loader);

  function clean(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 100);
  }

  function track(name, params) {
    window.gtag('event', name, Object.assign({
      page_path: window.location.pathname
    }, params || {}));
  }

  window.trackCampaignEvent = track;

  function labelFor(element) {
    return clean(
      element.getAttribute('data-analytics-label') ||
      element.getAttribute('aria-label') ||
      element.textContent
    );
  }

  document.addEventListener('click', function (event) {
    var element = event.target.closest('a, button');
    if (!element) return;

    var href = element.getAttribute('href') || '';
    var action = element.getAttribute('data-action') || '';
    var slug = element.getAttribute('data-slug') || '';
    var label = labelFor(element);
    var lowerHref = href.toLowerCase();

    if (action === 'mount') {
      track('partner_ballot_start', { partner: clean(slug || label) });
      return;
    }

    if (action === 'share') {
      track('share', {
        method: 'site',
        content_type: 'partner_ballot',
        item_id: clean(slug || label)
      });
      return;
    }

    if (element.id === 'view-ballot') {
      track('ballot_complete', {
        ballot_type: window.location.pathname.toLowerCase().indexOf('parceiros') >= 0 ? 'partner' : 'main',
        partner: clean((window.location.hash || '').replace('#colinha-', '')) || undefined
      });
      return;
    }

    if (element.id === 'share-ballot') {
      track('share', {
        method: 'site',
        content_type: 'ballot',
        item_id: clean((window.location.hash || '').replace('#colinha-', '')) || 'main'
      });
      return;
    }

    if (element.id === 'save-ballot' || element.id === 'save-ballot-image') {
      track('file_download', { file_name: 'imagem_colinha' });
      return;
    }

    if (element.id === 'copy-ballot-link') {
      track('share', { method: 'copy_link', content_type: 'ballot' });
      return;
    }

    if (element.id === 'open-informativos') {
      track('informativo_download_menu_open');
      return;
    }

    if (element.id === 'share-stories-page') {
      track('share', {
        method: 'site',
        content_type: 'stories_page',
        item_id: 'historias_que_ficam'
      });
      return;
    }

    if (element.id === 'share-informativo' || element.id === 'share-informativo-bottom') {
      track('share', {
        method: 'site',
        content_type: 'informativo',
        item_id: clean(window.location.pathname)
      });
      return;
    }

    if (/\.pdf(?:$|[?#])/i.test(lowerHref) || element.hasAttribute('download')) {
      track('file_download', {
        file_name: clean(href.split('/').pop() || label),
        link_text: label
      });
      return;
    }

    if (/informativos\.html(?:$|[?#])/i.test(lowerHref) && !/\/informativos-online\//i.test(window.location.pathname)) {
      track('informativos_catalog_open', { link_text: label });
      return;
    }

    if (/parceiros\.html(?:$|[?#])/i.test(lowerHref) && !/parceiros\.html$/i.test(window.location.pathname)) {
      track('partner_page_open', { link_text: label });
      return;
    }

    if (/instagram|facebook|tiktok|youtube|twitter|x\.com|linktr\.ee/i.test(lowerHref)) {
      var network = (lowerHref.match(/instagram|facebook|tiktok|youtube|twitter|x\.com|linktr\.ee/i) || ['social'])[0];
      track('social_click', { network: clean(network) });
      return;
    }

    if (/time[\s_-]*luciano/i.test(label + ' ' + lowerHref)) {
      track('team_click', { link_text: label });
      return;
    }

    if (element.id === 'share-story-link') {
      var storyDownload = document.querySelector('#download-story-video');
      track('share', {
        method: 'site',
        content_type: 'video',
        item_id: clean(storyDownload && (storyDownload.getAttribute('download') || storyDownload.getAttribute('href')))
      });
      return;
    }

    if (element.classList.contains('story-share-button')) {
      track('video_share_menu_open', {
        video_id: clean(element.getAttribute('data-story') || element.getAttribute('data-video') || label)
      });
    }
  }, true);

  function monitorVideo(video, index) {
    var sent = false;
    video.addEventListener('timeupdate', function () {
      if (!sent && video.currentTime >= 30) {
        sent = true;
        track('video_30_seconds', {
          video_id: clean(video.id || video.getAttribute('data-title') || video.getAttribute('aria-label') || ('video_' + (index + 1))),
          video_type: video.id === 'campaign-video' ? 'principal' : 'historia'
        });
      }
    });
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('video'), monitorVideo);

    if (/\/informativos-online\//i.test(window.location.pathname)) {
      track('informativo_online_view', {
        item_id: clean(window.location.pathname.split('/').filter(Boolean).pop())
      });
    }

    if (/parceiros\.html$/i.test(window.location.pathname) && /^#colinha-/.test(window.location.hash)) {
      track('partner_ballot_open', {
        partner: clean(window.location.hash.replace('#colinha-', ''))
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
