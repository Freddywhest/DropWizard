const app = require("../config/app");
const logger = require("../../../../utils/logger");
const sleep = require("../../../../utils/sleep");
var _ = require("lodash");

class ApiRequest {
  constructor(session_name, bot_name) {
    this.session_name = session_name;
    this.bot_name = bot_name;
  }

  async get_user_data(http_client) {
    try {
      const response = await http_client.get(
        `${app.apiUrl}?operationName=getHomePage&variables=%7B%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%226d07a34b66170fe08f878f8d8b000a5611bd7c8cee8729e5dc41ae848fab4352%22%7D%7D`
      );

      if (_.isEmpty(response?.data?.data)) {
        const error = response?.data?.errors[0]?.message;
        if (error?.toLowerCase()?.includes("user not found")) {
          const register_data = await this.#register(http_client);
          if (!_.isEmpty(register_data)) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | User ${register_data?.nickname} successfully registered! | User Id: ${register_data?.id}`
            );
            await this.get_user_data(http_client);
          }
        } else {
          logger.error(
            `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error in response from server: ${error}`
          );
        }
      }
      const json_data = {
        launch: true,
        timeMs: Date.now(),
      };
      await this.save_game_event(http_client, json_data, "Launch");
      return response?.data?.data;
    } catch (error) {
      const regex = /ENOTFOUND\s([^\s]+)/;
      const match = error.message.match(regex);
      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${
          this.session_name
        } | Error while getting User Data: ${
          error.message.includes("ENOTFOUND") ||
          error.message.includes("getaddrinfo") ||
          error.message.includes("ECONNREFUSED")
            ? `The proxy server at ${
                match && match[1] ? match[1] : "unknown address"
              } could not be found. Please check the proxy address and your network connection`
            : error.message
        }`
      );
      return null;
    }
  }

  async get_personal_tasks(http_client) {
    try {
      const response = await http_client.get(
        `${app.apiUrl}?operationName=lostDogsWayWoofPersonalTasks&variables=%7B%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22d94df8d9fce5bfdd4913b6b3b6ab71e2f9d6397e2a17de78872f604b9c53fe79%22%7D%7D`
      );
      return response?.data?.data?.lostDogsWayWoofPersonalTasks?.items?.filter(
        (task) =>
          task?.isCompleted === false &&
          task?.id !== "connectWallet" &&
          task?.id !== "joinSquad"
      );
    } catch (error) {
      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting personal tasks:</b>: ${error.message}`
      );
      return null;
    }
  }

  async get_common_tasks(http_client) {
    try {
      const response = await http_client.get(
        `${app.apiUrl}?operationName=lostDogsWayCommonTasks&variables=%7B%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%227c4ca1286c2720dda55661e40d6cb18a8f813bed50c2cf6158d709a116e1bdc1%22%7D%7D`
      );
      return response?.data?.data?.lostDogsWayCommonTasks?.items;
    } catch (error) {
      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting common tasks:</b>: ${error.message}`
      );
      return null;
    }
  }

