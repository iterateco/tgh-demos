export default {
  loadModal(path: string) {
    const { loadModal } = (window as any);
    if (loadModal) {
      loadModal(path);
    } else {
      console.log('loadModal:', path);
    }
  },

  track(name: string, params?: object) {
    googleTag('event', name, params);
  }
};

function googleTag(...args: any) {
  const { gtag } = (window as any);
  if (gtag) {
    gtag(...args);
  } else {
    console.log('gtag:', ...args);
  }
}
