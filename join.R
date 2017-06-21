library(jsonlite)

general = rbind(
  read.csv("csv/general_Cobb.csv", stringsAsFactors = F),
  read.csv("csv/general_DeKalb.csv", stringsAsFactors = F),
  read.csv("csv/general_Fulton.csv", stringsAsFactors = F)
)

special = rbind(
  read.csv("csv/special_Cobb.csv", stringsAsFactors = F),
  read.csv("csv/special_DeKalb.csv", stringsAsFactors = F),
  read.csv("csv/special_Fulton.csv", stringsAsFactors = F)
)

# SANITY CHECK against http://results.enr.clarityelections.com/GA/70059/Web02-state/#/
sum(special$HANDEL)
sum(special$OSSOFF)

# SANITY CHECK AGAINST DAVE LEIP
# Cobb: http://uselectionatlas.org/RESULTS/statesub.php?year=2016&fips=13067&f=1&off=0&elect=0
# DeKalb: http://uselectionatlas.org/RESULTS/statesub.php?year=2016&fips=13089&f=1&off=0&elect=0
# Fulton: http://uselectionatlas.org/RESULTS/statesub.php?year=2016&fips=13121&f=1&off=0&elect=0
aggregate(ballots_16 ~ county, data=general, FUN=sum)
aggregate(CLINTON ~ county, data=general, FUN=sum)
aggregate(TRUMP ~ county, data=general, FUN=sum)

# merge the files, reducing to the 208 we care about
merged <- merge(general, special, by=c("county", "precinct"))

# for convenience, calculate the winners in each precinct in each race and the difference in 
# margin of victory from 2016 to 2017
merged$winner2016 <- ifelse(merged$CLINTON > merged$TRUMP, "Clinton", "Trump")
merged$winner2017 <- ifelse(merged$OSSOFF > merged$HANDEL, "Ossoff", "Handel")

merged$D2016 <- round(100 * merged$TRUMP / (merged$TRUMP + merged$CLINTON), 2)
merged$D2017 <- round(100 * merged$HANDEL / (merged$HANDEL + merged$OSSOFF), 2)
merged$diff  <- merged$D2017 - merged$D2016

# get Trump's margin of victory in both head-to-head and counting Gary Johnson.
100 * sum(merged$CLINTON) / sum(merged$CLINTON + merged$TRUMP)
100 * sum(merged$TRUMP) / sum(merged$CLINTON + merged$TRUMP)

100 * sum(merged$CLINTON) / sum(merged$CLINTON + merged$TRUMP + merged$JOHNSON)
100 * sum(merged$TRUMP) / sum(merged$CLINTON + merged$TRUMP + merged$JOHNSON)

# See how many precincts flipped
table(merged$winner2016, merged$winner2017)

# number of precincts shifting left or right
NROW(merged[merged$diff < 0,])
NROW(merged[merged$diff > 0,])

# turnout
sum(merged$ballots_16) / sum(merged$voters_16)
sum(merged$ballots_17) / sum(merged$voters_17)

# write results as CSV and JSON
write.csv(merged, "csv/results.csv", row.names = F)
write_json(merged, "json/results.json")