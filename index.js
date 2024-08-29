const logger = require("./utils/logger");
const luncher = require("./utils/luncher");
const main = async () => {
  await luncher.process();
};

// Wrap main function execution in an async context to handle asynchronous operations
(async () => {
  try {
    const nodeVersion = process.version;
    const major = process.versions
      ? parseInt(nodeVersion.split(".")[0].replace("v", ""), 10)
      : 0;
    if (major < 18 || major > 20 || isNaN(major) || major === 0) {
      return logger.error(
        "To run this bot, Node.js version <la>18.x</la> or <lb>20.x</lb> is required.\n Current version: <bl>" +
          nodeVersion +
          "</bl>"
      );
    }
    await main();
  } catch (error) {
    throw error;
  }
})();
