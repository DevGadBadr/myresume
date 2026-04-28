#!/bin/bash
set -euo pipefail

uri="${MONGODB_URI:-}"
if [[ -z "$uri" ]]; then
  echo "MONGODB_URI is required" >&2
  exit 1
fi

if [[ "$uri" != mongodb://* ]]; then
  echo "MONGODB_URI must start with mongodb://" >&2
  exit 1
fi

uri_without_scheme="${uri#mongodb://}"
auth_and_host="${uri_without_scheme%%/*}"
db_and_query="${uri_without_scheme#*/}"

if [[ "$auth_and_host" != *@* ]]; then
  echo "MONGODB_URI must include credentials in the form mongodb://user:password@host:port/database" >&2
  exit 1
fi

credentials="${auth_and_host%@*}"
database="${db_and_query%%\?*}"

if [[ "$credentials" != *:* ]]; then
  echo "MONGODB_URI credentials must be in the form user:password" >&2
  exit 1
fi

username="${credentials%%:*}"
password="${credentials#*:}"

if [[ -z "$username" || -z "$password" || -z "$database" ]]; then
  echo "MONGODB_URI must include non-empty username, password, and database name" >&2
  exit 1
fi

export MONGO_INITDB_ROOT_USERNAME="$username"
export MONGO_INITDB_ROOT_PASSWORD="$password"
export MONGO_INITDB_DATABASE="$database"

exec /usr/local/bin/docker-entrypoint.sh mongod --bind_ip_all
