import { buttonsHandlers } from 'logic/ContractInteraction';


function GetIP() {
	function handleKeyPress(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			document.getElementById("inputDomainNameGetIP").blur();
		}
	}

	function handleOnSubmit(event) {
		event.preventDefault();

		const domainTopLevel = document.getElementById('getip')['domainTopLevel'].value;
		const domainName     = document.getElementById('getip')['domainName'].value;

		if (buttonsHandlers.getIP) {
			buttonsHandlers.getIP(domainName, domainTopLevel);
		}

		document.getElementById('getip')['button'].blur();
	}

	return (
		<div className="App-top-content-holder relative">
			<div className="center-relative center-text relative page-header-title">
				<h1 className="entry-title">Get domain IP</h1>

				<div className="container">
					<div className="row">
						<div className="col-sm-8 offset-sm-2">
							<form id="getip" onSubmit={handleOnSubmit}>
								<div className="form-group">
									<label htmlFor="exampleFormControlSelect1">Select top level</label>
									<select className="form-control" name="domainTopLevel" required>
										<option value=".crypto">.crypto</option>
										<option value=".io">.io</option>
										<option value=".cool">.cool</option>
										<option value=".custom">.custom</option>
										<option value=".log">.log</option>
									</select>
								</div>
								<div className="form-group">
									<label htmlFor="domainName">Name</label>
									<input id="inputDomainNameGetIP"
										autoComplete="off" onKeyDown={handleKeyPress} type="text"
										minLength="5" className="form-control" name="domainName" required>
									</input>
								</div>
								<button type="submit" className="btn btn-primary btn-lg btn-block" name="button">Get IP</button>
							</form>
						</div>
					</div>
				</div>
			</div>

			<div className="clear"></div>
		</div>
	);
}

export default GetIP;