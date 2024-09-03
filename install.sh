#!/bin/bash


echo "Copying .env-general-example to .env-general..."
cp .env-general-example .env-general

echo "Copying .env-blum-example to .env-blum..."
cp .env-blum-example .env-blum

echo "Copying .env-tomarket-example to .env-tomarket..."
cp .env-tomarket-example .env-tomarket

echo "Copying .env-rockyrabbit-example to .env-rockyrabbit..."
cp .env-rockyrabbit-example .env-rockyrabbit

echo "Copying .env-timefarm-example to .env-timefarm..."
cp .env-timefarm-example .env-timefarm

echo "Copying .env-dotcoin-example to .env-dotcoin..."
cp .env-dotcoin-example .env-dotcoin

echo "Copying .env-lostdogs-example to .env-lostdogs..."
cp .env-lostdogs-example .env-lostdogs

echo "Copying .env-major-example to .env-major..."
cp .env-major-example .env-major

echo "Please edit the .env-general file to add your API_ID and API_HASH after Installation."

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if Node.js is installed
if command_exists node; then
  echo "Preparing to install npm packages..."
else
  echo "Node.js is not installed. Installing Node.js..."

  # Install Node.js (This assumes a Debian-based system like Ubuntu)
  curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
  sudo apt-get install -y nodejs

  # Verify installation
  if command_exists node; then
    echo "Node.js successfully installed."
  else
    echo "Failed to install Node.js. Exiting."
    exit 1
  fi
fi

# Install npm packages
echo "Installing npm packages..."
npm install

# Verify installation of npm packages
if [ $? -eq 0 ]; then
  echo "npm packages successfully installed."
else
  echo "Failed to install npm packages. Exiting."
  exit 1
fi

read -p "Press any key to continue..."
