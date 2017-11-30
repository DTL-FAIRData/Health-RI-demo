#!/bin/sh
printf "\n------------This reset script will remove the chrome's localhost cookie, delete and recreate test namespace in the blazegraph------------"
bGraphNamespace="test"
bGraphURL="http://localhost:8504/blazegraph/namespace"
aGraphRepo="fdp"
aGraphUrl="http://localhost:10035"
gcCookies="localhost"
gcCookiesFileName="Cookies"

printf "\n\n------------DELETING namespace $bGraphNamespace------------"
curl -X DELETE "$bGraphURL/$bGraphNamespace"

printf "\n\n------------CREATING namespace $bGraphNamespace------------"
curl -v -X POST --data-binary @test.xml --header 'Content-Type:application/xml' $bGraphURL

#printf "\n\n------------DELETING $gcCookies Cookies attempt 1------------"
#cd ~/.config/google-chrome/Default/
#sqlite3 Cookies "DELETE FROM $gcCookiesFileName WHERE host_key LIKE '%$gcCookies%';"

#printf "\n\n------------DELETING $gcCookies Cookies attempt 2------------"
#cd ~/.config/google-chrome/Profile\ 1/
#sqlite3 Cookies "DELETE FROM $gcCookiesFileName WHERE host_key LIKE '%$gcCookies%';"

printf "\n\n------------DELETING agraph repos $aGraphRepo------------"
curl -X DELETE "$aGraphUrl/repositories/$aGraphRepo" -u test:xyzzy

printf "\n\n------------CREATING agraph repos $aGraphRepo------------"
curl -X PUT "$aGraphUrl/repositories/$aGraphRepo" -u test:xyzzy

printf "\n\n------------OPENING new incognito mode------------"
google-chrome --incognito --args "http://localhost:8505"
