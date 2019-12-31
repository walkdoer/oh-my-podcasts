const fs = require('fs');
const path = require('path');
const util = require('util');
const toml = require('toml');
const axios = require('axios');

const currentWorkDirectory = process.cwd();
const rssDir = path.resolve(currentWorkDirectory, './rss');
const writeFilePromise = util.promisify(fs.writeFile);


function readTomlData(filePath) {
  const dataPath = path.resolve(currentWorkDirectory, filePath);
  const tomlContent = fs.readFileSync(dataPath);
  return toml.parse(tomlContent);
}

function getUrl(url) {
  return axios.get(url);
}

function saveRSSToLocalFile(filename, content) {
  const writePath = path.resolve(rssDir, filename);
  return writeFilePromise(writePath, content);
}

module.exports = {
  readTomlData,
  getUrl,
  saveRSSToLocalFile,
};
