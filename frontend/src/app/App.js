import { Routes, Route } from 'react-router-dom';

import {
	Home,
	Price,
	GetIP,
	GetCID,
	Buy,
	Renew,
	Edit,
	Transfer
} from './components/Components'

import './App.css';


function App() {
	return (
		<div>
			<Routes>
				<Route path="/"         element={ <Home     />} />
				<Route path="/price"    element={ <Price    />} />
				<Route path="/ip"       element={ <GetIP    />} />
				<Route path="/cid"      element={ <GetCID   />} />
				<Route path="/buy"      element={ <Buy      />} />
				<Route path="/renew"    element={ <Renew    />} />
				<Route path="/edit"     element={ <Edit     />} />
				<Route path="/transfer" element={ <Transfer />} />
			</Routes>
		</div>
	);
}

export default App;
