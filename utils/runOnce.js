function runOnce(fn) {
  let hasRun = false;

  return function (...args) {
    if (!hasRun) {
      hasRun = true;
      return fn(...args);
    }
  };
}

function runOnceAsync(fn) {
  let hasRun = false;

  return async function (...args) {
    if (!hasRun) {
      hasRun = true;
      await fn(...args); // Run the provided async code once
    }
    // On subsequent calls, do nothing and return nothing
  };
}

module.exports = { runOnce, runOnceAsync };
