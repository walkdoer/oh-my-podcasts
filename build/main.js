const chalk = require('chalk');
const render = require('./render');
const updateRss = require('./updateRSS');
const utils = require('./utils');

const renderOnly = (process.argv[2] === '--renderonly');

const renderFinish = () => {
  console.log(chalk.green('html and readme updated'));
};
if (renderOnly) {
  render().then(renderFinish);
} else {
  updateRss()
    .then((result) => {
      console.log(`
    ${chalk.green.bold('Success')}: ${result.podcasts.length - result.failed.length}
    ${chalk.red.bold('Failed')}: ${result.failed.length}
      `);
      return utils.saveRSSJsonList(JSON.stringify(result.podcasts, null, 2));
    })
    .then(render)
    .then(renderFinish)
    .catch((err) => {
      console.error(err);
      process.exit(-1);
    });
}