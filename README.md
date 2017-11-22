# Health-RI-demo
Demo environment setup for Health-RI 2017

## End to end demo
The scripts for the end to end demo is available in ``end-to-end`` dir. 

#### Start docker containers
* Go to <code>$cd end-to-end</code> 
* Run <code>$docker-compose up</code>

``NOTE:`` Starting up all the require docker containers will take some time. __Please wait__ until the container starting process is __done__ then execute the following steps.
* Run <code>$sh reset.sh</code>. This script will ``create``  fdp repository in the __agraph__ and test namespace in the blazegraph


The apps can be accessible via the links below
* FDP for patient reg [link](http://localhost:8500/fdp)
* FDP for biobank [link](http://localhost:8501/fdp)
* FDP for farifier [link](http://localhost:8502/fdp)
* Simple file hosting server [link](http://localhost:8503)
* Blazegraph triple store [link](http://localhost:8080/blazegraph)
* Agraph triple store [link](http://localhost:10035)
* Demonstrator app [link](http://localhost:8505)

``NOTE:`` USE __incognito window__ of the google chrome when demonstrating ``Demonstrator app``    

#### Reset the enviroment
To reset the demo enviroment
* Go to <code>$cd end-to-end</code>
* Run <code>$sh reset.sh</code>
* Close the __google chrome's__ incognito window of the ``Demonstrator app`` and __reopen__ it in the new  incognito window

## BBMRI demo
The scripts for the end to end demo is available in ``end-to-end`` dir. 

#### Start docker containers

--TODO--

#### Reset the enviroment
To reset the demo enviroment
* Go to <code>$cd bbmri</code>
* Run <code>$sh reset.sh</code>
* Close the __google chrome's__ incognito window of the ``Demonstrator app`` and __reopen__ it in the new  incognito window
