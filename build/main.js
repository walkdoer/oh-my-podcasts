const chalk = require('chalk');
const render = require('./render');
const updateRss = require('./updateRSS');
const utils = require('./utils');

updateRss()
  .then((result) => {
    console.log(`
  ${chalk.green.bold('Success')}: ${result.podcasts.length - result.failed.length}
  ${chalk.red.bold('Failed')}: ${result.failed.length}
    `);
    return utils.saveRSSJsonList(JSON.stringify(result.podcasts, null, 2));
  })
  .then(render)
  .catch((err) => {
    console.error(err);
    process.exit(-1);
  });
