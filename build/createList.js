const fs = require('fs');
const path = require('path');
const toml = require('toml');
const utils = require('./utils');




async function readRSS(rssUrl) {
  return utils.getUrl(rssUrl);
}

async function mainProcess() {
  const content = utils.readTomlData('./data/content.toml');
  const { podcasts } = content;
  for (let i = 0; i < podcasts.length; i++) {
    const podcast = podcasts[i];
    const rssXml = await readRSS(podcast.rss);
    console.log(rssXml);
  }
}

mainProcess()
.then(() => {
  console.log('done!');
})
.catch((err) => {
  console.error(err);
});