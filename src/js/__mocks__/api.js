
// read cookie and check token
function doSessionToken(cb) { // this happens automatically now.
  console.log('my token',cookies.get('user')); //
  let cookiedata = cookies.get('user')


  var getToken = function() {
    // socket.emit('getToken',{},function(data) {
    //   console.log('get token',data);
    //   cookies.set('user', data);
    // });
  }

  if (cookiedata) {
    // socket.emit('checkToken',cookiedata.token,function(data) {
    //   console.log(data);
    //   if (data === 'bad format') { // if error:
    //     console.log('token rejected');
    //     getToken();
    //     return;
    //   } 

    //   console.log('token accepted',data);
    //   // ok we know who you are..

    // });
  } else {
    getToken();
  }
}

function gainedConnectionAlert(cb) {
  // socket.on('reconnect', () => cb(null,true));
  // socket.on('connect', () => cb(null,true));
}
function lostConnectionAlert(cb) {
  // socket.on('disconnect', () => cb(null,false));
  // socket.on('error', () => cb(null,false));
  // socket.on('connect_timeout', () => cb(null,false));
  // socket.on('connect_failed', () => cb(null,false));
  // socket.on('connect_error', () => cb(null,false));
}

// socket.on('sessiontoken',function(data){
//     console.log('get token',data);
//     cookies.set('sessiontoken', data, { path: '/' });
// });

// socket.once('twittertoken',function(data){
//     console.log('get twitter details',data)
//     loginPromiseResolve(data);
// });

var loginPromiseResolve;
var loginPromise = new Promise(function(resolve,reject) {
  loginPromiseResolve = resolve;
});

function gotTwitterLoginPromise() {
  return loginPromise;
}

// doSessionToken();

function getRequestToken() {
  return new Promise(function(resolve,reject) {
    // socket.emit('getrequesttoken',{},function(data) {
    //   console.log('got getRequestToken',data);
    //   if (data === 'error') {
    //     return reject();
    //   }
    //   resolve(data);
    // });
  });
}


function fetchHomeTimeline(cb) {
	// socket.emit('gethometimeline',{},function(data) {
	// 	// console.log(data);
	// 	if (!data || data==='unauthorized' || data==='error') {
	// 	  cb(null, []);
	// 		return;
	// 	}
	// 	// return data;
	// 	cb(null, data);
	// });
}

function subscribeToHomeTimeline(cb) {
	// socket.on('hometweet',function(data){
	// 	if (!data || data==='unauthorized' || data==='error') {
	// 		  cb(null, []);
 //  			return;
 //  		}
 //  		// return data;
 //  		cb(null, data);
	// })
}

// TODO we should cache this data so we can combine it with retweets
function fetchMentions(cb) {
	// socket.emit('getmentions',{},function(data) {
	// 	// console.log(data);
	// 	if (!data || data==='unauthorized' || data==='error') {
	// 	  cb(null, []);
	// 		return;
	// 	}
	// 	// return data;
	// 	cb(null, data);
	// });
}

// getretweets
function fetchRetweets(cb) {
  // socket.emit('getretweets',{},function(data) {
  //   // console.log(data);
  //   if (!data || data==='unauthorized' || data==='error') {
  //     cb(null, []);
  //     return;
  //   }
  //   // return data;
  //   cb(null, data);
  // });
}

function fetchFavorites(cb) {
  // socket.emit('getfavoriteslist',{},function(data) {
  //   // console.log(data);
  //   if (!data || data==='unauthorized' || data==='error') {
  //     cb(null, []);
  //     return;
  //   }
  //   // return data;
  //   cb(null, data);
  // }); 
}

function fetchDirectMessages(cb) {
  // socket.emit('getdirectmessages',{},function(data) {
  //   console.log(data);
  //   if (!data || data==='unauthorized' || data==='error') {
  //     cb(null, []);
  //     return;
  //   }
  //   // return data;
  //   cb(null, data);
  // });   
}

function fetchSentDirectMessages(cb) {
  // socket.emit('getsentdirectmessages',{},function(data) {
  //   console.log(data);
  //   if (!data || data==='unauthorized' || data==='error') {
  //     cb(null, []);
  //     return;
  //   }
  //   // return data;
  //   cb(null, data);
  // });   
}


// // returns your profile
// function fetchHomeUser(cb) {
//   	socket.emit('gethomeuser',{},function(data) {
//   		// console.log(data);
//   		if (!data) {
// 			cb(null, []);
//   			return;
//   		}
//   		// return data;
//   		cb(null, data);
//   	});
// }
// function fetchHomeUserTimeline(cb) {
//   	socket.emit('gethomeusertimeline',{},function(data) {
//   		// console.log(data);
//   		if (!data) {
// 			cb(null, []);
//   			return;
//   		}
//   		// return data;
//   		cb(null, data);
//   	});
// }

