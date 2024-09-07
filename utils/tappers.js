const ToMarketNonSessionTapper = require("../bots/ToMarket/bot/core/nonSessionTapper");
const BlumNonSessionTapper = require("../bots/Blum/bot/core/nonSessionTapper");
const RockyRabbitNonSessionTapper = require("../bots/RockyRabbit/bot/core/nonSessionTapper");
const TimeFarmNonSessionTapper = require("../bots/TimeFarm/bot/core/nonSessionTapper");
const DotcoinNonSessionTapper = require("../bots/Dotcoin/bot/core/nonSessionTapper");
const MajorNonSessionTapper = require("../bots/Major/bot/core/nonSessionTapper");
const LostDogsNonSessionTapper = require("../bots/LostDogs/bot/core/nonSessionTapper");

const BlumTapper = require("../bots/Blum/bot/core/tapper");
const ToMarketTapper = require("../bots/ToMarket/bot/core/tapper");
const TimeFarmTapper = require("../bots/TimeFarm/bot/core/tapper");
const MajorTapper = require("../bots/Major/bot/core/tapper");
const LostDogsTapper = require("../bots/LostDogs/bot/core/tapper");
const DotcoinTapper = require("../bots/Dotcoin/bot/core/tapper");
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
  timefarm: {
    class: TimeFarmTapper,
    use: settings.TIMEFARM,
  },
  dotcoin: {
    class: DotcoinTapper,
    use: settings.DOTCOIN,
  },
  major: {
    class: MajorTapper,
    use: settings.MAJOR,
  },
  lostdogs: {
    class: LostDogsTapper,
    use: settings.LOSTDOGS,
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
  rockyrabbit: {
    class: RockyRabbitNonSessionTapper,
    use: settings.ROCKYRABBIT,
  },
  timefarm: {
    class: TimeFarmNonSessionTapper,
    use: settings.TIMEFARM,
  },
  dotcoin: {
    class: DotcoinNonSessionTapper,
    use: settings.DOTCOIN,
  },
  major: {
    class: MajorNonSessionTapper,
    use: settings.MAJOR,
  },
  lostdogs: {
    class: LostDogsNonSessionTapper,
    use: settings.LOSTDOGS,
  },
};

module.exports = { tappers, nonSessionTappers };
