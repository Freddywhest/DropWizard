const app = require("../config/app");
const logger = require("../../../../utils/logger");
var _ = require("lodash");

class ApiRequest {
  constructor(session_name, bot_name) {
    this.session_name = session_name;
    this.bot_name = bot_name;
  }

  async get_mining_info(http_client) {
    try {
      const response = await http_client.get(
        `${app.apiUrl}/mining/getUserMining`
      );
      return response?.data;
    } catch (error) {
      console.log(error);

      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while getting mining: ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while getting mining: ${error.message}`
        );
      }

      return null;
    }
  }

  async validate_query_id(http_client) {
    try {
      const response = await http_client.get(
        `${app.apiUrl}/mining/getUserMining`
      );

      if (!_.isEmpty(response?.data)) {
        return true;
      }
      return false;
    } catch (error) {
      if (_.isEmpty(error?.response?.data) || error?.response?.status == 403) {
        return false;
      }

      throw error;
    }
  }

  async claim_mining(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/mining/claimMining`
      );
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>claiming mining:</b>: ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>claiming mining:</b>: ${error.message}`
        );
      }

      return null;
    }
  }

  async create_mining_user(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/mining/createUserMining`
      );
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>creating mining user:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>creating mining user:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async start_param(http_client) {
    try {
      await http_client.get(
        `${app.apiUrl}/getPresetTokens?startParam=1167045062`
      );
      return true;
    } catch (error) {
      if (error?.response?.status === 404) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>getting start param:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting start param:</b> ${error.message}`
        );
      }

      return null;
    }
  }
}

module.exports = ApiRequest;
