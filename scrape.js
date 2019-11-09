const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const writeStream = fs.createWriteStream('games.json');


request('https://www.allkeyshop.com/blog/', (error, response, html) => {
    if(!error && response.statusCode == 200) {
        const $ = cheerio.load(html);

        let games = {
            games: [
        ]};

        $('#Top25 .topclick-list-element').each((i, el) => {
            
            const item = $(el).find('.topclick-list-element-game .topclick-list-element-game-title').text();
            const merchant = $(el).find('.topclick-list-element-game .topclick-list-element-game-merchant').text();
            const price = $(el).find('.topclick-list-element-price').text();

            const game = {
                title: item,
                merchant: merchant,
                price: price
            }

            games.games.push(game);
            
            
        });

        // Write row to csv
        writeStream.write(JSON.stringify(games));

        console.log('Scraping done...');
    }
});