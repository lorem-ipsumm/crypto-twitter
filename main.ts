import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
const Twitter = require("twitter-lite");

// provide your own config with keys
const Config = require("./config");

// setup client
const client = new Twitter({
    consumer_key: Config.consumer_key,
    consumer_secret: Config.consumer_secret,
    access_token_key: Config.access_token_key,
    access_token_secret: Config.access_token_secret
});


// make a new tweet
async function newTweet(coinData: any) {
    let tweet = "New Coingecko Listing!\n" + 
                coinData.name + " / $" + coinData.ticker +
                "\n\nPrice: " + coinData.price + 
                "\n1h Change: " + coinData.hour +
                "\n24h Change: " + coinData.day + 
                "\n24h Volume: " + coinData.volume + 
                "\nMkt Cap: " + coinData.marketCap + 
                "\n\n" + coinData.url;

    await client.post("statuses/update", {
        status: tweet
    })
    .then(() => {
        console.log("tweet sent");
    })
    .catch((err: any) => {
        console.log(err);
    })

    console.log(tweet);
}

// scrape the recently added page
async function scrape() {

    // get site html
    const html = await axios.get("https://www.coingecko.com/en/coins/recently_added");
    const $ = await cheerio.load(html.data);

    // go through all table items
    $('tr', 'tbody').each((i, elem) => {

        let coinName: string;
        let coinTicker: string;

        // get token info
        let nameInfo = $(elem).find(".coin-name a").text().trim().split("\n").join().split(",,");
        coinName = nameInfo[0];
        coinTicker = nameInfo[1];

        // get data
        let price = $(elem).find(".td-price span").text().trim();
        let hourChange = $(elem).find(".td-change1h span").text().trim();
        let dayChange = $(elem).find(".td-change24h span").text().trim();
        let volume = $(elem).find(".td-liquidity_score span").text().trim();
        let marketCap = $(elem).find(".td-market_cap").text().trim();
        let url = "https://www.coingecko.com" + $(elem).find(".coin-name a").attr("href");

        // check if price change data has been added
        if (hourChange.length <= 1)
            hourChange = "N/A";
        if (dayChange.length <= 1)
            dayChange = "N/A";

        const coinData = {
            name: coinName,
            ticker: coinTicker,
            price: price,
            hour: hourChange,
            day: dayChange,
            volume: volume,
            marketCap: marketCap,
            url: url
        };

        // check our saved file
        fs.readFile("coins.txt", (err, data) => {

            if (err){
                console.log(err);
                return;
            }

            // check if coin has already been added
            if (data.indexOf(coinName) === -1) {
                // && (hourChange.length > 1 && dayChange.length > 1)
                // append coin name to text file
                fs.appendFile("coins.txt", "\n" + coinName + "(" + coinTicker + ")", (err) => {
                    if (err) console.log(err);
                });

                newTweet(coinData);

            }
        });

    });


}




console.log("starting!");

// scrape every 10 minutes
scrape();
setInterval(() => {scrape()}, 600000);
