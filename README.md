> [<img src="https://img.shields.io/badge/Telegram-%40Me-orange">](https://t.me/roddyfred)

![img1](./.github/images/hero.png)

# Use Node.Js 18 or greater

## Available Bots

| Bots                    | Status |
| ----------------------- | :----: |
| Blum                    |   ✅   |
| Rocky Rabbit            |   ✅   |
| ToMarket                |   ✅   |
| Dotcoin                 |   ✅   |
| Major                   |   ✅   |
| Timefarm                |   ✅   |
| PocketFi                |   ✅   |
| Character X             |   ⏳   |
| BunnyApp                |   ⏳   |
| Stay tune, more to come |   👻   |

### [How to get and add query id](https://github.com/Freddywhest/DropWizard/blob/main/AddQueryId.md)

## Config Files

| Files                           | Description                                                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **`.env-general`**              | Config file for `DropWizard`. [How to configure DropWizard](#settings)                                                             |
| **`.env-blum`**                 | Config file for `Blum`. [How to configure Blum](https://github.com/Freddywhest/BlumBot/blob/main/README.md)                        |
| **`.env-rockyrabbit`**          | Config file for `Rocky Rabbit`. [How to configure Rocky Rabbit](https://github.com/Freddywhest/RockyRabbitBot/blob/main/README.md) |
| **`.env-tomarket`**             | Config file for `ToMarket`. [How to configure ToMarket](https://github.com/Freddywhest/ToMarketBot/blob/main/README.md)            |
| **`.env-major`**                | Config file for `Major`. [How to configure Major](https://github.com/Freddywhest/MajorBot/blob/main/README.md)                     |
| **`.env-dotcoin`**              | Config file for `Dotcoin`. [How to configure Dotcoin](https://github.com/Freddywhest/DotcoinBot/blob/main/README.md)               |
| **`.env-timefarm`**             | Config file for `Timefarm`. [How to configure Timefarm](https://github.com/Freddywhest/TimefarmBot/blob/main/README.md)            |
| **`.env-pocketfi`**             | Config file for `PocketFi`. [How to configure Timefarm](https://github.com/Freddywhest/PocketFiBot/blob/main/README.md)            |
| **`queryIds_blum.json`**        | For setting query ids for `Blum`                                                                                                   |
| **`queryIds_rockyrabbit.json`** | For setting query ids for `ROCKY RABBIT`                                                                                           |
| **`queryIds_tomarket.json`**    | For setting query ids for `ToMarket`                                                                                               |
| **`queryIds_major.json`**       | For setting query ids for `Major`                                                                                                  |
| **`queryIds_dotcoin.json`**     | For setting query ids for `Dotcoin`                                                                                                |
| **`queryIds_timefarm.json`**    | For setting query ids for `Timefarm`                                                                                               |
| **`queryIds_pocketfi.json`**    | For setting query ids for `PocketFi`                                                                                               |

## [Settings](https://github.com/FreddyWhest/DropWizard/blob/main/.env-general-example)

| Settings                     | Description                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------- |
| **API_ID / API_HASH**        | Platform data from which to launch a Telegram session (stock - Android)      |
| **BLUM**                     | Whether to start `Blum` when the bot start (True / False)                    |
| **TOMARKET**                 | Whether to start `ToMarket` when the bot start (True / False)                |
| **DOTCOIN**                  | Whether to start `Dotcoin` when the bot start (True / False)                 |
| **MAJOR**                    | Whether to start `Major` when the bot start (True / False)                   |
| **TIMEFARM**                 | Whether to start `Timefarm` when the bot start (True / False)                |
| **ROCKYRABBIT**              | Whether to start `Rocky Rabbit` when the bot start (True / False)            |
| **POCKETFI**                 | Whether to start `PocketFi` when the bot start (True / False)                |
| **USE_QUERY_ID_BLUM**        | Whether to use query ids instead of sessions `(BLUM)` (True / False)         |
| **USE_QUERY_ID_TOMARKET**    | Whether to use query ids instead of sessions `(TOMARKET)` (True / False)     |
| **USE_QUERY_ID_ROCKYRABBIT** | Whether to use query ids instead of sessions `(ROCKY RABBIT)` (True / False) |
| **USE_QUERY_ID_DOTCOIN**     | Whether to use query ids instead of sessions `(DOTCOIN)` (True / False)      |
| **USE_QUERY_ID_MAJOR**       | Whether to use query ids instead of sessions `(MAJOR)` (True / False)        |
| **USE_QUERY_ID_TIMEFARM**    | Whether to use query ids instead of sessions `(TIMEFARM)` (True / False)     |
| **USE_QUERY_ID_POCKETFI**    | Whether to use query ids instead of sessions `(POCKETFI)` (True / False)     |
| **USE_PROXY_FROM_FILE**      | Whether to use proxy from the `bot/config/proxies.js` file (True / False)    |

## Installation

You can download [**Repository**](https://github.com/FreddyWhest/DropWizard) by cloning it to your system and installing the necessary dependencies:

```shell
~ >>> git clone https://github.com/FreddyWhest/DropWizard.git
~ >>> cd DropWizard

#Linux and MocOS
~/DropWizard >>> chmod +x check_node.sh
~/DropWizard >>> ./check_node.sh

OR

~/DropWizard >>> npm install
~/DropWizard >>> cp .env-general-example .env-general
~/DropWizard >>> cp .env-blum-example .env-blum
~/DropWizard >>> cp .env-tomarket-example .env-tomarket
~/DropWizard >>> cp .env-rockyrabbit-example .env-rockyrabbit
~/DropWizard >>> nano .env-general # Here you must specify your API_ID and API_HASH , the rest is taken by default
~/DropWizard >>> node index.js

#Windows
1. Double click on INSTALL.bat in DropWizard directory to install the dependencies
2. Double click on START.bat in DropWizard directory to start the bot

OR

~/DropWizard >>> npm install
~/DropWizard >>> cp .env-general-example .env-general
~/DropWizard >>> cp .env-blum-example .env-blum
~/DropWizard >>> cp .env-tomarket-example .env-tomarket
~/DropWizard >>> cp .env-rockyrabbit-example .env-rockyrabbit
~/DropWizard >>> # Edit .env-general and set your API_ID and API_HASH
~/DropWizard >>> node index.js
```

Also for quick launch you can use arguments, for example:

```shell
~/DropWizard >>> node index.js --action=1

OR

~/DropWizard >>> node index.js --action=2

#1 - Create session
#2 - Run clicker
```
