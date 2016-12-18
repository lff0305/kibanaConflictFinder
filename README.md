# kibanaConflictFinder
Find conflicts in ElasticSearch indexes, to avoid the warning of "Conflict Detected" in Kibana.

Usage:

node detect.js <Elastcisearch URL> <index patterns>

For exampe, 
node detect.js http://192.168.1.100:9200 sh*
