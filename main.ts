import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as twitterStream from './stream';
const Twitter = require("twitter-lite");
const hooman = require('hooman');
const CoinCodex = require('coincodex-api');
const Discord = require('discord.js');
const axios = require('axios');
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

export async function wait(milliseconds: number) {
    await new Promise(resolve => setTimeout(resolve, milliseconds));
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

    // try and read coins.txt and make get request
    let data: any;

    try {

        const res = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
            headers: {
                'X-CMC_PRO_API_KEY': Config.CMC_API_KEY
            },
            params: { 
                sort: "date_added",
                sort_dir: "asc"
            }
        });

        // get response
        data = res.data.data;

    } catch(err) {
        log(err, "gems", true);
        return;
    }

    // load html with cheerio
    // const $ = await cheerio.load(html);

    // iterate through latest tokens
    for (const token of data) {

        // name and ticker
        let coinName = token.name;
        let coinTicker = token.symbol;

        // get data
        let price = token.quote.USD.price;
        let volume = token.quote.USD.volume_24h;
        let url = "https://coinmarketcap.com/currencies/" + token.slug;

        const coinData:CoinData = {
            name: coinName,
            ticker: coinTicker,
            price: price,
            volume: volume,
            url: url,
            site: "CoinMarketCap"
        };

        saveCoins(coinData);

    }

}

// scrape the recently added page
async function coingeckoScrape() {

    // log("scraping CoinGecko");
    console.log("scraping");

    let data: any;

    try {

        const res = await axios.get('https://api.coingecko.com/api/v3/coins/list');

        // get response
        data = res.data;


    } catch(err) {
        log(err, "gems", true);
        return;
    }

    let coinData: CoinData;

    // iterate through latest tokens
    for (const token of data) {


        // name and ticker
        let coinName = token.name;
        let coinTicker = token.symbol;
        let price;
        let volume;
        let url = "";

        // a second request needs to be made for the price & volume data
        if (coins.indexOf(coinName + "(" + coinTicker + "): CoinGecko") === -1) {

            // make coin data request
            let extraData = await axios.get('https://api.coingecko.com/api/v3/coins/' + token.id);

            // get data
            try {
                extraData = extraData.data.tickers[0];
                price = extraData.converted_last.usd;
                volume = extraData.converted_volume.usd;
                url = "https://www.coingecko.com/en/coins/" + token.id;
            } catch (e) {
                return;
            }

        }
        
        // set data
        coinData = {
            name: coinName,
            ticker: coinTicker,
            price: price,
            volume: volume,
            url: url,
            site: "CoinGecko"
        };

        saveCoins(coinData);

    }

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

        /*

        // is this in the social channel?
        if (message.channel.id !== Config.DISCORD_CHANNEL_SOCIAL)
            return;

        // get the message content
        const text = message.content;

        // restart streaming and pass in requested tickers
        // if there are at least 3
        if (text.match(reg) && text.match(reg).length >= 3)
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
        */
        
    })

    // start streaming tweets
    // twitterStream.start();


    // load saved coins 
    if (!loadCoins()) {
        log("coins.txt failed to load", "gems", true)
        return;
    }

    // start first scrape
    // log("starting", "gems");
    scrape();

    // scrape every 15 minutes
    setInterval(() => {
        if (loadCoins()) {
            scrape();
        }
    }, 900000);

})