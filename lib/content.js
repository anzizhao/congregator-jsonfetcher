var read = require('node-read');
var async = require('async');
var debug = require('debug')('jsonfetcher:content-fetcher');
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();
var util = require('util');
var helpers = require('./helpers');
var url = require('url');
var exec = require('exec');

exports = module.exports = function () {
    return function (mapping, entries, callback) {
        if (!mapping.body){
            callback(null, null);
            return;
        }
        debugger;
        if (!mapping.linkref){
            callback(null, null);
            return;
        }

        var processed = [];

        // loop through each entry and get the body content
        async.each(entries, function (item, callback) {
            process.nextTick(function () {
                var illegalDomain = helpers.containsIllegalDomain(item[mapping.linkref]);
                if (!item[mapping.linkref] || illegalDomain) {
                    debug('link contains illegal domain: ' + illegalDomain);
                    callback();
                    return;
                }
                debugger;
                if( mapping.outside ) {
                    //需要翻墙 
                    var cmds = [
                        'export https_proxy=https://127.0.0.1:8087', 
                        'curl -k '  + item[mapping.linkref] 
                    ];
                    var context = this;
                    exec(cmds.join(';'), function(err, out, code) {
                        if (err instanceof Error) {
                            callback(error);
                        }
                        debugger;
                        Read(context, out)
                    });
                } else {
                    var url  = item[mapping.linkref];
                    debugger;
                    Read(this, url);
                }

                function Read( context,  url ){
                    read( url, { pool: context.agent, timeout: context.timeOut }, function (err, article, res) {
                        // override when error occurs
                        if (err) {
                            debug('got error for guid: ' + item.guid + ' - ' + util.inspect(err));
                            callback();
                            return;
                        }

                        // add content to item
                        item.content = {
                            title: article.title,
                            body: entities.decode(article.content),
                            image: helpers.fixRelativePath(helpers.getMetaImage(article.dom), item[mapping.linkref])
                        };

                        // add to result list
                        processed.push(item);

                        // callback
                        callback();
                    }.bind(context));
                }
            }.bind(this));
        }.bind(this),
        function (err) {
            if (err) debug(util.inspect(err));
            callback(err, processed);
        });
    };
};
