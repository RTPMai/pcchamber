/* ==========================================================================
   SHOW / HIDE ON PASSWORD FIELDS

   Every password box on the site, public pages and admin alike, gets a
   Show button on its right edge. Clicking it flips the box to plain text
   so you can check what you typed, and back again.

   It finds boxes on its own, including ones the admin app builds after the
   page loads, so new password fields need nothing extra. Styles live here
   too, so this one file works on pages that use styles.css and on the admin
   page that uses admin.css.
   ========================================================================== */

(function () {
  if (window.__pwtoggle) return;
  window.__pwtoggle = true;

  var css =
    '.pwwrap{position:relative;display:block}' +
    '.pwwrap input{width:100%;padding-right:4.75rem !important;box-sizing:border-box}' +
    '.pwshow{position:absolute;top:50%;right:6px;transform:translateY(-50%);' +
    'font:inherit;font-size:.85rem;font-weight:600;line-height:1;' +
    'padding:7px 10px;border:0;border-radius:7px;background:transparent;' +
    'color:#062734;cursor:pointer}' +
    '.pwshow:hover{background:rgba(6,39,52,.08)}' +
    '.pwshow:focus-visible{outline:2px solid #f19d30;outline-offset:1px}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function enhance(input) {
    if (input.dataset.pwtoggle) return;
    input.dataset.pwtoggle = '1';

    var wrap = document.createElement('span');
    wrap.className = 'pwwrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pwshow';
    btn.textContent = 'Show';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Show password');
    if (input.id) btn.setAttribute('aria-controls', input.id);
    wrap.appendChild(btn);

    btn.addEventListener('click', function () {
      var showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.textContent = showing ? 'Show' : 'Hide';
      btn.setAttribute('aria-pressed', showing ? 'false' : 'true');
      btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      input.focus();
    });

    /* Hide it again on submit, so a browser asked to remember the
       password still sees a password field. */
    if (input.form) {
      input.form.addEventListener('submit', function () {
        if (input.type === 'text') btn.click();
      });
    }
  }

  function scan(root) {
    var list = (root.querySelectorAll ? root : document).querySelectorAll('input[type="password"]');
    for (var i = 0; i < list.length; i++) enhance(list[i]);
    if (root.matches && root.matches('input[type="password"]')) enhance(root);
  }

  function start() {
    scan(document);
    new MutationObserver(function (changes) {
      for (var i = 0; i < changes.length; i++) {
        var added = changes[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          if (added[j].nodeType === 1) scan(added[j]);
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
