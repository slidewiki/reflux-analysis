var sync = require("synchronize");
var fs = require('fs');
var textFilesLoader = require("text-files-loader");
var analyzer = require('./analyzer.js');
var DEBUG = true;

var rootDir;   // root directory of the project to be analyzed

var errors =
{
  NOPARAM : {code : -1, msg : "Usage: reflux-analyzer.js dir"},
  NOTDIR  : {code : -2, msg : "Not a directory: "},
  READERR : {code : -3, msg : "Unable to read directory: "}
}

// FUNCTIONS //

function die(error)
{
  process.stderr.write(error.msg + "\n");
  process.exit(error.code);
}

function checkDir(path)
{
  try
  {
    stats = fs.lstatSync(path);

    if (!stats.isDirectory())
    {
      errors.NOTDIR.msg += path;
      die(errors.NOTDIR);
    }
  }
  catch (e)
  {
    errors.READERR.msg += path;
    die(errors.READERR);
  }
}

function contains(arr, str)
{
  for (item in arr)
  {
    if (item.indexOf(str) > -1) {
      return true;
    }
  }
  return false;
}

//        //
//  INIT  //
//        //

// check for path parameter
if (process.argv[2])
{
  rootDir = process.argv[2];
}
else
{
  die(errors.NOPARAM);
}

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
  var componentsPath = rootDir + "/components";
  var actionsPath    = rootDir + "/actions";
  var storesPath     = rootDir + "/stores";

  // check if project dir is sane
  checkDir(rootDir);

  // load rootDir/components/*.js
  checkDir(componentsPath);
  var componentCode = sync.await(textFilesLoader.load(componentsPath, sync.defer()));

  // load rootDir/actions/*.js
  checkDir(actionsPath);
  var actionCode = sync.await(textFilesLoader.load(actionsPath, sync.defer()));

  // load rootDir/stores/*.js
  checkDir(storesPath);
  var storeCode = sync.await(textFilesLoader.load(storesPath, sync.defer()));

  // search for Component definitions
  var components = analyzer.findLinesInContent
  (
    componentCode,
    new RegExp(/class\s+.*\s+extends\s+React.Component/g),
    new RegExp(/class\s+(.*)\s+extends/)
  );

  if (DEBUG) console.log("COMPONENTS:");
  if (DEBUG) console.log(components);

  // search for Action definitions
  var actions = analyzer.findLinesInContent
  (
    actionCode,
    new RegExp(/export\s+default\s+function\s+(.*)\(.*, .*, .*\)/g),
    new RegExp(/function\s+(.*)\(.*, .*, .*\)/)
  )

  if (DEBUG) console.log("ACTIONS:");
  if (DEBUG) console.log(actions);

  // search for Store definitions
  var stores = analyzer.findLinesInContent
  (
    storeCode,
    new RegExp(/class\s+.*\s+extends\s+BaseStore/g),  // FIXME finds only children of BaseStore
    new RegExp(/class\s+(.*)\s+extends/)
  );

  if (DEBUG) console.log("STROES:");
  if (DEBUG) console.log(stores);

  // search for Handlers in Stores
  var handlers = analyzer.findLinesInContent
  (
    storeCode,
    new RegExp(/\'[A-Z_]+\'\:\s?\'[A-Za-z]+\'/g),     // FIXME this is not a good pattern
    new RegExp(/\'([A-Z_]+)\'\:\s?\'[A-Za-z]+\'/)
  );

  if (DEBUG) console.log("HANDLERS:");
  if (DEBUG) console.log(handlers);

  // search for Calls: Component -> Action
  var calls = analyzer.findLinesInContent
  (
    componentCode,
    new RegExp(/import\s+.*\s+from\s+\'.*\/actions\/.*\'/g),
    new RegExp(/import\s+(.*)\s+from/)
  );

  if (DEBUG) console.log("CALLS:");
  if (DEBUG) console.log(calls);

  // search for Dispatch: Action -> Store
  var dispatchHandlers = analyzer.findLinesInContent
  (
    actionCode,
    new RegExp(/context\.dispatch\(\'.*\',\s?.*\);/g),
    new RegExp(/dispatch\(\'(.*)\',/)
  );

  if (DEBUG) console.log("DISPATCH HANDLER CALLS:");
  if (DEBUG) console.log(dispatchHandlers);

  // resolve DISPATCH relations
  var dispatch = [];
  for (var filename in dispatchHandlers)
  {
    dispatch[filename] = [];

    for (handler in dispatchHandlers[filename])
    {
      var handlerParent = analyzer.findFileContaining(handlers, handler);
      if (handlerParent && !contains(dispatchHandlers[filename], handlerParent))
      {
        dispatch[filename].push(handlerParent);
      }
    }
  }

  if (DEBUG) console.log("DISPATCH RELATIONS:");
  if (DEBUG) console.log(dispatch);

  // search for Updates: Store -> Component
  var updates = analyzer.findLinesInContent
  (
    componentCode,
    new RegExp(/import\s+.*\s+from\s+\'.*\/stores\/.*\'/g),
    new RegExp(/import\s+(.*)\s+from/)
  );

  if (DEBUG) console.log("UPDATES:");
  if (DEBUG) console.log(updates);

});
