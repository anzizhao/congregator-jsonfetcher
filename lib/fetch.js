var debug = require('debug')('jsonfetcher:fetch');
var colors = require('colors');
var util = require('util');
var async = require('async');
var helpers = require('./helpers');
var exec = require('exec');
var fs = require('fs');
var request = require('request');


function getList(opt, callback) {
    var requestOptions = {
        url: opt.url,
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
    if( ! opt.outside ) {
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
            'curl -k '  + opt.url
        ];
        debug( cmds.join(';'))
        exec(cmds.join(';'), function(err, out, code) {
            if (err instanceof Error) {
                callback(error);
            }
            var jsonStr = out.substr( out.indexOf('{'));
            callback(null, jsonStr);
        });
    }
}


function handleList(opt,  body, callback) {
    var entries;
    var entriesParent; 
    var formattedPosts = []; // formatted posts holder
    var ranking = 0;

    try { 
        entries = JSON.parse(body) 
        if(  opt.listref )  {
            if( typeof opt.listref === 'string' ) {
                // 为字符串情况
                entries = entries[opt.listref] 
            } else if ( opt.listref instanceof Array ) {
                // 数组情况
                opt.listref.forEach(function(key){
                    entriesParent = entries;
                    entries = entries[key]; 
                })
            }    
        }
    }
    catch (e) { debug(util.inspect(e)); }
    finally { entries = entries || []; }
    if( opt.name === 'medium') {
        async.eachSeries(Object.keys(entries), function (key, callback) {
            var post = entries[key];
            formattedPost = this.handler(post, opt, ++ranking, entriesParent);
            if (formattedPost) formattedPosts.push(formattedPost);
            callback();
        }.bind(this), function (err) {
            callback(err, formattedPosts);
        });
    } else {
        async.eachSeries(entries, function (post, callback) {
            var formattedPost = this.handler(post, opt, ++ranking, entriesParent);
            if (formattedPost) formattedPosts.push(formattedPost);
            callback();
        }.bind(this), function (err) {
            callback(err, formattedPosts);
        });
    }
}



exports = module.exports = {
    getList: getList,
    handleList: handleList,
}; 

