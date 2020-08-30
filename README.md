# crypto-twitter

This is a bot that Tweets out new coins that have been added to CoinGecko's recently added page. This is to help people find low-market-cap gems before they blast off 100% - 500%.

It currently only scrapes Coingecko, but more functionality is coming soon: Uniswap scraping, updates on coin growth, etc.

Give it a follow here:
https://twitter.com/CoinGeckoGems




# how to setup

The code that sends tweets is in a different method than the scraping code so you can run the scraper on your own if you'd like. The code is written in Typescript so you'll need to transpile it to Javascript: `npm install tsc`

Once you have the Javacript file, you need to install all of the dependencies from package.json: `npm install`

After that you should be good to go! You'll have to comment out the sections that use the Twitter client, but other than that you should be to scrape Coingecko now by running: `node main.js`


