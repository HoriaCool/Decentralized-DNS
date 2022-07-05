import { buttonsHandlers } from 'logic/ContractInteraction';


function Transfer() {
	function handleKeyPress(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			document.getElementById("inputDomainNameTransfer").blur();
			document.getElementById("inputNewOwnerTransfer").blur();
		}
	}

	function handleOnSubmit(event) {
		event.preventDefault();

		const domainTopLevel = document.getElementById('transfer')['domainTopLevel'].value;
		const domainName     = document.getElementById('transfer')['domainName'].value;
		const newOwner       = document.getElementById('transfer')['newOwner'].value;

		if (buttonsHandlers.transfer) {
			buttonsHandlers.transfer(domainName, domainTopLevel, newOwner);
		}

		document.getElementById('transfer')['button'].blur();
	}

	return (
		<div className="App-top-content-holder">
			<div className="center-relative center-text relative page-header-title">
				<h1 className="entry-title">Transfer domain name</h1>

				<div className="container">
					<div className="row">
						<div className="col-sm-8 offset-sm-2">
							<form id="transfer" onSubmit={handleOnSubmit}>
								<div className="form-group">
									<label htmlFor="exampleFormControlSelect1">Select top level</label>
									<select className="form-control" name="domainTopLevel" required>
										<option value=".com">.crypto</option>
										<option value=".crypto">.crypto</option>
										<option value=".io">.io</option>
										<option value=".cool">.cool</option>
										<option value=".custom">.custom</option>
										<option value=".log">.log</option>
									</select>
								</div>
								<div className="form-group">
									<label htmlFor="domainName">Name</label>
									<input id="inputDomainNameTransfer"
										autoComplete="off" onKeyDown={handleKeyPress} type="text"
										minLength="5" className="form-control" name="domainName" required>
									</input>
								</div>
								<div className="form-group">
									<label htmlFor="newOwner">New owner's address:</label>
									<input id="inputNewOwnerTransfer"
										autoComplete="off" onKeyDown={handleKeyPress} type="text"
										className="form-control" name="newOwner" required>
									</input>
								</div>
								<button type="submit" className="btn btn-primary btn-lg btn-block" name='button'>Transfer</button>
							</form>
						</div>
					</div>
				</div>
			</div>

			<div className="clear"></div>
		</div>
	);
}

export default Transfer;