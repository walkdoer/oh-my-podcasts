const fs = require('fs');
const path = require('path');
const toml = require('toml');
const Mustache = require('mustache');
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
  return readTomlData('./data/site.toml');
}

function readContentData() {
  return readTomlData('./data/content.toml');
}

function genHtml(siteData, listData) {
  const tplPath = readTpl('index.mustache');
  const tplContent = fs.readFileSync(tplPath, 'utf-8');
  const renderedHtml = Mustache.render(tplContent, { site: siteData, content: listData });
  // create index.html
  const indexPath = path.resolve(currentWorkDirectory, './index.html');
  fs.writeFileSync(indexPath, renderedHtml);
}

function genReadme(siteData, listData) {
  const tplPath = readTpl('readme.mustache');
  const tplContent = fs.readFileSync(tplPath, 'utf-8');
  const renderedContent = Mustache.render(tplContent, { site: siteData, content: listData });
  // create readme.md
  fs.writeFileSync(path.resolve(currentWorkDirectory, './readme.md'), renderedContent);
}


const siteData = readSiteData();
const content = readContentData();

console.log(content);
genHtml(siteData, content);
genReadme(siteData, content);