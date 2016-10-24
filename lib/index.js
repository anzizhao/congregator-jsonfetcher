var http = require('http');
var Base = require('congregator-base');

var fetch = require('./fetch');
var content = require('./content');




function JsonReader (options) {
    Base.call(this, options)
    this.fetcher.setFetchMsg('beginning fetch from jsonfetcher: ');
    this.fetcher.setGetListFn( fetch.getList.bind(this) );
    this.fetcher.setHandleListFn( fetch.handleList.bind(this) );
    this.contenter.setGetContentFn( content.getContent.bind(this));

}

function f(){}
f.prototype = Base.prototype;

JsonReader.prototype = new f();
JsonReader.prototype.handler = require('./handler')();
JsonReader.prototype.finishRunMsg = function(){
    return '**Congregator-jsonFetcher done waiting - commensing new fetch..............**'.blue;
} 

exports = module.exports = JsonReader;
