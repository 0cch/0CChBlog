/* 0CCh Blog - Local Search */
(function() {
  'use strict';
  var searchInput = document.getElementById('search-input');
  var searchResults = document.getElementById('search-results');
  if (!searchInput || !searchResults) return;

  var searchData = null;
  var loaded = false;

  function loadData() {
    if (loaded) return Promise.resolve();
    return fetch(SEARCH_URL)
      .then(function(r) { return r.text(); })
      .then(function(text) {
        var parser = new DOMParser();
        var xml = parser.parseFromString(text, 'text/xml');
        var entries = xml.querySelectorAll('entry');
        searchData = [];
        entries.forEach(function(entry) {
          searchData.push({
            title: entry.querySelector('title') ? entry.querySelector('title').textContent : '',
            url: entry.querySelector('url') ? entry.querySelector('url').textContent : '',
            content: entry.querySelector('content') ? entry.querySelector('content').textContent : ''
          });
        });
        loaded = true;
      })
      .catch(function(e) { console.error('Search load error:', e); });
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function search(query) {
    if (!query) { searchResults.innerHTML = ''; return; }
    var q = query.toLowerCase();
    var results = searchData.filter(function(item) {
      return item.title.toLowerCase().indexOf(q) !== -1 || item.content.toLowerCase().indexOf(q) !== -1;
    }).slice(0, 10);

    if (results.length === 0) {
      searchResults.innerHTML = '<div class="search-result-item"><p>No results found</p></div>';
      return;
    }

    var html = results.map(function(item) {
      var snippet = '';
      var idx = item.content.toLowerCase().indexOf(q);
      if (idx !== -1) {
        var start = Math.max(0, idx - 40);
        var end = Math.min(item.content.length, idx + 120);
        snippet = (start > 0 ? '...' : '') + item.content.substring(start, end) + (end < item.content.length ? '...' : '');
      }
      return '<div class="search-result-item">' +
        '<a href="' + item.url + '">' + escapeHtml(item.title) + '</a>' +
        (snippet ? '<p>' + escapeHtml(snippet) + '</p>' : '') +
        '</div>';
    }).join('');
    searchResults.innerHTML = html;
  }

  var debounceTimer;
  searchInput.addEventListener('input', function() {
    var query = this.value.trim();
    if (!query) { searchResults.innerHTML = ''; return; }
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function() {
      if (!loaded) {
        loadData().then(function() { search(query); });
      } else {
        search(query);
      }
    }, 200);
  });
})();