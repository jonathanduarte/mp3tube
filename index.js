//Use Node 8.1.4
var http = require('http');
var request = require('request');
var wget = require('wget-improved');
var dest = 'downloaded';
var rp = require('request-promise');
var fs = require('fs');
const { URL } = require('url');

function printProgress(progress){
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(progress + '%');
}

function readFile() {
	var songs = JSON.parse(fs.readFileSync('songs.json', 'utf8'));
	return songs;
}

function downloadPlaylist() {
	var songs = readFile();
	songs.forEach(function(n){
		downloadSong(n);
	})
}

function downloadSong(url){
	var options = {
		"url": "http://www.youtubeinmp3.com/fetch/?format=JSON&video=" + url,
		"method": "POST"
	};

	rp(options)
		.then(function (data) {
			const parsedData = JSON.parse(data);

			dwOptions = {
				url: parsedData.link,
				method: 'GET',
				followRedirect: false,
				simple: false
			}
			rp(dwOptions)
				.on("response", function(response){
					console.log("Downloading " + parsedData.title);
					var src = "http:" + response.headers['location'];
					var output = parsedData.title.trim() + '.mp3';
					var options = {};

					if (!fs.existsSync(dest)){
					    fs.mkdirSync(dest);
					}

					var download = wget.download(src, output, options );

					download.on('progress', function(progress) {
						printProgress(Math.floor(progress * 100));
					});

					download.on('end', function(output) {
					    console.log("\n Finished downloading " + parsedData.title);
					});

					download.on('error', function(err) {
					    console.log('Error on download', err);
					});
				})
		})
		.catch(function(e) {
			console.log("Error!! ", e);
		})
};

downloadPlaylist();