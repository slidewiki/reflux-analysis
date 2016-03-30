var sync = require("synchronize");
var fs = require('fs');
var textFilesLoader = require("text-files-loader");
var analyzer = require('./analyzer.js');

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

  console.log("COMPONENTS:");
  console.log(components);

  // search for Action definitions
  var actions = analyzer.findLinesInContent
  (
    actionCode,
    new RegExp(/export\s+default\s+function\s+(.*)\(.*, .*, .*\)/g),
    new RegExp(/function\s+(.*)\(.*, .*, .*\)/)
  )

  console.log("ACTIONS:");
  console.log(actions);

  // search for Store definitions
  var stores = analyzer.findLinesInContent
  (
    storeCode,
    new RegExp(/class\s+.*\s+extends\s+BaseStore/g),  // FIXME finds only children of BaseStore
    new RegExp(/class\s+(.*)\s+extends/)
  );

  console.log("STROES:");
  console.log(stores);

  // search for Handlers in Stores
  var handlers = analyzer.findLinesInContent
  (
    storeCode,
    new RegExp(/\'[A-Z_]+\'\:\s?\'[A-Za-z]+\'/g),     // FIXME this is not a good pattern
    new RegExp(/\'([A-Z_]+)\'\:\s?\'[A-Za-z]+\'/)
  );

  console.log("HANDLERS:");
  console.log(handlers);

  // search for Calls: Component -> Action
  var calls = analyzer.findLinesInContent
  (
    componentCode,
    new RegExp(/import\s+.*\s+from\s+\'.*\/actions\/.*\'/g),
    new RegExp(/import\s+(.*)\s+from/)
  );

  console.log("CALLS:");
  console.log(calls);

  // search for Dispatch: Action -> Store
  var dispatch = analyzer.findLinesInContent
  (
    actionCode,
    new RegExp(/context\.dispatch\(\'.*\',\s?.*\);/g),
    new RegExp(/dispatch\(\'(.*)\',/)
  );

  console.log("DISPATCH:");
  console.log(dispatch);

  // search for Updates: Store -> Component
  var updates = analyzer.findLinesInContent
  (
    componentCode,
    new RegExp(/import\s+.*\s+from\s+\'.*\/stores\/.*\'/g),
    new RegExp(/import\s+(.*)\s+from/)
  );

  console.log("UPDATES:");
  console.log(updates);

});

// Store
// in /stores/.. + class DeckTreeStore extends BaseStore
// DeckTreeStore.handlers = {
//    'LOAD_DECK_TREE_SUCCESS': 'updateDeckTree',
//    'SELECT_TREE_NODE_SUCCESS': 'selectTreeNode',
//    'TOGGLE_TREE_NODE_SUCCESS': 'toggleTreeNode',
//    'RENAME_TREE_NODE_SUCCESS': 'renameTreeNode',
//    'SAVE_TREE_NODE_SUCCESS': 'saveTreeNode',
//    'DELETE_TREE_NODE_SUCCESS': 'deleteTreeNode',
//    'ADD_TREE_NODE_SUCCESS': 'addTreeNode'
// };
// stores = analyzer.findLinesInDirectory
// (
//   storesPath,
//   new RegExp(/class\s+(.*)\s+extends\s+BaseStore/)
// )

// Calls: Component -> Action
// inside component: import toggleTreeNode from '../../../actions/decktree/toggleTreeNode';

// Dispatch: Action -> Store
// inside action: context.dispatch('RENAME_TREE_NODE_SUCCESS', payload);

// Data: Store -> Component
// inside component: import DeckTreeStore from '../../../stores/DeckTreeStore';
