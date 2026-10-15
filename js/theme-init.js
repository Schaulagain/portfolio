// Runs before first paint: marks JS as available and restores the saved theme (no flash).
(function () {
    var root = document.documentElement;
    root.classList.add('js');
    try {
        var theme = localStorage.getItem('theme');
        if (theme) root.dataset.theme = theme;
    } catch (e) { /* storage blocked: keep default theme */ }
})();
