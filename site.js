(function () {
    'use strict';

    var page = (document.body && document.body.dataset.page) || '';

    function injectHeader() {
        var el = document.getElementById('site-header');
        if (!el) return;

        var links = [
            { href: '/', label: 'Home', key: 'home' },
            { href: '/products.html', label: 'Products', key: 'products' },
            { href: '/about.html', label: 'About', key: 'about' },
            { href: '/contact.html', label: 'Contact', key: 'contact' }
        ];

        var linksHtml = links.map(function (link) {
            var active = link.key === page ? ' class="active"' : '';
            return '<a href="' + link.href + '"' + active + '>' + link.label + '</a>';
        }).join('\n                ');

        el.innerHTML =
            '<nav>\n' +
            '            <a href="/" class="logo">\n' +
            '                <img src="Inarius_logo.png" alt="Inarius Dynamics Logo" />\n' +
            '                INARIUS <span>DYNAMICS</span>\n' +
            '            </a>\n' +
            '            <div class="nav-links">\n' +
            '                ' + linksHtml + '\n' +
            '                <div class="nav-tag">⚡ Edge AI</div>\n' +
            '            </div>\n' +
            '        </nav>';
    }

    function injectFooter() {
        var el = document.getElementById('site-footer');
        if (!el) return;

        el.innerHTML =
            '<footer>\n' +
            '            <div class="footer-left">\n' +
            '                <div>© 2026 Inarius Dynamics. Built for the people who run toward the sirens.</div>\n' +
            '                <div class="tm-note">Furian® is a registered trademark of Inarius Dynamics. FurianES™, FurianEMS™, and FurianPD™ are trademarks of Inarius Dynamics.</div>\n' +
            '            </div>\n' +
            '            <div>\n' +
            '                <a href="/privacy.html">Privacy</a> ·\n' +
            '                <a href="/contact.html">Contact</a> ·\n' +
            '                <a href="/careers.html">Careers</a>\n' +
            '            </div>\n' +
            '        </footer>';
    }

    function setupReveals() {
        var revealElements = document.querySelectorAll('.reveal');
        if (!revealElements.length || !('IntersectionObserver' in window)) {
            revealElements.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

        revealElements.forEach(function (el) { observer.observe(el); });
    }

    injectHeader();
    injectFooter();
    setupReveals();
})();
