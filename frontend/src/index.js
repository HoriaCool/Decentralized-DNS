import React      from 'react';
import ReactDOM   from 'react-dom/client';
// replace for 'BrowserRouter' / 'HashRouter' from 'react-router-dom'
import IpfsRouter from 'ipfs-react-router';

import './index.css';
import App       from './app/App';
import Toolbar   from './toolbar/Toolbar';
import Animation from './animation/Animation';

import { ContractInteraction } from './logic/ContractInteraction';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<IpfsRouter>
			<Toolbar />
			<App />
		</IpfsRouter>
	</React.StrictMode>
);

const animation = ReactDOM.createRoot(document.getElementById('animation'));
animation.render(
	<React.StrictMode>
		<Animation />
	</React.StrictMode>
);

document.addEventListener("DOMContentLoaded", ContractInteraction);
