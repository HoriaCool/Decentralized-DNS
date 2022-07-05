import { buttonsHandlers } from 'logic/ContractInteraction';


function Price() {
	function handleKeyPress(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			document.getElementById('inputDomainNamePrice').blur();
		}
	}

	function handleOnSubmit(event) {
		event.preventDefault();

		const domainTopLevel = document.getElementById('price')['domainTopLevel'].value;
		const domainName     = document.getElementById('price')['domainName'].value;

		if (buttonsHandlers.getPrice) {
			buttonsHandlers.getPrice(domainName, domainTopLevel);
		}

		document.getElementById('price')['button'].blur();
	}

	return (
		<div className="App-top-content-holder relative">
			<div className="center-relative center-text relative page-header-title">
				<h1 className="entry-title">Calculate domain price</h1>

				<div className="container">
					<div className="row">
						<div className="col-sm-8 offset-sm-2">
							<form id="price" onSubmit={handleOnSubmit}>
								<div className="form-group">
									<label htmlFor="exampleFormControlSelect">Select top level</label>
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
									<input id="inputDomainNamePrice"
										autoComplete="off" onKeyDown={handleKeyPress} type="text"
										minLength="5" className="form-control" name="domainName" required>
									</input>
								</div>
								<button type="submit" className="btn btn-primary btn-lg btn-block" name="button">Get Price</button>
				   			</form>
						</div>
					</div>
				</div>
 			</div>

			<div className="clear"></div>
		</div>
	);
}

export default Price;