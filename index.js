var cron = require('node-cron');
var puppeteer = require('puppeteer');
const {BigQuery} = require('@google-cloud/bigquery');
const config = require('./config.json');

cron.schedule('* * * * *', () => {
    console.log('Cron executing...');
    await puppet();
  });


async function puppet(){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(config.urls[0]);
    page.find
}


  