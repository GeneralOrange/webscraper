const fs = require('fs');
const env = require('process');
const puppeteer = require('puppeteer');

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
    try {
      await page.goto(url, {
        timeout: 0
      });
    } catch(err) {
      console.log(err);
    }
   
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
    }).catch(err => console.log(`- Error: Oops something went wrong: ${err}`));

    //Loop through fetched URLS
    for (let game of gamesOnPage) {
        try {
          await page.goto(game.link, {
            timeout: 0
          });
          console.log(`Scraping: ${game.link}`);
        } catch(err){
          console.log(err);
        }
        
        //Add more to info
        var game_info = await page.$eval('#info ul', el => {
          var extra_info = Array.from(el.querySelectorAll('li')).map(data => data.innerText.toLowerCase());

          if(extra_info[0].indexOf('news')){
            extra_info.splice(0, 1);
          }
          
          return extra_info;
        }).catch(err => console.log(`No extra gameinfo on ${game.link}`));

        game.info = Object.assign({}, game.info, game_info);

        game.info.thumbnail = await page.$eval('.content-box img.mx-auto.d-block.img-fluid', image => image.src).catch(err => console.log(`- Error: Thumbnail not found on ${game.link}`));

        game.info.media = await page.$$eval('.gamepage__slide.gallery-slider', el => {
          var media = el.map(data => ({
            item: data.querySelector('img').src
          }));

          return media;
        }).catch(err => console.log(`- Error: Media not found on ${game.link}`));

        game.info.description = await page.$eval('#info', el => {
          var desc = Array.from(el.querySelectorAll('p'));

          //Remove first value in array, because we dont want it
          desc.splice(0,1);

          var description = desc.map(data => data.innerText).join(' ');
          description.replace('Allkeyshop.com', 'Gamekoopjes.nl');

          return {
            english: description
          };
        }).catch(err => console.log(`- Error: Description not found on ${game.link}`));

        game.info.about = await page.$eval('#about', el => {
          var desc = Array.from(el.querySelectorAll('p'));

          var about = desc.map(data => data.innerText).join(' ');

          return {
            english: about
          };
        }).catch(err => console.log(`- Error: About not found on ${game.link}`));

        var new_offers = await page.$$eval('.offers-table .offers-table-row', offer => {
          var offers = offer.map(data => ({
            seller: data.querySelector('.offers-merchant-name').innerText,
            platform: data.querySelector('.offers-edition-region').innerText,
            price: data.querySelector('.price [data-offer-price-container]').innerText
          }));

          return offers;
        }).catch(err => console.log(`- Error: Offers not found on ${game.link}`));

        game.offers = Object.assign({}, game.offers, new_offers); 

        game.config = await page.$$eval('#config ul', config => {
          var configs = config.map((data) => ({
            specs: Array.from(data.querySelectorAll('li')).map(i => ({
              spec: i.innerText
            }))
          }))

          return configs;
        }).catch(err => console.log(`- Error: Config not found on ${game.link}`));
    };

    if(gamesOnPage.length < 1){
      console.log(`Terminated scraping on page: ${url}`);
      return gamesOnPage;
    } else {
      const nextNumber = parseInt(url.match(/page-(\d+)$/)[1], 10) + 1;
      const nextUrl = `https://www.allkeyshop.com/blog/catalogue/category-pc-games-all/page-${nextNumber}`;

      //Add limitation for testing
      //console.log(process.env.TOTAL_PAGES_SCRAPED);
      if(nextNumber === 10){
        console.log(`Terminated scraping on page: ${url}`);
        return gamesOnPage;
      } else {
        return gamesOnPage.concat(await extractGames(nextUrl));
      }
    }
  };

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
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

