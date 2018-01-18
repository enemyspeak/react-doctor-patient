import React, { Component } from 'react';

function Avatar(props) {
	return (
		<img className="Avatar"
  			src={props.user.profile_image_url_https}
  			alt={props.user.screen_name}
		/>
	);
}

function UserInfo(props){
    return(
        <div className="tweet-user">
            <div className="user-avatar" onClick={() =>{if (props.onClick) props.onClick(props.user.screen_name)}}>
                <Avatar user={props.user} />
            </div>
            {props.user.verified && ( <div className="verified"></div> )}
            <span className="name" onClick={() =>{if (props.onClick) props.onClick(props.user.screen_name)}}>{props.user.name}</span>
            <span className="screenName" onClick={() =>{if (props.onClick) props.onClick(props.user.screen_name)}}>@{props.user.screen_name}</span>
        </div>
    );
}

function VideoMedia(props) {
	// TODO load video's bitrate responsive to size of viewport
	let index = 0;
	const variants = props.obj.video_info.variants;
	const bitrate_max = 832000;
	// const viewport = 300;
	const loop = (props.obj.type === "animated_gif" ? true : false );

	for (var i = variants.length - 1; i >= 0; i--) {
		if ((variants[i].content_type === "video/mp4") && (variants[i].bitrate < bitrate_max)) {
			index = i;
		}
	}
	return (
		<video controls loop={loop} poster={props.obj.media_url_https + ":small"} src={variants[index].url} type={variants[index].content_type} >
			{ /* {obj.video_info.variants.map(source => {
				return (
		    		<source src={source.url} type={source.content_type} />
		    	);
		    } */}
		</video>
	)
}

function Media(props) {
	// TODO load image size responsive to size of viewport
	// const viewport = 300;
	// const length = props.media.length;
	return (
		<div className="media-contain">
	        {props.media.map(obj => {
            	return (
            		<div className="media-box" key={obj.id_str}>
						{(obj.type === "video" || obj.type === "animated_gif") && (
							<VideoMedia obj={obj} />
						)}
						{(obj.type === "photo") && (
							<img src={obj.media_url_https + ":small"} alt={obj.display_url} />	
						)}
					</div>
				);
	        })}
		</div>
	);
}

class RelativeTime extends Component {
	relativeTime() {
		// console.log(this.props);
		let time = this.props.created_at;

	 	if (!time) return;

	    // let day,month,year;
	    let date = new Date(time),
	        diff = ( (( new Date().getTime() ) - date.getTime()) / 1000),
	        // day_diff = ( new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()).getTime() - new Date(date.getFullYear(),date.getMonth(),date.getDate()).getTime() ) / 1000 / 86400, //
	        day_diff = Math.floor(diff / 86400);
	    
	    if (isNaN(day_diff) || diff <= 0)
	        return (
	        	"now"
	            // year.toString()+'-'+
	            // ((month<10) ? '0'+month.toString() : month.toString())+'-'+
	            // ((day<10) ? '0'+day.toString() : day.toString())
	        );
	    
	    var r = (
	        diff > 0 &&
	        (
	        	// eslint-disable-next-line
	            day_diff === 0 &&
	            (
	                (
	                    (diff < 60 && Math.ceil(diff) + "s") ||
	                    (diff < 3600 && Math.ceil(diff / 60)  + "m") ||
	                    (diff < 7200 && "1h") ||
	                    (diff < 86400 && Math.floor(diff / 3600) + "h")
	                )
	            // eslint-disable-next-line
	            ) ||
	            (day_diff === 1 && "1d") ||
	            (Math.ceil(day_diff) + "d")
	        )
	    );
	    // console.log(r);
	    return r;
	}
   	render() {
   		// console.log(this);
		return (
			<span className="tweet-date">{this.relativeTime()}</span>
		) // 
   	}
}

class DropdownMenu extends Component {
	copyTextToClipboard(text) {
		var textArea = document.createElement("textarea");
		textArea.style.position = 'fixed';
		textArea.style.top = 0;
		textArea.style.left = 0;
		textArea.style.width = '2em';
		textArea.style.height = '2em';
		textArea.style.padding = 0;
		textArea.style.border = 'none';
		textArea.style.outline = 'none';
		textArea.style.boxShadow = 'none';
		textArea.style.background = 'transparent';
		textArea.value = text;

		document.body.appendChild(textArea);
		textArea.select();

		try {
			document.execCommand('copy');
			// var successful = document.execCommand('copy');
			// var msg = successful ? 'successful' : 'unsuccessful';
			// console.log('Copying text command was ' + msg);
		} catch (err) {
			console.log('Oops, unable to copy');
		}

		document.body.removeChild(textArea);

		this.props.hideMenu();
	}
	render() {
		if (this.props.tweet) {
			var text;
			if (this.props.tweet.extended_tweet) {
				text = this.props.tweet.extended_tweet.full_text;
			} else if (this.props.tweet.full_text) {
				text = this.props.tweet.full_text;
			} else {
				text = this.props.tweet.text;
			}
			return  (
				<div className={"tweet-menu " + (this.props.visible ? "visible" : "")}>
					<div className="list-item"><div className="list-icon fi-magnifying-glass"></div>Show Details</div>
					<div className="list-item" onClick={() => this.copyTextToClipboard("https://twitter.com/" + this.props.tweet.user.screen_name + "/status/" + this.props.tweet.id_str)}><div className="list-icon fi-quote"></div>Copy Link to Tweet</div>
					<div className="list-item" onClick={() => this.copyTextToClipboard(text)}><div className="list-icon fi-page-copy"></div>Copy Tweet Text</div>
					<a href={"https://twitter.com/" + this.props.tweet.user.screen_name + "/status/" + this.props.tweet.id_str} target="_blank" className="list-item"><div className="list-icon fi-link"></div>View on Twitter.com</a>
					{ this.props.mine && ( <div className="list-item"><div className="list-icon fi-delete"></div>Delete Tweet</div> )}
				</div>
			)
		}
		if (this.props.profile) {
			return  (
				<div className={"tweet-menu " + (this.props.visible ? "visible" : "")}>
					<div className="list-item" onClick={() => this.props.blockUser()}><div className="list-icon fi-prohibited"></div>Block User</div>
					<a href={"https://twitter.com/" + this.props.profile.screen_name } target="_blank" className="list-item"><div className="list-icon fi-link"></div>View on Twitter.com</a>
				</div>
			)
		}
	}
}

class StandardInput extends Component {
	constructor(props) {
    	super(props);
    	this.state = {
    		searchTerm: '',
    	};
    }
	handleChange(event) {
		this.setState({
			searchTerm: event.target.value,
		});
  	}
	render() {
		return (
			<div className="input-form-contain">
				<span className={"input-label " + (this.state.searchTerm ? "" : "full" )}>{this.props.inputName}</span>
				<input type={this.props.type || "text"} value={this.state.searchTerm} onChange={(event) => this.handleChange(event)} />
			</div>
		);
	}
}
export  { UserInfo,Avatar,Media,RelativeTime,DropdownMenu,StandardInput };