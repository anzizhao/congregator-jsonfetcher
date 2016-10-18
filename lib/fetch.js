var debug = require('debug')('jsonfetcher:fetch');
var colors = require('colors');
var util = require('util');
var async = require('async');
var helpers = require('./helpers');
var exec = require('exec');
var fs = require('fs');

exports = module.exports = function (request) {
    return function (mapping, callback) {
        debug('beginning fetch for mapping: '.yellow + mapping.name.magenta);

        var ranking = 0; // rank the articles by position in feed
        var formattedPosts = []; // formatted posts holder

        var requestOptions = {
            url: mapping.url,
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36',
                'accept': 'text/html,application/xhtml+xml',
                'x-lc-id': 'mhke0kuv33myn4t4ghuid4oq2hjj12li374hvcif202y5bm6',
                'x-lc-session': 'bv3yqr8fmt9f3jkpmvktyiem5',
                'x-lc-sign': 'f0674d8d4170ad69ce7c5f35e0932864,1476363693256',
                'x-lc-ua': 'AV/js1.5.0'
            },
            timeout: 10000,
            pool: false
        };

        async.waterfall([
            // fetch raw mapping entries
            function (callback) {
                if( ! mapping.outside ) {
                    // 不需要翻墙
                    request(requestOptions, function (error, response, body){
                        if(!error && response.statusCode == 200){
                            callback(null, body);
                        }
                        else if (error) {
                            callback(error);
                        }
                        else {
                            debug('error - status: ' + response.statusCode);
                            callback('could not fetch json endpoint');
                        }
                    }.bind(this));
                } else {
                    //需要翻墙 
                    var cmds = [
                        'export https_proxy=https://127.0.0.1:8087', 
                        'curl -k '  + mapping.url
                    ];
                    debug( cmds.join(';'))
                    exec(cmds.join(';'), function(err, out, code) {
                        if (err instanceof Error) {
                            callback(error);
                        }
                        var jsonStr = out.substr( out.indexOf('{'));
                        //fs.writeFileSync('medium.html', jsonStr);
                        //debug('receive: %s', out)
                        //var jsonStr = out.substr( out.indexOf('{'));
                        callback(null, jsonStr);
                    });
                }
            }.bind(this),
            // handle and parse mapping entries
            function (body, callback) {
                var entries;
                var entriesParent; 

                try { 
                    entries = JSON.parse(body) 
                    if(  mapping.listref )  {
                        if( mapping.listref instanceof String ) {
                            // 为字符串情况
                            entries = entries[mapping.listref] 
                        } else if ( mapping.listref instanceof Array ) {
                            // 数组情况
                            mapping.listref.forEach(function(key){
                                entriesParent = entries;
                                entries = entries[key]; 
                            })
                            //debug( entries )
                        }    
                    }
                }
                catch (e) { debug(util.inspect(e)); }
                finally { entries = entries || []; }
                if( mapping.name === 'medium') {
                    async.eachSeries(Object.keys(entries), function (key, callback) {
                        var post = entries[key];
                        var formattedPost = this.handler(post, mapping, ++ranking, entriesParent);
                        if (formattedPost) formattedPosts.push(formattedPost);
                        callback();
                    }.bind(this), function (err) {
                        callback(err, formattedPosts);
                    });
                } else {
                    async.eachSeries(entries, function (post, callback) {
                        var formattedPost = this.handler(post, mapping, ++ranking, entriesParent);
                        if (formattedPost) formattedPosts.push(formattedPost);
                        callback();
                    }.bind(this), function (err) {
                        callback(err, formattedPosts);
                    });
                }



            }.bind(this)
        ], function (err, result) {
            callback(err, result);
        });
    };
};
