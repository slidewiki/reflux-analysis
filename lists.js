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
  addToNodesList : function(nodeList, itemList, groupName, next_id, urlPrefix)
  {
    for (var file in itemList)
    {
      for (var i in itemList[file])
      {
        var item = itemList[file][i];
        nodeList.push(
        {
          id:    next_id++,
          label: item,
          group: groupName,
          path: file,
          github: urlPrefix + file
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
  addToEdgeList : function(nodeList, edgeList, relationList, label, arrowDir, color)
  {
    for (var file in relationList)
    {
      var fromID = undefined;
      for(var i in nodeList)
      {
        var item = nodeList[i];
        if (item.path === file) {
          fromID = item.id;
        }
      }

      if (fromID === undefined) console.log("WARN: (" + label + ")(FROM) Node index for [" + file + "] not found!");

      for (var i in relationList[file])
      {
        var toID = undefined;
        for(var j in nodeList)
        {
          var item = nodeList[j];
          if (item.path == relationList[file][i]) {
            toID = item.id;
          }
        }

        if (toID === undefined) console.log("WARN: (" + label + ")(TO) Node index for [" + relationList[file][i] + "] not found!");

        if (fromID !== undefined && toID !== undefined)
        {
          edgeList.push(
          {
            from: fromID,
            to: toID,
            label: label,
            arrows: arrowDir,
            color: color
          });
        }
      }
    }
  }
 ,
  stripPaths : function(arr, rootDir)
  {
    out = []
    prefix_len = rootDir.length;
    for (var path in arr) {
      var pathElms = path.split("/");
      var filename = pathElms[pathElms.length-1];
      var entity = filename.substr(0, filename.length-3);
      rpath = path.substr(prefix_len);
      out[rpath] = {path:rpath, filename:filename, label:entity, code:arr[path]};
    }
    return out;
  }
}
