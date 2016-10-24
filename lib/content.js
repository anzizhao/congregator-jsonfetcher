var read = require('node-read');
var async = require('async');
var debug = require('debug')('jsonfetcher:content-fetcher');
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();
var util = require('util');
var helpers = require('./helpers');
var url = require('url');
var exec = require('child_process').exec;  
//var exec = require('exec');
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

        var timer, child;
        timer = setTimeout( function(){
            //超时杀掉子进程
            child.kill(); 
            callback(new Error('timeout: ' + (this.timeout/1000) + 's, getting ' + opt.url ));
        }.bind(this), this.timeout||5000) ;


        child =  exec(cmds.join(';'), function(err, out, code) {
            if (err instanceof Error) {
                // 接受到被杀死的信号  已经做返回处理 不做什么处理 退出
                if( err.signal === 'SIGKILL') {
                    return  
                }
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
