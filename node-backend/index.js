var request = require('request');
var express = require('express');
var Promise  = require('promise');
var bodyParser = require('body-parser');
var Twitter = require('twitter');
var credentials = require('./twittercredentials.json');
var cacheMaker = require("./cacheMaker");
var uuid=require('uuid');
var CryptoJS = require('crypto-js');
var cookie = require('cookie');

var port = 4000;

start( port );

function start( port ){
    var app = express();
    var http = require('http').Server(app);
    var io = require('socket.io')(http);
    var ss = require('socket.io-stream');
    io.set('transports', ['websocket', 'polling']);

    console.log('This process is pid', process.pid );

    app.use( bodyParser.json() ); // for parsing application/json
    app.use( bodyParser.urlencoded( { extended: true } ) ); // for parsing application/x-www-form-urlencoded
    app.enable('trust proxy');

    /*   ==================================================
    /    ============== webhooks & callbacks ==============
    /    ==================================================
    */

    var createToken = function(){
        //create a unique token
        var uniqueToken=uuid.v1();
        return uniqueToken;
    }

    var percentEncode = function(str) {
        return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
            return '%' + c.charCodeAt(0).toString(16);
        });
    }

    var parseTwitterResponse = function(raw) {
        if (!raw) return raw;
        // var raw = 'oauth_token=dc3ufQAAAAAAxv8zAAABXI6eNFY&oauth_token_secret=ec69l98KkIl9OP8p6CEPEszzAQdwogq8&oauth_callback_confirmed=true';
        raw = raw.split('&');
        var data = {};
        var temp;
        for (var i in raw) {
            temp = raw[i].split('=');
            data[temp[0]]=temp[1];
        }
        // console.log(data);
        return data;
    }

    var serveFile = function(filename,contentType){
        return function(req,res){
            res.sendFile(__dirname+"/"+filename,{headers:{'Content-Type':contentType || 'text/html'}});
        }
    }

    app.all('*', function( req, res, next ){
        console.log(req.url);
        res.type( 'application/json' );
        console.log( req.method, req.url );
        next();
    });

    app.get('/node', function(req, res) {
        res.send('enemyspeak backend');
    });

    app.get('/node/css/auth.css',serveFile('auth.css','text/css'));

    app.get('/node/twitter',function(req,res){ // twitter oauth callback uri - used in getting an oauth_token
        if (req.query.error) {
            console.log('twitter error found!',req.query);
            res.status( 400 ); // display error in pop up window
            res.sendFile(__dirname+"/"+'failed.html',{headers:{'Content-Type':'text/html'}});

            // res.sendFile('failed.html',{ root:__dirname });
            return;
        }

        var data = req.query; //parseTwitterResponse(req.query);
        // console.log(data);

        // get the user token from the verify token.
        // data.oauth_verifier
        var user = sessions.find(function (obj) { 
            return (obj.requestToken === data.oauth_token); 
        });
        if (!user) {
            console.log('twitter err: no user matching');

            // display error
            res.status( 400 );
            res.sendFile(__dirname+"/"+'failed.html',{headers:{'Content-Type':'text/html'}});
            // res.sendFile('failed.html',{ root:__dirname });
            return;
        }

        // console.log('header ip',req.headers['x-forwarded-for']); //  x-real-ip?
        // look up the user -
        // console.log("twitter got user data",fetchedUserData.id);//,fetchedUserData);
        // var userData = fetchedUserData; // save user data per socket session

        var oauth_token = data.oauth_token;
        var oauth_verifier = data.oauth_verifier;

        // test if oauth_token or oauth_verifier exist.
        console.log(oauth_token,oauth_verifier);

        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        var nonce = s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
        nonce = new Buffer( nonce ).toString('base64');
        var timestamp = Math.round((new Date()).getTime() / 1000.0);//new Date().getTime();
        var parameters =
            'oauth_consumer_key='+percentEncode(credentials.twitter.consumer_key)+
            '&oauth_nonce='+percentEncode(nonce)+
            '&oauth_signature_method='+percentEncode('HMAC-SHA1')+
            '&oauth_timestamp='+percentEncode(timestamp)+
            '&oauth_token='+percentEncode(oauth_token)+
            '&oauth_version='+percentEncode('1.0');
        var base = 'POST'+'&'+percentEncode('https://api.twitter.com/oauth/access_token')+'&'+percentEncode(parameters);
        var signingKey = percentEncode(credentials.twitter.consumer_secret)+'&';//+percentEncode(OAuth token secret);
        var signiture = CryptoJS.HmacSHA1(base, signingKey);
        signiture = CryptoJS.enc.Base64.stringify(signiture);

        // console.log('twitter header',base,signingKey,signiture);
        // console.log('twitter signiture',percentEncode(signiture));

        request.post({
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'OAuth ' + 
                                            'oauth_consumer_key="'+percentEncode(credentials.twitter.consumer_key)+'", '+
                                            'oauth_nonce="'+percentEncode(nonce)+'", '+
                                            'oauth_signature="'+percentEncode(signiture)+'", '+
                                            'oauth_signature_method="'+percentEncode('HMAC-SHA1')+'", '+
                                            'oauth_timestamp="'+percentEncode(timestamp)+'", '+
                                            'oauth_token='+percentEncode(oauth_token)+'", '+
                                            'oauth_version="'+percentEncode('1.0')+'"'
            },
            url: 'https://api.twitter.com/oauth/access_token',
            form:  {
                oauth_verifier: oauth_verifier
            },
            method: 'POST'
        },function(error, response, body){
            let data = body;
            if(error || (data && data.errors)) { 
                // console.log(parameters,signiture);
                console.log('twitter access token err',data,error);//,response);
    
                res.status( 400 );
                res.sendFile(__dirname+"/"+'failed.html',{headers:{'Content-Type':'text/html'}});
            } else { 
                data = parseTwitterResponse(data);
                console.log('success! twitter access token',data);

                res.status( 200 );
                res.sendFile(__dirname+"/"+'success.html',{headers:{'Content-Type':'text/html'}});

                user.hasTwitter = true;
                user.oauth_token = data.oauth_token;
                user.oauth_token_secret = data.oauth_token_secret;
                user.screen_name = data.screen_name;
                user.user_id = data.user_id;

                delete user.requestToken;
                delete user.requestTokenSecret;

                // FIXME: this doesn't update userData in the socket.

                io.to(user.id).emit('twittertoken',{
                    hasTwitter: true,
                    user_id: data.user_id,
                    screen_name: data.screen_name
                }); // tell the front end we got one.
            }
        });
    });

    /********************************************************************************/
    /*********************************** SOCKETIO ***********************************/
    /********************************************************************************/

    var sessions = []; // this is where we're going to keep our session tokens and stuff.
    var usersConnected = 0;
    var id_seq = 0;
    io.on( 'connection', function( socket ){
        usersConnected++;
        var userData={};

        var twit,timelinecache = [],mentionscache = [],directmessagescache = [],sentdirectmessagescache = [];
        var userStream;

        console.log('a user connected', usersConnected, 'This process is pid', process.pid );
        // console.log(socket);

        function createTwitter() {
            twit = new Twitter({
                consumer_key: credentials.twitter.consumer_key,           
                consumer_secret: credentials.twitter.consumer_secret,        
                access_token_key: userData.oauth_token,       
                access_token_secret: userData.oauth_token_secret
            });
        }

        // sessiontoken //
        function checkToken() {
            // console.log( 'header', socket.handshake.headers );
            var user;
            if (socket.handshake.headers && socket.handshake.headers.cookie) { // check if cookie fields exist
                var cookies = cookie.parse(socket.handshake.headers.cookie);
                if (cookies.sessiontoken) {
                    console.log('checkToken',cookies.sessiontoken,socket.handshake.headers["x-forwarded-for"]);
                    user = sessions.find(function (obj) { 
                        return (obj.ip === socket.handshake.headers["x-forwarded-for"] && obj.sessiontoken === cookies.sessiontoken); 
                    });
                }
            }
            if (user) {
                userData = user;
                console.log('current user', userData);

                if (userData.hasTwitter) {
                    if (!twit) {
                        createTwitter();
                    }
                    socket.emit('twittertoken',{
                        hasTwitter: userData.hasTwitter,
                        user_id: userData.user_id,
                        screen_name: userData.screen_name
                    });
                }

                socket.join( userData.id ); // join your own room with your user id
            } else {
                createSessionToken();
            }
        }
        
        checkToken();

        function createSessionToken() {
            var token = createToken();

            console.log(' create token ------------------------------------------');
            console.log( socket.handshake.headers["x-forwarded-for"] );
            console.log( token );
            console.log('--------------------------------------------------------');
            id_seq++;

            sessions.push({ 
                sessiontoken:token,
                hasTwitter:false,
                id: id_seq,
                ip: socket.handshake.headers["x-forwarded-for"] // nginx isn't giving us x-real-ip..  // socket.conn.request.headers['x-forwarded-for']
            });

            userData = {
                sessiontoken:token,
                hasTwitter:false,
                id: id_seq,
                ip: socket.handshake.headers["x-forwarded-for"] // nginx isn't giving us x-real-ip..  // socket.conn.request.headers['x-forwarded-for'] 
            };
            console.log('current user', userData);

            socket.join( userData.id ); // join your own room with your user id
            socket.emit('sessiontoken',token);
        }

        function streamfunction(event) {
            socket.emit('hometweet',event);
            // TODO add an id here so react can use this.
            // event.id 
            timelinecache.unshift(event); // add this to the cache.
            console.log(event && event.text);
            streamfunction = this;
        };
        
        socket.on( 'disconnect', function(){
            usersConnected--;
            console.log('user disconnected', usersConnected);
            if(userData.id){
                socket.leave(userData.id);
                userData = {}; // clear user data, might not be necessary, closure should take care of it
            }
            if (userStream) {
                userStream.removeAllListeners('data');
                userStream.destroy();
            }
        });

        socket.on('getrequesttoken',function(data,cb){
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            var callback = 'http://138.197.170.47/node/twitter';
            var nonce = s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
            nonce = new Buffer( nonce ).toString('base64');
            var timestamp = Math.round((new Date()).getTime() / 1000.0);//new Date().getTime();
            var parameters =
                'oauth_callback='+percentEncode(callback)+
                '&oauth_consumer_key='+percentEncode(credentials.twitter.consumer_key)+
                '&oauth_nonce='+percentEncode(nonce)+
                '&oauth_signature_method='+percentEncode('HMAC-SHA1')+
                '&oauth_timestamp='+percentEncode(timestamp)+
                '&oauth_version='+percentEncode('1.0');
            var base = 'POST'+'&'+percentEncode('https://api.twitter.com/oauth/request_token')+'&'+percentEncode(parameters);
            var signingKey = percentEncode(credentials.twitter.consumer_secret)+'&';//+percentEncode('E0h6CsWX0zgiPppitqI7Hk7XluGmjIfgs0zEUjLaQzWGW');
            var signiture = CryptoJS.HmacSHA1(base, signingKey);
            signiture = CryptoJS.enc.Base64.stringify(signiture);

            // console.log('twitter header',base,signingKey,signiture);
            // console.log('twitter signiture',percentEncode(signiture));

            request.post({
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'OAuth ' + 'oauth_callback="'+percentEncode(callback)+'", '+
                                                'oauth_consumer_key="'+percentEncode(credentials.twitter.consumer_key)+'", '+
                                                'oauth_nonce="'+percentEncode(nonce)+'", '+
                                                'oauth_signature="'+percentEncode(signiture)+'", '+
                                                'oauth_signature_method="'+percentEncode('HMAC-SHA1')+'", '+
                                                'oauth_timestamp="'+percentEncode(timestamp)+'", '+
                                                'oauth_version="'+percentEncode('1.0')+'"'
                },
                url: 'https://api.twitter.com/oauth/request_token',
                form:  {
                    oauth_callback: callback
                },
                method: 'POST'
            },function(error, response, body){
                var data = body;

                if(error || (data && data.errors)) { 
                    // console.log(parameters,signiture);
                    console.log('twitter auth/token err',data,error);//,response);
                    if (cb) cb('error');
                    // res.status( 400 );
                } else { 
                    // console.log('success! twitter token',data);
                    // socket.emit('twitter token',data);
                    data = parseTwitterResponse(data);
                    userData.requestToken = data.oauth_token;
                    userData.requestTokenSecret = data.oauth_token_secret;

                    // sessions
                    // var cookies = cookie.parse(socket.handshake.headers.cookie); // don't go back to the cookie here.
                    var sessiontoken = userData.sessiontoken;
                    if (sessiontoken) {
                        console.log(sessiontoken,socket.handshake.headers["x-forwarded-for"]);

                        var user = sessions.find(function (obj) { 
                            return (obj.ip === socket.handshake.headers["x-forwarded-for"] && obj.sessiontoken === sessiontoken); 
                        });
                        if (user) {
                            console.log('user found',user);
                            user.requestToken = data.oauth_token;
                            if (cb) cb(data.oauth_token);
                        } else {
                            console.log('user not found');
                            if (cb) cb('error');    
                        }
                    } else {
                        console.log('no sessiontoken');
                        if (cb) cb('error');
                    }
                    // oauth_verifier

                    // delete data.oauth_token_secret;
                    
                }
            });
        });

        function authorizeRequest() {
            return new Promise(function(resolve,reject) {
                if (!userData.hasTwitter) {
                    // NOTE: this is just to get the socket to update its cache
                    // after you authenticate..

                    // see fixme on 183
                    
                    user = sessions.find(function (obj) { 
                        return (obj.id === userData.id)
                    });
                    if (user && user.hasTwitter) {
                        userData = user; 
                      
                    }
                }
                if (userData.hasTwitter) {
                    if (!twit) {
                        createTwitter();
                    }
                    return resolve();
                }

                return reject();
            })
        }

        // ANYTHING BELOW HERE NEEDS AUTH

        socket.on('updatestatus',function(data,cb){
            authorizeRequest().then(function() {
                if (!data) {
                    if (cb) cb('bad request');
                }
                twit.updateStatus(data.status,
                    function (err, result) {
                        console.log(result);
                        if (cb) cb(result);
                    }
                );
            }).catch(function() {
                if (cb) cb('unauthorized');
                console.log('unauthorized updatestatus');
            })
        });

        socket.on('stophometimelinestream',function(data,cb){ 
            try {
                if (userStream) {
                    userStream.removeAllListeners('data');
                    userStream.destroy();
                }
                if (cb) cb('ok');
            } catch (error) {
                console.log(error);
                if (cb) cb('error');
            }
        });

        socket.on('gethometimeline',function(data,cb){
            authorizeRequest().then(function() {
                if (timelinecache.length) {
                    // console.log('return cache');
                    if (cb) cb(timelinecache);
                    // return; // we dont want to return here because this will cancel making a stream   
                } else {
                    // return cache here, probably using makeCacheFunction instead of timelinecache..
                    twit.get('statuses/home_timeline',{tweet_mode:'extended',count:200},function(err,result) {
                        if (err) {
                            console.log('home_timeline err',err);
                            if (cb) cb('error');
                            // return; // we dont want to return here because this will cancel making a stream
                        } else {
                            // console.log('timeline result',result.length);
                            timelinecache = result;
                            // if (cb) cb(result);
                            if (cb) cb(timelinecache);
                        }
                    });
                }
                if (!userStream) {
                    twit.stream('user', {tweet_mode:'extended'}, function(stream) {
                        console.log('create stream');
                        userStream = stream;
                        userStream.on('data', streamfunction);
                        userStream.on('error',function(err) {
                            console.log('stream error',err); // 420 probably.
                        });
                        userStream.on('end', function (response) {
                            console.log('closed stream'); // ,response );
                        });
                    });
                }
            }).catch(function() {
                if (cb) cb('unauthorized');
            })
        });

        socket.on('getmentions', function(data,cb) { // load profile by id
            // console.log('get mentions',data);
            authorizeRequest().then(function() {
                if (mentionscache.length) {
                    if (cb) cb(mentionscache);
                    return;
                }
                twit.get('statuses/mentions_timeline',{tweet_mode:'extended',count:200},function(error,result) {
                    if (error) {
                        console.log('mentions_timeline err',error);
                        if(cb) cb('error');
                        return;
                    }
                    mentionscache = result;
                    if(cb) cb(mentionscache);
                });
            }).catch(function(error) {
                // console.log('mentions unauthorized',userData,error);
                if (cb) cb('unauthorized');
            })
           
        });   

        socket.on('getdirectmessages',function(data,cb) {
            authorizeRequest().then(function() {
                if (directmessagescache.length) {
                    if (cb) cb(directmessagescache);
                    return;
                }

                twit.get('direct_messages', {count:200,full_text:'true',include_entities:'true'}, function(error, result) {
                // twit.get('direct_messages/events/list', {}, function(error, result) {
                    if (error) {
                        console.log(error);
                        if(cb) cb('error');
                        return;
                    }
                    // console.log('mentions result');
                    directmessagescache = result;
                    if(cb) cb(directmessagescache);
                });
            }).catch(function() {
                if (cb) cb('unauthorized');
            })
        });

        socket.on('getsentdirectmessages',function(data,cb) {
            authorizeRequest().then(function() {
                if (sentdirectmessagescache.length) {
                    if (cb) cb(sentdirectmessagescache);
                    return;
                }

                twit.get('direct_messages/sent', {count:200,full_text:'true',include_entities:'true'}, function(error, result) {
                // twit.get('direct_messages/events/list', {}, function(error, result) {
                    if (error) {
                        console.log(error);
                        if(cb) cb('error');
                        return;
                    }
                    // console.log('mentions result');
                    sentdirectmessagescache = result;
                    if(cb) cb(sentdirectmessagescache);
                });
            }).catch(function() {
                if (cb) cb('unauthorized');
            })
        });

        socket.on('getdetails', function(data,cb) { // loads replies and stuff to a tweet
            authorizeRequest().then(function() {
                if (!data.id) {
                    if(cb) cb('error');
                    return;
                }
                // TODO cache this
                twit.get('statuses/show/',{id:data.id,tweet_mode:'extended'},function(error, tweet) {
                    if (error) {
                        if(cb) cb('error');
                        return;
                    }
                    if(cb) cb(tweet);
                });
            }).catch(function() {
                if (cb) cb('unauthorized');
            });
        });

        // socket.on('gethomeuser', function(data,cb) { // load profile by id
        //     authorizeRequest().then(function() {
        //         if(cb) cb(profilecache)
        //     }).catch(function() {
        //         if (cb) cb('unauthorized');
        //     });
        // });

        // socket.on('gethomeusertimeline', function(data,cb) { // load profile by id
        //     authorizeRequest().then(function() {
        //         if(cb) cb(homeusertimelinecache)
        //     }).catch(function() {
        //         if (cb) cb('unauthorized');
        //     }); 
        // });

        socket.on('getuser', function(data,cb) { // load profile by screen_name
            // TODO cache this
            authorizeRequest().then(function() {
                console.log('getuser',data);
                if (!data.screen_name) {
                    if(cb) cb('error');
                    return;
                }

                let user;
                twit.get('users/show', {screen_name: data.screen_name},function(error,  response) {
                    if (error) {
                        if(cb) cb('error');
                        return;
                    }
                    user = response
                    twit.get('statuses/user_timeline',{screen_name: data.screen_name,tweet_mode:'extended',count:200},function(error, tweets) {
                        if (error) {
                            if(cb) cb('error');
                            return;
                        }
                        user.timeline = tweets;
                        if(cb) cb(user);
                    });
                });
            }).catch(function() {
                if (cb) cb('unauthorized');
            });
        });

        socket.on('searchtwitter', function(data,cb) { // search tweets & users
            authorizeRequest().then(function() {
                if (!data || !data.search) {
                    if(cb) cb('error');
                    return;
                }
                twit.get('search/tweets',{q:data.search,count:100,tweet_mode:'extended',result_type:'popular'}, function(err, result) {
                    // console.log(result);
                    if (cb) cb(result);
                });
            }).catch(function(error) {
                // console.log('search err',error);
                if (cb) cb('unauthorized');
            });
        });

        socket.on('getfavoriteslist',function(data,cb) {
            authorizeRequest().then(function() {
                // if (!data || !data.id) {
                //     if (cb) cb({error:'error'});
                //     return;
                // } 

                twit.get('favorites/list',{count:200,tweet_mode:'extended'},function(error, result) {
                    if (cb) cb(result);
                });
            }).catch(function() {
                if (cb) cb('unauthorized');
            });
        });

        socket.on('getretweets',function(data,cb) {
            authorizeRequest().then(function() {
                // if (!data || !data.id) {
                //     if (cb) cb({error:'error'});
                //     return;
                // } 

                twit.get('statuses/retweets_of_me',{},function(error, result) {
                    if (cb) cb(result);
                });
            }).catch(function() {
                if (cb) cb('unauthorized');
            });
        });

        // POST

        socket.on('retweettweet',function(data,cb){
            authorizeRequest().then(function() {
                if (!data || !data.id) {
                    if (cb) cb({error:'error'});
                    return;
                } 
                twit.post('statuses/retweet/',{id:data.id},function(error, tweets) {
                    if (error) {
                        if(cb) cb({error:error});
                        return;
                    }
                    if(cb) cb('ok');
                });
            }).catch(function() {
                if (cb) cb('unauthorized');
            });
        });

        socket.on('unretweettweet',function(data,cb){
            authorizeRequest().then(function() {
                if (!data || !data.id) {
                    if (cb) cb({error:'error'});
                    return;
                } 
                twit.post('statuses/unretweet/',{id:data.id},function(error, tweets) {
                    if (error) {
                        if(cb) cb({error:error});
                        return;
                    }
                    if(cb) cb('ok');
                });
            }).catch(function() {
                if (cb) cb('unauthorized');
            });
        });

        socket.on('favoritetweet',function(data,cb) {
            authorizeRequest().then(function() {
                if (!data || !data.id) {
                    if (cb) cb({error:'error'});
                    return;
                } 

                // TODO update the cached tweet to set favorited = true;

                twit.post('favorites/create',{id: data.id},function(error, tweets) {
                    if (error) {
                        if(cb) cb({error:error});
                        return;
                    }
                    if(cb) cb('ok');
                });
            }).catch(function() {
                if (cb) cb('unauthorized');
            });
        });
        socket.on('unfavoritetweet',function(data,cb) {
            authorizeRequest().then(function() {
                if (!data || !data.id) {
                    if (cb) cb({error:'error'});
                    return;
                } 
                twit.post('favorites/destroy',{id: data.id},function(error, tweets) {
                    if (error) {
                        if(cb) cb({error:error});
                        return;
                    }
                    if(cb) cb('ok');
                });
            }).catch(function() {
                if (cb) cb('unauthorized');
            });
        });

        socket.on('blockuser',function(data,cb) {
            authorizeRequest().then(function() {
                if (!data || !data.id) {
                    if (cb) cb({error:'error'});
                    return;
                } 

                twit.post('blocks/create',{user_id: data.id},function(error, tweets) {
                    if (error) {
                        if(cb) cb({error:error});
                        return;
                    }
                    if(cb) cb('ok');
                });
            }).catch(function() {
                if (cb) cb('unauthorized');
            });
        });
        socket.on('unblockuser',function(data,cb) {
            authorizeRequest().then(function() {
                if (!data || !data.id) {
                    if (cb) cb({error:'error'});
                    return;
                } 
                twit.post('blocks/destroy',{user_id: data.id},function(error, tweets) {
                    if (error) {
                        if(cb) cb({error:error});
                        return;
                    }
                    if(cb) cb('ok');
                });
            }).catch(function() {
                if (cb) cb('unauthorized');
            });
        });
        

        socket.on('createstatus',function(data,cb) {
            authorizeRequest().then(function() {
                if (!data || !data.status) {
                    if (cb) cb({error:'error'});
                    return;
                } 
                twit.post('favorites/destroy',{status: data.status},function(error, tweets) {
                    if (error) {
                        if(cb) cb({error:error});
                        return;
                    }
                    if(cb) cb('ok');
                });
            }).catch(function() {
                if (cb) cb('unauthorized');
            });
        });
    });

    http.listen(port, function(){
        console.log('listening on *:', port);
    });
}