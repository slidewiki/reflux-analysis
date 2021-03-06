textFilesLoader = require("text-files-loader");
sync = require("synchronize");

module.exports = {

    findLinesInContent : function( content, pattern )
    {
      var detect_pattern  = pattern.detect;
      var extract_pattern = pattern.extract;
      var data = [];

      // scan each file for lines matching detect_pattern
      for (var filename in content)
      {
        var matches = content[filename].code.match(detect_pattern);

        // if lines machting the detect_pattern were found
        if (matches != null && matches.length > 0)
        {
          // create enty for current fileaddToEdgeList
          data[filename] = [];

          // extract target pattern from lines
          for (var index in matches)
          {
            var result = matches[index].match(extract_pattern)
            if (result != null) data[filename].push(result[1].trim());  
          }
        }
      }

      return data;
    }
  ,
    findFileContaining : function( files, searchString )
    {
      var sstr = searchString.trim().toLowerCase();
      for (var filename in files)
      {
        for (item_idx in files[filename])
        {
          var item = files[filename][item_idx];
          //console.log("ITEM: " + item);
          var it = item.trim().toLowerCase();
          if (it == sstr)
          {
            return filename;
          }
        }
      }

      // searchString not in files
      return undefined;
    }
}
