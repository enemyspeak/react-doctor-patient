import React, { Component } from 'react';

const navItems = [  
	{
	"name": "timeline",
	"icon":"fi-comment"
	},
	{
	"name": "mentions",
	"icon":"fi-at-sign"
	},
	{
	"name": "direct-messages",
	"icon":"fi-mail"
	},
	{
	"name": "favorites",
	"icon":"fi-star"
	},
	{
	"name": "search",
	"icon":"fi-magnifying-glass"
	},
	{
	"name": "profile",
	"icon":"fi-torso"
	}
]; 

	// {
	// "name": "retweets",
	// "icon":"fi-loop"
	// },

class Navigation extends Component {
	handleClick(obj,e) {
		this.props.handleClick(obj);
	}
	render() {
		return (
		    <div className="nagivation">
	        	<nav>
    		        {navItems.map(obj => {
			          	return (
			            	<div alt={obj.name} className={"navigation-item " + (this.props.selectedTab === obj.name ? 'active' : '')} key={obj.name} id={obj.name} onClick={(e) => this.handleClick(obj.name, e)}>
				            	<div className={"icon-contain " + obj.icon}></div>
							</div>
			          	);
			        })}
	        	</nav>
	        </div>
        ); // <div className="unread"></div>
	}
}
	
export default Navigation;