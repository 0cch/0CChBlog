/* 0CCh Blog - Theme Scripts */
(function() {
  'use strict';

  // Mobile nav toggle
  var navToggle = document.getElementById('nav-toggle');
  var navMenu = document.getElementById('nav-menu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
    });
  }

  // Theme toggle
  var themeBtn = document.getElementById('theme-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function() {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      if (next === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      try { localStorage.setItem('theme', next); } catch(e) {}
    });
  }

  // TOC scroll highlight
  var tocLinks = document.querySelectorAll('.toc a');
  var headings = [];
  if (tocLinks.length) {
    tocLinks.forEach(function(link) {
      var id = link.getAttribute('href');
      if (id && id.indexOf('#') === 0) {
        var el = document.querySelector(id);
        if (el) headings.push({el: el, link: link});
      }
    });
  }
  if (headings.length) {
    var updateToc = function() {
      var scrollY = window.scrollY + 100;
      var current = -1;
      for (var i = 0; i < headings.length; i++) {
        if (headings[i].el.offsetTop <= scrollY) current = i;
      }
      headings.forEach(function(h, idx) {
        h.link.classList.toggle('active', idx === current);
      });
    };
    window.addEventListener('scroll', updateToc, {passive: true});
    updateToc();
  }

  // Search overlay
  var searchBtn = document.getElementById('search-btn');
  var searchOverlay = document.getElementById('search-overlay');
  var searchClose = document.getElementById('search-close');
  var searchInput = document.getElementById('search-input');
  
  function openSearch() {
    if (searchOverlay) {
      searchOverlay.classList.add('active');
      setTimeout(function() { searchInput && searchInput.focus(); }, 100);
    }
  }
  function closeSearch() {
    if (searchOverlay) searchOverlay.classList.remove('active');
  }
  if (searchBtn) searchBtn.addEventListener('click', openSearch);
  if (searchClose) searchClose.addEventListener('click', closeSearch);
  if (searchOverlay) {
    searchOverlay.addEventListener('click', function(e) {
      if (e.target === searchOverlay) closeSearch();
    });
  }
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeSearch();
    if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      openSearch();
    }
  });
})();