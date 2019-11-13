const fs = require('fs');
const writeStream = fs.createWriteStream('games.json');

const puppeteer = require('puppeteer');

(async () => {
  const extractGames = async url => {
    const page = await browser.newPage();

    await page.goto(url);
    console.log(`Scraping: ${url}`);

    //Scrape data we need
    const gamesOnPage = await page.evaluate( ()=> {
      return Array.from(document.querySelectorAll('.search-results-row-link')).map((data, key) => ({
        id: key,
        title: data.querySelector('.search-results-row-game-title').innerText,
        link: data.href,
        info: {
          price: data.querySelector('.search-results-row-price').innerText.trim(),
          year: data.querySelector('.search-results-row-game-infos').innerText.split('-')[0],
          category: data.querySelector('.search-results-row-game-infos').innerText.split('-')[1],
          grade: data.querySelector('.metacritic-button').innerText.trim()
        }
      }));
    });

    await page.close();

    if(gamesOnPage.length < 1){
      console.log(`Terminated scraping on page: ${url}`);
      return gamesOnPage;
    } else {
      const nextNumber = parseInt(url.match(/page-(\d+)$/)[1], 10) + 1;
      const nextUrl = `https://www.allkeyshop.com/blog/catalogue/category-pc-games-all/page-${nextNumber}`;

      //Add limitation for testing
      if(nextNumber === 5){
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

