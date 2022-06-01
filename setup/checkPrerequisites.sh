#!/bin/bash


function version_is_higher( ){
    # two number versioncompare: current vs target

    local ver_curr="$1"
    local ver_tgt="$2"

    is_higher=$( awk -v ver_curr="$ver_curr" -v ver_tgt="$ver_tgt" 'BEGIN{
split( ver_curr, ver_curr_ar, "." )
split( ver_tgt, ver_tgt_ar, "." )

print( ( ver_curr_ar[1] > ver_tgt_ar[1] )? \
              "true": \
              ( ver_curr_ar[1] <  ver_tgt_ar[1] )? \
                  "false": \
                   ( ver_curr_ar[2] >= ver_tgt_ar[2] )? "true" : "false" ) \
}' )
    echo -n "$is_higher"
}

function check_command_version(){
    local cmd=$1
    local ver_tgt=$2
    case "$cmd" in
    bash)
        ver_curr=$( bash --version | awk '/^GNU bash/{print $4}' )
        if $(version_is_higher "$ver_curr" "$ver_tgt") ; then
            : #>&2 echo "Check Version: SUCCESS: Command: $cmd Current: $ver_curr Target: $ver_tgt"
        else
            >&2 echo "ABEND: Check Command Version: Command: $cmd Current Version: $ver_curr Target: $ver_tgt"
            return 1
        fi
        ;;
    awk)
        ver_curr=$( awk --version | awk '/^GNU Awk/{print $3}' )
        if $(version_is_higher "$ver_curr" "$ver_tgt") ; then
            : #>&2 echo "Check Version: SUCCESS: Command: $cmd Current: $ver_curr Target: $ver_tgt"
        else
            >&2 echo "ABEND: Check Command Version: Command: $cmd Current Version: $ver_curr Target: $ver_tgt"
            return 1
        fi
        ;;
    *)
        >&2 echo "ABEND: Check Command Version: Command is not recognized: $cmd"
        return 1
        ;;
    esac
}

function check_envvars() {
    local varlist=$1

    local varsnotset="F"

    for v in $varlist; do
        if [ -z "${!v}" ]; then
            >&2 echo "ERROR: Required environment variable $v is not set."
            varsnotset="T"
        fi
    done

    if [ "$varsnotset" = "T" ]; then
        >&2 echo ""
        >&2 echo "ABEND. Please set up required variables."
        return 1
    fi
}


function check_commands() {
    local comlist=$1

    local comsnotset="F"

    for c in $comlist; do
        if ! [ -x "$(command -v $c)" ]; then
            >&2 echo "Required command is not on your PATH: $c."
            comsnotset="T"
        else
            : #>&2 echo "Check Command: SUCCESS: Command: $c is found"
        fi
    done

    if [ "$comsnotset" = "T" ]; then
        >&2 echo ""
        >&2 echo "ABEND. Please make sure required commands are set and accesible via PATH."
        return 1
    fi
}

set -e

check_commands "curl openssl xmllint pem-jwk apigeetool gensfds.sh"

check_command_version bash "4.1"

check_commands "awk"
# check_command_version awk "4.1"

check_envvars "APIGEE_ORG APIGEE_ENV APIGEE_USER APIGEE_PASSWORD"
check_envvars "METRICS_SERVICE_HOST"

# Configuraton

check_envvars "CDS_TEST_DEVELOPER_EMAIL CDS_REGISTER_TEST_DEVELOPER_EMAIL CDS_HOSTNAME"
