const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    import('web-vitals').then(module => {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = module;
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;

