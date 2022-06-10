use crate::constants::*;

use std::fs::File;
use std::net::Ipv4Addr;
use std::convert::TryFrom;
use simple_error::SimpleError;

use ethers_core::abi::Abi;
use ethers_core::abi::Token;
use ethers_core::types::Address;
use ethers_contract::Contract;
use ethers_providers::{Provider, Http};

use domain::rdata::*;
use domain::base::Dname;
use domain::base::Message;
use domain::base::name::Label;
use domain::base::iana::rtype::Rtype;
use domain::base::iana::rcode::Rcode;
use domain::base::message_builder::MessageBuilder;


pub enum ExtendedRtype {
    Base(Rtype),
    DNSLink
}

pub struct DnsQuestion {
    pub forward:    bool,
    pub fulldomain: String,
	pub domain:     String,
	pub tld:        String,
	pub qtype:      ExtendedRtype,
    pub msg:        Message<Vec<u8>>
}

#[derive(Clone, Debug)]
pub struct DnsResponse {
    pub packet: Vec<u8>,
    pub ttl: u32
}

#[derive(Clone, Debug)]
pub struct DDNS {
    contract: Contract<Provider<Http>>
}


impl DDNS {
    pub fn new() -> DDNS {
        return DDNS { contract: DDNS::create_smart_contract() };
    }

    fn parse_json_from_file(file_name: &str) -> serde_json::Value {
        let file_path = [ARTIFACTS_PATH_DDNS, file_name].join("/");
        let file: File = File::open(file_path)
            .expect("file should open read only");
        let json: serde_json::Value = serde_json::from_reader(file)
            .expect("file should be proper JSON");

        return json;
    }

    fn create_smart_contract() -> Contract<Provider<Http>> {
        let deployed_json = DDNS::parse_json_from_file("deployed.json");

        let url_json = deployed_json
            .get("url")
            .expect("file should have address key")
            .clone();

        let address_json = deployed_json
            .get("address")
            .expect("file should have address key")
            .clone();

        let abi_json = DDNS::parse_json_from_file("DNS_Service.json")
            .get("abi")
            .expect("file should have abi key")
            .clone();

        let url = match url_json {
            serde_json::Value::String(s) => s,
            _ => "".to_string()
        };
    
        let address = match address_json {
            serde_json::Value::String(s) => s,
            _ => "".to_string(),
        }.parse::<Address>().unwrap();

        let abi: Abi = serde_json::from_str(abi_json.to_string().as_str()).unwrap();

        // connect to the network
        let client = Provider::<Http>::try_from(url).unwrap();

        // create the contract object at the address
        let contract = Contract::new(address, abi, client);

        return contract;
    }

    pub fn forward_query(&self, query: &Vec<u8>) -> Result<DnsQuestion, SimpleError> {
        let msg = Message::from_octets(query.clone()).unwrap();

        let question = match msg.sole_question() {
            Ok(question) => question,
            Err(_)       => return Err(SimpleError::new("multiple questions asked"))
        };

        let qname = question.qname();
        let qtype: ExtendedRtype;
	    
        if qname.first().to_string() == "_dnslink" {
            qtype = ExtendedRtype::DNSLink;
        } else {
            qtype = ExtendedRtype::Base(question.qtype());
        }

        let mut sub_domains = Vec::new();

        for node in qname.iter() {
            if node != Label::root() && node.to_string() != "_dnslink" {
                sub_domains.push(node.to_string());
            }
        }

        let tld = match sub_domains.pop() {
            Some(tld) => tld,
            None      => return Err(SimpleError::new("tld not present"))
        };

        let domain = sub_domains.join(".");

    	Ok(DnsQuestion {
            forward: TLD_FOR_DDNS.contains(&tld.as_str()),
            fulldomain: qname.to_string(),
            domain: domain,
            tld: tld,
            qtype: qtype,
            msg: msg
        })
    }

    pub async fn request(&self, question: DnsQuestion) -> Result<DnsResponse, SimpleError> {
        let name = self.full_domain(&question);

        let msg_builder = MessageBuilder::new_vec();
        let mut msg = msg_builder.start_answer(&question.msg, Rcode::NoError).unwrap();

        match question.qtype {
        ExtendedRtype::Base(Rtype::A) => {
            let record_data = self.query_a(question).await.unwrap();

            msg.push((name, TTL_DDNS, record_data)).unwrap();
        },

        ExtendedRtype::Base(Rtype::Txt) => {
            let record_data = self.query_txt(question).await.unwrap();

            msg.push((name, TTL_DDNS, record_data)).unwrap();
        },

        ExtendedRtype::DNSLink => {
            let record_data = self.query_dnslink(question).await.unwrap();

            msg.push((name, TTL_DDNS, record_data)).unwrap();
        }

        _ => return Err(SimpleError::new("DDns doesn't handle those requests"))
        };

        let packet = msg.finish();

        Ok(DnsResponse {
            packet: packet,
            ttl: TTL_DDNS
        })
    }

    fn full_domain(&self, question: &DnsQuestion) -> Dname::<Vec<u8>> {
        // let full_domain = [question.domain.clone(), question.tld.clone()].join(".");
        // Dname::<Vec<u8>>::vec_from_str(&full_domain).unwrap()

        Dname::<Vec<u8>>::vec_from_str(&question.fulldomain).unwrap()
    }

    async fn query_a(&self, question: DnsQuestion) -> Result<A, SimpleError> {
        let domain_arg = Token::String(question.domain);
        let tld_arg    = Token::String([".", question.tld.as_str()].join(""));

        let args = Token::Tuple(Vec::from([domain_arg, tld_arg]));

        let value = self.contract
            .method::<_, String>("getIP", args)
            .unwrap()
            .call()
            .await
            .unwrap();

        let address = match value.parse::<Ipv4Addr>() {
            Ok(value) => value,
            Err(_) => return Err(SimpleError::new("Error parsing domain A record received from DDns"))
        };

        Ok(A::from_octets(
            address.octets()[0],
            address.octets()[1],
            address.octets()[2],
            address.octets()[3])
        )
    }

    async fn query_txt(&self, _question: DnsQuestion) -> Result<Txt::<Vec<u8>>, SimpleError> {
        Ok(Txt::<Vec<u8>>::from_slice(b"Simple TXT record").unwrap())
    }

    async fn query_dnslink(&self, question: DnsQuestion) -> Result<Txt::<Vec<u8>>, SimpleError> {
        let domain_arg = Token::String(question.domain);
        let tld_arg    = Token::String([".", question.tld.as_str()].join(""));

        let args = Token::Tuple(Vec::from([domain_arg, tld_arg]));

        let value = self.contract
            .method::<_, String>("getCID", args)
            .unwrap()
            .call()
            .await
            .unwrap();

        let dnslink_record = ["dnslink=", value.as_str()].join("");

        Ok(Txt::<Vec<u8>>::from_slice(dnslink_record.as_bytes()).unwrap())
    }
}