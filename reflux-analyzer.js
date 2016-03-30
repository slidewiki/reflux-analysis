var sync = require("synchronize");
var fs = require('fs');
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

checkDir(rootDir);

//                 //
//  CODE ANALYSIS  //
//                 //

componentsPath = rootDir + "/components";
actionsPath    = rootDir + "/actions";
storesPath     = rootDir + "/stores";

checkDir(componentsPath);
checkDir(actionsPath);
checkDir(storesPath);

// Component
// in /components/.. + class TreePanel extends React.Component {

// fiber for working synchronously
sync.fiber(function()
{
  components = analyzer.findLinesInDirectory
  (
    componentsPath,
    new RegExp(/class\s+.*\s+extends\s+React.Component/g),
    new RegExp(/class\s+(.*)\s+extends/)
  );

  console.log(components);
});

// Action
// in /actions/.. + export default function renameTreeNode(context, payload, done) {
// actions = analyzer.findLinesInDirectory
// (
//     actionsPath,
//     new RegExp(/export\s+default\s+function\s+(.*)\((.*), (.*), (.*))/)
// )

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
