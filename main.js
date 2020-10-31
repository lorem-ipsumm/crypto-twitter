"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var cheerio = require("cheerio");
var fs = require("fs");
var twitterStream = require("./stream");
var Twitter = require("twitter-lite");
var hooman = require('hooman');
var CoinCodex = require('coincodex-api');
var Discord = require('discord.js');
var discord = new Discord.Client();
// create CoinCodex API client
var codex = new CoinCodex();
// provide your own config with keys
// comment this section out if you don't have keys and
// and you just want to scrape Coingecko
var Config = require("./config");
// setup client
// comment this section out if you don't have keys and
// and you just want to scrape Coingecko
var client = new Twitter({
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
var coins = "";
// log output and error message in a discord server
function log(message, where, err) {
    return __awaiter(this, void 0, void 0, function () {
        var channelId, channel;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (where === "gems")
                        channelId = Config.DISCORD_CHANNEL_GEMS;
                    else if (where === "social")
                        channelId = Config.DISCORD_CHANNEL_SOCIAL;
                    else
                        return [2 /*return*/];
                    if (!(where === "gems")) return [3 /*break*/, 1];
                    // mention me if there is an error
                    if (err)
                        discord.channels.cache.get(channelId).send("<@" + Config.DISCORD_MENTION + ">\n" + message);
                    else
                        discord.channels.cache.get(channelId).send(message);
                    return [3 /*break*/, 3];
                case 1:
                    if (!(where === "social")) return [3 /*break*/, 3];
                    return [4 /*yield*/, discord.channels.cache.get(channelId)];
                case 2:
                    channel = _a.sent();
                    if (!channel)
                        return [2 /*return*/];
                    // edit message to show new data
                    channel.messages.fetch(Config.DISCORD_EDIT)
                        .then(function (m) {
                        m.edit(message);
                    });
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.log = log;
// make a new tweet
function newTweet(coinData) {
    return __awaiter(this, void 0, void 0, function () {
        var tweet;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // don't tweet in dev
                    if (__dirname.indexOf("/home/nick/Documents") !== -1)
                        return [2 /*return*/];
                    tweet = "New " + coinData.site + " Listing!\n\n" +
                        coinData.name + " / $" + coinData.ticker +
                        "\nPrice: " + coinData.price +
                        "\n24h Volume: " + coinData.volume +
                        "\n#crypto #gem #eth #defi" +
                        "\n\n" + coinData.url;
                    // post the tweet
                    return [4 /*yield*/, client.post("statuses/update", {
                            status: tweet
                        })
                            .then(function () {
                            log("```New " + coinData.site + " Listing!\n\n" +
                                coinData.name + " / $" + coinData.ticker +
                                "\nPrice: " + coinData.price +
                                "\n24h Volume: " + coinData.volume +
                                "```\n" + coinData.url, "gems");
                        })["catch"](function (err) {
                            log(err, "gems", true);
                        })];
                case 1:
                    // post the tweet
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// load coins.txt data into coins global var
function loadCoins() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                coins = fs.readFileSync("coins.txt", "utf8");
            }
            catch (err) {
                coins = "";
                log(err, "gems", true);
            }
            return [2 /*return*/, coins.length > 0];
        });
    });
}
// save new coin data to coins.txt
function saveCoins(coinData) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(coins.indexOf(coinData.name + "(" + coinData.ticker + "): " + coinData.site) === -1)) return [3 /*break*/, 2];
                    // sleep after finding new coins
                    // this is for if the bot breaks and misses coins
                    // await sleep(1000);
                    log("New " + coinData.site + " coin found: " + coinData.name + " / $" + coinData.ticker, "gems");
                    // append coin name to text file
                    return [4 /*yield*/, fs.appendFile("coins.txt", "\n" + coinData.name + "(" + coinData.ticker + "): " + coinData.site, function (err) {
                            if (err)
                                log(err.message, "gems", true);
                        })];
                case 1:
                    // append coin name to text file
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
// scrape coinmarketcap
function coinmarketcapScrape() {
    return __awaiter(this, void 0, void 0, function () {
        var html, response, err_1, $;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    html = "";
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, hooman.get('https://coinmarketcap.com/new/')];
                case 2:
                    response = _a.sent();
                    html = response.body;
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    log(err_1, "gems", true);
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, cheerio.load(html)];
                case 5:
                    $ = _a.sent();
                    // go through all table items
                    $('tr.cmc-table-row').each(function (i, elem) { return __awaiter(_this, void 0, void 0, function () {
                        var coinName, coinTicker, price, volume, url, coinData;
                        return __generator(this, function (_a) {
                            // name and ticker
                            coinName = $(elem).find(".cmc-table__column-name").text().trim();
                            coinTicker = $(elem).find(".cmc-table__cell--sort-by__symbol").text().trim();
                            price = $(elem).find(".cmc-table__cell--sort-by__price").text().trim();
                            volume = $(elem).find(".cmc-table__cell--sort-by__volume-24-h").text().trim();
                            url = "https://www.coinmarketcap.com" + $(elem).find(".cmc-table__column-name a").attr("href");
                            coinData = {
                                name: coinName,
                                ticker: coinTicker,
                                price: price,
                                volume: volume,
                                url: url,
                                site: "CoinMarketCap"
                            };
                            saveCoins(coinData);
                            return [2 /*return*/];
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    });
}
// scrape the recently added page
function coingeckoScrape() {
    return __awaiter(this, void 0, void 0, function () {
        var html, response, err_2, $;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    html = "";
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, hooman.get('https://www.coingecko.com/en/coins/recently_added')];
                case 2:
                    response = _a.sent();
                    html = response.body;
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    log(err_2, "gems", true);
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, cheerio.load(html)];
                case 5:
                    $ = _a.sent();
                    // go through all table items
                    $('tr', 'tbody').each(function (i, elem) { return __awaiter(_this, void 0, void 0, function () {
                        var coinName, coinTicker, nameInfo, price, volume, url, coinData;
                        return __generator(this, function (_a) {
                            nameInfo = $(elem).find(".coin-name a").text().trim().split("\n").join().split(",,");
                            coinName = nameInfo[0];
                            coinTicker = nameInfo[1];
                            coinTicker = coinTicker.trim();
                            price = $(elem).find(".td-price span").text().trim();
                            volume = $(elem).find(".td-liquidity_score span").text().trim();
                            url = "https://www.coingecko.com" + $(elem).find(".coin-name a").attr("href");
                            coinData = {
                                name: coinName,
                                ticker: coinTicker,
                                price: price,
                                volume: volume,
                                url: url,
                                site: "CoinGecko"
                            };
                            saveCoins(coinData);
                            return [2 /*return*/];
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    });
}
// scrape CoinCodex
function scrapeCodex() {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, codex.coins.all()];
                case 1:
                    data = _a.sent();
                    console.log(data);
                    return [2 /*return*/];
            }
        });
    });
}
// scrape Coin360
function scrape360() {
    return __awaiter(this, void 0, void 0, function () {
        var html, response, err_3, x, key, $;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, hooman.get('https://api.coin360.com/coin/latest')];
                case 1:
                    response = _a.sent();
                    html = JSON.parse(response.body);
                    return [3 /*break*/, 3];
                case 2:
                    err_3 = _a.sent();
                    log(err_3, "gems", true);
                    return [2 /*return*/];
                case 3:
                    // exit if no html
                    if (!html)
                        return [2 /*return*/];
                    x = 0;
                    for (key in html) {
                        if (html.hasOwnProperty(key)) {
                            console.log(html[key]);
                            console.log(key);
                        }
                        if (x++ > 10)
                            break;
                    }
                    return [4 /*yield*/, cheerio.load(html)];
                case 4:
                    $ = _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// start scraping process
function scrape() {
    // scrape sites
    coingeckoScrape();
    coinmarketcapScrape();
}
// wait for discord to be ready
discord.on("ready", function () { return __awaiter(void 0, void 0, void 0, function () {
    var reg;
    return __generator(this, function (_a) {
        reg = /\B(\$[a-zA-Z][a-zA-Z0-9]+\b)(?!;)/gm;
        // listen for messages
        discord.on("message", function (message) {
            // is this in the social channel?
            if (message.channel.id !== Config.DISCORD_CHANNEL_SOCIAL)
                return;
            // get the message content
            var text = message.content;
            // restart streaming and pass in requested tickers
            // if there are at least 3
            if (text.match(reg).length >= 3)
                twitterStream.restart(text.match(reg));
            else
                twitterStream.restart();
            if (message) {
                try {
                    message["delete"]({ timeout: 500 });
                }
                catch (e) {
                    return;
                }
            }
        });
        // start streaming tweets
        twitterStream.start();
        // load saved coins 
        if (!loadCoins()) {
            log("coins.txt failed to load", "gems", true);
            return [2 /*return*/];
        }
        // start first scrape
        log("starting", "gems");
        scrape();
        // scrape every 15 minutes
        setInterval(function () {
            if (loadCoins()) {
                scrape();
            }
        }, 900000);
        return [2 /*return*/];
    });
}); });
