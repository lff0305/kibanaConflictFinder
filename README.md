# kibanaConflictFinder
Find conflicts in ElasticSearch indexes, to avoid the warning of "Conflict Detected" in Kibana.

The conflict is caused by that a field in differenct index, has in-compatible types.

For example, in Kibana, a "sh*" is configured. But, in index sh-1, a field named "value" is string under some type.
And, in index sh-2, a filed named "value" is numeric(int, long, float, doube, etc) under some type.
This will make a conflict. Another case is 2 fields with same name, but in-compatibe types exists in 2 types under same index.

Kibana reports "Some field, conflicts detected", but it does NOT report how it is conflicted. This script is trying to help to solve this case: It will tell you how the fields conflict ---- Their indexes, types.


Usage:

node detect.js <Elastcisearch URL> <index patterns>

For exampe, 
node detecter.js http://192.168.1.100:9200 sh*
