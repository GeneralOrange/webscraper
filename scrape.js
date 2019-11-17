const fs = require('fs');
const writeStream = fs.createWriteStream('games.json');

const puppeteer = require('puppeteer');

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
        title: data.querySelector('.search-results-row-game-title').innerText,
        link: data.href,
        info: {
          lowest_price: data.querySelector('.search-results-row-price').innerText.trim(),
          year: data.querySelector('.search-results-row-game-infos').innerText.split('-')[0],
          category: data.querySelector('.search-results-row-game-infos').innerText.split('-')[1],
          grade: data.querySelector('.metacritic-button').innerText.trim()
        }
      }));

      return games;
    });

    for (let game of gamesOnPage) {
        try {
          await page.goto(game.link);
          console.log(`Scraping: ${game.link}`);
        } catch(error){
          console.log(error);
        }
        
        game.img = await page.$eval('.content-box img.mx-auto.d-block.img-fluid', image => image.src);

        game.offers = await page.$$eval('.offers-table .offers-table-row', offer => {
          var offers = offer.map(data => ({
            seller: data.querySelector('.offers-merchant-name').innerText,
            platform: data.querySelector('.offers-edition-region').innerText,
            price: data.querySelector('.price [data-offer-price-container]').innerText
          }));

          return offers;
        });

        game.config = await page.$$eval('#config ul', (config, key) => {
          var config;
          if(key < 1){
            config += config.map(data => ({
              min_sys_req: Array.from(data.querySelectorAll('li')).map(li => ({
                spec: li.innerText
              }))
            })); 
          } else {
            config += config.map(data => ({
              rec_sys_req: Array.from(data.querySelectorAll('li')).map(li => ({
                spec: li.innerText
              }))
            }));
          }
        
          return config;
        });
    };

    if(gamesOnPage.length < 1){
      console.log(`Terminated scraping on page: ${url}`);
      return gamesOnPage;
    } else {
      const nextNumber = parseInt(url.match(/page-(\d+)$/)[1], 10) + 1;
      const nextUrl = `https://www.allkeyshop.com/blog/catalogue/category-pc-games-all/page-${nextNumber}`;

      //Add limitation for testing
      if(nextNumber === 2){
        return gamesOnPage;
      } else {
        return gamesOnPage.concat(await extractGames(nextUrl));
      }
    }
  };

  const browser = await puppeteer.launch();
  
  const firstUrl = `https://www.allkeyshop.com/blog/catalogue/category-pc-games-all/page-1`;

  const games = await extractGames(firstUrl);

  await browser.close();

  console.log('Scraping done...');

  writeStream.write(JSON.stringify(games));
})();

