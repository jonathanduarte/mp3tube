//Use Node 8.1.4
var http = require('http');
var request = require('request');
var wget = require('wget-improved');
var dest = __dirname + "/downloaded";
var rp = require('request-promise');
var fs = require('fs');
const Q = require("q");
const Youtube = require("youtube-api");
const API_KEY = "AIzaSyDspwOrR10HxgDDQ1tVMjuPvYKPxRkZIYQ";

var songs = [];

function printProgress(progress){
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(progress + '%');
}

function readFile() {
	var songs = JSON.parse(fs.readFileSync('songs.json', 'utf8'));
	return songs;
}

function getPlaylistItems(id, page) {
	var deferred = Q.defer();
	var options = {
		"url" : "https://content.googleapis.com/youtube/v3/playlistItems?playlistId=" + id + "&maxResults=2&part=snippet%2CcontentDetails&key=" + API_KEY + (!!page ? "&pageToken=" + page : ""),
		"method" : "GET"
	}

	rp(options)
		.then(function(resp) {
			data = JSON.parse(resp);
			data.items.forEach(function(n){
				console.log("WHERE MY SONGS AT?? ", songs)
				songs.push("https://www.youtube.com/watch?v=" + n.contentDetails.videoId);
			})

			
			if (data.pageInfo.totalResults > songs.length) {
				console.log("Mayor");
				getPlaylistItems(id, data.nextPageToken)
					.then(function() {
						deferred.resolve();
					})
			}
			else if (data.pageInfo.totalResults = songs.length && !!songs) {
				deferred.resolve()
			}
		})
		.catch(function(e) {
			console.error("Couldn't get elements from playlist", e);
		})

	return deferred.promise;
}

function downloadPlaylist() {
	getPlaylistItems("PLtGmakrpiY6vU5gx7KIIxHa3ciBjWBcHV")
		.then(function() {
			if (!!songs){
				downloadSong(songs);
			}
		});
}

function downloadSong(array, index){
	if (!index) index = 0;

	if (index >= array.length) return;

	var options = {
		"url": "http://www.youtubeinmp3.com/fetch/?format=JSON&video=" + array[index],
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
					var output = dest + "/" + parsedData.title.trim() + '.mp3';
					var options = {};

					if (!fs.existsSync(dest)){
					    fs.mkdirSync(dest);
					}

					var download = wget.download(src, output, options);


					download.on('progress', function(progress) {
						printProgress(Math.floor(progress * 100));
					});

					download.on('end', function(output) {
					    console.log("\n Finished downloading " + parsedData.title);
					    downloadSong(array, index + 1);
					});

					download.on('error', function(err) {
					    console.error(parsedData.title + " couldn't be downloaded");
					});

				})
		})
		.catch(function(e) {
			console.error(parsedData.title + " couldn't be downloaded.");
		})
};

downloadPlaylist();