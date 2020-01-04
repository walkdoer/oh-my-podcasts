const fs = require('fs');
const path = require('path');
const toml = require('toml');
const Mustache = require('mustache');
const util = require('./utils');

const currentWorkDirectory = process.cwd();

function readTpl(tplName) {
  return path.resolve(currentWorkDirectory, `./tpl/${tplName}`);
}

function readTomlData(filePath) {
  const dataPath = path.resolve(currentWorkDirectory, filePath);
  const tomlContent = fs.readFileSync(dataPath);
  return toml.parse(tomlContent);
}

function readSiteData() {
  return readTomlData('./config/site.toml');
}

async function readContentData() {
  const result = await util.getRSSJsonList();
  return result;
}

function formateDate() {
  return function formatter(rawDate, r) {
    const t = parseInt(r(rawDate), 10);
    return new Date(t).toLocaleString();
  };
}

function genHtml(siteData, content) {
  const tplPath = readTpl('index.mustache');
  const tplContent = fs.readFileSync(tplPath, 'utf-8');
  const renderedHtml = Mustache.render(tplContent, { site: siteData, content, formateDate });
  // create index.html
  const indexPath = path.resolve(currentWorkDirectory, './public/index.html');
  fs.writeFileSync(indexPath, renderedHtml);
  console.log(`page created in ${indexPath}`);
}

function genReadme(siteData, content) {
  const tplPath = readTpl('readme.mustache');
  const tplContent = fs.readFileSync(tplPath, 'utf-8');
  const renderedContent = Mustache.render(tplContent, { site: siteData, content, formateDate });
  // create readme.md
  fs.writeFileSync(path.resolve(currentWorkDirectory, './readme.md'), renderedContent);
}

async function render() {
  const siteData = readSiteData();
  siteData.year = new Date().getFullYear();
  const content = await readContentData();
  genHtml(siteData, content);
  genReadme(siteData, content);
  return { success: true };
}

module.exports = render;
