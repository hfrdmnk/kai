// MAIN world: content-script worlds have no customElements, and the page's CSP doesn't apply to extension injections.
const toggleKai = async (tab) => {
  const target = { tabId: tab.id };
  try {
    const [{ result: present }] = await chrome.scripting.executeScript({
      target,
      world: 'MAIN',
      func: () => !!document.querySelector('ui-annotator'),
    });
    if (!present) {
      await chrome.scripting.executeScript({ target, world: 'MAIN', files: ['kai.js'] });
    }
    await chrome.scripting.executeScript({
      target,
      world: 'MAIN',
      func: () => document.querySelector('ui-annotator').toggle(),
    });
  } catch (err) {
    // chrome://, the Web Store and other protected pages reject injection
    console.warn(`kai: cannot run on ${tab.url}`, err);
  }
};

chrome.action.onClicked.addListener(toggleKai);
