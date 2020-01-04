const xml2js = require('xml2js');
const ora = require('ora');
const chalk = require('chalk');
const utils = require('./utils');

const findCategory = (categories, id) => categories.find((cate) => cate.id === id);
async function readRSS(rssUrl) {
  return utils.getUrl(rssUrl);
}
const get$Val = (v, key) => v.$ && v.$[key];
const pickVal = (obj, keyList) => keyList.reduce(
  (result, key) => {
    let pair = key;
    if (typeof key === 'string') {
      pair = { from: key, to: key };
    }
    const handle = pair.handle || ((v) => v);
    return { ...result, [pair.to]: handle(obj[pair.from]) };
  },
  {},
);

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

function extractBasicInfo(podcastConfig, rssObj) {
  let basicInfo = {};
  const { channel } = rssObj;
  if (channel) {
    const allEpisode = channel.item || [];
    let latestEpisode = allEpisode[0];
    if (podcastConfig.sort === 'asc') {
      latestEpisode = allEpisode[allEpisode.length - 1];
    }
    const averageDuration = getAverageDuration(allEpisode);
    const pubDate = (latestEpisode && latestEpisode.pubDate) || channel.pubDate;
    basicInfo = {
      ...basicInfo,
      ...pickVal(channel, [
        'title', 'link', 'language', 'pubDate',
        { from: 'description', to: 'description', handle: (str) => str.replace(/<[^>]*>?/gm, '') },
        { from: 'itunes:keywords', to: 'keywords' },
        { from: 'itunes:author', to: 'author' },
      ]),
      ituneCategory: get$Val(channel['itunes:category'], 'text'),
      image: get$Val(channel['itunes:image'], 'href'),
      episodeNumber: allEpisode.length,
      lastUpdated: pubDate ? new Date(pubDate).toLocaleDateString() : null,
      averageDuration,
      averageDurationFormated: utils.secondsToHMS(averageDuration),
      latestEpisode,
    };
  }
  return basicInfo;
}


async function updateRSS() {
  const content = utils.readTomlData('./config/content.toml');
  const { podcasts = [], categories } = content;
  const failed = [];
  const result = [];
  for (let i = 0; i < podcasts.length; i += 1) {
    const podcast = podcasts[i];
    const podcastCategoryIds = podcast.cate.split(',');
    const fullCategories = podcastCategoryIds.map((cateId) => findCategory(categories, cateId));
    const prefix = (text) => `${chalk.bold(`[${podcast.name}]`)} ${text}`;

    // read rss content from rss feed
    const spinner = ora(prefix('loading RSS')).start();
    let jsonObj = { config: podcast };
    let rssResult;
    let rssXml;
    try {
      rssResult = await readRSS(podcast.rss);
      rssXml = rssResult.data;
    } catch (err) {
      failed.push(podcast);
      spinner.fail(prefix(chalk.red(`Read From RSS feed Failed. Detail: ${err.message}`)));
      // eslint-disable-next-line no-continue
    }

    if (rssXml) {
      // parsing xml to json
      spinner.text = prefix('Parsing RSS xml file to json');
      try {
        const originRssObj = await xml2js.parseStringPromise(rssXml, { explicitArray: false });
        jsonObj = {
          ...jsonObj,
          categories: fullCategories,
          basicInfo: extractBasicInfo(podcast, originRssObj.rss),
        };
      } catch (err) {
        failed.push(podcast);
        spinner.fail(prefix(chalk.red(`Parsing RSS xml feed Failed. Detail: ${err.message}`)));
      }

      try {
        // writing to local file system
        spinner.text = prefix('writeing RSS xml file');
        await utils.saveRSSToLocalFile(`${podcast.name}.xml`, rssXml);
        await utils.saveRSSToLocalFile(`${podcast.name}.json`, JSON.stringify(jsonObj, null, 2));
      } catch (err) {
        failed.push(podcast);
        spinner.fail(prefix(chalk.red(`Write to local file failed. Detail: ${err.message}`)));
      }
    }

    result.push(jsonObj);
    spinner.succeed(prefix('updated'));
  }
  return { podcasts: result, failed, lastUpdated: Date.now() };
}

module.exports = updateRSS;
