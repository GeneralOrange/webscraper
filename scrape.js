const fs = require('fs');
const puppeteer = require('puppeteer');
const translate = require('@vitalets/google-translate-api');

function getFormattedTime() {
  var today = new Date();
  var y = today.getFullYear();
  // JavaScript months are 0-based.
  var m = today.getMonth() + 1;
  var d = today.getDate();
  var h = today.getHours();
  var mi = today.getMinutes();
  var s = today.getSeconds();
  return y + "-" + m + "-" + d + "-" + h + "-" + mi + "-" + s;
}

(async () => {
  const extractGames = async url => {
    const page = await browser.newPage();

    //Go to pagination page
    await page.goto(url);
    console.log(`Scraping: ${url}`);

    //Scrape data we need
    const gamesOnPage = await page.$$eval('.search-results-row-link', el => {
      var games = el.map((data, key) => ({
        id: key,
        link: data.href,
        info: {
          title: data.querySelector('.search-results-row-game-title').innerText,
          year: data.querySelector('.search-results-row-game-infos').innerText.split('-')[0],
          category: data.querySelector('.search-results-row-game-infos').innerText.split('-')[1],
          grade: data.querySelector('.metacritic-button').innerText.trim()
        },
        offers: {
          lowest_price: data.querySelector('.search-results-row-price').innerText.trim()
        }
      }));

      return games;
    });

    //Loop through fetched URLS
    for (let game of gamesOnPage) {
        try {
          await page.goto(game.link);
          console.log(`Scraping: ${game.link}`);
        } catch(error){
          console.log(error);
        }
        
        //Add more to info
        game.info.thumbnail = await page.$eval('.content-box img.mx-auto.d-block.img-fluid', image => image.src);

        game.info.media = await page.$$eval('.game-images-slide .slick-track .gallery-slider', el => {
          var media = el.map(data => ({
            item: data.querySelector('a').href
          }));

          return media;
        });

        game.info.description = await page.$eval('#info', el => {
          var desc = Array.from(el.querySelectorAll('p'));

          //Remove first value in array, because we dont want it
          desc.splice(0,1);

          var description = desc.map(data => data.innerText).join(' ');

          return {
            english: description
          };
        });

        var new_offers = await page.$$eval('.offers-table .offers-table-row', offer => {
          var offers = offer.map(data => ({
            seller: data.querySelector('.offers-merchant-name').innerText,
            platform: data.querySelector('.offers-edition-region').innerText,
            price: data.querySelector('.price [data-offer-price-container]').innerText
          }));

          return offers;
        });

        game.offers = Object.assign({}, game.offers, new_offers); 

        game.config = await page.$$eval('#config ul', config => {
          var configs = config.map((data) => ({
            specs: Array.from(data.querySelectorAll('li')).map(i => ({
              spec: i.innerText
            }))
          }))

          return configs;
        });
    };

    if(gamesOnPage.length < 1){
      console.log(`Terminated scraping on page: ${url}`);
      return gamesOnPage;
    } else {
      const nextNumber = parseInt(url.match(/page-(\d+)$/)[1], 10) + 1;
      const nextUrl = `https://www.allkeyshop.com/blog/catalogue/category-pc-games-all/page-${nextNumber}`;

      //Add limitation for testing
      if(nextNumber === 25){
        console.log(`Terminated scraping on page: ${url}`);
        return gamesOnPage;
      } else {
        return gamesOnPage.concat(await extractGames(nextUrl));
      }
    }
  };

  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  
  const firstUrl = `https://www.allkeyshop.com/blog/catalogue/category-pc-games-all/page-1`;

  const games = await extractGames(firstUrl);

  await browser.close();

  console.log('Scraping done...');

  console.log('Creating file to store data...');
  const date = getFormattedTime();
  const writeStream = fs.createWriteStream('./games/games_'+date+'.json');

  writeStream.write(JSON.stringify(games));

  console.log('Data stored!');
})();

