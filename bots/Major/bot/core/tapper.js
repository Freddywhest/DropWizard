const { default: axios } = require("axios");
const logger = require("../../../../utils/logger");
const headers = require("./header");
const { Api } = require("telegram");
const { SocksProxyAgent } = require("socks-proxy-agent");
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
      await this.tg_client.start();
      const platform = this.#get_platform(this.#get_user_agent());
      if (!this.runOnce) {
        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 📡 Waiting for authorization...`
        );
        const botHistory = await this.tg_client.invoke(
          new Api.messages.GetHistory({
            peer: await this.tg_client.getInputEntity(app.bot),
            limit: 10,
          })
        );
        if (botHistory.messages.length < 1) {
          await this.tg_client.invoke(
            new Api.messages.SendMessage({
              message: "/start",
              silent: true,
              noWebpage: true,
              peer: await this.tg_client.getInputEntity(app.peer),
            })
          );
        }
      }
      const result = await this.tg_client.invoke(
        new Api.messages.RequestWebView({
          peer: await this.tg_client.getInputEntity(app.peer),
          bot: await this.tg_client.getInputEntity(app.bot),
          platform,
          from_bot_menu: false,
          url: app.webviewUrl,
          startParam: "VSLNu6frT0NF3Vw1",
        })
      );
      const authUrl = result.url;
      const tgWebData = authUrl.split("#", 2)[1];
      const data = parser.toJson(
        decodeURIComponent(this.#clean_tg_web_data(tgWebData))
      );

      const json = {
        init_data: parser.toQueryString(data),
      };
      return json;
    } catch (error) {
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
      throw error;
    } finally {
      if (this.tg_client.connected) {
        await this.tg_client.destroy();
      }
      await sleep(1);
      if (!this.runOnce) {
        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🚀 Starting session...`
        );
      }

      this.runOnce = true;
    }
  }

  async #get_access_token(tgWebData, http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/auth/tg/`,
        JSON.stringify(tgWebData)
      );

      return response.data;
    } catch (error) {
      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error while getting Access Token: ${error}`
      );
      await sleep(3); // 3 seconds delay
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
    let parsed_tg_web_data;
    let tasks;
    let tasks_daily;
    let sleep_hold_to_earn = 0;
    let sleep_roulette = 0;
    let sleep_reward = 0;
    let access_token;

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
        const currentTime = _.floor(Date.now() / 1000);
        if (currentTime - access_token_created_time >= 1800) {
          const tg_web_data = await this.#get_tg_web_data();
          access_token = await this.#get_access_token(tg_web_data, http_client);
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
        /* referrals = await this.api.get_referrals(http_client);
        position = await this.api.get_position(
          http_client,
          parsed_tg_web_data?.user?.id
        ); */

        if (_.isEmpty(profile_data)) {
          access_token_created_time = 0;
          continue;
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
          const result = await this.api.claim_roulette(http_client);
          if (result?.rating_award) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🎰 Roulette claimed successfully | Reward: <la>${result?.rating_award}</la>`
            );
            sleep_roulette = _.floor(Date.now() / 1000) + 28820;
          } else if (!_.isEmpty(result?.detail)) {
            sleep_roulette = result?.detail?.blocked_until + 10;
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
          const result = await this.api.claim_bonus(http_client, data);
          if (result?.success == true) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 💰 Hold to earn claimed successfully | Reward: <la>${data?.coins}</la>`
            );
            sleep_hold_to_earn = _.floor(Date.now() / 1000) + 28820;
          } else if (!_.isEmpty(result?.detail)) {
            sleep_hold_to_earn = result?.detail?.blocked_until + 10;
          }

          await sleep(2);
        }
      } catch (error) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error: ${error}`
        );
      } finally {
        if (this.tg_client.connected) {
          await this.tg_client.destroy();
        }
        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 😴 sleeping for ${settings.SLEEP_BETWEEN_REQUESTS} seconds...`
        );
        await sleep(settings.SLEEP_BETWEEN_REQUESTS);
      }
    }
  }
}
module.exports = Tapper;
