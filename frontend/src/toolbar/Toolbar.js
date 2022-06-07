import * as React from 'react';
import Menu from '@mui/material/Menu';
import MuiMenuItem from '@material-ui/core/MenuItem';
import { withStyles } from '@material-ui/core/styles';
import { useNavigate, useLocation } from 'react-router-dom';

import './Toolbar.css';


const MenuItem = withStyles({
	root: {
		justifyContent: 'center'
	}
})(MuiMenuItem);

function Toolbar() {
	// href used just to disable compilation warnings
	const uselessHref = 'http://localhost';

	const currentRoute = useLocation();
	const navigate = useNavigate();

	function handleClick(path) {
		return (event) => {
			event.preventDefault();
			navigate(path);

			// change animation only for new route
			if (path !== currentRoute.pathname) {
				window.dispatchEvent(new Event('navigateNewRoute'));
			}
		};
	}

	const [anchorEl, setAnchorEl] = React.useState(null);
  	const open = Boolean(anchorEl);

  	function handleMenu(event) {
		event.preventDefault();
    	setAnchorEl(event.currentTarget);
  	}

  	function handleMenuClose() {
    	setAnchorEl(null);
  	}

	function handleClickMenuOption(path) {
		return (event) => {
			event.preventDefault();
			navigate(path);

			// change animation only for new route
			if (path !== currentRoute.pathname) {
				window.dispatchEvent(new Event('navigateNewRoute'));
			}

			handleMenuClose();
		};
	}


	return (
		<div className='Toolbar relative'>
      		<header className='Toolbar-header'>
				<Menu
					anchorEl={anchorEl}
					open={open}
					onClose={handleMenuClose}
				>
					<MenuItem onClick={handleClickMenuOption("/edit?type=A")}> Edit IP </MenuItem>
					<MenuItem onClick={handleClickMenuOption("/edit?type=DNSLink")}> Edit CID </MenuItem>
				</Menu>

        		<ul className='Toolbar-unordered-list'>
					<li className='Toolbar-list-item'>
        				<a className='Toolbar-nav-link' onClick={handleClick("/")} href={uselessHref}>Home</a>
					</li>
					<li className='Toolbar-list-item'>
						<a className='Toolbar-nav-link' onClick={handleClick("/price")} href={uselessHref}>Price</a>
					</li>
					<li className='Toolbar-list-item'>
						<a className='Toolbar-nav-link' onClick={handleClick("/ip")} href={uselessHref}>IP</a>
					</li>
					<li className='Toolbar-list-item'>
						<a className='Toolbar-nav-link' onClick={handleClick("/cid")} href={uselessHref}>CID</a>
					</li>
					<li className='Toolbar-list-item'>
						<a className='Toolbar-nav-link' onClick={handleClick("/buy")} href={uselessHref}>Buy</a>
					</li>
					<li className='Toolbar-list-item'>
						<a className='Toolbar-nav-link' onClick={handleClick("/renew")} href={uselessHref}>Renew</a>
    				</li>
					<li className='Toolbar-list-item'>
						<a className='Toolbar-nav-link' onClick={handleMenu} href={uselessHref}>Edit</a>
					</li>
					<li className='Toolbar-list-item'>
						<a className='Toolbar-nav-link' onClick={handleClick("/transfer")} href={uselessHref}>Transfer</a>
					</li>
				</ul>
			</header>
		</div>
	);
}

export default Toolbar;
