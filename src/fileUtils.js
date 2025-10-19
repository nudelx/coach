const { readFile, writeFile, mkdir } = require('fs/promises');
const { dirname } = require('path');

const readJsonFile = async (filePath, fallbackValue) => {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      if (fallbackValue !== undefined) {
        return fallbackValue;
      }
      throw new Error(`Missing required file: ${filePath}`);
    }
    throw error;
  }
};

const writeJsonFile = async (filePath, content) => {
  const directory = dirname(filePath);
  await mkdir(directory, { recursive: true });
  const serialized = JSON.stringify(content, null, 2);
  await writeFile(filePath, serialized, 'utf8');
};

module.exports = {
  readJsonFile,
  writeJsonFile,
};
