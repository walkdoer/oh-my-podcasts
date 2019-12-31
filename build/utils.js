const fs = require('fs');
const path = require('path');
const toml = require('toml');
const axios = require('axios');

const currentWorkDirectory = process.cwd();

function readTomlData(filePath) {
  const dataPath = path.resolve(currentWorkDirectory, filePath);
  const tomlContent = fs.readFileSync(dataPath);
  return toml.parse(tomlContent);
}

function getUrl(url) {
  return axios.get(url);
}

module.exports = {
  readTomlData,
  getUrl,
};
