// MAIN world: content-script worlds have no customElements, and the page's CSP doesn't block extension injections.
const toggleKai = async (tab) => {
  const target = { tabId: tab.id };
  let ok = false;
  try {
    const [{ result: defined }] = await chrome.scripting.executeScript({
      target,
      world: 'MAIN',
      func: () => !!customElements.get('ui-annotator'),
    });
    if (!defined) {
      await chrome.scripting.executeScript({ target, world: 'MAIN', files: ['kai.js'] });
    }
    // Errors thrown in the page don't reject executeScript, so the func reports them itself
    const [{ result }] = await chrome.scripting.executeScript({
      target,
      world: 'MAIN',
      func: () => {
        try {
          // SPAs that swap <body> drop the element but keep the definition
          (document.querySelector('ui-annotator') ?? document.body.appendChild(document.createElement('ui-annotator'))).toggle();
          return true;
        } catch (err) {
          console.warn('kai: failed to start on this page', err);
          return false;
        }
      },
    });
    ok = result;
  } catch (err) {
    // chrome://, the Web Store and other protected pages reject injection
    console.warn(`kai: cannot run on ${tab.url}`, err);
  }
  await chrome.action.setBadgeText({ tabId: tab.id, text: ok ? '' : '!' });
  await chrome.action.setTitle({ tabId: tab.id, title: ok ? 'Toggle kai' : "kai can't run on this page" });
};

chrome.action.onClicked.addListener(toggleKai);
