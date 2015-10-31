# TweetMap

TweetMap is Realtime Tweet Visualization Client. It uses Twitter Public Stream Api and shows tweets on a map in realtime.

##Screenshot
<img src="https://raw.github.com/fatihozkan/TweetMap/master/Screenshot.jpg" border="0" />


##Demo

You can check out demo via this link http://tweetmap-starlabs.rhcloud.com/

## Clone and Run

You can run TweetMap in your machine.

* Install Node.js from [https://nodejs.org/](https://nodejs.org/)
* Checkout the project
```
git clone https://github.com/fatihozkan/TweetMap.git
```
* Set your Twitter Api Keys inside *config.js* file.

```
module.exports = {
    twitter: {
        consumer_key: '',
        consumer_secret: '',
        access_token_key: '',
        access_token_secret: ''
    }
}
```

* Install the dependencies

```
npm install
```

* Run the application

```
node ./bin/www
```

* Type localhost:8000 to your browser
