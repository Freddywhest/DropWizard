const { default: axios } = require("axios");
const logger = require("../../../../utils/logger");
const headers = require("./header");
const { SocksProxyAgent } = require("socks-proxy-agent");
const settings = require("../config/config");
const app = require("../config/app");
const user_agents = require("../../../../utils/userAgents");
const fs = require("fs");
const sleep = require("../../../../utils/sleep");
const ApiRequest = require("./api");
var _ = require("lodash");
const path = require("path");
const moment = require("moment");

class NonSessionTapper {
  constructor(query_id, query_name, bot_name) {
    this.bot_name = bot_name;
    this.session_name = query_name;
    this.query_id = query_id;
    this.API_URL = app.apiUrl;
    this.session_user_agents = this.#load_session_data();
    this.headers = { ...headers, "user-agent": this.#get_user_agent() };
    this.api = new ApiRequest(this.session_name, this.bot_name);
  }

  #load_session_data() {
    try {
      const filePath = path.join(process.cwd(), "session_user_agents.json");
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        return {};
      } else {
        throw error;
      }
    }
  }

  #get_random_user_agent() {
    const randomIndex = Math.floor(Math.random() * user_agents.length);
    return user_agents[randomIndex];
  }

  #get_user_agent() {
    if (this.session_user_agents[this.session_name]) {
      return this.session_user_agents[this.session_name];
    }

    logger.info(
      `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Generating new user agent...`
    );
    const newUserAgent = this.#get_random_user_agent();
    this.session_user_agents[this.session_name] = newUserAgent;
    this.#save_session_data(this.session_user_agents);
    return newUserAgent;
  }

  #save_session_data(session_user_agents) {
    const filePath = path.join(process.cwd(), "session_user_agents.json");
    fs.writeFileSync(filePath, JSON.stringify(session_user_agents, null, 2));
  }

  #proxy_agent(proxy) {
    try {
      if (!proxy) return null;
      let proxy_url;
      if (!proxy.password && !proxy.username) {
        proxy_url = `socks${proxy.socksType}://${proxy.ip}:${proxy.port}`;
      } else {
        proxy_url = `socks${proxy.socksType}://${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`;
      }
      return new SocksProxyAgent(proxy_url);
    } catch (e) {
      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${
          this.session_name
        } | Proxy agent error: ${e}\nProxy: ${JSON.stringify(proxy, null, 2)}`
      );
      return null;
    }
  }

  async #get_tg_web_data() {
    try {
      return this.query_id;
    } catch (error) {
      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error during Authorization: ${error}`
      );
      throw error;
    } finally {
      await sleep(1);
      logger.info(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🚀 Starting session...`
      );
    }
  }

  async #check_proxy(http_client, proxy) {
    try {
      const response = await http_client.get("https://httpbin.org/ip");
      const ip = response.data.origin;
      logger.info(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Proxy IP: ${ip}`
      );
    } catch (error) {
      if (
        error.message.includes("ENOTFOUND") ||
        error.message.includes("getaddrinfo") ||
        error.message.includes("ECONNREFUSED")
      ) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error: Unable to resolve the proxy address. The proxy server at ${proxy.ip}:${proxy.port} could not be found. Please check the proxy address and your network connection.`
        );
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | No proxy will be used.`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Proxy: ${proxy.ip}:${proxy.port} | Error: ${error.message}`
        );
      }

      return false;
    }
  }

  async run(proxy) {
    let http_client;
    let access_token_created_time = 0;

    let profile_data;
    let bones_balance;
    let woof_balance;
    let prev_round_data;

    if (settings.USE_PROXY_FROM_FILE && proxy) {
      http_client = axios.create({
        httpsAgent: this.#proxy_agent(proxy),
        headers: this.headers,
        withCredentials: true,
      });
      const proxy_result = await this.#check_proxy(http_client, proxy);
      if (!proxy_result) {
        http_client = axios.create({
          headers: this.headers,
          withCredentials: true,
        });
      }
    } else {
      http_client = axios.create({
        headers: this.headers,
        withCredentials: true,
      });
    }
    while (true) {
      try {
        const currentTime = Date.now() / 1000;
        if (currentTime - access_token_created_time >= 3600) {
          const tg_web_data = await this.#get_tg_web_data();

          http_client.defaults.headers["x-auth-token"] = `${tg_web_data}`;
          access_token_created_time = currentTime;
          await sleep(2);
        }
        profile_data = await this.api.get_user_data(http_client);
        if (_.isEmpty(profile_data)) {
          continue;
        }
        bones_balance = profile_data?.lostDogsWayUserInfo?.gameDogsBalance;
        woof_balance = _.floor(
          parseInt(profile_data?.lostDogsWayUserInfo?.woofBalance) / 1000000000
        );
        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🐶 Woof balance: <gr>${woof_balance} $WOOF</gr> | 🦴 Bones balance: <gr>${bones_balance} Bones</gr>`
        );
        prev_round_data = profile_data?.lostDogsWayUserInfo?.prevRoundVote;

        if (!_.isEmpty(prev_round_data)) {
          logger.info(
            `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🐶 Previous round is over | Getting prediction rewards...`
          );
          const price = parseInt(prev_round_data?.woofPrize) / 1000000000;
          if (prev_round_data?.userStatus?.toLowerCase() === "winner") {
            const notcoin = parseInt(prev_round_data?.notPrize) / 1000000000;
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🎉 Congratulations! You won <gr>${price} $WOOF</gr> and <gr>${notcoin} $NOT</gr>!`
            );
          } else if (prev_round_data?.userStatus?.toLowerCase() === "loser") {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 😢 You lost but you got <gr>${price} $WOOF</gr>`
            );
          }

          await this.api.view_prev_votes(http_client);
        }
        await sleep(5);

        const current_round =
          profile_data?.lostDogsWayUserInfo?.currentRoundVote;

        if (_.isEmpty(current_round)) {
          let card;
          if (settings.CHOOSE_RANDOM_CARDS) {
            card = _.random(1, 3);
          } else {
            card = settings.CARD_TO_CHOOSE;
          }

          const vote_result = await this.api.vote(http_client, card);

          if (!_.isEmpty(vote_result)) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🐶 Voted for card <bl>${vote_result?.selectedRoundCardValue}</bl> | Spend Bones: <la>${vote_result?.spentGameDogsCount}</la>`
            );
          }
        } else {
          logger.info(
            `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🐶 Voted card: <pi>${current_round?.selectedRoundCardValue}</pi> | Bones spent: <ye>${current_round?.spentGameDogsCount}</ye>`
          );
        }
        await sleep(5);

        if (settings.AUTO_CLAIM_TASKS) {
          const personal_tasks = await this.api.get_personal_tasks(http_client);
          await sleep(2);

          const event_data = {
            commonPageView: "yourDog",
            timeMs: Date.now(),
          };

          await this.api.save_game_event(
            http_client,
            event_data,
            "Common Page View"
          );

          for (const task of personal_tasks) {
            const sleep_time = _.random(5, 10);
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Sleeping ${sleep_time} seconds to claim: <bl>${task?.name}</bl>`
            );
            await sleep(sleep_time);
            const task_id = task?.id;
            const personal_tasks_claim = await this.api.perform_task(
              http_client,
              task_id
            );
            if (
              !_.isEmpty(personal_tasks_claim) &&
              personal_tasks_claim?.success
            ) {
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${
                  this.session_name
                } | Claimed task: <bl>${task?.name}</bl> | Reward: <gr>${
                  !isNaN(parseInt(personal_tasks_claim?.woofReward))
                    ? parseInt(personal_tasks_claim?.woofReward) / 1000000000 +
                      " $WOOF"
                    : "N/A"
                }</gr>`
              );
            } else {
              logger.warning(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Failed to claim task: <bl>${task?.name}</bl>`
              );
            }
          }

          await sleep(5);

          const get_common_tasks = await this.api.get_common_tasks(http_client);
          const get_done_common_tasks = await this.api.get_done_common_tasks(
            http_client
          );
          const undone_tasks = get_common_tasks?.filter(
            (task) =>
              !get_done_common_tasks?.includes(task?.id) &&
              task?.customCheckStrategy == null
          );

          if (!_.isEmpty(undone_tasks)) {
            for (const task of undone_tasks) {
              const sleep_time = _.random(5, 10);
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Sleeping ${sleep_time} seconds to claim: <bl>${task?.name}</bl>`
              );
              await sleep(sleep_time);
              const task_id = task?.id;
              const common_tasks_claim = await this.api.perform_common_task(
                http_client,
                task_id
              );
              if (
                !_.isEmpty(common_tasks_claim) &&
                common_tasks_claim?.success
              ) {
                logger.info(
                  `<ye>[${this.bot_name}]</ye> | ${
                    this.session_name
                  } | Claimed task: <bl>${task?.name}</bl> | Reward: <gr>${
                    !isNaN(parseInt(common_tasks_claim?.woofReward))
                      ? parseInt(common_tasks_claim?.woofReward) / 1000000000 +
                        " $WOOF"
                      : "N/A"
                  }</gr>`
                );
              } else {
                logger.warning(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Failed to claim task: <bl>${task?.name}</bl>`
                );
              }
            }
          }
        }

        await sleep(5);

        const round_ends = isNaN(
          parseInt(profile_data?.lostDogsWayGameStatus?.gameState?.roundEndsAt)
        )
          ? 0
          : parseInt(
              profile_data?.lostDogsWayGameStatus?.gameState?.roundEndsAt
            );

        const game_ends = isNaN(
          parseInt(profile_data?.lostDogsWayGameStatus?.gameState?.gameEndsAt)
        )
          ? 0
          : parseInt(
              profile_data?.lostDogsWayGameStatus?.gameState?.gameEndsAt
            );
        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${
            this.session_name
          } |  Current round ends <lb>${moment(
            new Date(round_ends * 1000)
          ).fromNow()}</lb> | Game ends: <lb>${moment(
            new Date(game_ends * 1000)
          ).fromNow()}</lb>`
        );
      } catch (error) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error: ${error}`
        );
      } finally {
        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 😴 sleeping for ${settings.SLEEP_BETWEEN_REQUESTS} seconds`
        );
        await sleep(settings.SLEEP_BETWEEN_REQUESTS);
      }
    }
  }
}
module.exports = NonSessionTapper;
