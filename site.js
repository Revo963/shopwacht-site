// Everything here is decoration: without this file the page shows the finished scan and all its text.
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The scanner: a beam passes over the example page; each phrase is marked when the beam reaches it.
  const scanner = document.querySelector('[data-scanner]');
  const listing = scanner?.querySelector('[data-listing]');
  const beam = scanner?.querySelector('[data-beam]');
  if (scanner && listing && beam && !still) {
    const hits = [...scanner.querySelectorAll('[data-hit]')];
    const counts = { risiko: scanner.querySelector('[data-count="risiko"]'), pruefen: scanner.querySelector('[data-count="pruefen"]') };
    const status = scanner.querySelector('[data-status]');
    const PASS_MS = 4200;
    const REST_MS = 5200;
    let timers = [];
    let running = null;

    const scan = () => {
      timers.forEach(clearTimeout);
      timers = [];
      running?.cancel();
      scanner.classList.add('is-scanning');
      scanner.querySelectorAll('.is-found').forEach((el) => el.classList.remove('is-found'));
      const found = { risiko: 0, pruefen: 0 };
      counts.risiko.textContent = '0';
      counts.pruefen.textContent = '0';
      status.textContent = 'Prüfe Produktseite …';

      const height = listing.offsetHeight;
      running = beam.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${height + 76}px)` }], { duration: PASS_MS, easing: 'linear', fill: 'forwards' });
      for (const hit of hits) {
        const box = hit.getBoundingClientRect();
        const at = (box.top - listing.getBoundingClientRect().top + box.height) / (height + 76);
        timers.push(
          setTimeout(() => {
            hit.classList.add('is-found');
            const finding = scanner.querySelector(`[data-finding="${hit.dataset.hit}"]`);
            finding?.classList.add('is-found');
            const level = finding?.classList.contains('finding--soft') ? 'pruefen' : 'risiko';
            counts[level].textContent = String(++found[level]);
          }, at * PASS_MS),
        );
      }
      timers.push(
        setTimeout(() => {
          scanner.classList.remove('is-scanning');
          status.textContent = '5 Befunde in einem Produkt';
        }, PASS_MS + 150),
      );
      timers.push(setTimeout(scan, PASS_MS + REST_MS));
    };

    // Start when the scanner is on screen, pause when it is not.
    new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !timers.length) scan();
        if (!entry.isIntersecting) {
          timers.forEach(clearTimeout);
          timers = [];
          running?.cancel();
          scanner.classList.remove('is-scanning');
          scanner.querySelectorAll('[data-hit], [data-finding]').forEach((el) => el.classList.add('is-found'));
          counts.risiko.textContent = '3';
          counts.pruefen.textContent = '2';
        }
      },
      { threshold: 0.35 },
    ).observe(scanner);
  }

  // Sections come in as they are scrolled to.
  const revealed = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        revealed.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  const reveals = [...document.querySelectorAll('.reveal')];
  reveals.forEach((el, i) => {
    // Items that share a row follow each other.
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 5) * 70}ms`;
    revealed.observe(el);
  });

  // Copy the install commands.
  for (const button of document.querySelectorAll('[data-copy]')) {
    const label = button.textContent;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        button.textContent = 'Kopiert';
        button.classList.add('is-done');
      } catch {
        button.textContent = 'Bitte von Hand kopieren';
      }
      setTimeout(() => {
        button.textContent = label;
        button.classList.remove('is-done');
      }, 2200);
    });
  }
})();
