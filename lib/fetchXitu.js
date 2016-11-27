var debug = require('debug')('jsonfetcher:fetch');
var colors = require('colors');
var util = require('util');
var async = require('async');

var exec = require('child_process').exec;  
//var exec = require('exec');

var fs = require('fs');
var request = require('request');
var e_someDaysAgo = 7 * 24* 3600 *1000;



function getDateStr(){
    var date = new Date();
    var time = date.getTime() - (date.getHours()*3600 + date.getMinutes()*60 + date.getSeconds() ) * 1000 - e_someDaysAgo;
    console.log(time);
    var sDate = new Date(time);
    return [sDate.getFullYear(), sDate.getMonth()+1, sDate.getDate()].join('-'); 
}

function getList(opt, callback) {
    var base ='https://api.leancloud.cn/1.1/classes/Entry?&order=-hotIndex&where=';
    var raw = [
        '{"category":"frontend","createdAt":{"$gte":{"__type":"Date","iso":"',
        getDateStr(),
        'T0:0:0.002Z"}}}',
    ];
    var url = base + encodeURIComponent(raw.join(''));
    var requestOptions = {
        url: url,
        headers: {
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36',
            'accept': 'text/html,application/xhtml+xml',
            'x-lc-id': 'mhke0kuv33myn4t4ghuid4oq2hjj12li374hvcif202y5bm6',
            'x-lc-session': 'bv3yqr8fmt9f3jkpmvktyiem5',
            'x-lc-sign': 'f0674d8d4170ad69ce7c5f35e0932864,1476363693256',
            'x-lc-ua': 'AV/js1.5.0'
        },
        timeout: this.timeout || 10000,
        pool: false
    };
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
}

exports = module.exports = {
    getList: getList,
}; 

