#!/bin/sh
printf "\n------------This reset script will delete and recreate test namespace in the blazegraph------------"
bGraphNamespace="test"
bGraphURL="http://localhost:8080/blazegraph/namespace"

printf "\n\n------------DELETING namespace $bGraphNamespace------------"
curl -X DELETE "$bGraphURL/$bGraphNamespace"

printf "\n\n------------CREATING namespace $bGraphNamespace------------"
curl -v -X POST --data-binary @test.xml --header 'Content-Type:application/xml' $bGraphURL

printf "\n\n------------OPENING new incognito mode------------"
google-chrome --incognito --args "http://localhost:8505"