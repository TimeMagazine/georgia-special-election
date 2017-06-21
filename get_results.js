var fs = require('fs');
var parseString = require('xml2js').parseString;
var request = require('request');
var AdmZip = require('adm-zip');
var async = require('async');
var d3 = require('d3');
var argv = require('minimist')(process.argv.slice(2));

// There were 208 precincts that voted in the special election across parts of three GA counties
// http://results.enr.clarityelections.com/GA/70059/Web02-state/#/

var counties = ["Cobb", "DeKalb", "Fulton"];

// URLs of the precinct-level data for the special election
var special = {
	Cobb: "http://results.enr.clarityelections.com/GA/Cobb/70093/187829/reports/detailxml.zip",
	DeKalb: "http://results.enr.clarityelections.com/GA/DeKalb/70104/187817/reports/detailxml.zip",
	Fulton: "http://results.enr.clarityelections.com/GA/Fulton/70120/187831/reports/detailxml.zip"
}

// mismatched precinct spelling in the general election data that we need to fix to merge correctly in R
var replacements = {
	"Lasssiter 01": "Lassiter 01",
	"Rocky Mountain 01": "Rocky Mount 01",
	"Shallowford Fall 01": "Shallowford Falls 01",
	"Wileo 01": "Willeo 01",
	"PLEASANTDALE ELEM": "PLEASANTDALE ROAD"
};

// fetch the results of the special election. Run this function any time with --update to get latest data
function fetchSpecial() {
	async.eachSeries(counties, function(county, callback) {
        // request the ZIP file and temporarily write it to the disk
		request(special[county]).pipe(fs.createWriteStream("./zip/" + county + ".zip")).on('close', function () {
            // unzip it save the XML in the elections directory, then delete the zip file
			var zip = new AdmZip("./zip/" + county + ".zip");
			var xml = zip.readAsText("detail.xml");
			fs.writeFileSync("elections/special_" + county + ".xml", xml);
			fs.unlinkSync("zip/" + county + ".zip");
			callback();
		});
	}, function() {
		console.log("Finished fetching special election results.")
	});
}

// parse the XML precinct-level results for either the general or special elections. We'll deal with combining them in R
function readXML(filepath) {
	var election = filepath.split("/")[1].replace(".xml", "");
	var year = /general/.test(filepath.split("/")[1]) ? "16" : "17";
	var xml = fs.readFileSync(filepath, "utf8");

    // read the XML as JSON
	parseString(xml, function (err, result) {
		// save JSON object for easy viewing if you want
    	// fs.writeFileSync(filepath.replace(".xml", ".json").replace("elections/", "json/"), JSON.stringify(result, null, 2));

    	var county = result.ElectionResult.Region[0];

    	// get turnout by precinct
    	var turnout = {};
    	result.ElectionResult.VoterTurnout[0].Precincts[0].Precinct.forEach(d => {
    		var precinct_name = d.$.name;
			if (replacements[precinct_name]) {
				precinct_name = replacements[precinct_name];
			}
    		turnout[precinct_name] = {
    			totalVoters: +d.$.totalVoters,
    			ballotsCast: +d.$.ballotsCast,
    			voterTurnout: +d.$.voterTurnout
    		};
    	});

    	// get results by precinct and candidate
    	var results = {};
    	result.ElectionResult.Contest[0].Choice.forEach(d => {
    		var candidate = d.$.text.replace(/ \([DEMREP]+\)/, "").split(/[\. ]+/g).slice(-1)[0];
    		var total = +d.$.totalVotes;
    		var count = 0;
    		d.VoteType.forEach(e => {
    			e.Precinct.forEach(f => {
    				var precinct_name = f.$.name;
    				if (replacements[precinct_name]) {
    					precinct_name = replacements[precinct_name];
    				}
    				results[precinct_name] = results[precinct_name] || {};
    				results[precinct_name][candidate] = results[precinct_name][candidate] || 0;
    				results[precinct_name][candidate] += +f.$.votes;
    				count += +f.$.votes;
    			});
    		});
    		// check that the totals match. They should.
    		console.log("Checking that totals match:", county, candidate, total, count);
    	});

    	// join the turnout and results
    	results = d3.entries(results);
    	results.forEach(d => {
    		d.value.precinct = d.key.trim();
    		d.value.county = county;
    		d.value["voters_" + year] = turnout[d.key].totalVoters;
    		d.value["ballots_" + year] = turnout[d.key].ballotsCast;
    		d.value["turnout_" + year] = turnout[d.key].voterTurnout;    		
    	});
    	results = results.map(d => { return d.value; });

        // write a nice CSV to the csv directory
    	fs.writeFileSync("csv/" + election + ".csv", d3.csvFormat(results));
	});
}

if (argv.update) {
    fetchSpecial();
} else if (argv.parse) {
    readXML("elections/general_Cobb.xml");
    readXML("elections/general_DeKalb.xml");
    readXML("elections/general_Fulton.xml");

    readXML("elections/special_Cobb.xml");
    readXML("elections/special_DeKalb.xml");
    readXML("elections/special_Fulton.xml");
}