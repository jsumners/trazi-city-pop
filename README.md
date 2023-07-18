## Introduction

This project provides a service that allows clients to query for the population
numbers of cities, and update populations numbers for cities.

To get started, run `npm install` to install the project's dependencies.

A fairly comprehensive test suite is included that works on Unix-like platforms.
These tests can be run via `npm test`.

To start the server, run `npm start.` A new server will be started on the
local address `127.0.0.1` (`::1`) and port `5555`. Once started, queries can
be issued to it like so:

```sh
$ curl -v 127.0.0.1:5555/api/population/state/Alabama/city/Marion
{"population":3178}
$ curl -v -X PUT -d 1 127.0.0.1:5555/api/population/state/Alabama/city/Marion
```
Note: the special string "boom" can be supplied as a state name to generate
the spec defined 400 error when attempting to write new population data.

The server can be stopped by the ctrl+c key combination in the terminal
where it was started.

## Details

The service is written with the [Fastify](https://fastify.dev) framework. As
such, it utilizes features of the framework to provide assistance in the
business logic and data persistence.

Data is loaded from the included [city_populations.csv](./city_populations.csv)
file via the [lib/plugins/city-data.mjs](./lib/plugins/city-data.mjs) plugin.
This plugin parses the CSV file and adds the data to an in-memory object
that is modeled in [lib/city-data.mjs](./lib/city-data.mjs). This object
provides the methods for adding, updating, finding, and persisting population
data.

The routes, defined in [lib/routes/population/](./lib/routes/population), use
a [Fastify decorator](https://fastify.dev/docs/latest/Reference/Decorators)
added by the city data plugin to gain access to the data object. The
[get route](./lib/routes/population/get.mjs) uses this rather simply. The
[put route](./lib/routes/population/put.mjs) is where the interesting parts
are defined. This is where we handle persisting data to disk after `PUT`
requests and when the server is stopped.

## Benchmarks

### System Details

+ Apple M1 Max
+ 32 GB RAM
+ macOS 13.4.1 (22F82)

### GET

```sh
❯ npx autocannon -d 10 -c 30 -w 3 127.0.0.1:5555/api/population/state/georgia/city/atlanta
Running 10s test @ http://127.0.0.1:5555/api/population/state/georgia/city/atlanta
30 connections
3 workers

-
┌─────────┬──────┬──────┬───────┬──────┬─────────┬─────────┬───────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg     │ Stdev   │ Max   │
├─────────┼──────┼──────┼───────┼──────┼─────────┼─────────┼───────┤
│ Latency │ 0 ms │ 0 ms │ 2 ms  │ 2 ms │ 0.14 ms │ 0.48 ms │ 19 ms │
└─────────┴──────┴──────┴───────┴──────┴─────────┴─────────┴───────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬──────────┬─────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg      │ Stdev   │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼──────────┼─────────┼─────────┤
│ Req/Sec   │ 35359   │ 35359   │ 39295   │ 41247   │ 39148.81 │ 1510.56 │ 35358   │
├───────────┼─────────┼─────────┼─────────┼─────────┼──────────┼─────────┼─────────┤
│ Bytes/Sec │ 6.79 MB │ 6.79 MB │ 7.54 MB │ 7.92 MB │ 7.52 MB  │ 289 kB  │ 6.79 MB │
└───────────┴─────────┴─────────┴─────────┴─────────┴──────────┴─────────┴─────────┘

Req/Bytes counts sampled once per second.
# of samples: 31

432k requests in 10.01s, 82.9 MB read
```

### PUT

Note: due to a bug in `autocannon`, these are performed using `wrk`

```sh
❯ wrk -d 10 -c 30 -t 3 -s bench.lua http://127.0.0.1:5555/api/population/state/georgia/city/atlanta
Running 10s test @ http://127.0.0.1:5555/api/population/state/georgia/city/atlanta
  3 threads and 30 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     0.91ms    3.03ms  69.96ms   99.18%
    Req/Sec    15.10k     1.93k   16.82k    94.72%
  455263 requests in 10.10s, 53.40MB read
Requests/sec:  45063.68
Transfer/sec:      5.29MB
```

Utilizing the `bench.lua` script:

```lua
wrk.method = "PUT"
wrk.body = "1"
wrk.headers["Content-Type"] = "application/x-www-form-urlencoded"
```
