const BlumTapper = require("../bots/Blum/bot/core/tapper");
const ToMarketNonSessionTapper = require("../bots/ToMarket/bot/core/nonSessionTapper");
const BlumNonSessionTapper = require("../bots/Blum/bot/core/nonSessionTapper");
const RockyRabbitNonSessionTapper = require("../bots/RockyRabbit/bot/core/nonSessionTapper");
const ToMarketTapper = require("../bots/ToMarket/bot/core/tapper");
const settings = require("./config");
const RockyRabbitTapper = require("../bots/RockyRabbit/bot/core/tapper");

const tappers = {
  blum: {
    class: BlumTapper,
    use: settings.BLUM,
  },
  tomarket: {
    class: ToMarketTapper,
    use: settings.TOMARKET,
  },
  rockyrabbit: {
    class: RockyRabbitTapper,
    use: settings.ROCKYRABBIT,
  },
};

const nonSessionTappers = {
  blum: {
    class: BlumNonSessionTapper,
    use: settings.BLUM,
  },
  tomarket: {
    class: ToMarketNonSessionTapper,
    use: settings.TOMARKET,
  },
  tomarket: {
    class: RockyRabbitNonSessionTapper,
    use: settings.ROCKYRABBIT,
  },
};

module.exports = { tappers, nonSessionTappers };
