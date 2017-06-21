# Georgia Special Election
Comparing the GA-06 special election on June 20, 2017 to 2016 results

# The election
Georgia's Sixth Congressional District special election took place across [208 precincts](http://results.enr.clarityelections.com/GA/70059/Web02-state/#/) distributed across portions of Cobb, DeKalb and Fulton counties.

# Get the data

The Georgia elections board publishes data files with precinct-level returns and turnout, both as XML and poorly formatted text. The best way to parse the XML is with the Python ["clarify" library](https://github.com/openelections/clarify) published by the stellar crew at the [OpenElections project](https://github.com/openelections/). This repo uses a hand-written Node.js script to do the parsing since I wanted to look under the hood at the raw XML files and didn't want to brush up on my Python chops late at night.

The XML files for the 2016 general election for the three relevant counties were downloaded by hand and are stored in the [/elections](/elections) directory since there is no reasonable expectation that the results will change after more than six months. The files for the special election are present as well, but since the results of Tuesday night's election are uncertified as of this writing, the Node script can fetch and unzip them with the following command in order to stay current:

	node get_results.js --update

The next step is to parse those XML files into coherent CSV files using the `readXML` function, which you can call on all six files at once:

	node get_results.js --parse

This will place the CSV files in the [/csv](/csv) directory. Now it's time for R.

# Combine the data

There are 682 precincts across the three counties, but we're only interesting in the 208 that are located in the sixth district and voted in the special election. (A very small number of precincts were not used.) So we'll use the trusty old `merge` function in R to combine them, having already carefully made sure in the Node script that the precinct names match from one year to the next. 

The R code is well commented. You can either run `join.R` or open `code.Rproj` as an RStudio project. The script runs a few sanity checks on the data and outputs both a `csv/results.csv` and `json/results.json` file with the combined 2016 and 2017 results in one row per precinct.

# Make a map

To make the topoJSON file if you want to map the results, you'll need [mapshaper](https://www.npmjs.com/package/mapshaper) installed globally:

	npm install mapshaper -i

The Georgia General Assembly publishes [SHP files](http://www.legis.ga.gov/joint/reapportionment/en-us/default.aspx) for CDs and precincts

### Congressional Districts, whittled down to just the 6th
	wget http://www.legis.ga.gov/Joint/reapportionment/Documents/SEPT%202012/CONGRESS12-SHAPE.zip && unzip CONGRESS12-SHAPE.zip
	mapshaper CONGPROP2.shp name=GA06 -filter 'DISTRICT == "006"' -filter-fields DISTRICT -rename-fields FIPS=DISTRICT -o shp/GA06.shp
	rm CONG*

### Precincts
	wget http://www.legis.ga.gov/Joint/reapportionment/Documents/VTD2016-Shape.zip && unzip VTD2016-Shape.zip
	mapshaper VTD2016-Shape.shp name=precincts -filter 'CTYNAME == "Cobb" || CTYNAME == "DeKalb" || CTYNAME == "Fulton"' -filter-fields ID,DATA,POPULATION,DISTRICT,PRECINCT_I,PRECINCT_N,CTYNAME,FIPS1 -rename-fields FIPS=FIPS1,PRECINCT_ID=PRECINCT_I,NAME=PRECINCT_N -o format=topojson topojson/GA06_Precincts.topojson	
	rm VTD*

### Okay, this is gonna get a little weird

Right now, our topojson file has all 682 precincts in the three counties, when we only need 208. There's no particularly great way to take a topoJSON file and filter it down to a subset without leaving behind a lot of arcs you no longer need. But believe it or not, mapshaper can easily handle a filter command of its own in which it check a property against an array of 208 precinct names!

	mapshaper topojson/GA06_Precincts.topo.json -filter '["addison 01","bells ferry 02","bells ferry 03","blackwell 01","chattahoochee 01","chestnut ridge 01","davis 01","dickerson 01","dodgen 01","east piedmont 01","eastside 01","eastside 02","elizabeth 02","elizabeth 03","elizabeth 04","elizabeth 05","fullers park 01","garrison mill 01","gritters 01","hightower 01","kell 01","lassiter 01","mabry 01","marietta 5a","marietta 6a","marietta 6b","marietta 7a","mccleskey 01","mount bethel 01","mount bethel 03","mount bethel 04","murdock 01","nicholson 01","palmer 01","pope 01","post oak 01","powers ferry 01","rocky mount 01","roswell 01","roswell 02","sandy plains 01","sewell mill 01","sewell mill 03","shallowford falls 01","simpson 01","sope creek 01","sope creek 02","sope creek 03","timber ridge 01","willeo 01","ashford dunwoody rd","ashford park elem","ashford parkside","austin","briarlake elem","briarwood","brookhaven","chamblee","chamblee 2","chesnut elem","cross keys high","doraville north","doraville south","dresden elem","dunwoody","dunwoody high","dunwoody library","embry hills","evansdale elem","georgetown square","hawthorne elem","henderson mill elem","huntley hills elem","kingsley elem","kittredge elem","lakeside high","livsey elem","midvale elem","midvale road","montgomery elem","mt. vernon east","mt. vernon west","north peachtree","oakcliff elem","peachtree middle","pleasantdale road","silver lake","skyland","tilly mill road","tucker","tucker library","warren tech","winters chapel","ap01a","ap01b","ap01c","ap01d","ap021","ap022","ap02b","ap03","ap04a","ap04b","ap05","ap06","ap07a","ap07b","ap09a","ap09b","ap10","ap12a","ap12b","ap12c","ap13","ap14","jc01","jc02","jc03a","jc03b","jc04a","jc04b","jc05","jc06","jc07","jc08","jc09","jc10","jc11","jc12","jc13a","jc13b","jc14","jc15","jc16","jc18","jc19","ml011","ml012","ml01b","ml021","ml022","ml023","ml024","ml03","ml04a","ml04b","ml04c","ml05a","ml05b","ml05c","ml06a","ml06b","ml071","ml072","ml07a","mp01","rw01","rw02","rw03","rw04","rw05","rw06","rw07a","rw07b","rw08","rw09","rw10","rw11a","rw12","rw13","rw16","rw17","rw19","rw20","rw21","rw22a","ss01","ss02a","ss02b","ss03","ss04","ss05","ss06","ss07a","ss07b","ss07c","ss08a","ss08b","ss08c","ss08d","ss11a","ss11b","ss11c","ss12","ss15a","ss15b","ss16","ss17","ss18a","ss18b","ss19a","ss19b","ss20","ss22","ss25","ss26","ss29a","ss31"].indexOf(NAME.toLowerCase()) > -1' -o topojson/GA06_Precincts_filtered.topo.json

Now you have everything you need to analyze or map the data!