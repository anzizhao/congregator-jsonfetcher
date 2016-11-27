var debug = require('debug')('jsonfetcher:fetch');
var util = require('util');
var async = require('async');

var exec = require('child_process').exec;  

var fs = require('fs');
var request = require('request');
var getListXitu = require('./fetchXitu').getList;


exports = module.exports = {
    getList: getList,
    handleList: handleList,
}; 


function getList(opt, callback) {
    switch(opt.name) {
        case 'xitu':  
            (getListXitu.bind(this))(opt, callback);
            break;
        default:
            (getListCommon.bind(this))(opt, callback);
    }
}

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
                try{
                    callback(err);
                }catch(e) {
                    debug( e.msg + e.stack ) 
                }
            }

            var jsonStr = out.substr( out.indexOf('{'));
            try{
                callback(null, jsonStr);
            }catch(e) {
                debug( e.msg + e.stack ) 
            }
        });

    }
}

function handleList(opt,  body, callback) {
    var entries;
    var entriesParent; 
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
    // 并发发送图片的请求 最多100？ 稀土
    // TODO post picture 使用图片服务器抓取相关的图片
    // handlePictureUrl
    (handlerEntries.bind(this))(opt, entries, entriesParent, callback);
}


function handlerEntries (opt, _entries, entriesParent, callback ) {
    var fetchUrl = this.imageServer;

    async.waterfall([
        function(callback) {
            var formattedPosts = []; // formatted posts holder
            var ranking = 0;
            var entries = _entries; 

            if( opt.name === 'medium') {
                entries = Object.keys(_entries);
            } 
            async.eachSeries( entries, function ( item, callback) {

                var post = item;
                if( opt.name === 'medium') {
                    post = _entries[key];
                } 
                var formattedPost = this.handler(post, opt, ++ranking, entriesParent);
                if (formattedPost){
                    formattedPosts.push(formattedPost);
                } 
                callback();

            }.bind(this), function (err) {
                callback(err, formattedPosts);
            });

        }.bind(this),
        function(entries, callback) {
            //转化出来的entries 
            //wired 网站做图片缓存处理
            async.map( entries, function(entry, callback){
                switch( entry.site ) {
                    case 'Mashable': 
                        break;
                    default: 
                        return callback(null, entry);
                }
                var requestData = {
                    url: entry.image,
                    category:  entry.site.replace(/\s/g, ""),
                    options: {
                        webp: true, 
                    }
                };
                request({
                    url: fetchUrl,
                    method: "POST",
                    json: true,
                    headers: {
                        "content-type": "application/json",
                    },
                    body: JSON.stringify(requestData)
                }, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        entry.imageB = body.data.url
                        console.dir( entry )
                    }
                    callback(null, entry)
                }); 

            }, function(err, _entries ){
                callback(err, _entries) 
            }) 
        }
    ], function(err, result){
        callback(err, result ) 
    })




}


