// MAIN world: content-script worlds have no customElements, and the page's CSP doesn't block extension injections.
const toggleKai = async (tab) => {
  const target = { tabId: tab.id };
  try {
    const [{ result: defined }] = await chrome.scripting.executeScript({
      target,
      world: 'MAIN',
      func: () => !!customElements.get('ui-annotator'),
    });
    if (!defined) {
      await chrome.scripting.executeScript({ target, world: 'MAIN', files: ['kai.js'] });
    }
    await chrome.scripting.executeScript({
      target,
      world: 'MAIN',
      // SPAs that swap <body> drop the element but keep the definition
      func: () => (document.querySelector('ui-annotator') ?? document.body.appendChild(document.createElement('ui-annotator'))).toggle(),
    });
  } catch (err) {
    // chrome://, the Web Store and other protected pages reject injection
    console.warn(`kai: cannot run on ${tab.url}`, err);
  }
};

chrome.action.onClicked.addListener(toggleKai);
