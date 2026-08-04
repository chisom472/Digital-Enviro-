// Digital Enviro — shared site behavior (nav, footer year, active link)
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', function () {
        var isOpen = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
      links.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { links.classList.remove('open'); });
      });
    }

    // Highlight the current page in nav
    var here = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a[data-page]').forEach(function (a) {
      if (a.getAttribute('data-page') === here) a.classList.add('active');
    });

    // Footer year
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  });
})();
