export const detectWebEngine = () => {
  const userAgent = navigator.userAgent;

  const isWebKit = /WebKit/.test(userAgent) && !/Chrome/.test(userAgent);
  const isGecko = /Gecko/.test(userAgent) && !/WebKit/.test(userAgent);
  const isBlink = /Chrome/.test(userAgent) && /WebKit/.test(userAgent);

  return {
    isWebKit,
    isGecko,
    isBlink,
    userAgent,
  };
};
