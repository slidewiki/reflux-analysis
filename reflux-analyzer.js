var sync = require("synchronize");
var textFilesLoader = require("text-files-loader");
var analysis = require('./analysis.js');
var helper = require('./helper.js');
var lists = require('./lists.js')

var DEBUG = true;

var rootDir;   // root directory of the project to be analyzed

// detection and extraction patterns
var pattern =
{
  COMPONENT : {
    detect : new RegExp(/class\s+.*\s+extends\s+React.Component/g),
    extract: new RegExp(/class\s+(.*)\s+extends/)
  },
  ACTION : {
    detect : new RegExp(/export\s+default\s+function\s+(.*)\(.*, .*, .*\)/g),
    extract: new RegExp(/function\s+(.*)\(.*, .*, .*\)/)
  },
  STORE : {
    detect : new RegExp(/class\s+.*\s+extends\s+BaseStore/g),  // FIXME finds only children of BaseStore
    extract: new RegExp(/class\s+(.*)\s+extends/)
  },
  HANDLER: {
    detect : new RegExp(/\'[A-Z_]+\'\:\s?\'[A-Za-z]+\'/g),     // FIXME this is not a good pattern
    extract: new RegExp(/\'([A-Z_]+)\'\:\s?\'[A-Za-z]+\'/)
  },
  CALLS : {
    detect : new RegExp(/import\s+.*\s+from\s+\'.*\/actions\/.*\'/g),
    extract: new RegExp(/import\s+(.*)\s+from/)
  },
  DISPATCH : {
    detect : new RegExp(/context\.dispatch\(\'.*\',\s?.*\);/g),
    extract: new RegExp(/dispatch\(\'(.*)\',/)
  },
  UPDATE : {
    detect : new RegExp(/import\s+.*\s+from\s+\'.*\/stores\/.*\'/g),
    extract: new RegExp(/import\s+(.*)\s+from/)
  },
  COMPCOMP : {
    detect : new RegExp(/import\s+.*\s+from\s+\'\.\/.*\'/g),
    extract: new RegExp(/import\s+(.*)\s+from/)
  }
};

//        //
//  INIT  //
//        //

// check for path parameter
if (process.argv[2])
  rootDir = process.argv[2];
else
  helper.die({code : -1, msg : "Usage: reflux-analyzer.js dir"});

// check if project dir is sane
helper.checkDir(rootDir);

// make paths
var componentsPath = rootDir + "/components";
var actionsPath    = rootDir + "/actions";
var storesPath     = rootDir + "/stores";

// check if sub-dirs are sane
helper.checkDir(componentsPath);
helper.checkDir(actionsPath);
helper.checkDir(storesPath);

// prepare text-files-loader
textFilesLoader.setup(
{
  recursive: true,
  matchRegExp: /\.js/
});

//                 //
//  CODE ANALYSIS  //
//                 //
sync.fiber(function()
{
  // load contents of js files in sub-dirs
  var componentCode = sync.await(textFilesLoader.load(componentsPath, sync.defer()));
  var actionCode = sync.await(textFilesLoader.load(actionsPath, sync.defer()));
  var storeCode = sync.await(textFilesLoader.load(storesPath, sync.defer()));

  // search for Component definitions
  var components = analysis.findLinesInContent(componentCode, pattern.COMPONENT);
  if (DEBUG) helper.printList("COMPONENTS:", components);

  // search for Action definitions
  var actions = analysis.findLinesInContent(actionCode, pattern.ACTION)
  if (DEBUG) helper.printList("ACTIONS:", actions);

  // search for Store definitions
  var stores = analysis.findLinesInContent(storeCode, pattern.STORE);
  if (DEBUG) helper.printList("STROES:", stores);

  // search for Handlers in Stores
  var handlers = analysis.findLinesInContent(storeCode, pattern.HANDLER);
  if (DEBUG) helper.printList("HANDLERS:", handlers);

  // search for Calls: Component -> Action
  var calls = analysis.findLinesInContent(componentCode, pattern.CALLS);
  if (DEBUG) helper.printList("CALLS:", calls);

  // search for Dispatch: Action -> Store
  var dispatchHandlers = analysis.findLinesInContent(actionCode, pattern.DISPATCH);
  if (DEBUG) helper.printList("DISPATCH HANDLER CALLS:", dispatchHandlers);

  // search for Updates: Store -> Component
  var updates = analysis.findLinesInContent(componentCode, pattern.UPDATE);
  if (DEBUG) helper.printList("UPDATES:", updates);

  // search for Components importing other components
  var compcomp = analysis.findLinesInContent(componentCode, pattern.COMPCOMP);
  if (DEBUG) helper.printList("COMPCOMP:", compcomp);

  // resolve DISPATCH relations
  var dispatch = [];
  for (var filename in dispatchHandlers)
  {
    dispatch[filename] = [];

    for (var handler_idx in dispatchHandlers[filename])
    {
      var handler = dispatchHandlers[filename][handler_idx];
      var handlerParent = analysis.findFileContaining(handlers, handler);
      //if (DEBUG) console.log(filename + " -> " + handlerParent);
      if (handlerParent && !lists.contains(dispatch[filename], handlerParent))
      {
        dispatch[filename].push(handlerParent);
      }
    }
  }
  if (DEBUG) helper.printList("DISPATCH RELATIONS:", dispatch);

  //                   //
  //  GENERATE RESULT  //
  //                   //

  // create node list
  var nodes = [];
  var next_id = 0;

  next_id = lists.addToNodesList(nodes, stores, "stores", next_id);
  next_id = lists.addToNodesList(nodes, actions, "actions", next_id);
  next_id = lists.addToNodesList(nodes, components, "components", next_id);

  console.log(nodes);

  // create edge list
  var edges = [];
  lists.addToEdgeList(nodes, edges, compcomp, "uses", "to", {color:'black'});
  lists.addToEdgeList(nodes, edges, calls, "call", "to", {color:'blue'});
  lists.addToEdgeList(nodes, edges, dispatch, "dispatch", "to", {color:'green'});
  lists.addToEdgeList(nodes, edges, updates, "update", "from", {color:'brown'});

  console.log(edges);
});