  async get_done_common_tasks(http_client) {
    try {
      const response = await http_client.get(
        `${app.apiUrl}?operationName=lostDogsWayUserCommonTasksDone&variables=%7B%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%2299a387150779864b6b625e336bfd28bbc8064b66f9a1b6a55ee96b8777678239%22%7D%7D`
      );
      return response?.data?.data?.lostDogsWayUserCommonTasksDone;
    } catch (error) {
      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting common tasks:</b>: ${error.message}`
      );
      return null;
    }
  }

  async perform_task(http_client, task_id) {
    try {
      const data = {
        operationName: "lostDogsWayCompleteTask",
        variables: {
          type: task_id,
        },
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash:
              "4c8a2a1192a55e9e84502cdd7a507efd5c98d3ebcb147e307dafa3ec40dca60a",
          },
        },
      };
      const response = await http_client.post(
        `${app.apiUrl}`,
        JSON.stringify(data)
      );
      return response.data?.data?.lostDogsWayCompleteTask;
    } catch (error) {
      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>performing task:</b> ${error.message}`
      );
      return null;
    }
  }
  async vote(http_client, card) {
    try {
      const event_data = {
        mainScreenVote: true,
        timeMs: Date.now(),
      };
      await this.save_game_event(http_client, event_data, "MainScreen Vote");
      await sleep(_.random(2, 4));
      const data = {
        operationName: "lostDogsWayVote",
        variables: {
          value: String(card),
        },
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash:
              "6fc1d24c3d91a69ebf7467ebbed43c8837f3d0057a624cdb371786477c12dc2f",
          },
        },
      };
      const response = await http_client.post(
        `${app.apiUrl}`,
        JSON.stringify(data)
      );

      return response.data?.data?.lostDogsWayVote;
    } catch (error) {
      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>voting:</b> ${error.message}`
      );
      return null;
    }
  }

  async view_prev_votes(http_client) {
    try {
      const data = {
        operationName: "lostDogsWayViewPrevRound",
        variables: {},
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash:
              "9d71c4ff04d1f8ec24f23decd0506e7b1b8a0c70ea6bb4c98fcaf6904eb96c35",
          },
        },
      };
      const response = await http_client.post(
        `${app.apiUrl}`,
        JSON.stringify(data)
      );
      return response.data?.data?.lostDogsWayCompleteTask;
    } catch (error) {
      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>verifying previous votes:</b> ${error.message}`
      );
      return null;
    }
  }

  async perform_common_task(http_client, task_id) {
    try {
      const data = {
        operationName: "lostDogsWayCompleteCommonTask",
        variables: {
          id: task_id,
        },
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash:
              "313971cc7ece72b8e8edce3aa0bc72f6e40ef1c242250804d72b51da20a8626d",
          },
        },
      };
      const response = await http_client.post(
        `${app.apiUrl}`,
        JSON.stringify(data)
      );

      const event_data = {
        timeMs: Date.now(),
        yourDogGetFreeDogs: true,
      };

      await this.save_game_event(http_client, event_data, "Complete Task");

      if (
        _.isEmpty(response?.data?.data) &&
        !_.isEmpty(response?.data?.errors)
      ) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ${response?.data?.errors[0]?.message} <la>[${task_id}]</la>`
        );
        return null;
      }
      return response.data?.data?.lostDogsWayCompleteTask;
    } catch (error) {
      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>performing common task:</b> ${error.message}`
      );
      return null;
    }
  }

  async #register(http_client) {
    try {
      const data = {
        operationName: "lostDogsWayGenerateWallet",
        variables: {},
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash:
              "d78ea322cda129ec3958fe21013f35ab630830479ea9510549963956127a44dd",
          },
        },
      };
      const response = await http_client.post(
        `${app.apiUrl}`,
        JSON.stringify(data)
      );
      return response?.data?.data?.lostDogsWayGenerateWallet?.user;
    } catch (error) {
      if (error?.response?.data) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b> registering a user:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b> registering a user:</b> ${error.message}`
        );
      }
      return null;
    }
  }

  async save_game_event(http_client, data, event_name) {
    try {
      const json = {
        operationName: "lostDogsWaySaveEvent",
        variables: {
          data: {
            events: [data],
            utm: {
              campaign: null,
              content: null,
              medium: null,
              source: null,
              term: null,
            },
          },
        },
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash:
              "0b910804d22c9d614a092060c4f1809ee6e1fc0625ddb30ca08ac02bac32936a",
          },
        },
      };
      const response = await http_client.post(
        `${app.apiUrl}`,
        JSON.stringify(json)
      );

      if (response?.data?.data?.lostDogsWaySaveEvent == true) {
        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Game event <la>${event_name}</la> saved successfully`
        );
      } else {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} |  Failed to save game event: <la>${event_name}</la>`
        );
      }
    } catch (error) {
      if (error?.response?.data) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>saving game event:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>saving game event:</b> ${error.message}`
        );
      }
      return null;
    }
  }
}

module.exports = ApiRequest;
