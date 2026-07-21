// static/products/admin_subcategory_filter.js
// Filters the Subcategory <select> options to only those belonging to the
// currently selected Category, without a full page reload.
// Falls back gracefully if the expected DOM isn't found.
(function () {
  function init() {
    var categoryField    = document.getElementById('id_category');
    var subcategoryField = document.getElementById('id_subcategory');
    if (!categoryField || !subcategoryField) return;

    // Cache the full subcategory option list once, on first load,
    // tagged with their parent category id via data attributes
    // rendered by Django (option value -> we fetch via API instead,
    // since plain <select> doesn't carry category id by default).
    var endpoint = '/api/products/subcategories/';

    function reload(categoryId, selectedId) {
      if (!categoryId) {
        subcategoryField.innerHTML = '<option value="">---------</option>';
        return;
      }
      fetch(endpoint + '?all=true&category_id=' + categoryId)
        .then(function (res) { return res.json(); })
        .then(function (data) {
          var options = '<option value="">---------</option>';
          (data.results || data).forEach(function (sub) {
            var selected = String(sub.id) === String(selectedId) ? 'selected' : '';
            options += '<option value="' + sub.id + '" ' + selected + '>' + sub.name + '</option>';
          });
          subcategoryField.innerHTML = options;
        })
        .catch(function () { /* silent — admin still usable manually */ });
    }

    categoryField.addEventListener('change', function () {
      reload(categoryField.value, null);
    });
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();