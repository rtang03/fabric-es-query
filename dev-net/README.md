# Dev net deployment

The hyperledger network is adopted from [fabric-es-chaincode](https://github.com/rtang03/fabric-es-chaincode).

```shell
./run.sh
docker-compose -f compose.1org.yaml -f compose.2org.yaml -f compose.cc.org1.yaml -f compose.cc.org2.yaml -f compose.ot.yaml up -d --no-recreate
```

http://localhost:16686/search
