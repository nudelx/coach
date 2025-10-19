const { join } = require('path');
const { readJsonFile } = require('./fileUtils');

const configPath = join(__dirname, '..', 'config', 'lesson-config.json');

const loadConfig = async () => {
  const config = await readJsonFile(configPath);
  validateConfig(config);
  return config;
};

const validateConfig = (config) => {
  if (!config || !Array.isArray(config.kids) || config.kids.length === 0) {
    throw new Error('Config file must include at least one kid in the "kids" array.');
  }

  config.kids.forEach((kid) => {
    if (!kid.id || !kid.email) {
      throw new Error('Each kid must include "id" and "email" fields.');
    }
    if (kid.startingLevel === undefined) {
      throw new Error(`Kid "${kid.id}" is missing "startingLevel".`);
    }
  });

  if (!config.sender || !config.sender.email) {
    throw new Error('Config file must include a "sender" with an email.');
  }
};

module.exports = {
  loadConfig,
  configPath,
};
