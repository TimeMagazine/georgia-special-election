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

The R code is well commented. You can either run `RScript join.R` or open `code.Rproj` as an RStudio project. The script runs a few sanity checks on the data and outputs both a `csv/results.csv` and `json/results.json` file with the combined 2016 and 2017 results in one row per precinct.

Now you have everything you need to analyze the data!