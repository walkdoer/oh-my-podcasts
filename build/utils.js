const fs = require('fs');
const path = require('path');
const util = require('util');
const toml = require('toml');
const axios = require('axios');

const currentWorkDirectory = process.cwd();
const rssDir = path.resolve(currentWorkDirectory, './rss');
const dataDir = path.resolve(currentWorkDirectory, './data');
const writeFilePromise = util.promisify(fs.writeFile);
const readFilePromise = util.promisify(fs.readFile);
const DATA_RSS_PATH = path.resolve(dataDir, 'rss.json');

if (!fs.existsSync(rssDir)) {
  fs.mkdirSync(rssDir);
}

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}
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

function saveRSSJsonList(content) {
  return writeFilePromise(DATA_RSS_PATH, content);
}

function getRSSJsonList() {
  return readFilePromise(DATA_RSS_PATH, 'utf-8').then((content) => JSON.parse(content));
}

function secondsToHMS(time) {
  const arr = [];
  let t = time;
  while (t > 0) {
    const s = t % 60;
    arr.push(s > 9 ? s : `0${s}`);
    t = Math.floor(t / 60);
  }
  return arr.reverse().join(':');
}

module.exports = {
  writeFilePromise,
  readTomlData,
  getUrl,
  saveRSSToLocalFile,
  saveRSSJsonList,
  getRSSJsonList,
  secondsToHMS,
};
