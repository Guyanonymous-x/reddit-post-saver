// Reddit Post Saver: adds an orange "Save posts" button to Reddit.
// Click it in a subreddit: it saves every post you can see (title + text),
// pages down, saves again, and repeats for 25 page downs, then downloads a CSV.
(() => {
  if (window.__redditPostSaver) return;
  window.__redditPostSaver = true;

  // ---- Settings you can change ----
  const PAGE_DOWNS = 25;   // how many times to page down
  const WAIT_MS = 2000;    // wait after each page down so new posts can load (2000 = 2 seconds)

  let running = false;
  let stopAsked = false;

  const btn = document.createElement('button');
  btn.textContent = 'Save posts';
  Object.assign(btn.style, {
    position: 'fixed', right: '16px', bottom: '16px', zIndex: '2147483647',
    padding: '10px 16px', background: '#ff4500', color: '#fff', border: 'none',
    borderRadius: '20px', font: 'bold 14px sans-serif', cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,.35)'
  });
  document.body.appendChild(btn);

  btn.addEventListener('click', () => {
    if (running) { stopAsked = true; btn.textContent = 'Stopping...'; return; }
    run();
  });

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function subredditName() {
    const m = location.pathname.match(/^\/r\/([^\/]+)/i);
    return m ? m[1] : null;
  }

  function onScreen(el) {
    const r = el.getBoundingClientRect();
    return r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
  }

  function clean(s) {
    return (s || '').replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  }

  // Collects the posts on screen now. A post seen on an earlier screen is not added twice.
  function collect(pageDown, sub, seen, rows) {
    // New Reddit
    document.querySelectorAll('shreddit-post').forEach(p => {
      if (!onScreen(p)) return;
      const id = p.getAttribute('id') || p.getAttribute('permalink');
      if (!id || seen.has(id)) return;
      seen.add(id);
      const titleEl = p.querySelector('[slot="title"]');
      const bodyEl = p.querySelector('[id$="-post-rtjson-content"]') ||
                     p.querySelector('[slot="text-body"] .md') ||
                     p.querySelector('[slot="text-body"]');
      const flairEl = p.querySelector('shreddit-post-flair');
      const permalink = p.getAttribute('permalink') || '';
      const outside = p.getAttribute('content-href') || '';
      rows.push({
        pageDown, sub,
        title: clean(p.getAttribute('post-title') || (titleEl && titleEl.innerText)),
        text: clean(bodyEl && bodyEl.innerText),
        flair: clean(flairEl && flairEl.innerText),
        type: p.getAttribute('post-type') || '',
        author: p.getAttribute('author') || '',
        score: p.getAttribute('score') || '',
        comments: p.getAttribute('comment-count') || '',
        posted: p.getAttribute('created-timestamp') || '',
        link: permalink ? 'https://www.reddit.com' + permalink : '',
        outside: outside.includes(permalink) && permalink ? '' : outside,
        id
      });
    });

    // Old Reddit (old.reddit.com)
    document.querySelectorAll('#siteTable div.thing.link:not(.promoted)').forEach(p => {
      if (!onScreen(p)) return;
      const id = p.getAttribute('data-fullname') || p.id;
      if (!id || seen.has(id)) return;
      seen.add(id);
      const titleEl = p.querySelector('a.title');
      const bodyEl = p.querySelector('.expando .usertext-body');
      const ts = Number(p.getAttribute('data-timestamp'));
      const permalink = p.getAttribute('data-permalink') || '';
      const url = p.getAttribute('data-url') || '';
      rows.push({
        pageDown, sub,
        title: clean(titleEl && titleEl.innerText),
        text: clean(bodyEl && bodyEl.innerText),
        flair: clean((p.querySelector('.linkflairlabel') || {}).innerText),
        type: p.classList.contains('self') ? 'text' : 'link',
        author: p.getAttribute('data-author') || '',
        score: p.getAttribute('data-score') || '',
        comments: p.getAttribute('data-comments-count') || '',
        posted: ts ? new Date(ts).toISOString() : '',
        link: permalink ? 'https://old.reddit.com' + permalink : '',
        outside: url.startsWith('/r/') ? '' : url,
        id
      });
    });
  }

  function cell(v) {
    return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  }

  function saveCsv(sub, rows) {
    const head = ['Order', 'Page down', 'Subreddit', 'Title', 'Post text', 'Flair', 'Post type',
                  'Author', 'Score', 'Comments', 'Posted', 'Post link', 'Outside link', 'Post ID'];
    const lines = [head.map(cell).join(',')];
    rows.forEach((r, i) => lines.push([
      i + 1, r.pageDown, 'r/' + r.sub, r.title, r.text, r.flair, r.type, r.author,
      r.score, r.comments, r.posted, r.link, r.outside, r.id
    ].map(cell).join(',')));
    // The mark at the start lets Excel read accents and emoji correctly.
    const blob = new Blob(['﻿' + lines.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `reddit_r-${sub}_${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }

  async function run() {
    const sub = subredditName();
    if (!sub) { alert('Open a subreddit first (an address with /r/ in it).'); return; }
    running = true;
    stopAsked = false;
    const seen = new Set();
    const rows = [];

    collect(0, sub, seen, rows);                     // what is on screen now
    for (let i = 1; i <= PAGE_DOWNS && !stopAsked; i++) {
      btn.textContent = `Stop (page down ${i} of ${PAGE_DOWNS})`;
      window.scrollBy(0, Math.round(window.innerHeight * 0.875)); // same distance as the Page Down key
      await sleep(WAIT_MS);
      collect(i, sub, seen, rows);
    }

    saveCsv(sub, rows);
    running = false;
    btn.textContent = `Saved ${rows.length} posts`;
    setTimeout(() => { if (!running) btn.textContent = 'Save posts'; }, 5000);
  }
})();
