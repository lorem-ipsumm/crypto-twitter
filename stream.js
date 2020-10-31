"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var Config = require("./config");
var TwitterStream = require('twitter-stream-api');
var main = require("./main");
var fs = require("fs");
// twitter api vars,
var conf = {
    consumer_key: Config.consumer_key,
    consumer_secret: Config.consumer_secret,
    token: Config.access_token_key,
    token_secret: Config.access_token_secret
};
// filter list to be updated
var filterList;
// old list of 
// let oldList:string[] = [];
// list of tokens recently found during scanning
var recentlyScanned = [];
// holds frequency of price tickers that are found 
// also holds add, sorted, and toString methods
var frequencyList = {
    // add to list
    add: (function (t) {
        // convert ticker to upper case
        var ticker = t.toLowerCase();
        // these will almost always end up being the top ones
        if (ticker === "$btc" || ticker === "$eth")
            return;
        // set old list for change calculation
        // oldList = frequencyList.toString().split("\n");
        // update count if needed, or create new entry
        if (frequencyList[ticker]) {
            frequencyList[ticker].count += 1;
        }
        else {
            frequencyList[ticker] = {
                name: t,
                count: 1,
                change: '+'
            };
        }
        // add the ticker to the beginning of recent list
        // and keep size at 5
        recentlyScanned.unshift(ticker);
        recentlyScanned = recentlyScanned.slice(0, 10);
        /*
        // construct new sorted list
        const newList:string[] = frequencyList.toString().split("\n");

        // get the change in position (if any)
        // const change:number = oldList[ticker].count - newList[ticker].count
        const change:number = oldList.indexOf(ticker) - newList.indexOf(ticker);

        if (change === 0) {
            oldList[ticker].count
            frequencyList[ticker].change = '-';
        }
        if (change > 0) {
            frequencyList[ticker].change = '^';
        }
        if (change < 0) {
            frequencyList[ticker].change = '∨';
        }
        */
        console.log(ticker + "(" + frequencyList[ticker].count + ")");
        // replace with new list
        if (frequencyList.sorted().length > 8)
            filterList = frequencyList.sorted().slice(0, 8);
    }),
    // return sorted frequencyList
    sorted: (function () {
        // javascript meme magic
        var sorted = Object.entries(frequencyList).slice(4)
            .sort(function (a, b) {
            return (b[1].count - a[1].count);
        })
            // ???
            .reduce(function (r, _a) {
            var _b;
            var k = _a[0], v = _a[1];
            return (__assign(__assign({}, r), (_b = {}, _b[k] = v, _b)));
        }, {});
        return (sorted);
    }),
    clear: (function () {
        // remove everything but methods
        var sorted = Object.entries(frequencyList).slice(0, 4)
            .sort(function (a, b) {
            return (b[1].count - a[1].count);
        })
            // ???
            .reduce(function (r, _a) {
            var _b;
            var k = _a[0], v = _a[1];
            return (__assign(__assign({}, r), (_b = {}, _b[k] = v, _b)));
        }, {});
        // update list
        frequencyList = sorted;
    }),
    toString: (function () {
        // sort items and only keep top 25
        var sorted = Object.entries(frequencyList).slice(4)
            .sort(function (a, b) {
            return (b[1].count - a[1].count);
        });
        var str = "";
        var item;
        for (var _i = 0, sorted_1 = sorted; _i < sorted_1.length; _i++) {
            item = sorted_1[_i];
            str += item[0] + "\n";
        }
        return str;
    })
};
// wait function
function wait(milliseconds) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, milliseconds); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
var stream;
// create a new twitter stream
function newStream(trackingList) {
    return __awaiter(this, void 0, void 0, function () {
        var ready;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // close old stream if it exists
                    if (stream)
                        stream.close();
                    // setup stream stream
                    stream = new TwitterStream(conf, false);
                    ready = false;
                    // setup stream events
                    stream.stream("statuses/filter", { track: trackingList });
                    stream.on("connection success", function () {
                        console.log("connection success");
                        // allow this method to return fully initialized stream
                        ready = true;
                        // block parse method from returning
                        // streaming = true; 
                    });
                    stream.on("connection aborted", function () {
                        console.log("connection closed");
                        stream = null;
                    });
                    _a.label = 1;
                case 1:
                    if (!!ready) return [3 /*break*/, 3];
                    return [4 /*yield*/, wait(100)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/, stream];
            }
        });
    });
}
// parse the twitter stream
function parseStream(stream) {
    return __awaiter(this, void 0, void 0, function () {
        var reg, streaming;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("parsing stream");
                    reg = /\B(\$[a-zA-Z][a-zA-Z0-9]+\b)(?!;)/gm;
                    streaming = true;
                    // listen to stream
                    stream
                        .on("data", function (data) {
                        // convert data (as buffer) to JSON tweet data
                        var tweet = JSON.parse(Buffer.from(data).toString("utf-8"));
                        // store tweet text
                        var text;
                        // attempt to get the full tweet content
                        try {
                            if (tweet.extended_tweet)
                                text = tweet.extended_tweet.full_text;
                            else if (tweet.retweeted_status)
                                text = tweet.retweeted_status.extended_tweet.full_text;
                        }
                        catch (error) {
                            // TODO: figure out all types of tweet data
                            return;
                        }
                        // exit if text doesn't match filter
                        if (!text || !text.match(reg))
                            return;
                        // too many fake-looking tweets from whaleagent telegram
                        if (text.indexOf("whaleagent") > -1) {
                            console.log(tweet);
                            console.log(text.indexOf("whaleagent"));
                            return;
                        }
                        var tickerList = text.match(reg);
                        for (var _i = 0, tickerList_1 = tickerList; _i < tickerList_1.length; _i++) {
                            var ticker = tickerList_1[_i];
                            frequencyList.add(ticker);
                        }
                    })
                        .on("connection aborted", function () {
                        streaming = false;
                    });
                    _a.label = 1;
                case 1:
                    if (!streaming) return [3 /*break*/, 3];
                    return [4 /*yield*/, wait(500)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 1];
                case 3:
                    console.log("done streaming");
                    return [2 /*return*/];
            }
        });
    });
}
// operation(?) variables (kinda debounce variables)
var running = false;
var restarting = false;
// restart streaming immediately 
function restart(tickers) {
    return __awaiter(this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("here");
                    // set restarting flag
                    restarting = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    // close old stream if it exists
                    if (stream)
                        stream.close();
                    // alert the masses
                    main.log("```...waiting for old stream to close...```", "social");
                    _a.label = 2;
                case 2:
                    if (!running) return [3 /*break*/, 4];
                    return [4 /*yield*/, wait(500)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 2];
                case 4:
                    console.log("okay done waiting");
                    restarting = false;
                    // reset frequency list
                    frequencyList.clear();
                    // start over
                    start(tickers);
                    return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    console.log(err_1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.restart = restart;
function start(tickers) {
    return __awaiter(this, void 0, void 0, function () {
        var previousRun, lastMessage, startingList, startTime, timestamp, stream_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // this is being called multiple times for some reason
                    if (running)
                        return [2 /*return*/];
                    // set running flag
                    running = true;
                    console.log("here");
                    // has someone requested specific tickers to start with 
                    if (tickers) {
                        filterList = tickers;
                    }
                    else {
                        previousRun = fs.readFileSync("./frequency.txt", "utf-8");
                        filterList = previousRun.trim().split("\n");
                    }
                    // set generic list if there is no filter list
                    if (filterList.length < 3)
                        filterList = ["$yfi", "$xrp", "$vet", "$icx", "$core", "$uni", "$lido"];
                    // client = twitterClient;
                    main.log("```...waiting for price tickers...```", "social");
                    lastMessage = frequencyList.toString().slice(0, 25);
                    startingList = filterList.slice();
                    startTime = new Date().toLocaleString();
                    _a.label = 1;
                case 1:
                    if (!(true && !restarting)) return [3 /*break*/, 4];
                    fs.writeFileSync("./frequency.txt", frequencyList.toString().slice(0, 25), function (err) {
                        console.log(err);
                    });
                    timestamp = "[" + startTime + " - " + new Date().toLocaleString() + "]" +
                        "\n[Starting Filter List: " + startingList + "]" +
                        "\n\n25 Trending Coins On Twitter (" + frequencyList.toString().split("\n").length + " tickers scanned): \n\n";
                    // don't post duplicates
                    if (frequencyList.toString() !== lastMessage)
                        main.log("```" +
                            timestamp +
                            frequencyList.toString().split("\n").slice(0, 25).join("\n") +
                            "\n\nRecently Scanned: \n\n" +
                            recentlyScanned.join(' ') +
                            "\n```" +
                            "\nSay 'rs' or 'reset' to refresh (takes 1-2 minutes). List at least three tickers if you want to start filtering with those, ex:" +
                            "\nrs $rot $yeld $ocean $waves", "social");
                    // update last message
                    lastMessage = frequencyList.toString().slice(0, 25);
                    return [4 /*yield*/, newStream(filterList)];
                case 2:
                    stream_1 = _a.sent();
                    // begin parsing 
                    parseStream(stream_1);
                    return [4 /*yield*/, wait(60000)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 1];
                case 4:
                    // unset running flag
                    running = false;
                    return [2 /*return*/];
            }
        });
    });
}
exports.start = start;
