const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const writeStream = fs.createWriteStream('games.csv');

// Write Headers
writeStream.write(`Title, Merchant, Price \n`);

request('https://www.allkeyshop.com/blog/', (error, response, html) => {
    if(!error && response.statusCode == 200) {
        const $ = cheerio.load(html);

        $('#Top25 .topclick-list-element').each((i, el) => {
            const item = $(el).find('.topclick-list-element-game .topclick-list-element-game-title').text();
            const merchant = $(el).find('.topclick-list-element-game .topclick-list-element-game-merchant').text();
            const price = $(el).find('.topclick-list-element-price').text();
            
            // Write row to csv
            writeStream.write(`${item}, ${merchant}, ${price} \n`);
        });

        console.log('Scraping done...');
    }
});