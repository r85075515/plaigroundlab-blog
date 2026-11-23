(function () {
  // 1. Subtle reading progress indicator at top of viewport
  var bar = document.createElement('div');
  bar.className = 'reading-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.prepend(bar);

  function updateProgress() {
    var doc = document.documentElement;
    var scrollTop = window.scrollY || doc.scrollTop || 0;
    var maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
    var pct = Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));
    bar.style.transform = 'scaleX(' + (pct / 100).toFixed(4) + ')';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress();

  // 2. Instant search & topic filtering on blog index pages
  var searchInput = document.getElementById('blog-search');
  var filterBtns = document.querySelectorAll('.blog-filter-btn');
  var emptyMsg = document.getElementById('blog-empty');
  var countEl = document.getElementById('blog-filter-count');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.postcard'));
  if (!searchInput || !cards.length) return;

  var activeCat = 'all';
  var CAT_TERMS = {
    guides: ['常青攻略', 'evergreen guide', 'forma'],
    infra: ['gpu', 'runbook', 'webhook', 'set -e', 'watch', 'cache', '算力', '維運', '快取', '看門狗', '串接', '入口'],
    ai: ['sdxl', 'bake-off', 'agent', 'team', 'axiom', 'virtual creator', '團隊', '模型', '虛擬創作者', '摘要', '功課'],
  };

  function applyFilters() {
    var query = (searchInput.value || '').trim().toLowerCase();
    var visibleTotal = 0;

    cards.forEach(function (card) {
      var text = (card.textContent || '').toLowerCase();
      var section = card.closest('.postlist');
      var sectionLabel = section ? (section.getAttribute('aria-label') || '').toLowerCase() : '';
      var combined = text + ' ' + sectionLabel;

      var matchQuery = !query || combined.indexOf(query) !== -1;
      var matchCat = activeCat === 'all' || (CAT_TERMS[activeCat] || []).some(function (t) {
        return combined.indexOf(t) !== -1;
      });
      var show = matchQuery && matchCat;
      card.hidden = !show;
      if (show) visibleTotal += 1;
    });

    document.querySelectorAll('.postlist').forEach(function (sec) {
      var anyVisible = !!sec.querySelector('.postcard:not([hidden])');
      sec.hidden = !anyVisible;
    });

    if (emptyMsg) {
      emptyMsg.hidden = visibleTotal > 0;
    }
    if (countEl) {
      var isEn = document.documentElement.lang === 'en';
      countEl.textContent = isEn
        ? visibleTotal + ' posts shown'
        : '顯示 ' + visibleTotal + ' 篇文章';
    }
  }

  searchInput.addEventListener('input', applyFilters);
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      activeCat = btn.getAttribute('data-cat') || 'all';
      filterBtns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      applyFilters();
    });
  });

  applyFilters();
})();
