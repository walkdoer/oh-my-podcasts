const xml2js = require('xml2js');
const ora = require('ora');
const chalk = require('chalk');
const utils = require('./utils');

const findCategory = (categories, id) => categories.find((cate) => cate.id === id);

async function readRSS(rssUrl) {
  return utils.getUrl(rssUrl);
}
const get$Val = (v, key) => v.$ && v.$[key];
const pickVal = (obj, keyList) => {
  return keyList.reduce(
    (result, key) => {
      let pair = key;
      if (typeof key === 'string') {
        pair = { from: key, to: key };
      }
      return { ...result, [pair.to]: obj[pair.from] };
    },
    {},
  );
};

function getAverageDuration(episodes) {
  if (!episodes || episodes.length === 0) {
    return null;
  }
  const getSeconds = (str) => {
    let s = 0;
    if (str.indexOf(':') >= 0) {
      const p = str.split(':');
      let m = 1;
      while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
      }
    } else {
      s = parseInt(str, 10);
    }
    return s;
  };
  const durations = episodes
    .map((episode) => {
      const durationString = episode['itunes:duration'];
      return getSeconds(durationString) || 0;
    })
    .filter((val) => val > 0)
    .sort((a, b) => b - a);

  return Math.round(durations.reduce((total, val) => total + val, 0) / durations.length);
}
function extractBasicInfo(rssObj) {
  let basicInfo = {};
  const { channel } = rssObj;
  if (channel) {
    const allEpisode = channel.item || [];
    const latestEpisode = allEpisode[0];
    basicInfo = {
      ...basicInfo,
      ...pickVal(channel, [
        'title', 'link', 'description', 'language',
        { from: 'itunes:keywords', to: 'keywords' },
        { from: 'itunes:author', to: 'author' },
      ]),
      ituneCategory: get$Val(channel['itunes:category'], 'text'),
      image: get$Val(channel['itunes:image'], 'href'),
      episodeNumber: allEpisode.length,
      averageDuration: getAverageDuration(allEpisode),
      latestEpisode,
    };
  }
  return basicInfo;
}


async function mainProcess() {
  const content = utils.readTomlData('./config/content.toml');
  const { podcasts = [], categories } = content;
  const failed = [];
  for (let i = 0; i < podcasts.length; i += 1) {
    const podcast = podcasts[i];
    const podcastCategoryIds = podcast.cate.split(',');
    const fullCategories = podcastCategoryIds.map((cateId) => findCategory(categories, cateId));
    const prefix = (text) => `${chalk.bold(`[${podcast.name}]`)} ${text}`;

    // read rss content from rss feed
    const spinner = ora(prefix('loading RSS')).start();
    let rssResult;
    let rssXml;
    try {
      rssResult = await readRSS(podcast.rss);
      rssXml = rssResult.data;
    } catch (err) {
      failed.push(podcast);
      spinner.fail(prefix(chalk.red(`Read From RSS feed Failed. Detail: ${err.message}`)));
      // eslint-disable-next-line no-continue
      continue;
    }


    // parsing xml to json
    let jsonObj;
    spinner.text = prefix('Parsing RSS xml file to json');
    try {
      const originRssObj = await xml2js.parseStringPromise(rssXml, { explicitArray: false });
      jsonObj = {
        lastUpdated: Date.now(),
        categories: fullCategories,
        basicInfo: extractBasicInfo(originRssObj.rss),
        originRssObj,
      };
    } catch (err) {
      failed.push(podcast);
      spinner.fail(prefix(chalk.red(`Parsing RSS xml feed Failed. Detail: ${err.message}`)));
      continue;
    }

    try {
      // writing to local file system
      spinner.text = prefix('writeing RSS xml file');
      await utils.saveRSSToLocalFile(`${podcast.name}.xml`, rssXml);
      await utils.saveRSSToLocalFile(`${podcast.name}.json`, JSON.stringify(jsonObj, null, 2));
    } catch (err) {
      failed.push(podcast);
      spinner.fail(prefix(chalk.red(`Write to local file failed. Detail: ${err.message}`)));
      continue;
    }

    spinner.succeed(prefix('updated'));
  }
  return { podcasts, failed };
}

mainProcess()
  .then((result) => {
    console.log(`
  ${chalk.green.bold('Success')}: ${result.podcasts.length - result.failed.length}
  ${chalk.red.bold('Failed')}: ${result.failed.length}
    `);
  })
  .catch((err) => {
    console.error(err);
    process.exit(-1);
  });
