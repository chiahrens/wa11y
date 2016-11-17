var fs = require('fs');
var async = require('async');
var HTMLCS = fs.readFileSync(__dirname+'/../vendor/HTMLCS.js').toString();
var inject = fs.readFileSync(__dirname+'/../vendor/inject.js').toString();

var webdriverio = require('webdriverio');
var selenium = require('selenium-standalone');
var sauceConnectLauncher = require('sauce-connect-launcher');


var runPa11y = function(client, url, options, callback){

    if(options.ignore){
        options.ignore = options.ignore.split(';');
    }

    var pa11yOptions = {
        ignore: [], 
        standard: 'WCAG2AA'
    };

    var waitFor = options.rootElement || 'body';

    client.on('error', function(e) {
        console.error(e);
    });

    client
        .init()
        .url(url)
        .waitForVisible(waitFor, options.timeout || 30000)
        .executeAsync(function(HTMLCS, inject, options, done) {

            var script = document.createElement('script');
            script.text = HTMLCS;
            document.head.appendChild(script);
    
            script = document.createElement('script');
            script.text = inject;
            document.head.appendChild(script);

            injectPa11y(window, options, function(data){
                done(data);
            });
        }, HTMLCS, inject, Object.assign({}, pa11yOptions, options)).then(function(ret) {
            callback(null, ret.value);
        })
        .catch(function(e) {
      		return callback(e);
    	})
        .end();
}


var local = function(url, options, callback){

    var webdriverOptions = {
        desiredCapabilities: {
            browserName: options.browser || 'chrome'
        },
        logLevel: typeof options.verbose !== 'undefined' ? 'verbose' : 'silent'
    };

    selenium.start({
      seleniumArgs: []
    }, function(err, child){
    
        if(err){
            return callback(err);
        }
    
        child.stderr.on('data', function(data){
            if(typeof options.verbose !== 'undefined'){
                console.error(data.toString());
            }
        });

        var client = webdriverio.remote(webdriverOptions);
    
        client.on('end', function(e) {
            setTimeout(function(){
                child.kill();
            }, 1000);
        });
        
        runPa11y(client, url, options, callback);
    });
}

var sauce = function(url, options, callback){

    var webdriverOptions = {
        desiredCapabilities: {
            browserName: options.browser || 'chrome',
            version: options.version || 'latest',
            platform: options.platform || 'OS X 10.11',
            name: 'wa11y',
            public: true
        },
        host: 'ondemand.saucelabs.com',
        port: 80,
        user: process.env.SAUCE_USERNAME,
        key: process.env.SAUCE_ACCESS_KEY,
        logLevel: typeof options.verbose !== 'undefined' ? 'verbose' : 'silent'
    };

    var client = webdriverio.remote(webdriverOptions);
    
    var scp = null;
    
    var exec = [];
    
    if(typeof options.tunnel !== 'undefined'){
        exec.push(function(next) {
            sauceConnectLauncher({
              username: process.env.SAUCE_USERNAME,
              accessKey: process.env.SAUCE_ACCESS_KEY,
              verbose: true
            }, function (err, sauceConnectProcess) {
              if (err) {
                return next(err);
              }

              console.log("Sauce Connect ready");
              scp = sauceConnectProcess;
              next(null);
            });
        });
    }
    
    exec.push(function(next) {
        runPa11y(client, url, options, next);
    });
    

    
    async.waterfall(exec, function(err, results){
    
        if(typeof options.tunnel !== 'undefined'){     
			scp.close(function () {
				console.log("Closed Sauce Connect process");
				callback(err, results);
			});
		}else{
			callback(err, results);
		}
		
    });

    
}


module.exports.scan = function(url, options, callback){

    if(typeof options === 'function'){
        callback = options;
    }

    if(typeof url === 'object'){
        url = options.url;
        options = url;
    }

    if(!url || !url.startsWith('http')){
        return console.error('URL is required!');
    }


    if(typeof options.sauce !== 'undefined'){
        return sauce(url, options, callback);
    }else{
        return local(url, options, callback);
    }
};
