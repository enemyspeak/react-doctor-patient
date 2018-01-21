import React, { Component } from 'react';

import Navigation from './navigation';
import Authorize from './authorize';

import { createStatus, gotTwitterLoginPromise, fetchHomeTimeline, fetchMentions,fetchFavorites,subscribeToHomeTimeline } from './api';

class Root extends Component {
	constructor(props) {
    	super(props);
    	this.state = {
	    	selectedTab: 'timeline',
	    	userData: {
	    		screen_name: ""
	    	},
	    	connected: true,
	    	tweetText: "",
	    	showCompose: false
	    };
	    
	    this.handleClick = this.handleClick.bind(this);	    
	    
	    gotTwitterLoginPromise().then((data) => { // TODO add this to component will mount
			this.setState({
				userData: data
			});
	    });
    }
    
    componentWillMount() {
    	// this.setState({ user:  });
	    // console.log(this.state.user);
    }
	handleClick(obj,e) {
		this.setState({
			selectedTab: obj
		});				
	}
	toggleComposeView() {
		this.setState({
			showCompose: !this.state.showCompose,
			tweetText: ""
		})
	}
	handleChange(event) {
		// TODO remove error
		this.setState({
			tweetText: event.target.value,
		});
  	}
  	submitStatus(){
  		if (this.state.tweetText) {
  			createStatus({status:this.state.tweetText}).then(() => this.setState({
  				tweetText: "",
  				showCompose: false
  			})).catch((err)=> console.error(err));
  		} else {
  			// TODO: add error
  		}
  	}
	render() {
		return (
			<div className="app-wrapper">
				<div className={"potential-problem " + (this.state.connected ? "" : "visible")}>
					<p>Disconnected from data</p>
				</div>

				<Authorize visible={this.state.user} />

				<div className="header-row">
					<div className="fi-social-twitter"></div>
					<div>Forceps</div>
					<span>BETA</span>
				</div>

				<div className="navigation-contain">
				    <div className="nagivation">
			        	<Navigation handleClick={this.handleClick} selectedTab={this.state.selectedTab} />
			        </div>
				</div>

				<div className="app-contain">
				
				</div>
			</div>
        );
	}
}

export default Root;
