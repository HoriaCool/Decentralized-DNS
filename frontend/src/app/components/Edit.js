import { useSearchParams } from 'react-router-dom';
import { buttonsHandlers } from 'logic/ContractInteraction';


const recordTypeToText = {
	'A':       'IP',
	'DNSLink': 'CID'
};

function Edit() {
	const [searchParams] = useSearchParams();
	let recordType = searchParams.get('type');
	if (!recordType)
		recordType = 'A';


	function handleKeyPress(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			document.getElementById('inputDomainNameEdit').blur();
			document.getElementById('inputRecordEdit').blur();
		}
	}

	function handleOnSubmit(event) {
		event.preventDefault();

		const domainTopLevel = document.getElementById('edit')['domainTopLevel'].value;
		const domainName     = document.getElementById('edit')['domainName'].value;
		const domainRecord   = document.getElementById('edit')['domainRecord'].value;

		if (buttonsHandlers.editDomain) {
			buttonsHandlers.editDomain[recordType](domainName, domainTopLevel, domainRecord);
		}

		document.getElementById('edit')['button'].blur();
	}

	return (
		<div className="App-top-content-holder">
			<div className="center-relative center-text relative page-header-title">
				<h1 className="entry-title">Edit domain name</h1>
				<div className="container">
					<div className="row">
						<div className="col-sm-8 offset-sm-2">
							<form id="edit" onSubmit={handleOnSubmit}>
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
									<input id="inputDomainNameEdit"
										autoComplete="off" onKeyDown={handleKeyPress} type="text"
										minLength="5" className="form-control" name="domainName" required>
									</input>	
								</div>
								<div className="form-group">
									<label htmlFor="domainRecord">{recordTypeToText[recordType]}</label>
									<input id="inputRecordEdit"
										autoComplete="off" onKeyDown={handleKeyPress} type="text"
										minLength="7" className="form-control" name="domainRecord">
									</input>
								</div>
								<button type="submit" className="btn btn-primary btn-lg btn-block" name='button'>Edit</button>
							</form>
						</div>
					</div>
				</div>
			</div>

			<div className="clear"></div>
		</div>
	);
}

export default Edit;