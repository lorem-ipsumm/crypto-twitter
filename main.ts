import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as twitterStream from './stream';
const Twitter = require("twitter-lite");
const hooman = require('hooman');
const CoinCodex = require('coincodex-api');
const Discord = require('discord.js');
const discord = new Discord.Client();

// create CoinCodex API client
const codex = new CoinCodex();

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

/*
client.get("account/verify_credentials")
.then(async (res: any) => {

    const rateLimits = await client.get("statuses/lookup", {
        id: "1016078154497048576",
        tweet_mode: "extended"
    });

    console.log(rateLimits);


})
.catch((err: any) => {
    console.log("err");
})

t();
*/

// login to discord
discord.login(Config.DISCORD_TOKEN);

// variable to hold coins.txt data
// TODO: convert to JSON / easier to parse format
let coins = "";

interface CoinData {
    name: string,
    ticker: string,
    price: string,
    volume: string,
    url: string,
    site: string
}


// log output and error message in a discord server
export async function log(message: string, where: string, err?: boolean | null) {

    let channelId:string;

    if(where === "gems")
        channelId = Config.DISCORD_CHANNEL_GEMS; 
    else if (where === "social")
        channelId = Config.DISCORD_CHANNEL_SOCIAL;
    else
        return;

    if (where === "gems") {

        // mention me if there is an error
        if (err)
            discord.channels.cache.get(channelId).send("<@" + Config.DISCORD_MENTION + ">\n" + message);
        else 
            discord.channels.cache.get(channelId).send(message);

    } else if (where === "social") {

        // get the channel
        const channel = await discord.channels.cache.get(channelId);

        if (!channel)
            return;

        // edit message to show new data
        channel.messages.fetch(Config.DISCORD_EDIT)
        .then((m: any) => {
            m.edit(message)
        });


    }

}

// make a new tweet
async function newTweet(coinData: CoinData) {

    // don't tweet in dev
    if (__dirname.indexOf("/home/nick/Documents") !== -1)
        return;

    // build tweet
    let tweet = "New " + coinData.site + " Listing!\n\n" + 
                coinData.name + " / $" + coinData.ticker +
                "\nPrice: " + coinData.price + 
                "\n24h Volume: " + coinData.volume + 
                "\n#crypto #gem #eth #defi" + 
                "\n\n" + coinData.url;

    // post the tweet
    await client.post("statuses/update", {
        status: tweet
    })
    .then(() => {
        log("```New " + coinData.site + " Listing!\n\n" + 
                coinData.name + " / $" + coinData.ticker +
                "\nPrice: " + coinData.price + 
                "\n24h Volume: " + coinData.volume + 
                "```\n" + coinData.url
        , "gems");
    })
    .catch((err: any) => {
        log(err, "gems", true);
    })

}

// load coins.txt data into coins global var
async function loadCoins() {

    try {
        coins = fs.readFileSync("coins.txt", "utf8");
    } catch(err) {
        coins = "";
        log(err, "gems", true);
    }

    return coins.length > 0;
}

// save new coin data to coins.txt
async function saveCoins(coinData: CoinData) {

    // check if coin has already been added
    if (coins.indexOf(coinData.name+ "(" + coinData.ticker + "): " + coinData.site) === -1) {

        // sleep after finding new coins
        // this is for if the bot breaks and misses coins
        // await sleep(1000);

        log("New " + coinData.site + " coin found: " + coinData.name + " / $" + coinData.ticker, "gems");

        // append coin name to text file
        await fs.appendFile("coins.txt", "\n" + coinData.name+ "(" + coinData.ticker + "): " + coinData.site, (err) => {
            if (err) log(err.message, "gems", true);
        });

        newTweet(coinData);

    }

}


