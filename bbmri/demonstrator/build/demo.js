(function(){"use strict";var app = angular.module('demo', ['ngRoute', 'ngCookies', 'templates', 'ngAnimate', 'ngSanitize',
	'ui.bootstrap','demonstrator.config', 'ngMaterial']);

app.config(["$routeProvider", function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'home/home.html',
    controller: 'HomeCtrl'
  }).when('/about', {
    templateUrl: 'about/about.html',
    controller: 'AboutCtrl'
  }).when('/stats', {
    templateUrl: 'stats/stats.html',
    controller: 'StatsCtrl'
  }).when('/cache', {
    templateUrl: 'cache/cache.html',
    controller: 'CacheCtrl'
  }).otherwise({
    redirectTo: '/'
  });
}]);
//Config file
//TODO: Logic should be separated from configuration

var config_module = angular.module('demonstrator.config', []);

(function(){
   
  var config_data = {
  'GENERAL_CONFIG': {
    'END_POINT_BASE_URL': 'http://localhost:8504/blazegraph/',
    'QUESTIONS_FILE': 'data/questions.json',
    'SPARQL_QUERIES_DIR': 'data/query/'
  }};
	  
  angular.forEach(config_data,function(key,value) {
       config_module.constant(value, key);
     }
  );	   
})();
app.controller('AboutCtrl', ["$scope", function($scope) {
  
}]);
app.controller('CacheCtrl', ["$scope", "$rootScope", "$http", "$cookies", "File", "FDP", "HttpEndpoint", "Caching", "Log", function($scope, $rootScope, $http, $cookies, File, FDP, HttpEndpoint,
		Caching, Log) {    
	$scope.isCachingStarted = false;
	$scope.fairDataPoints = [];
	$scope.fdp = {url:"", name:"", state:true};
	$scope.searchEngineUrl = null;
	$scope.oneAtATime = true;

  // populate the fdps list
  $scope.updateFdpList = function() {
    FDP.getFdps().then(function(fdps) {
      console.log("List of fdps", fdps);
      $scope.fairDataPoints = fdps;
      // Update cookies to indicate which fdp's should be used in the queries
      var fdpsToUse = [];
      fdps.forEach(function(fdp) {
        if (fdp.state) {
          fdpsToUse.push(fdp.url);
        }
      });
      $cookies.putObject("fdpsToUse", fdpsToUse);
      console.log("fdpsToUse == ", $cookies.getObject("fdpsToUse"));
    });
  };
  
  console.log('calling init updateFdpList function');
  $scope.updateFdpList();
  console.log('init function finished');
  $scope.setFdpState = function(fdp) {
    $cookies.putObject(btoa(fdp.url), fdp);
  };

	$scope.cache = function() {
    Log.reset();
    Log.setLogElementId('log-panel');
    $scope.isCachingStarted = true;
    Log.appendToLog("Caching started");
    $scope.log = Log.get();
    FDP.load([ $scope.fdp ]);
    $rootScope.$on('fdp-data-loaded', function() {
      $scope.loadingData = false;
      Caching.setCachingState(true);
      Log.appendToLog("Caching is done");
      $scope.updateFdpList();
    });
  };

	$scope.cacheSearch = function(url) {
		Log.reset();
		Log.setLogElementId('log-panel');
		$scope.isCachingStarted = true;
		Log.appendToLog("Caching started");
		$scope.log = Log.get();
		$http.get(url)
		.then(function(response) {
			var fdps = response.data;
			console.log(fdps);
			FDP.load(fdps);
		});
		$rootScope.$on('fdp-data-loaded', function() {            
			$scope.loadingData = false;
			Caching.setCachingState(true);
			Log.appendToLog("Caching is done");
		});
	};
}]);
app.controller('HomeCtrl', ["$scope", "$cookies", "Data", "File", "$timeout", "$http", "$q", "Caching", "FDP", "HttpEndpoint", "$rootScope", "GENERAL_CONFIG", function($scope, $cookies, Data, File, $timeout, $http, $q, Caching, FDP,
		HttpEndpoint, $rootScope, GENERAL_CONFIG) {
	$scope.isCachingAvailable = Caching.getCachingState();  
	$scope.variables = {};
	$scope.isResultAvailable = false;

	File.read(GENERAL_CONFIG.QUESTIONS_FILE).then(function(response) {
		$scope.questions = response.templateQueries;
		$scope.questionsVariables = response.variables;
		console.log('Number of questions', $scope.questions.length);
		console.log('Number of questionsVariables', $scope.questionsVariables.length);
	}, function(response) {
		console.log("Error reading template query file", response);  
	});
	/*return promise from then
	 * This function load data option's value for the questions form. In the current implementation
	 * ,we get the data option values from ontologies or RDF blob files, this function make
	 * use of the questions.json file to get the location information(URL) about these files. 
	 * This function does two things operations, it stores the files in the triple store and also
	 * checks if given list of file exits in the triple store.
	 */
	$scope.cacheDataOptions = function(){
		console.log("Loading data options");
		var promises = [];
		File.read(GENERAL_CONFIG.QUESTIONS_FILE).then(function(response) {
			var questionsVariables = response.variables;
			angular.forEach( $scope.questionsVariables, function(variable) {
				var deffered  = $q.defer();  
				if(variable.fileUrl != undefined) {
					File.read(GENERAL_CONFIG.SPARQL_QUERIES_DIR + 'checkGraph.sparql').then(
							function(query) { 
								var variables = {};
								variables ["#url#"] = variable.fileUrl;
								HttpEndpoint.query(query, variables).then(function(response) {
									console.log(response);  
									if (response.data.results.bindings.length == 0) {
										console.log("Loading content of ", variable.fileUrl); 
										deffered.resolve(HttpEndpoint.load(variable.fileUrl,
												variable.fileUrl));
									} else {
										console.log("Content of ", variable.fileUrl,
												" is available");
									}           	
								}, function(res) {
									console.log('Something went wrong loading ontology');
									deffered.reject();
								}
								);            
							});          
				} 
				promises.push(deffered.promise);
			});
			console.log('Number of questionsVariables', questionsVariables.length);
		}, function(response) {
			console.log("Error reading template query file", response);  
		});
		return $q.all(promises);
	};

	$scope.getVariableValues = function(){
		if($scope.isCachingAvailable) {
			// preload the autocomplete values
			$scope.vars = {};
			angular.forEach($scope.questions, function(question, key) {
				angular.forEach(question.variables, function(variable) {
					if ($scope.vars[variable]) {
						return;
					}
					// Variable JSON config is not defined it is a free text input
					if($scope.questionsVariables[variable] != undefined) {
						var varFileName = $scope.questionsVariables[variable].queryFileName;
						var file = GENERAL_CONFIG.SPARQL_QUERIES_DIR + varFileName;
						var promise = Data.variables(file);
						$scope.vars[variable] = promise;
						promise.then(function(vars) {
							$scope.vars[variable] = vars;
						});            
					}
				});
			});
		}

	};


	$scope.questionChanged = function() {
		console.log('selected question', $scope.selectedQuestion);
		$scope.getVariableValues();
		console.log('preloaded variables:', $scope.vars);
		$scope.isResultAvailable = false;
		$scope.isEmptyRows = false;
	};  

	$scope.process = function() {
		$scope.isResultAvailable = false;
		var question = $scope.questions[$scope.selectedQuestion];

		File.read('data/query/' + question.queryFileName).then(function(query) {
			var variables = {};
			question.variables.forEach(function(variable) {
				variables['#'+variable+'#'] = $scope.variables[variable];
			});
			// Add variables['#' + FDP_Variable + '#'] here. Make use of getfdpList function
			var fdpUris = "";
			$cookies.getObject("fdpsToUse").forEach(function(fdp){			  
			  fdpUris = fdpUris.concat(" <", fdp, ">");			  
			});
			variables['#fdp#'] = fdpUris;
			HttpEndpoint.query(query, variables).then(function(response) {
				console.log(response);        
				$scope.results = response.data;        
				$scope.isResultAvailable = true;
				$scope.rows = $scope.getValues(response.data.results.bindings,
						response.data.head.vars);
			}).then(function() {
				// Manually added timeout. (This is a work around) 
				$timeout(function(){
					console.log('trying to enable pagination');
					jQuery('#footest').simplePagination({
						perPage: 15,
						previousButtonText: 'Prev',
						nextButtonText: 'Next',
						previousButtonClass: "btn btn-primary btn-xs",        
						nextButtonClass: "btn btn-primary btn-xs"
					});
				}, 100);
			});
		});
	};

	$scope.getHeaders = function(vars) {
		var headers = [];
		vars.forEach(function(v) {
			if (v.indexOf('URI') === -1) {
				headers.push(v);
			}
		});
		return headers;
	};

	$scope.getValues = function(results, vars) {
		var rows = [];
		results.forEach(function(result){
			var values = [];
			vars.forEach(function(v) {
				if (v.indexOf('URI') === -1 && result[v] !== undefined) {
					var resource = result[v + 'URI'];
					var displayName = result[v].value;

					if (resource !== undefined) {
						values.push({
							uri: resource.value,
							label: displayName
						});
					} else {
						values.push({
							label: displayName
						});
					}
				}
			});
			rows.push(values);
		});
		return rows;
	};
}]);
app.controller('StatsCtrl', ["$scope", "Statistics", function($scope, Statistics) {    
  $scope.stats = Statistics.get();
}]);
angular.module('templates', []).run(['$templateCache', function($templateCache) {$templateCache.put('about/about.html','<h1>About</h1>\n<p>\n--- TODO ---\n</p>');
$templateCache.put('cache/cache.html','<uib-accordion close-others="oneAtATime">\n\n<!-- FDP caching config panel -->\n<div uib-accordion-group class="panel-info" is-open="fdpCache.open">\n\t<uib-accordion-heading> <span\n\t\tclass="glyphicon glyphicon-cog"></span> FDP cache configuration <i\n\t\tclass="pull-right glyphicon"\n\t\tng-class="{\'glyphicon-chevron-down\': fdpCache.open, \'glyphicon-chevron-right\':\n\t\t!fdpCache.open}"></i>\n\t</uib-accordion-heading>\n\t<form>\n\t\t<div class="form-group row">\n\t\t\t<div class="col-lg-6">\n\t\t\t\t<div class="input-group">\n\t\t\t\t\t<span class="input-group-addon">Url</span> <input type="text"\n\t\t\t\t\t\tclass="form-control" placeholder="Enter FDP URL"\n\t\t\t\t\t\tng-model="fdp.url" />\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t\t<!-- Cache button section  -->\n\t\t<div class="form-group row">\n\t\t\t<div class="offset-sm-2 col-sm-10">\n\t\t\t\t<button type="button" ng-click="cache()"\n\t\t\t\t\tclass="btn btn-primary has-spinner" id="cache"\n\t\t\t\t\tdata-btn-text="caching...">Cache</button>\n\t\t\t</div>\n\t\t</div>\n\t</form>\n</div>\n\n<!-- Search caching config panel -->\n<div uib-accordion-group class="panel-info" is-open="searchCache.open">\n\t<uib-accordion-heading> <span\n\t\tclass="glyphicon glyphicon-cog"></span> FDP from search cache\n\tconfiguration <i class="pull-right glyphicon"\n\t\tng-class="{\'glyphicon-chevron-down\': searchCache.open, \'glyphicon-chevron-right\':\n\t\t!searchCache.open}"></i>\n\t</uib-accordion-heading>\n\t<form>\n\t\t<div class="form-group row">\n\t\t\t<div class="col-lg-6">\n\t\t\t\t<div class="input-group">\n\t\t\t\t\t<span class="input-group-addon">Url</span> <input type="text"\n\t\t\t\t\t\tclass="form-control" aria-label="..."\n\t\t\t\t\t\tplaceholder="Enter serach engine URL" ng-model="searchEngineUrl">\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t\t<!-- Cache button section  -->\n\t\t<div class="form-group row">\n\t\t\t<div class="offset-sm-2 col-sm-10">\n\t\t\t\t<button type="button" ng-click="cacheSearch(searchEngineUrl)"\n\t\t\t\t\tclass="btn btn-primary has-spinner" id="cache"\n\t\t\t\t\tdata-btn-text="caching...">Cache</button>\n\t\t\t</div>\n\t\t</div>\n\t</form>\n</div>\n\n<!-- FDP config panel -->\n<div uib-accordion-group class="panel-info" is-open="fdpConfig.open"\n\tng-click="updateFdpList()">\n\t<uib-accordion-heading> <span\n\t\tclass="glyphicon glyphicon-cog"></span> FDP query configuration <i\n\t\tclass="pull-right glyphicon"\n\t\tng-class="{\'glyphicon-chevron-down\': fdpConfig.open, \'glyphicon-chevron-right\':\n\t\t!fdpConfig.open}"></i>\n\t</uib-accordion-heading>\n\t<div class="form-group row" ng-repeat="fdp in fairDataPoints">\n\t\t<div class="col-lg-4">\n\t\t\t<div class="input-group">\n\t\t\t\t<span class="input-group-addon">String</span> <input type="text"\n\t\t\t\t\tclass="form-control" placeholder="Enter FDP name"\n\t\t\t\t\tng-model="fdp.name" />\n\t\t\t</div>\n\t\t</div>\n\t\t<div class="col-lg-6">\n\t\t\t<div class="input-group">\n\t\t\t\t<span class="input-group-addon">Url</span> <input type="text"\n\t\t\t\t\tclass="form-control" placeholder="Enter FDP URL" ng-model="fdp.url" />\n\t\t\t</div>\n\t\t</div>\n\t\t<div class="col-lg-2">\n\t\t\t<md-switch ng-model="fdp.state" ng-change="setFdpState(fdp)" />\n\t\t</div>\n\t</div>\n</div>\n</uib-accordion>\n\n<!-- Cache log panel -->\n<div class="panel panel-info" ng-if="isCachingStarted">\n\t<div class="panel-heading">\n\t\t<span class="glyphicon glyphicon-info-sign"></span> Log\n\t</div>\n\t<div class="panel-body">\n\t\t<!-- Log section-->\n\t\t<div id="log-panel" class="panel-body"\n\t\t\tstyle="height: 300px; overflow-y: scroll;">\n\t\t\t<p ng-repeat="x in log">\n\t\t\t\t<kbd>[{{x.date}} {{x.time}}]</kbd>\n\t\t\t\t{{x.message}}\n\t\t\t</p>\n\t\t</div>\n\t</div>\n</div>\n');
$templateCache.put('home/home.html','<!-- \nThe cacheDataOptions() function is initiated as soon as the first user visit the home page, \nFor the every first time this function stores ontologies and RDF blob files which supplies, \nData options value to the questions form. \n-->\n<div class="container" ng-init="cacheDataOptions()">\n\t<div class="alert alert-warning" role="alert" ng-if="!isCachingAvailable">\n\t\t<span class="glyphicon glyphicon-warning-sign" aria-hidden="true"></span>\n        The data cache is not available. Please start the <a href="#!cache">caching process!</a>\n    </div>  \n\t<div class="row">\n    \t<div class="col-lg-12">\n        \t<div class="page-header text-center">\n              <h1>FAIR Data Demonstrator</h1>\n            </div>\n\t\t\t<div class="panel panel-info" id="step1">\n\t\t\t\t<div class="panel-heading">\n\t\t\t    \t<h3 class="panel-title">Step 1 <span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span> Select query:</h3>\n\t\t\t    </div>\n\t\t\t\t<questions></questions>\n\t\t\t</div>\n\t\t\t <div class="panel panel-info" id="step2" ng-if="selectedQuestion">\n             \t<div class="panel-heading">\n                \t<h3 class="panel-title">Step 2 <span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span> By which value?</h3>\n              \t</div>\n              \t<div class="panel-body"> \n              \t\t<variables></variables>\n              \t</div>              \t\n             </div>             \n             \n             <div class="panel panel-info" id="step3" ng-if="isResultAvailable">              \n              <div class="panel-heading">                \n                <h3 class="panel-title">Step 3 <span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span> Result:</h3>\n              </div>\n              <div class="panel-body">                  \n            <div class="alert alert-info fade in" ng-show="rows.length == 0">   \n                <p><strong> No result :</strong> Sorry no result available for these query params</p>\n            </div>\n            <results ng-show="rows.length > 0"></results> \n              </div>\n            </div>\t\t\t\n\t\t</div>\n\t</div>\n</div>\n<!-- /.container -->\n\n\t');
$templateCache.put('stats/stats.html','<div class="panel panel-info">  \n  <div class="panel-heading">\n    <h3 class="panel-title">FDP stats</h3>\n  </div>\n  <div class="panel-body">\n    <ul class="list-group">    \n\t    <li ng-repeat="(name, count) in stats" class="list-group-item">\n\t\t    <span class="badge">{{count}}</span>\n\t\t    {{name}}\n\t\t  </li>\n\t</ul>\n  </div>\n</div>');
$templateCache.put('components/questions/questions.html','<div class="panel-body">\n\t<select ng-attr-size="{{questions.length}}"\n     \tng-model="selectedQuestion"\n        ng-change="questionChanged()"\n        ng-options="key as option.text for (key, option) in questions"\n        class="form-control" \n        id="template">        \n        \t<!-- workaround for angular\'s empty model selection -->\n        \t<option value="" ng-if="false"></option>\n    </select>\n</div>');
$templateCache.put('components/results/results.html','<table class="table table-striped" id="footest">\n    <thead>\n        <tr>\n            <th ng-repeat="v in getHeaders(results.head.vars)">\n                {{v}}\n            </th>\n        </tr>\n    </thead>\n    <tbody>\n        <tr ng-repeat="result in rows">\n            <td ng-repeat="value in result track by $index">\n                <a ng-if="value.uri" target="_blank" ng-href="{{value.uri}}">{{value.label}}</a>\n                <span ng-if="!value.uri">{{value.label}}</span>\n            </td>\n        </tr>\n    </tbody>\n</table>');
$templateCache.put('components/variables/variables.html','<div ng-repeat="variable in questions[selectedQuestion].variables">\n\t<div  class="row" id="{{variable}}">\n\t\t<div class="col-md-4"><button type="button" class="btn btn-voilet btn-lg btn-block">{{variable}}</button></div>\n\t    <div class="col-md-4"><button type="button" class="btn btn-default btn-lg btn-block"><i>type</i></button></div>  \n\t    <div class="col-md-4">\n\t        <input class="form-control" type="text" ng-attr-list="{{variable}}-list" ng-model="variables[variable]" placeholder="Type your {{variable}} here">\n\t        <datalist ng-attr-id="{{variable}}-list">\n\t    \t    <option ng-repeat="option in vars[variable]" ng-value="option.uri">{{option.label}}</option>\n\t    \t</datalist> \n\t    </div>\n\t</div>\n\t<p></p>\n</div>\n\n<!-- Process button section  -->\n\n<div class="panel-footer panel-info">\n\t<div class="row">\n       <div class="col-md-4"></div>\n            <div class="col-md-4">\n                <button type="button" ng-click="process()" class="btn btn-red btn-lg btn-block has-spinner" id="process" data-btn-text="Loading...">\n                \tProcess <span class="glyphicon glyphicon-forward" aria-hidden="true"></span>\n            \t</button>\n        \t</div>\n    \t<div class="col-md-4"></div>\n\t</div>                \n</div>');}]);
app.service('Caching', ["$cookies", function($cookies) {
  
  var isCachingAvailable = false;
  
  return { 
    setCachingState: function(x) {
      $cookies.put('cachestate', true);
    },
    getCachingState: function() {
      return $cookies.get('cachestate') || false;
    }
  };
}]);
app.service('Data', ["$http", "$q", "File", "HttpEndpoint", function($http, $q, File, HttpEndpoint) {

  return {
    variables : function(file) {
      var deferred = $q.defer();
      File.read(file).then(function(query) {
        HttpEndpoint.query(query).then(function(response) {
          var variables = [];
          response.data.results.bindings.forEach(function(binding) {
            var url;
            var label;
            if ('url' in binding && 'value' in binding) {
              url = binding.url.value;
              label = binding.value.value;
            } else if ('url' in binding) {
              url = binding.url.value;
              label = binding.url.value;
            } else if ('value' in binding) {
              url = binding.value.value;
              label = binding.value.value;
            }
            variables.push({
              uri : url,
              label : label
            });
          });
          deferred.resolve(variables);
        }, function(response) {
          deferred.reject(response);
        });
      }, function(response) {
        console.log("File to read query file ", response);
      });
      return deferred.promise;
    }
  };
}]);
app.service('FDP', ["$http", "HttpEndpoint", "File", "Statistics", "Log", "$q", "$rootScope", "$cookies", function ($http, HttpEndpoint, File, Statistics, Log, $q, $rootScope, $cookies) {
  /**
   * Caches the content of the url using {@link HttpEndpoint#load}, reads the query
   * file using {@link File}, and executes the query using {@link HttpEndpoint#query}.
   * @param {string} url - to cache and query
   * @param {string} queryFile - sparql query file location
   * @return {promise} Result of the sparql query
   */
  var cacheAndQuery = function (url, graphUri, queryFile) {
    return HttpEndpoint.load(url, graphUri).then(function () {
      Log.appendToLog("Loading content of <" + url + ">");
      return File.read(queryFile).then(function (query) {
        return HttpEndpoint.query(query, {'#inputUrl#': url}).then(function (response) {
          // return map of id->url
          var values = {};
          response.data.results.bindings.forEach(function (binding) {
            values[binding.id.value] = binding.url.value;
            });
          return values;
          }, function (response) {
            console.log('failed', response);
            });
        });
      });
    };

  return {
    /**
     * Loads all levels of metadata for the given FAIR Data Point. When all loading
     * is finished, an event named 'fdp-data-loaded' is fired.
     * @param {string} root - the root of a FAIR Data Point
     */

    load: function (fairDataPoints) {
      Statistics.setFairDataPointsCount(Object.keys(fairDataPoints).length);
      var catalogsCount = 0;
      var datasetsCount = 0;
      var distributionsCount = 0;
      angular.forEach(fairDataPoints, function (fdp, index) {
	var logMsg = "Loading data from '" + fdp.name;
	Log.appendToLog(logMsg);
	// load the FDP root and query for all catalogs
	var uberpromise = cacheAndQuery(fdp.url, fdp.url, 'data/query/getCatalogs.sparql').then(
	    function (catalogs) {
	  console.log("catalogs for ", fdp.name, " FDP ", catalogs);
	  catalogsCount = catalogsCount + Object.keys(catalogs).length;
	  Statistics.setCatalogsCount(catalogsCount);
	  var p = [];
	  Object.keys(catalogs).forEach(function (cid) {
	    var catalog = catalogs[cid];
	    // load the catalog and query for all datasets
	    p.push(cacheAndQuery(catalog, fdp.url, 'data/query/getDataset.sparql').then(
	        function (datasets) {
	      var p2 = [];
	      Object.keys(datasets).forEach(function (did) {
		var dataset = datasets[did];
		datasetsCount = datasetsCount + 1;
		Statistics.setDataSetsCount(datasetsCount);
		// load the dataset and query for all distributions
		p2.push(cacheAndQuery(dataset, fdp.url, 'data/query/getDistributions.sparql').then(
		    function (distributions) {
		  var p3 = [];
		  Object.keys(distributions).forEach(function (distId) {
		    var dist = distributions[distId];
		    distributionsCount = distributionsCount + 1;
		    Statistics.setDistributionsCount(distributionsCount);
		    Log.appendToLog("Loading content of <" + dist + ">");
		    p3.push(HttpEndpoint.load(dist + ".ttl"), fdp.url);
		  });

		  return $q.all(p3);
		}, angular.noop));
	      });
	      return $q.all(p2);
	    }, angular.noop));
	  });
	  return $q.all(p);
	}, angular.noop);

	uberpromise.then(function () {
	  console.log('now done with our uberloop');
	  File.read('data/query/getTurtleDistributionFiles.sparql').then(function (query) {
	    HttpEndpoint.query(query).then(function (response) {
	      var promises = [];
	      var turtleFilesCount = 0;
	      // result is expected to be id,url mappings where url is the download location            
	      response.data.results.bindings.forEach(function (binding) {
		var url = binding.url.value;
		var distributionUri = binding.distributionUri.value;
		turtleFilesCount = turtleFilesCount + 1;
		Statistics.setTurtleFilesCount(turtleFilesCount);
		// load each file. Note: Due to implicitome server failure we skip the data hosted in implicitome server.
		if (url != 'http://implicitome.cloud.tilaa.nl/goNlSvR5/rdf.ttl') {
		  Log.appendToLog("Loading content of <" + url + ">");
		  var promise = HttpEndpoint.load(url, distributionUri).then(function (response) {
		    console.log('loaded', url, response);
		  }, function (response) {
		    console.log('failed to load', response);
		  });
		  promises.push(promise);
		}
	      });

	      // broadcast event when all files are loaded
	      $q.all(promises).then(function () {
		console.log('broadcasting fdp-data-loaded');
		$rootScope.$broadcast('fdp-data-loaded');
	      });
	    });
	  });
	}, function () {
	  console.log('failed uberloop');
	});
      });
    },  
    
    getFdps: function() {
      return File.read('data/query/listCachedFdps.sparql').then(function(query) {
        return HttpEndpoint.query(query).then(function(response) {
          var fairDataPoints = [];
          response.data.results.bindings.forEach(function(binding) {
            var fdpFromCookies = $cookies.getObject(btoa(binding.fdp.value));
            var state = true;
            if(fdpFromCookies != null) {
              state = fdpFromCookies.state;
            }
    				fairDataPoints.push({url:binding.fdp.value, name:binding.name.value, state:state});
    				});
          return fairDataPoints;
	      });
	    });	      
  	}
    
  };
}]);
app.service('File', ["$q", "$http", function($q, $http) {
  var cache = {};
  
  return { 
    read: function(fileName) {
      var deferred = $q.defer();
      
      if (cache[fileName]) {
        deferred.resolve(cache[fileName]);
      } else {
        $http.get(fileName).then(function(response) {
          var query = response.data;
          deferred.resolve(query);
          cache[fileName] = query;
        }, function(response) {          
          console.log('failed to get query', response);       
          deferred.reject(response.data);
        });
      }
      
      return deferred.promise;
    }
  };
}]);
app.service('HttpEndpoint', ["$q", "$http", "$timeout", "GENERAL_CONFIG", function($q, $http, $timeout, GENERAL_CONFIG) {
  var endpointBaseUrl = GENERAL_CONFIG.END_POINT_BASE_URL;
  var endpoint = endpointBaseUrl + 'namespace/test/sparql';
  
  return {            
    /**
     * params is expected in the following format: { 'param_name':'uri'}
     */
    
    query : function(q, params) {
      if (params) {
        Object.keys(params).forEach(function(key) {
          q = q.replace(key, params[key]);
          });
        }
      return $http.get(endpoint, {
        params : {query : q, format : 'json', callback : 'JSON_CALLBACK'}});
      },
            
    load : function(resource, graphUri) {
      var deferred = $q.defer();              
      var cacheLocation = endpoint;              
      var contextUri = resource; 
      
      if (graphUri) {                
        contextUri = graphUri;              
      } 
      // Hack solution for molegenis fdp
      if (resource == 'https://molgenis26.gcc.rug.nl/downloads/bbmri/sample_collections.ttl' || 
          resource == 'http://molgenis26.gcc.rug.nl/downloads/bbmri/sample_collections.ttl') {
        resource = 'http://localhost:8503/demo-content/sample_collections.ttl';
      }
      // setting headers              
      var config = {headers :{'Content-Type' : 'application/x-www-form-urlencoded;charset=utf-8;'}};
      
      // setting urlenconded form to post              
      var data = $.param({'uri' : resource, 'context-uri' : contextUri});
      
      $http.post(cacheLocation, data, config).then(function(res) {                        
        deferred.resolve(res);                        
        console.log('Caching : url ==>  ' + cacheLocation);                      
      },                      
      function(res) {                        
        data = $.param({'uri' : (resource + ".ttl"), 'context-uri' : contextUri});                        
        $http.post(cacheLocation, data, config).then(function(res) {                                  
          console.log('First attempt to load data failed. Trying differently:');                                  
          console.log('Caching now from : ' + resource + ".ttl");                                  
          deferred.resolve(res);                                
        },                                
        function(res) {                                  
          console.log('failed to PUT file in endpoint');                                  
          deferred.reject(res);                                
        });                      
      });              
      return deferred.promise;            
    }          
  };        
}]);

