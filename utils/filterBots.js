function filterBots(b) {
  return Object.fromEntries(
    Object.entries(b).filter(([key, value]) => value.use === true)
  );
}

module.exports = filterBots;
