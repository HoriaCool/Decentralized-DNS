import { buttonsHandlers } from 'logic/ContractInteraction';


function Buy() {
	function handleKeyPress(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			document.getElementById("inputDomainNameBuy").blur();
			document.getElementById("inputIPBuy").blur();
		}
	}

	function handleOnSubmit(event) {
		event.preventDefault();

		const domainTopLevel = document.getElementById('buy')['domainTopLevel'].value;
		const domainName     = document.getElementById('buy')['domainName'].value;
		const domainIP       = document.getElementById('buy')['domainIP'].value;

		if (buttonsHandlers.register) {
			buttonsHandlers.register(domainName, domainTopLevel, domainIP);
		}

		document.getElementById('buy')['button'].blur();
	}
	
	return (
		<div className="App-top-content-holder relative">
			<div className="center-relative center-text relative page-header-title">
				<h1 className="entry-title">Buy domain name</h1>

				<div className="container">
					<div className="row">
						<div className="col-sm-8 offset-sm-2">
							<form id="buy" onSubmit={handleOnSubmit}>
								<div className="form-group">
									<label htmlFor="exampleFormControlSelect1">Select top level</label>
									<select className="form-control" name="domainTopLevel" required>
										<option value=".com">.com</option>
										<option value=".co.uk">.co.uk</option>
										<option value=".bg">.bg</option>
										<option value=".io">.io</option>
									</select>
								</div>
								<div className="form-group">
									<label htmlFor="domainName">Name</label>
									<input id="inputDomainNameBuy"
										autoComplete="off" onKeyDown={handleKeyPress} type="text"
										minLength="5" className="form-control" name="domainName" required>
									</input>
								</div>
								<div className="form-group">
									<label htmlFor="domainIP">IP</label>
									<input id="inputIPBuy"
										autoComplete="off" onKeyDown={handleKeyPress} type="text"
										minLength="7" className="form-control" name="domainIP" required>
									</input>
								</div>
								<button type="submit" className="btn btn-primary btn-lg btn-block" name='button'>Buy</button>
							</form>
						</div>
					</div>
				</div>
			</div>

			<div className="clear"></div>
		</div>
	);
}

export default Buy;