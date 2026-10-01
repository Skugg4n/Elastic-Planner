// In-page helpers for manual end-to-end testing against the emulators.
// In the browser console: await import('/dev/test-helpers.js')
window.__t = (() => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const main = () => [...document.querySelectorAll('.block-interactive:not([title])')];
  const setVal = (el, v) => {
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const byLabel = (text) => [...document.querySelectorAll('button')].find((b) => (b.getAttribute('aria-label') || b.title || b.innerText || '').includes(text));
  return {
    sleep,
    blocks: () => main().map((b) => b.innerText.replace(/\n+/g, ' | ')),
    week: () => document.querySelector('header span.font-bold.text-center')?.innerText,
    status: () => ['Synkar...', 'Synkad', 'Ej synkat', 'Synkfel'].find((s) => document.body.innerText.includes(s)) || 'idle',
    click: async (text) => { byLabel(text).click(); await sleep(300); },
    inlineEdit: async (index, { label, project, task }) => {
      main()[index].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      await sleep(200);
      const inputs = [...main()[index].querySelectorAll('input')];
      if (label !== undefined) setVal(inputs[0], label);
      if (project !== undefined) setVal(inputs[1], project);
      if (task !== undefined) setVal(inputs[2], task);
      inputs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await sleep(200);
    },
    action: async (index, title) => {
      main()[index].click();
      await sleep(200);
      const btn = [...document.querySelectorAll('.action-menu button')].find((b) => (b.title || '').includes(title));
      btn.click();
      await sleep(200);
    },
    toggleDone: async (index) => { main()[index].querySelector('button').click(); await sleep(200); },
  };
})();
