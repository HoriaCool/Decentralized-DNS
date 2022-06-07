import { buttonsHandlers } from 'logic/ContractInteraction';


function Renew() {
	function handleKeyPress(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			document.getElementById("inputDomainNameRenew").blur();
		}
	}

	function handleOnSubmit(event) {
		event.preventDefault();

		const domainTopLevel = document.getElementById('renew')['domainTopLevel'].value;
		const domainName     = document.getElementById('renew')['domainName'].value;

		if (buttonsHandlers.renewDomain) {
			buttonsHandlers.renewDomain(domainName, domainTopLevel);
		}

		document.getElementById('renew')['button'].blur();
	}

	return (
		<div className="App-top-content-holder relative">
			<div className="center-relative center-text relative page-header-title">
				<h1 className="entry-title">Renew domain name</h1>

				<div className="container">
					<div className="row">
						<div className="col-sm-8 offset-sm-2">
							<form id="renew" onSubmit={handleOnSubmit}>
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
									<input id="inputDomainNameRenew"
										autoComplete="off" onKeyDown={handleKeyPress} type="text"
										minLength="5" className="form-control" name="domainName" required>
									</input>
								</div>
								<button type="submit" className="btn btn-primary btn-lg btn-block" name='button'>Renew</button>
							</form>
						</div>
					</div>
				</div>
			</div>

			<div className="clear"></div>
		</div>
	);
}

export default Renew;