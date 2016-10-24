var debug = require('debug')('jsonfetcher:fetch');
var colors = require('colors');
var util = require('util');
var async = require('async');
var helpers = require('./helpers');

var exec = require('child_process').exec;  
//var exec = require('exec');

var fs = require('fs');
var request = require('request');
var getListXitu = require('./fetchXitu').getList;


function getListCommon (opt, callback) {
    //common get list 
    //通用的获取资源方法
    var requestOptions = {
        url: opt.url,
        headers: {
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36',
            'accept': 'text/html,application/xhtml+xml',
        },
        timeout: this.timeout || 10000,
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
            'curl -k ' + opt.url
        ];
        debug( cmds.join(';'))
        var timer, child;
        timer = setTimeout( function(){
            //超时发送杀掉子进程信号, 当子进程不会立马被删掉  
            child.kill('SIGKILL'); 
            callback(new Error('timeout: ' + (this.timeout/1000) + 's, getting ' + opt.url ));
        }.bind(this), this.timeout||5000) ;

        child =  exec(cmds.join(';'), function(err, out, code) {
            if( timer ) {
                clearTimeout(timer); 
                timer = 0;
            }
            if (err instanceof Error) {
                // 接受到被杀死的信号  已经做返回处理 不做什么处理 退出
                if( err.signal === 'SIGKILL') {
                    return  
                }
                callback(err);
            }
            var jsonStr = out.substr( out.indexOf('{'));
            callback(null, jsonStr);
        });

    }
}
function getList(opt, callback) {
    switch(opt.name) {
        case 'xitu':  
            (getListXitu.bind(this))(opt, callback);
            break;
        default:
            (getListCommon.bind(this))(opt, callback);
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

