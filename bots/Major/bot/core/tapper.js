const { default: axios } = require("axios");
const logger = require("../../../../utils/logger");
const headers = require("./header");
const { Api } = require("telegram");
const settings = require("../config/config");
const app = require("../config/app");
const user_agents = require("../../../../utils/userAgents");
const fs = require("fs");
const sleep = require("../../../../utils/sleep");
const ApiRequest = require("./api");
var _ = require("lodash");
const parser = require("../../../../utils/parser");
const path = require("path");
const taskFilter = require("../utils/taskFilter");
const _isArray = require("../../../../utils/_isArray");
const { HttpsProxyAgent } = require("https-proxy-agent");
const FdyTmp = require("fdy-tmp");
const Fetchers = require("../utils/fetchers");

class Tapper {
  constructor(tg_client, bot_name) {
    this.bot_name = bot_name;
    this.session_name = tg_client.session_name;
    this.tg_client = tg_client.tg_client;
    this.session_user_agents = this.#load_session_data();
    this.headers = { ...headers, "user-agent": this.#get_user_agent() };
    this.api = new ApiRequest(this.session_name, this.bot_name);
    this.sleep_floodwait = 0;
    this.runOnce = false;
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

  async #validate_query_id(http_client, data) {
    let validate_request = "server";
    while (
      typeof validate_request === "string" &&
      validate_request === "server"
    ) {
      await sleep(3); // 3 seconds delay
      validate_request = await this.api.validate_query_id(http_client, data);
      if (
        typeof validate_request === "string" &&
        validate_request === "server"
      ) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Server error while validating query id. Retrying...`
        );
      }
    }

    return validate_request;
  }

  #clean_tg_web_data(queryString) {
    let cleanedString = queryString.replace(/^tgWebAppData=/, "");
    cleanedString = cleanedString.replace(
      /&tgWebAppVersion=.*?&tgWebAppPlatform=.*?(?:&tgWebAppBotInline=.*?)?$/,
      ""
    );
    return cleanedString;
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

  #get_platform(userAgent) {
    const platformPatterns = [
      { pattern: /iPhone/i, platform: "ios" },
      { pattern: /Android/i, platform: "android" },
      { pattern: /iPad/i, platform: "ios" },
    ];

    for (const { pattern, platform } of platformPatterns) {
      if (pattern.test(userAgent)) {
        return platform;
      }
    }

    return "Unknown";
  }

  #proxy_agent(proxy) {
    try {
      if (!proxy) return null;
      let proxy_url;
      if (!proxy.password && !proxy.username) {
        proxy_url = `${proxy.protocol}://${proxy.ip}:${proxy.port}`;
      } else {
        proxy_url = `${proxy.protocol}://${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`;
      }
      return new HttpsProxyAgent(proxy_url);
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
      const tmp = new FdyTmp({
        fileName: `${this.bot_name}.fdy.tmp`,
        tmpPath: path.join(process.cwd(), "cache/queries"),
      });
      if (tmp.hasJsonElement(this.session_name)) {
        const queryStringFromCache = tmp.getJson(this.session_name);
        if (!_.isEmpty(queryStringFromCache)) {
          const jsonData = {
            init_data: queryStringFromCache,
          };

          const va_hc = axios.create({
            headers: this.headers,
            withCredentials: true,
          });

          const validate = await this.#validate_query_id(va_hc, jsonData);

          if (validate) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🔄 Getting data from cache...`
            );
            if (this.tg_client.connected) {
              await this.tg_client.disconnect();
              await this.tg_client.destroy();
            }
            await sleep(5);
            return jsonData;
          } else {
            tmp.deleteJsonElement(this.session_name);
          }
        }
      }
      await this.tg_client.connect();
      await this.tg_client.start();
      const platform = this.#get_platform(this.#get_user_agent());

      if (!this.bot) {
        this.bot = await this.tg_client.getInputEntity(app.bot);
      }

      if (!this.runOnce) {
        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 📡 Waiting for authorization...`
        );
        const botHistory = await this.tg_client.invoke(
          new Api.messages.GetHistory({
            peer: this.bot,
            limit: 10,
          })
        );
        if (botHistory.messages.length < 1) {
          await this.tg_client.invoke(
            new Api.messages.SendMessage({
              message: "/start",
              silent: true,
              noWebpage: true,
              peer: this.bot,
            })
          );
        }
      }

      await sleep(5);

      const result = await this.tg_client.invoke(
        new Api.messages.RequestWebView({
          peer: this.bot,
          bot: this.bot,
          platform,
          from_bot_menu: true,
          url: app.webviewUrl,
        })
      );

      const authUrl = result.url;
      const tgWebData = authUrl.split("#", 2)[1];
      logger.info(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 💾 Storing data in cache...`
      );

      await sleep(5);

      tmp
        .addJson(
          this.session_name,
          decodeURIComponent(this.#clean_tg_web_data(tgWebData))
        )
        .save();
      const json = {
        init_data: decodeURIComponent(this.#clean_tg_web_data(tgWebData)),
      };
      return json;
    } catch (error) {
      if (error.message.includes("AUTH_KEY_DUPLICATED")) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | The same authorization key (session file) was used in more than one place simultaneously. You must delete your session file and create a new session`
        );
        return null;
      }
      const regex = /A wait of (\d+) seconds/;
      if (
        error.message.includes("FloodWaitError") ||
        error.message.match(regex)
      ) {
        const match = error.message.match(regex);

        if (match) {
          this.sleep_floodwait =
            new Date().getTime() / 1000 + parseInt(match[1], 10) + 10;
        } else {
          this.sleep_floodwait = new Date().getTime() / 1000 + 50;
        }
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${
            this.session_name
          } | Some flood error, waiting ${
            this.sleep_floodwait - new Date().getTime() / 1000
          } seconds to try again...`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error during Authorization: ${error}`
        );
      }
      return null;
    } finally {
      if (this.tg_client.connected) {
        await this.tg_client.disconnect();
        await this.tg_client.destroy();
      }
      this.runOnce = true;
      if (this.sleep_floodwait > new Date().getTime() / 1000) {
        await sleep(this.sleep_floodwait - new Date().getTime() / 1000);
        return await this.#get_tg_web_data();
      }
      await sleep(3);
    }
  }

  async run(proxy) {
    let http_client;
    let access_token_created_time = 0;

    let profile_data;
    let parsed_tg_web_data;
    let position;
    let tasks;
    let tasks_daily;
    let sleep_hold_to_earn = 0;
    let sleep_roulette = 0;
    let sleep_swipe = 0;
    let sleep_reward = 0;
    let access_token;

    const fetchers = new Fetchers(this.api, this.session_name, this.bot_name);

    if (settings.USE_PROXY_FROM_FILE && proxy) {
      http_client = axios.create({
        httpsAgent: this.#proxy_agent(proxy),
        headers: this.headers,
        withCredentials: true,
      });
      const proxy_result = await fetchers.check_proxy(http_client, proxy);
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
        const currentTime = _.floor(Date.now() / 1000);
        if (currentTime - access_token_created_time >= 1800) {
          const tg_web_data = await this.#get_tg_web_data();
          if (
            _.isNull(tg_web_data) ||
            _.isUndefined(tg_web_data) ||
            !tg_web_data ||
            _.isEmpty(tg_web_data)
          ) {
            continue;
          }
          access_token = await fetchers.get_access_token(
            tg_web_data,
            http_client
          );
          http_client.defaults.headers["authorization"] = `${
            access_token?.token_type ? access_token?.token_type : "Bearer"
          } ${access_token?.access_token}`;

          parsed_tg_web_data = parser.toJson(tg_web_data.init_data);
          access_token_created_time = currentTime;
          await sleep(2);
        }
        if (_.isEmpty(parsed_tg_web_data) || !parsed_tg_web_data?.user?.id) {
          access_token_created_time = 0;
          continue;
        }

        profile_data = await this.api.get_user_info(
          http_client,
          parsed_tg_web_data?.user?.id
        );

        tasks = await this.api.get_tasks(http_client, false);
        tasks_daily = await this.api.get_tasks(http_client, true);
        /*referrals = await this.api.get_referrals(http_client);
         */
        position = await this.api.get_position(
          http_client,
          parsed_tg_web_data?.user?.id
        );
        if (_.isEmpty(profile_data)) {
          access_token_created_time = 0;
          continue;
        }

        if (!_.isEmpty(position)) {
          logger.info(
            `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 👷 You current position: <pi>${position?.position}</pi> | 💲 Balance: <la>${profile_data?.rating}</la>`
          );
        }
        await sleep(2);

        if (settings.CLAIM_DAILY_REWARDS && sleep_reward < currentTime) {
          const check_joined_major_channel =
            await this.api.check_joined_major_channel(http_client);

          if (
            !_.isEmpty(check_joined_major_channel) &&
            check_joined_major_channel?.is_completed == false &&
            check_joined_major_channel?.task_id == 27
          ) {
            if (!this.tg_client.connected) {
              await this.tg_client.start();
            }
            await this.tg_client.invoke(
              new Api.channels.JoinChannel({
                channel: await this.tg_client.getInputEntity(app.majorChannel),
              })
            );
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ✅ Joined Major Channel. Retrying to claim daily reward...`
            );
            continue;
          }
          const daily_reward = await this.api.claim_visit(http_client);
          if (daily_reward?.is_increased == true) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🎉 Daily Reward claimed successfully | Streak: <pi>${daily_reward?.streak}</pi>`
            );
          }

          sleep_reward = _.floor(Date.now() / 1000) + 43200;
          await sleep(2);
        }

        if (settings.AUTO_CLAIM_TASKS) {
          const daily = taskFilter(tasks_daily, ["stories", "without_check"]);
          if (daily.length > 0) {
            for (let i = 0; i < daily.length; i++) {
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Sleep 10 seconds before claiming task <la>${daily[i].title}</la>`
              );
              await sleep(10);
              const data = {
                task_id: daily[i].id,
              };
              const result = await this.api.claim_task(http_client, data);
              if (result?.is_completed) {
                logger.info(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ✅ Claimed task <la>${daily[i].title}</la>`
                );
              }
            }
          }

          const nonDaily = taskFilter(tasks, "without_check");
          if (nonDaily.length > 0) {
            for (let i = 0; i < nonDaily.length; i++) {
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Sleep 10 seconds before claiming task <la>${nonDaily[i].title}</la>`
              );
              await sleep(10);
              const data = {
                task_id: nonDaily[i].id,
              };
              const result = await this.api.claim_task(http_client, data);
              if (
                typeof result === "string" &&
                result?.toLowerCase()?.includes("retry")
              ) {
                i--;
                continue;
              }
              if (result?.is_completed) {
                logger.info(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ✅ Claimed task <la>${nonDaily[i].title}</la>`
                );
              }
            }
          }
          await sleep(2);
        }

        if (settings.AUTO_PLAY_ROULETTE && sleep_roulette < currentTime) {
          const get_roulette = await this.api.get_roulette(http_client);
          if (!_.isEmpty(get_roulette) && get_roulette?.success == true) {
            const result = await this.api.claim_roulette(http_client);
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🎰 Roulette claimed successfully | Reward: <la>${result?.rating_award}</la>`
            );
            sleep_roulette = _.floor(Date.now() / 1000) + 28820;
          } else if (!_.isEmpty(get_roulette?.detail)) {
            sleep_roulette = get_roulette?.detail?.blocked_until + 10;
          }

          await sleep(2);
        }

        if (
          settings.AUTO_PLAY_HOLD_TO_EARN &&
          sleep_hold_to_earn < currentTime
        ) {
          const data = {
            coins: _.random(700, 820),
          };
          const get_bonus = await this.api.get_bonus(http_client);
          if (!_.isEmpty(get_bonus) && get_bonus?.success == true) {
            const result = await this.api.claim_bonus(http_client, data);
            if (!_.isEmpty(result) && result?.success == true) {
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 💰 Hold to earn claimed successfully | Reward: <la>${data?.coins}</la>`
              );
            }
            sleep_hold_to_earn = _.floor(Date.now() / 1000) + 28820;
          } else if (!_.isEmpty(get_bonus?.detail)) {
            sleep_hold_to_earn = get_bonus?.detail?.blocked_until + 10;
          }

          await sleep(2);
        }

        if (settings.AUTO_PLAY_SWIPE_COIN && sleep_swipe < currentTime) {
          const coins = _.random(200, 300);
          const get_swipe = await this.api.get_swipe(http_client);

          if (!_.isEmpty(get_swipe) && get_swipe?.success == true) {
            const result = await this.api.claim_swipe(http_client, coins);
            if (!_.isEmpty(result) && result?.success == true) {
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 💰 Swipe coin claimed successfully | Reward: <la>${coins}</la>`
              );
            }
            sleep_swipe = _.floor(Date.now() / 1000) + 28820;
          } else if (!_.isEmpty(get_swipe?.detail)) {
            sleep_swipe = get_swipe?.detail?.blocked_until + 10;
          }

          await sleep(2);
        }
      } catch (error) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error: ${error}`
        );
      } finally {
        let ran_sleep;
        if (_isArray(settings.SLEEP_BETWEEN_REQUESTS)) {
          if (
            _.isInteger(settings.SLEEP_BETWEEN_REQUESTS[0]) &&
            _.isInteger(settings.SLEEP_BETWEEN_REQUESTS[1])
          ) {
            ran_sleep = _.random(
              settings.SLEEP_BETWEEN_REQUESTS[0],
              settings.SLEEP_BETWEEN_REQUESTS[1]
            );
          } else {
            ran_sleep = _.random(450, 800);
          }
        } else if (_.isInteger(settings.SLEEP_BETWEEN_REQUESTS)) {
          const ran_add = _.random(20, 50);
          ran_sleep = settings.SLEEP_BETWEEN_REQUESTS + ran_add;
        } else {
          ran_sleep = _.random(450, 800);
        }

        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Sleeping for ${ran_sleep} seconds...`
        );
        await sleep(ran_sleep);
      }
    }
  }
}
module.exports = Tapper;
