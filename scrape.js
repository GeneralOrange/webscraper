const request = require('request');
const cheerio = require('cheerio');
const getUrls = require('get-urls');

const fs = require('fs');
const writeStream = fs.createWriteStream('games.json');

const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.allkeyshop.com/blog');
  await page.screenshot({path: 'homepage.png'});

  const data = await page.evaluate( ()=> {
    const titles = document.querySelectorAll('.topclick-list-element-game-title');

    const worked_titles = Array.from(titles).map(v => v.innerText);

    return worked_titles;
  })
  await browser.close();

  const games = {
    games: [

    ]
  }

  games.games.push(data);

  writeStream.write(JSON.stringify(games));

  console.log('Scraping done...');

  return data;
})();