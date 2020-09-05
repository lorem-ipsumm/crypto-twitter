import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
const Twitter = require("twitter-lite");

// provide your own config with keys
// comment this section out if you don't have keys and
// and you just want to scrape Coingecko
const Config = require("./config");

// setup client
// comment this section out if you don't have keys and
// and you just want to scrape Coingecko
const client = new Twitter({
    consumer_key: Config.consumer_key,
    consumer_secret: Config.consumer_secret,
    access_token_key: Config.access_token_key,
    access_token_secret: Config.access_token_secret
});


// make a new tweet
async function newTweet(coinData: any) {

    // build tweet
    let tweet = "New Coingecko Listing!\n" + 
                coinData.name + " / $" + coinData.ticker +
                "\n\nPrice: " + coinData.price + 
                "\n1h Change: " + coinData.hour +
                "\n24h Change: " + coinData.day + 
                "\n24h Volume: " + coinData.volume + 
                "\n\n" + coinData.url;

    // post the tweet
    await client.post("statuses/update", {
        status: tweet
    })
    .then(() => {
<<<<<<< HEAD
        console.log(new Date().toJSON());
=======
>>>>>>> 4bf87b8f6f5aa74891bdb2cd94512c36bf299d31
        console.log("tweet sent: \n" + tweet);
    })
    .catch((err: any) => {
        console.log(new Date().toJSON());
        console.log(err);
    })

}


// scrape the recently added page
async function scrape() {

<<<<<<< HEAD

    console.log(new Date().toJSON());
    console.log("scraping");

=======
>>>>>>> 4bf87b8f6f5aa74891bdb2cd94512c36bf299d31
    // try and get text in coins.txt
    let coins = "";
    try {
        coins = fs.readFileSync("coins.txt", "utf8");
    } catch(err) {
        console.log(err);
        return;
    }

    // get site html
    const html = await axios.get("https://www.coingecko.com/en/coins/recently_added");
    const $ = await cheerio.load(html.data);

    // go through all table items
    $('tr', 'tbody').each(async (i, elem) => {

        let coinName: string;
        let coinTicker: string;

        // get token info
        let nameInfo = $(elem).find(".coin-name a").text().trim().split("\n").join().split(",,");
        coinName = nameInfo[0];
        coinTicker = nameInfo[1];
        coinTicker = coinTicker.trim();

        // get data
        let price = $(elem).find(".td-price span").text().trim();
        let hourChange = $(elem).find(".td-change1h span").text().trim();
        let dayChange = $(elem).find(".td-change24h span").text().trim();
        let volume = $(elem).find(".td-liquidity_score span").text().trim();
        let marketCap = $(elem).find(".td-market_cap").text().trim();
        let url = "https://www.coingecko.com" + $(elem).find(".coin-name a").attr("href");

        // check if price change data has been added
        if (hourChange.length <= 1)
            hourChange = "?";
        if (dayChange.length <= 1)
            dayChange = "?";

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

        // check if coin has already been added
        if (coins.indexOf(coinName + "(" + coinTicker + ")") === -1) {

<<<<<<< HEAD
            console.log(new Date().toJSON());
=======
>>>>>>> 4bf87b8f6f5aa74891bdb2cd94512c36bf299d31
            console.log("New coin found: " + coinName + " / $" + coinTicker);

            // append coin name to text file
            await fs.appendFile("coins.txt", "\n" + coinName + "(" + coinTicker + ")", (err) => {
                if (err) console.log(err);
            });

            newTweet(coinData);

        }

    });


}




console.log("starting!");

// scrape every 10 minutes
scrape();
setInterval(() => {
    scrape()
}, 600000);
