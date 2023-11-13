"use strict";
const fs = require('fs');
const DomParser = require('dom-parser');

const headerList = [];
const rowsObj = [];
async function parse() {
	for (let i = 2; i < process.argv.length; i++) {
		console.log(process.argv[i]);
		const htmlString = fs.readFileSync(process.argv[i].trim()).toString();

		const parser = new DomParser();
		const doc3 = parser.parseFromString(htmlString);

		if (i === 2) {
			const headers = doc3.getElementsByTagName("th");
			for (const header of headers) {
				headerList.push(header.textContent?.trim());
			}
			headerList.splice(0,1);
		}
		
		const rows = doc3.getElementsByTagName("tr");
		for (const row of rows) {
			const els = row.getElementsByTagName("td");
			const rowObj = {};
			for (let i = 0; i < els.length; i++) {
				const el = els[i];
				const path = el.getElementsByTagName("path");
				rowObj[headerList[i]] = el.textContent?.trim() || (path.length > 0 && path[0] ? !!path[0]?.getAttribute('fill-rule') : false);
			}
			rowsObj.push(rowObj);
		}
	}
}

function analyze() {
	// We can make more specific ones but here are the basic tests.
    const tests = [
		{name: 'Was here last week but not this week', test: [undefined,undefined,undefined,true,false], people: []},
		{name: 'Was here two weeks ago but not since then', test: [undefined,undefined,true,false,false], people: []},
		{name: 'Was here three weeks ago but not since then', test: [undefined,true,false,false,false], people: []},
		{name: 'Was here four weeks ago but not since then', test: [true,false,false,false,false], people: []}
	];

	function testMatches(test,actual) {
		for (let i = 0; i < 5; i++) {
			if (test[i] === undefined || test[i] === actual[i]) {
				// keep going
			} else {
				return false;
			}
		}
		return true;
	}
	
	const sundays = headerList.slice(3,8);
	for (const person of rowsObj) {
		const name = person.Name;
		// Get their attendance
		const attendance = [];
		for (const day of sundays) {
			attendance.push(person[day]);
		}
		
		// Run it against the tests
		for (const test of tests) {
			if (testMatches(test.test, attendance)) {
				test.people.push(name);
			}
		}
	}
	
	for (const test of tests) {
		if (test.people.filter(a=>!!a).length > 0) {
			console.log('\n'+test.name+'\n'+test.people.filter(a=>!!a).join('\n'));
		}
	}
}

parse();
analyze();

// Ideas:
// Now go through with the following rules.
// Person that was here the last 3 weeks but not today
// Person that was here the last 2 weeks but not today
// Person that was here 2 weeks ago but not today (elder's quorum)
// Person that was here last week but not today (and not in any callings)
// Find people that you should mark today in other callings.
