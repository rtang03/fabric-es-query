
```shell
sudo lsof -i :5432
```

docker exec
-e CORE_PEER_ADDRESS=peer0-org1:7051
-e CORE_PEER_LOCALMSPID=Org1MSP
-e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
-e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp cli
sh -c
'peer chaincode invoke --isInit
    -o orderer0-org0:7050
    -C loanapp
    -n eventstore
    -c '\''{"Args":["Init"]}'\''
    --tls
    --cafile /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
    --waitForEvent
    --waitForEventTimeout 300s
    --peerAddresses peer0-org1:7051
    --tlsRootCertFiles /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
    --peerAddresses peer0-org2:7251
    --tlsRootCertFiles /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem'
