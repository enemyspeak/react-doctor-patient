import Cookies from 'universal-cookie';
const cookies = new Cookies();

// FIXME
const socket = {
  emit: function(){},
  on: function(){},
  once: function(){}
}

// prod
// const resturl = 'http://138.197.170.47/node';
// dev
const resturl = 'http://localhost';


// TODO port this code to new rest api

// read cookie and check token
function doSessionToken(cb) { // this happens automatically now.
  console.log('my token',cookies.get('user')); //
  let cookiedata = cookies.get('user')

  var getToken = function() {
    socket.emit('getToken',{},function(data) { // FIXME
      console.log('get token',data);
      cookies.set('user', data);
    });
  }

  if (cookiedata) {
    socket.emit('checkToken',cookiedata.token,function(data) {
      console.log(data);
      if (data === 'bad format') { // if error:
        console.log('token rejected');
        getToken();
        return;
      } 

      console.log('token accepted',data);
      // ok we know who you are..
    });
  } else {
    getToken();
  }
}

// auth
socket.on('sessiontoken',function(data){
    console.log('get token',data);
    cookies.set('sessiontoken', data, { path: '/' });
});

socket.once('twittertoken',function(data){
    console.log('get twitter details',data)
    loginPromiseResolve(data);
});

var loginPromiseResolve;
var loginPromise = new Promise(function(resolve,reject) {
  loginPromiseResolve = resolve;
});

function gotTwitterLoginPromise() {
  return loginPromise;
}

function getRequestToken() {
  return new Promise(function(resolve,reject) {
    socket.emit('getrequesttoken',{},function(data) {
      console.log('got getRequestToken',data);
      if (data === 'error') {
        return reject();
      }
      resolve(data);
    });
  });
}

// one way data
function fetchHomeTimeline(cb) {
	socket.emit('gethometimeline',{},function(data) {
		// console.log(data);
		if (!data || data==='unauthorized' || data==='error') {
		  cb(null, []);
			return;
		}
		// return data;
		cb(null, data);
	});
}

function subscribeToHomeTimeline(cb) {
	socket.on('hometweet',function(data){
		if (!data || data==='unauthorized' || data==='error') {
			  cb(null, []);
  			return;
  		}
  		// return data;
  		cb(null, data);
	})
}

// TODO we should cache this data so we can combine it with retweets
function fetchMentions(cb) {
	socket.emit('getmentions',{},function(data) {
		// console.log(data);
		if (!data || data==='unauthorized' || data==='error') {
		  cb(null, []);
			return;
		}
		// return data;
		cb(null, data);
	});
}

// getretweets
function fetchRetweets(cb) {
  socket.emit('getretweets',{},function(data) {
    // console.log(data);
    if (!data || data==='unauthorized' || data==='error') {
      cb(null, []);
      return;
    }
    // return data;
    cb(null, data);
  });
}

function fetchFavorites(cb) {
  socket.emit('getfavoriteslist',{},function(data) {
    // console.log(data);
    if (!data || data==='unauthorized' || data==='error') {
      cb(null, []);
      return;
    }
    // return data;
    cb(null, data);
  }); 
}

function fetchDirectMessages(cb) {
  socket.emit('getdirectmessages',{},function(data) {
    // console.log(data);
    if (!data || data==='unauthorized' || data==='error') {
      cb(null, []);
      return;
    }
    // return data;
    cb(null, data);
  });   
}

function fetchSentDirectMessages(cb) {
  socket.emit('getsentdirectmessages',{},function(data) {
    // console.log(data);
    if (!data || data==='unauthorized' || data==='error') {
      cb(null, []);
      return;
    }
    // return data;
    cb(null, data);
  });   
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
  	socket.emit('getuser',{screen_name:screen_name},function(data) {
  		console.log('got user data',data);
      if (!data || data==='unauthorized' || data==='error') {
			// cb(null, undefined);
  	// 		return;
        reject('error');
        return;
  		}
  		// return data;
  		// cb(null, data);
      usersCache[screen_name] = data; // cache the result.
      resolve(data);
  	});
  })
}

