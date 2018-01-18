import React, { Component } from 'react';
import { getRequestToken,gotTwitterLoginPromise } from './api';
import {StandardInput} from './common';


class Authorize extends Component {
	constructor(props) {
		super(props)
		this.state = {
			modalVisible: true,
		}
		gotTwitterLoginPromise().then((data) => {
			this.setState({
				modalVisible: false
			});
			this.closeOAuthWindow();
		});
	}
	closeOAuthWindow() {
		if (this.oauthWindow) {
            this.oauthWindow.close();
        }
	}
	
	handleClick() {

	}
	render() {
		return (
			<div className={"authorize-contain " + (this.state.modalVisible ? "visible" : "" )}>
				<div className="authorize-background"></div>
				<div className="authorize-modal">
					<div className="logo-row">
						<div className="fi-first-aid"></div>
						<h1>Forceps</h1>
					</div>

					<StandardInput inputName='Username' />
					<StandardInput inputName='Password' type='password' />
					
					<div className="login-wrap">
						<button onClick={() => this.handleClick()}>Login</button>
					</div>
				</div>
			</div>
		);
	}
}

export default Authorize;