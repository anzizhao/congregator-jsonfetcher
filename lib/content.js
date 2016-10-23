var read = require('node-read');
var async = require('async');
var debug = require('debug')('jsonfetcher:content-fetcher');
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();
var util = require('util');
var helpers = require('./helpers');
var url = require('url');
var exec = require('exec');
var fs = require('fs');


function getContent(opt, item, callback) {
    if( opt.outside ) {
        //需要翻墙 
        var cmds = [
            'export https_proxy=https://127.0.0.1:8087', 
            'wget --no-check-certificate -q -O - '  + item[opt.linkref] 
        ];
        var context = this;
        debug( cmds.join(';'));
        exec(cmds.join(';'), function(err, out, code) {
            if (err instanceof Error) {
                callback(error);
            }
            callback(null, out);
        });
    } else {
        var url = item[opt.linkref];
        callback(null, url);
    }
}


exports = module.exports =  {
    getContent: getContent
};
