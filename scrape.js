const request = require('request');

const cheerio = require('cheerio');

request('https://www.allkeyshop.com/blog/', (error, response, html) => {
    if(!error && response.statusCode == 200) {
        const $ = cheerio.load(html);

        $('#Top25 .topclick-list-element').each((i, el) => {
            const item = $(el).find('.topclick-list-element-game .topclick-list-element-game-title').text();
            const price = $(el).find('.topclick-list-element-price').text();
            console.log(item, '|', price);
        });

        
    }
});