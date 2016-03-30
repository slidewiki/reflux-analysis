textFilesLoader = require("text-files-loader");
sync = require("synchronize");

module.exports = {

    findLinesInContent : function( content, detect_pattern, extract_pattern )
    {
      var data = [];

      // scan each file for lines matching detect_pattern
      for (var filename in content)
      {
        var matches = content[filename].match(detect_pattern);

        // if lines machting the detect_pattern were found
        if (matches != null && matches.length > 0)
        {
          // create enty for current file
          data[filename] = [];

          // extract target pattern from lines
          for (var index in matches)
          {
            var result = matches[index].match(extract_pattern)
            if (result != null) data[filename].push(result[1]);
          }
        }
      }

      return data;
    }
  ,
    findFileContaining : function( files, searchString )
    {
      var data = [];

      for (filename in files)
      {
        for (item in files[filename])
        {
          if (item.indexOf(searchString) > -1) {
            return filename;
          }
        }
      }

      // searchString not in files
      return undefined;
    }
}