app.service('Log', ["$filter", "$timeout", function($filter, $timeout) {
  var log = [];
  var logElementId;
  
  return {
    setLogElementId: function(id) {
      logElementId = id;
    },
    appendToLog: function(msg) {   
      console.log(msg);
      var date = $filter('date')(new Date(), 'dd/MM/yyyy');
      var time = $filter('date')(new Date(), 'HH:mm:ss');
      log.push({ 
        time:time, date:date, message:msg
      });
      
      if (logElementId) {
        var elem = document.getElementById(logElementId);
        if (elem) {
          elem.scrollTop = elem.scrollHeight + 1;
        }
      }
    },
    get: function() {return log;},
    reset: function() {log = [];}
    };
  
}]);
app.directive('questions', function() {
  return {
    restrict: 'E',
    templateUrl: 'components/questions/questions.html'
  };
});
app.directive('results', function() {
  return {
    restrict: 'E',
    templateUrl: 'components/results/results.html'
  };
});
app.service('Statistics', ["$cookies", function($cookies) {
  var numberOfFairDataPoints = 0;
  var numberOfCatalogs = 0;
  var numberOfDatasets = 0;
  var numberOfDistributions = 0;
  var numberOfDistributionTurtleFiles = 0;
  
  return { 
    setFairDataPointsCount: function(x) {
      $cookies.put('numberOfFairDataPoints', x);
    },
    setCatalogsCount: function(x) {
      $cookies.put('numberOfCatalogs', x);
    },
    setDataSetsCount: function(x) {
      $cookies.put('numberOfDatasets', x);
    },
    setDistributionsCount: function(x) {
      $cookies.put('numberOfDistributions', x);
    },
    setTurtleFilesCount: function(x) {
      $cookies.put('numberOfDistributionTurtleFiles', x);
    },
    get:function() {
      var stats = {
        "FairDataPoints": $cookies.get('numberOfFairDataPoints') || 0,
        "Catalogs": $cookies.get('numberOfCatalogs') || 0,
        "Datasets": $cookies.get('numberOfDatasets') || 0,
        "Distributions": $cookies.get('numberOfDistributions') || 0, 
        "TurtleFilesDistributions": $cookies.get('numberOfDistributionTurtleFiles') || 0
      };
      return stats;
    }
  };
}]);
app.directive('variables', function() {
  return {
    restrict: 'E',
    templateUrl: 'components/variables/variables.html'
  };
});})();