//searches
function searchTweets(term) {
  return new Promise(function(resolve, reject) {
    if (!term){ 
      reject('no term!');
    };
    socket.emit('searchtwitter',{search:term},function(data) {
      if (!data || data==='unauthorized' || data==='error') {
        reject(data)
      } else {
        resolve(data);
        console.log(data);
      }
    });
  });
}

  // actions!
function favoriteTweet(id) {
  // console.log(id);
  return new Promise(function(resolve, reject) {
    if (!id){ 
      reject('no id!');
    };
    socket.emit('favoritetweet',{id:id},function(data) {
      if (!data || data==='unauthorized' || data==='error') {
        reject(data)
      } else {
        resolve();
        console.log(data);
      }
    });
  });
}

function unfavoriteTweet(id) {
  return new Promise(function(resolve, reject) {
    if (!id){ 
      reject('no id!');
    };
    socket.emit('unfavoritetweet',{id:id},function(data) {
      if (!data || data==='unauthorized' || data==='error') {
        reject(data)
      } else {
        resolve();
        console.log(data);
      }
    });
  });
}

function retweetTweet(id) {
  // console.log(id);
  return new Promise(function(resolve, reject) {
    if (!id){ 
      reject('no id!');
    };
    socket.emit('retweettweet',{id:id},function(data) {
      if (!data || data==='unauthorized' || data==='error') {
        reject(data)
      } else {
        resolve();
        console.log(data);
      }
    });
  });
}

function unretweetTweet(id) {
  return new Promise(function(resolve, reject) {
    if (!id){ 
      reject('no id!');
    };
    socket.emit('unretweettweet',{id:id},function(data) {
      if (!data || data==='unauthorized' || data==='error') {
        reject(data)
      } else {
        resolve();
        console.log(data);
      }
    });
  });
}

function followUser(id) {
  return new Promise(function(resolve, reject) {
    if (!id){ 
      reject('no id!');
    };
    socket.emit('followuser',{id:id},function(data) {
      if (!data || data==='unauthorized' || data==='error') {
        reject(data)
      } else {
        resolve();
        console.log(data);
      }
    });
  }); 
}
function unfollowUser(id) {
  return new Promise(function(resolve, reject) {
    if (!id){ 
      reject('no id!');
    };
    socket.emit('unfollowuser',{id:id},function(data) {
      if (!data || data==='unauthorized' || data==='error') {
        reject(data)
      } else {
        resolve();
        console.log(data);
      }
    });
  }); 
}

function blockUser(id) {
  return new Promise(function(resolve, reject) {
    if (!id){ 
      reject('no id!');
    };
    socket.emit('blockuser',{id:id},function(data) {
      if (!data || data==='unauthorized' || data==='error') {
        reject(data)
      } else {
        resolve();
        console.log(data);
      }
    });
  }); 
}

function unblockUser(id) {
  return new Promise(function(resolve, reject) {
    if (!id){ 
      reject('no id!');
    };
    socket.emit('unblockuser',{id:id},function(data) {
      if (!data || data==='unauthorized' || data==='error') {
        reject(data)
      } else {
        resolve();
        console.log(data);
      }
    });
  }); 
}


function createStatus(data) {
  return new Promise(function(resolve, reject) {
    if (!data || !data.status){ 
      reject('no data!');
    };
    socket.emit('createstatus',{data:data},function(result) {
      if (!result || result==='unauthorized' || result==='error') {
        reject(result)
      } else {
        resolve();
        console.log(result);
      }
    });
  }); 
}

export { doSessionToken, getRequestToken,gotTwitterLoginPromise, fetchHomeTimeline, fetchMentions,fetchRetweets,fetchFavorites,fetchDirectMessages, fetchSentDirectMessages,subscribeToHomeTimeline,fetchUserByName,searchTweets,favoriteTweet,unfavoriteTweet,retweetTweet,unretweetTweet,followUser,unfollowUser,blockUser,unblockUser, createStatus };