var sync = require("synchronize");
var textFilesLoader = require("text-files-loader");
var analysis = require('./analysis.js');
var helper = require('./helper.js');
var lists = require('./lists.js')

var DEBUG = false;

var urlPrefix = 'https://github.com/slidewiki/slidewiki-platform/blob/master/';
//var urlPrefix = '--->';

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

function resolveRelations(rel, sarr)
{
  if (DEBUG) {
    console.log("REL----------------------");
    console.log(rel);
    console.log("SARR---------------------");
    console.log(sarr);
  }

  out = []
  for (var filename in rel)
  {
    if (DEBUG) console.log("searching for " + filename);
    out[filename] = [];

    for (var idx in rel[filename])
    {
      var sitem = rel[filename][idx];
      var sitemParent = analysis.findFileContaining(sarr, sitem);
      if (DEBUG) console.log(filename + " -> " + handlerParent);
      if (sitemParent && !lists.contains(out[filename], sitemParent))
      {
        out[filename].push(sitemParent);
      }
    }
  }
  return out;
}

//        //
//  INIT  //
//        //

// check for path parameter
if (process.argv[2])
  rootDir = process.argv[2];
else
  helper.die({code : -1, msg : "Usage: nodejs reflux-analyzer.js project_absolute_path"});

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
  keysAsFullPath: true,
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

  // deconstruct absolute paths into project relative path, filename and
  // filename without extension
  componentCode = lists.stripPaths(componentCode, rootDir);
  actionCode = lists.stripPaths(actionCode, rootDir);
  storeCode = lists.stripPaths(storeCode, rootDir);

  //console.log(componentCode)
  //process.exit(0);

  // search for Component definitions
  var components = analysis.findLinesInContent(componentCode, pattern.COMPONENT);
  if (DEBUG) helper.printList("COMPONENTS:", components);

  // search for Action definitions
  var actions = analysis.findLinesInContent(actionCode, pattern.ACTION)
  if (DEBUG) helper.printList("ACTIONS:", actions);

  // search for Store definitions
  var stores = analysis.findLinesInContent(storeCode, pattern.STORE);
  if (DEBUG) helper.printList("STORES:", stores);

  // search for Handlers in Stores
  var handlers = analysis.findLinesInContent(storeCode, pattern.HANDLER);
  if (DEBUG) helper.printList("HANDLERS:", handlers);

  // search for Calls: Component -> Action
  var calls = analysis.findLinesInContent(componentCode, pattern.CALLS);
  if (DEBUG) helper.printList("CALLS:", calls);

  // search for Dispatching: Action -> Store
  var dispatchHandlers = analysis.findLinesInContent(actionCode, pattern.DISPATCH);
  if (DEBUG) helper.printList("DISPATCH HANDLER CALLS:", dispatchHandlers);

  // search for Updates: Store -> Component
  var updates = analysis.findLinesInContent(componentCode, pattern.UPDATE);
  if (DEBUG) helper.printList("UPDATES:", updates);

  // search for Components importing other components
  var compcomp = analysis.findLinesInContent(componentCode, pattern.COMPCOMP);
  if (DEBUG) helper.printList("COMPCOMP:", compcomp);


  // resolv "dispatch" relations
  var dispatch_rels = resolveRelations(dispatchHandlers, handlers)
  if (DEBUG) helper.printList("DISPATCH RELATIONS:", dispatch_rels);

  // resolve "uses" relations
  var uses_rels = resolveRelations(compcomp, components);
  if (DEBUG) helper.printList("USES RELATIONS:", uses_rels);

  // resolve "call" relations
  var call_rels = resolveRelations(calls, actions);
  if (DEBUG) helper.printList("CALL RELATIONS:", call_rels);

  // resolve "update" relations
  var update_rels = resolveRelations(updates, stores);
  if (DEBUG) helper.printList("UPDATE RELATIONS:", update_rels);


  //                   //
  //  GENERATE RESULT  //
  //                   //

  // create node list
  var nodes = [];
  var next_id = 0;

  next_id = lists.addToNodesList(nodes, stores, "stores", next_id, urlPrefix);
  next_id = lists.addToNodesList(nodes, actions, "actions", next_id, urlPrefix);
  next_id = lists.addToNodesList(nodes, components, "components", next_id, urlPrefix);

  // create edge list
  // TODO fix edge list generation
  var edges = [];
  lists.addToEdgeList(nodes, edges, uses_rels, "uses", "to", {color:'black'});
  lists.addToEdgeList(nodes, edges, call_rels, "call", "to", {color:'blue'});
  lists.addToEdgeList(nodes, edges, dispatch_rels, "dispatch", "to", {color:'green'});
  lists.addToEdgeList(nodes, edges, update_rels, "update", "from", {color:'brown'});

  console.log("var nodes = ");
  console.log(JSON.stringify(nodes));
  console.log(";\nvar edges = ");
  console.log(JSON.stringify(edges));
  console.log(";");
});
