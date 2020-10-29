const Config = require("./config");
const TwitterStream = require('twitter-stream-api');
import * as main from './main';
const fs = require("fs");

// twitter api vars,
const conf = {
    consumer_key: Config.consumer_key,
    consumer_secret: Config.consumer_secret,
    token: Config.access_token_key,
    token_secret: Config.access_token_secret
}

// filter list to be updated
let filterList:string[] = ["$yfi", "$xrp", "$vet", "$icx", 
                            "$core", "$uni", "$lido"];

// list from top dextools list 
let filterListDext:string[] = ["$CORE", "$yfi", "$NBT", "$YRISE", "$PRIA"
                            , "$UNI", "$TORE", "$encore", "$ARIA", "$pCore"]

interface ListItem {
    name: string,
    count: number,
    change: string
}

// old list of 
// let oldList:string[] = [];

// list of tokens recently found during scanning
let recentlyScanned:string[] = [];


// holds frequency of price tickers that are found 
// also holds add, sorted, and toString methods
let frequencyList:any= {

    // add to list
    add: ((t: string) => {

        // convert ticker to upper case
        const ticker:string = t.toLowerCase();

        // these will almost always end up being the top ones
        if (ticker === "$btc" || ticker === "$eth")
            return;

        // set old list for change calculation
        // oldList = frequencyList.toString().split("\n");

        // update count if needed, or create new entry
        if (frequencyList[ticker]) {
            frequencyList[ticker].count += 1;
        } else {
            frequencyList[ticker] = {
                name: t,
                count: 1,
                change: '+'
            };
        }

        // add the ticker to the beginning of recent list
        // and keep size at 5
        recentlyScanned.unshift(ticker);
        recentlyScanned = recentlyScanned.slice(0,10);

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
            filterListDext = frequencyList.sorted().slice(0,8);

    }),


    // return sorted frequencyList
    sorted: (() => {

        // javascript meme magic
        const sorted = Object.entries(frequencyList).slice(3)
        .sort((a: any, b: any) => {
            return(b[1].count - a[1].count);
        })
        // ???
        .reduce((r, [k, v]) => ({
                ...r, [k]: v 
        }), {});

        return(sorted);

    }),

    toString: (() => {

        // sort items and only keep top 25
        const sorted = Object.entries(frequencyList).slice(3)
        .sort((a: any, b: any) => {
            return(b[1].count - a[1].count);
        });

        let str = "";
        let item:any;

        for (item of sorted)
            str += item[0] + "\n";

        return str;
    })



}

// wait function
async function wait(milliseconds: number) {
    await new Promise(resolve => setTimeout(resolve, milliseconds));
}

let stream:any;

// create a new twitter stream
async function newStream(trackingList: string[]) {

    // close old stream if it exists
    if (stream)
        stream.close();

    // setup stream stream
    stream = new TwitterStream(conf, false);

    // 
    let ready = false;

    // setup stream events
    stream.stream("statuses/filter", {track: trackingList});
    stream.on("connection success", () => {
        console.log("connection success");

        // allow this method to return fully initialized stream
        ready = true;

        // block parse method from returning
        // streaming = true; 

    });
    stream.on("connection aborted", () => {
        console.log("connection closed");
        stream = null;
    });
    
    // wait until stream is setup before returning
    while(!ready) await wait(100);

    return stream;

}

// parse the twitter stream
async function parseStream(stream: any) {

    console.log("parsing stream");

    // regex for detecing tickers ex: $yeld $core $CEL etc.
    const reg = /\B(\$[a-zA-Z]+\b)(?!;)/gm;

    let streaming = true;

    // listen to stream
    stream 
    .on("data", (data: any) => {

        // convert data (as buffer) to JSON tweet data
        const tweet = JSON.parse(Buffer.from(data).toString("utf-8"))

        // store tweet text
        let text;

        // attempt to get the full tweet content
        try{

            if (tweet.extended_tweet) 
                text = tweet.extended_tweet.full_text;
            else if(tweet.retweeted_status)
                text = tweet.retweeted_status.extended_tweet.full_text;
 
        } catch (error) {
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

        let tickerList = text.match(reg);

        for (const ticker of tickerList) {
            frequencyList.add(ticker);
        }


    })
    .on("connection aborted", () => {
        streaming = false;
    })

    // erase stream when streaming is over
    while(streaming) await wait(500);
        console.log("done streaming");

}

// operation(?) variables (kinda debounce variables)
let running: boolean = false;
let restarting: boolean = false;

// restart streaming immediately 
export async function restart() {

    console.log("here");

    // set restarting flag
    restarting = true;

    try{

        // close old stream if it exists
        if (stream)
            stream.close();

        // alert the masses
        main.log("```...waiting for old stream to close...```", "social");

        // wait until everything is done
        while(running) await wait(500);

        console.log("okay done waiting")

        restarting = false;

        // start over
        start();

    }catch(err){
        console.log(err)
    }


}

export async function start() { 

    // client = twitterClient;
    main.log("```...waiting for price tickers...```", "social");

    // keep track of the previous message sent
    let lastMessage = frequencyList.toString().slice(0, 25);

    // get starting time
    let startTime = new Date().toLocaleString();

    // set running flag
    running = true;

    while(true && !restarting) {

        fs.writeFileSync("./frequency.txt", frequencyList.toString().slice(0, 25), (err: any) => {
            console.log(err);
        });


        let timestamp = "[" + startTime + " - " + new Date().toLocaleString() + "]" + 
        "\n\n25 Trending Coins On Twitter (" + frequencyList.toString().split("\n").length + " tickers scanned): \n\n";

        // don't post duplicates
        if (frequencyList.toString() !== lastMessage)
            main.log(
                "```" + 
                timestamp +
                frequencyList.toString().slice(0, 25) + 
                "\n\nRecently Scanned: \n\n" + 
                recentlyScanned.join(' ') +  
                "\n```" + 
                "\nsay 'rs' or 'reset' to refresh (takes 1-2 minutes)", "social");

        // update last message
        lastMessage = frequencyList.toString().slice(0, 25);

        // get a new stream
        let stream = await newStream(filterListDext);

        // begin parsing 
        parseStream(stream);

        await wait(60000);

    }

    // unset running flag
    running = false;

}

