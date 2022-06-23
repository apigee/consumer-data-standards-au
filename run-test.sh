




npm install

export CLIENTID=$(apigeetool getApp  -o $PROJECT -e test --name CDSTestApp --email cds-test-dev@exco.com |jq -r '.credentials[0].consumerKey')

apigeetool deleteDeveloper  -o $PROJECT -e test --name "Mock Company" --email debsorg@apigeecdsrefimplementation.net


#mkdir -p output
# npm run test -- -f json:output/results.json

npm run test
