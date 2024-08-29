@echo off
echo Copying .env-general-example to .env-general...
copy .env-general-example .env-general
echo Copying .env-blum-example to .env-blum...
copy .env-blum-example .env-blum
echo Copying .env-tomarket-example to .env-tomarket...
copy .env-tomarket-example .env-tomarket
echo Copying .env-rockyrabbit-example to .env-rockyrabbit...
copy .env-rockyrabbit-example .env-rockyrabbit
echo Please edit the .env-general file to add your API_ID and API_HASH after Installation.
echo Installing dependencies...
npm install
pause