// // returns details & timeline of user in user_id
// function fetchuser(id,cb) {
//   	socket.emit('getuser',{user_id: id},function(data) {
//   		// console.log(data);
//   		if (!data) {
// 			cb(null, []);
//   			return;
//   		}
//   		// return data;
//   		cb(null, data);
//   	});
// }


var usersCache = [];
function fetchUserByName(screen_name) {
  return new Promise( function(resolve,reject ) {
  	console.log('fetch user',screen_name);
  	if (!screen_name){ 
      reject('missing data');
  		// cb(null, undefined);
  		return
  	};

    if (usersCache[screen_name]) {
      console.log('return cache');
      resolve(usersCache[screen_name]);
      return;
    }
  	// socket.emit('getuser',{screen_name:screen_name},function(data) {
  	// 	console.log('got user data',data);
   //    if (!data || data==='unauthorized' || data==='error') {
			// // cb(null, undefined);
  	// // 		return;
   //      reject('error');
   //      return;
  	// 	}
  	// 	// return data;
  	// 	// cb(null, data);
   //    usersCache[screen_name] = data; // cache the result.
   //    resolve(data);
  	// });
  })
}

//searches
function searchTweets(term,cb) {
  return new Promise(function(resolve, reject) {
    if (!term){ 
      reject('no term!');
    };
    // socket.emit('searchtwitter',{search:term},function(data) {
    //   if (!data || data==='unauthorized' || data==='error') {
    //     reject(data)
    //   } else {
    //     resolve(data);
    //     console.log(data);
    //   }
    // });
  });
}

  // actions!
function favoriteTweet(id,cb) {
  // console.log(id);
  return new Promise(function(resolve, reject) {
    if (!id){ 
      reject('no id!');
    };
    // socket.emit('favoritetweet',{id:id},function(data) {
    //   if (!data || data==='unauthorized' || data==='error') {
    //     reject(data)
    //   } else {
    //     resolve();
    //     console.log(data);
    //   }
    // });
  });
}

function unfavoriteTweet(id,cb) {
  return new Promise(function(resolve, reject) {
    if (!id){ 
      reject('no id!');
    };
    // socket.emit('unfavoritetweet',{id:id},function(data) {
    //   if (!data || data==='unauthorized' || data==='error') {
    //     reject(data)
    //   } else {
    //     resolve();
    //     console.log(data);
    //   }
    // });
  });
}

function retweetTweet(id,cb) {
  // console.log(id);
  return new Promise(function(resolve, reject) {
    if (!id){ 
      reject('no id!');
    };
    // socket.emit('retweettweet',{id:id},function(data) {
    //   if (!data || data==='unauthorized' || data==='error') {
    //     reject(data)
    //   } else {
    //     resolve();
    //     console.log(data);
    //   }
    // });
  });
}

function unretweetTweet(id,cb) {
  return new Promise(function(resolve, reject) {
    if (!id){ 
      reject('no id!');
    };
    // socket.emit('unretweettweet',{id:id},function(data) {
    //   if (!data || data==='unauthorized' || data==='error') {
    //     reject(data)
    //   } else {
    //     resolve();
    //     console.log(data);
    //   }
    // });
  });
}

function followUser(id,cb) {
  return new Promise(function(resolve, reject) {
    if (!id){ 
      reject('no id!');
    };
    // socket.emit('followuser',{id:id},function(data) {
    //   if (!data || data==='unauthorized' || data==='error') {
    //     reject(data)
    //   } else {
    //     resolve();
    //     console.log(data);
    //   }
    // });
  }); 
}
function unfollowUser(id,cb) {
  return new Promise(function(resolve, reject) {
    if (!id){ 
      reject('no id!');
    };
    // socket.emit('unfollowuser',{id:id},function(data) {
    //   if (!data || data==='unauthorized' || data==='error') {
    //     reject(data)
    //   } else {
    //     resolve();
    //     console.log(data);
    //   }
    // });
  }); 
}

function createStatus(data,cb) {
  return new Promise(function(resolve, reject) {
    if (!data){ 
      reject('no data!');
    };
    // socket.emit('createstatus',{data:data},function(result) {
    //   if (!result || result==='unauthorized' || result==='error') {
    //     reject(result)
    //   } else {
    //     resolve();
    //     console.log(result);
    //   }
    // });
  }); 
}

export { doSessionToken, getRequestToken,gotTwitterLoginPromise,gainedConnectionAlert,lostConnectionAlert, fetchHomeTimeline, fetchMentions,fetchRetweets,fetchFavorites,fetchDirectMessages, fetchSentDirectMessages,subscribeToHomeTimeline,fetchUserByName,searchTweets,favoriteTweet,unfavoriteTweet,retweetTweet,unretweetTweet,followUser,unfollowUser,createStatus };