// scrape coinmarketcap
async function coinmarketcapScrape() {

    // log("scraping CoinMarketCap");

    // try and read coins.txt and make get request
    let html = "";

    try {
        const response = await hooman.get('https://coinmarketcap.com/new/');
        html = response.body;
    } catch(err) {
        log(err, "gems", true);
        return;
    }

    // load html with cheerio
    const $ = await cheerio.load(html);

    // go through all table items
    $('tr.cmc-table-row').each(async (i, elem) => {

        let coinName: string;
        let coinTicker: string;

        // name and ticker
        coinName = $(elem).find(".cmc-table__column-name").text().trim();
        coinTicker = $(elem).find(".cmc-table__cell--sort-by__symbol").text().trim();

        // get data
        let price = $(elem).find(".cmc-table__cell--sort-by__price").text().trim();
        let volume = $(elem).find(".cmc-table__cell--sort-by__volume-24-h").text().trim();
        let url = "https://www.coinmarketcap.com" + $(elem).find(".cmc-table__column-name a").attr("href");

        const coinData:CoinData = {
            name: coinName,
            ticker: coinTicker,
            price: price,
            volume: volume,
            url: url,
            site: "CoinMarketCap"
        };


        saveCoins(coinData);
    });


}

// scrape the recently added page
async function coingeckoScrape() {

    // log("scraping CoinGecko");

    let html = "";

    try {
        const response = await hooman.get('https://www.coingecko.com/en/coins/recently_added');
        html = response.body;
    } catch(err) {
        log(err, "gems", true);
        return;
    }

    // load html with cheerio
    const $ = await cheerio.load(html);

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
        // let hourChange = $(elem).find(".td-change1h span").text().trim();
        // let dayChange = $(elem).find(".td-change24h span").text().trim();
        let volume = $(elem).find(".td-liquidity_score span").text().trim();
        // let marketCap = $(elem).find(".td-market_cap").text().trim();
        let url = "https://www.coingecko.com" + $(elem).find(".coin-name a").attr("href");

        const coinData:CoinData = {
            name: coinName,
            ticker: coinTicker,
            price: price,
            volume: volume,
            url: url,
            site: "CoinGecko"
        };

        saveCoins(coinData);

    });
}


// scrape CoinCodex
async function scrapeCodex() {
    let data = await codex.coins.all();
    console.log(data);
}


// scrape Coin360
async function scrape360() {

    let html:any;

    try {
        const response = await hooman.get('https://api.coin360.com/coin/latest');
        html = JSON.parse(response.body);
    } catch(err) {
        log(err, "gems", true);
        return;
    }

    // exit if no html
    if (!html)
        return;


    let x = 0;
    for (const key in html) {
        if (html.hasOwnProperty(key)) {
            console.log(html[key])
            console.log(key);
        }


        if (x++ > 10)
            break;
    }

    // load html with cheerio
    const $ = await cheerio.load(html);

}

// start scraping process
function scrape() {

    // scrape sites
    coingeckoScrape();
    coinmarketcapScrape();

}

// wait for discord to be ready
discord.on("ready", async () => {

    // reg for detecting tickers 
    const reg = /\B(\$[a-zA-Z][a-zA-Z0-9]+\b)(?!;)/gm;

    // listen for messages
    discord.on("message", (message: any) => {

        // is this in the social channel?
        if (message.channel.id !== Config.DISCORD_CHANNEL_SOCIAL)
            return;

        // get the message content
        const text = message.content;

        // restart streaming and pass in requested tickers
        // if there are at least 3
        if (text.match(reg).length >= 3)
            twitterStream.restart(text.match(reg));
        else 
            twitterStream.restart();

        if (message) {
            
            try {
                message.delete({timeout: 500})
            } catch (e) {
                return;
            }
        }
        
    })

    // start streaming tweets
    twitterStream.start();

    // load saved coins 
    if (!loadCoins()) {
        log("coins.txt failed to load", "gems", true)
        return;
    }

    // start first scrape
    log("starting", "gems");
    scrape();

    // scrape every 15 minutes
    setInterval(() => {
        if (loadCoins()) {
            scrape();
        }
    }, 900000);

})