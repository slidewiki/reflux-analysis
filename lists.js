var lists = require("./lists.js");

module.exports = {

  contains : function(arr, str)
  {
    for (item in arr)
    {
      if (item.indexOf(str) > -1) {
        return true;
      }
    }
    return false;
  }
,
  addToNodesList : function(nodeList, itemList, groupName, next_id)
  {
    for (var file in itemList)
    {
      for (var i in itemList[file])
      {
        var label = itemList[file][i];
        nodeList.push(
        {
          id:    next_id++,
          label: label,
          group: groupName
        });
      }
    }
    return next_id;
  }
,
  findInNodeList : function(nodeList, searchStr)
  {
    for(var i in nodeList)
    {
      var item = nodeList[i];
      if (item.label.indexOf(searchStr) > -1) {
        return item.id;
      }
    }
    return undefined;
  }
,
  addToEdgeList : function(nodeList, edgeList, relationList, label, arrowDir)
  {
    for (var file in relationList)
    {
      var fromID = undefined;
      for(var i in nodeList)
      {
        var item = nodeList[i];
        if (item.label.indexOf(file) > -1) {
          fromID = item.id;
        }
      }

      if (fromID === undefined) throw("(FROM) Node index for " + file + " not found!");

      for (var i in relationList[file])
      {
        var toID = undefined;
        for(var j in nodeList)
        {
          var item = nodeList[j];
          if (item.label.indexOf(relationList[file][i]) > -1) {
            toID = item.id;
          }
        }

        if (toID === undefined) throw("(TO) Node index for " + relationList[file][i] + " not found!");

        edgeList.push(
        {
          from: fromID,
          to: toID,
          label: label,
          arrows: arrowDir
        });
      }
    }
  }

}
