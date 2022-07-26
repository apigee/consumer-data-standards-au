


Feature:
  As a Client App 
  I want to get JWKS keys 
  So that I can validate JWT token (id_token)
  TODO...


  # curl --location --request GET 'https://34-149-27-240.nip.io/mock-adr-client/privatekeyjwt?client_id=lZGlFApTac3GUGN56uHhUZrkksp2JCNOszuo5DzNiZ3QZbIr'

  Scenario: Client App Accesses JWKS Resource

    Given I set query parameters to
      | parameter | value |
      | client_id | `clientId` |
    When I GET /mock-adr-client/privatekeyjwt
    Then response code should be 200
    And response header Content-Type should be application/jwt
    And I store response body as jwt in scenario scope


    # curl --location --request POST 'https://34-149-27-240.nip.io/token' \
    # --header 'Accept: application/json' \
    # --header 'Content-Type: application/x-www-form-urlencoded' \
    # --data-urlencode 'grant_type=client_credentials' \
    # --data-urlencode 'scope=cdr:registration' \
    # --data-urlencode 'client_id=lZGlFApTac3GUGN56uHhUZrkksp2JCNOszuo5DzNiZ3QZbIr' \
    # --data-urlencode 'client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer' \
    # --data-urlencode 'client_assertion=eyJraWQiOiJDRFNUZXN0QXBwIiwidHlwIjoiSldUIiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJsWkdsRkFwVGFjM0dVR041NnVIaFVacmtrc3AySkNOT3N6dW81RHpOaVozUVpiSXIiLCJhdWQiOiJodHRwczpcL1wvMzQtMTQ5LTI3LTI0MC5uaXAuaW8iLCJpc3MiOiJsWkdsRkFwVGFjM0dVR041NnVIaFVacmtrc3AySkNOT3N6dW81RHpOaVozUVpiSXIiLCJleHAiOjE2NTU5MTgzMjUsImlhdCI6MTY1NTkxNjUyNSwianRpIjoiZjFiZmIxMDItOGIyMi00YmNkLTg4Y2UtZjhlNmU2MDIzOTJmIn0.nxY7QrXCT2icwjKYLP1E2epA7i5Qy_RAjDD5ZuOpcSuZuQxc6axE5S48rKyH9pkpsUhdqqXrsCjF_KOPxA7fIbDn8MG5HKsLhnhe9vpNkwxcjPkdRh1nJw3ptOmvTDDdffKhRe-XAdX3QPOI1ZFHgvGL5_2m7bLowS473SNQhiHr_5wy3rlWp0QiA6jEL92cOoM9OeLncBUyLDYkHz4osMOORyRrH35v8K4F8nJYQmxBdRH-_vUpQQuLdIqvny8DTLGq-K60p_dhCL-xvV3f9ulbUMAoYwkEUMmwUzIbkcsNPia7SxzDGSaputS1AkJMKXV6Gilkjx68ReDLEFtdaQ'


    Given I clear request
    And I set query parameters to
      | parameter | value |
    And I set Accept-Type header to application/json
    And I set form parameters to
      | parameter             | value |
      | grant_type            | client_credentials |
      | scope                 | cdr:registration  |
      | client_id             | `clientId`  |
      | client_assertion_type | urn:ietf:params:oauth:client-assertion-type:jwt-bearer |
      | client_assertion      | `jwt`  |
    When I POST to /token
    Then response code should be 200
    And I store the value of body path $.access_token as userToken in scenario scope
    

    # curl --location --request GET 'https://34-149-27-240.nip.io/mock-adr-client/dcrrequest?redirect_uri=https://34-149-27-240.nip.io/authorise-cb&software_id=SomeSWID&org_id=debsorg'
    # Generate Request for Register/Update Dynamic Client (Uses Mock ADR Client)
    Given I clear request
    And I set query parameters to
      | parameter    | value    |
      | redirect_uri | https://`hostname`/authorise-cb |
      | software_id  | SomeSWID |
      | org_id       | debsorg |
    When I GET /mock-adr-client/dcrrequest
    Then response code should be 200
    And I store response body as dcrRequest in scenario scope
    
    # Create dynamic client 
    #    curl --location --request POST 'https://34-149-27-240.nip.io/register' \
    # --header 'Content-Type: application/jwt' \
    #--data-raw 'eyJraWQi.....5kw46Msl1g'

    Given I clear request
    And I set Content-Type header to application/jwt
    And I set body to `dcrRequest`
    When I POST to /register
    Then response code should be 201
    And response body path $.client_name should be Mock Software
    And response body path $.org_name should be Mock Company
    And I store the value of body path $.client_id as dynamicClientId in scenario scope

    # OIDC - Obtain token for Registration Operations (Get/Update/Delete) - Step 1: Get Private Key JWT
    # curl --location --request GET 'https://eval-group.34-107-221-103.nip.io/mock-adr-client/privatekeyjwt?aud=https://eval-group.34-107-221-103.nip.io/token&client_id=ZA9C1Ji1F4J9eXa9g7BaGKx2F69Go98yZq1m57IzGqEU1q3W'

    Given I clear request
    And I set Accept-Type header to application/json
    And I set query parameters to
      | parameter    | value    |
      | aud |  https://`hostname`/token |
      | client_id | `dynamicClientId` |
    When I GET /mock-adr-client/privatekeyjwt
    Then response code should be 200
    And I store response body as dcrPrivKeyJwt in scenario scope
    

    # OIDC - Obtain token for Registration Operations (Get/Update/Delete) - Step 2: Acquire Token using Private Key JWT
    # curl --location --request POST 'https://eval-group.34-107-221-103.nip.io/token' \
    #      --header 'Accept: application/json' \
    #      --header 'Content-Type: application/x-www-form-urlencoded' \
    #      --data-urlencode 'grant_type=client_credentials' \
    #      --data-urlencode 'scope=cdr:registration' \
    #      --data-urlencode 'client_id=ZA9C1Ji1F4J9eXa9g7BaGKx2F69Go98yZq1m57IzGqEU1q3W' \
    #      --data-urlencode 'client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer' \
    #      --data-urlencode 'client_assertion={thePrivKeyJwt}'

    Given I clear request
    And I set Accept-Type header to application/json
    And I set form parameters to
      | parameter             | value |
      | grant_type            | client_credentials |
      | scope                 | cdr:registration  |
      | client_id             | `dynamicClientId`  |
      | client_assertion_type | urn:ietf:params:oauth:client-assertion-type:jwt-bearer |
      | client_assertion      | `dcrPrivKeyJwt`  |
    When I POST to /token
    Then response code should be 200
    And I store the value of body path $.access_token as dcrOperationsToken in scenario scope

    # Get details of client created
    # curl --location --request GET 'https://eval-group.34-107-221-103.nip.io/register/ZA9C1Ji1F4J9eXa9g7BaGKx2F69Go98yZq1m57IzGqEU1q3W' \
    #      --header 'Content-Type: application/jwt' \
    #      --header 'Authorization: Bearer pdYayN7Gu6SwAJTyo6xwzb2TnUtD'
    Given I clear request
    And I set Accept-Type header to application/json
    And I set Authorization header to Bearer `dcrOperationsToken`
    When I GET /register/`dynamicClientId`
    Then response code should be 200
    And response body path $.client_name should be Mock Software
    And response body path $.org_name should be Mock Company

    # Acquire token for regular Operations - Follow priv key jwt flow - To be done

    # Acquire token for regular Operations - Step 0a - Generate PAR Request

    # Acquire token for regular Operations - Step 0b - Invoke PAR Endpoint

    # Acquire token for regular Operations - Step 1a - Invoke /authorise Endpoint

    # Acquire token for regular Operations - Step 1b - Follow redirect to Idp Login

    # Acquire token for regular Operations - Step 2a - Submit Login

    # Acquire token for regular Operations - Step 2b - Follow redirect to /authorise-cb

    # Acquire token for regular Operations - Step 2c - Follow redirect to consent screen

    # Acquire token for regular Operations - Step 3a - Submit Accept in consent screen

    # Acquire token for regular Operations - Step 3b - Follow redirect to /consent-cb

    # Acquire token for regular Operations - Step 4a - Invoke /token endpoint

    # Acquire token for regular Operations - Step 4b - Generate Priv Key JWT





    # Delete client 
    Given I clear request
    And I set Authorization header to Bearer `dcrOperationsToken`
    When I DELETE /register/`dynamicClientId`
    Then response code should be 200

    # Get details of client once again. It should fail
    Given I clear request
    And I set Accept-Type header to application/json
    And I set Authorization header to Bearer `dcrOperationsToken`
    When I GET /register/`dynamicClientId`
    Then response code should be 400
    #And response body path $.client_name should be Mock Software
    #And response body path $.org_name should be Mock Company
